# FinanceOS deployment on AWS EC2 with Nginx and SQLite

Research date: 2026-08-24

Revised: 2026-08-25

## Final deployment architecture

Run FinanceOS directly on one EC2 instance. Use systemd for the Node.js processes, Nginx for HTTPS routing, and SQLite on an EBS volume mounted at `/data`.

```text
Browser
   |
Cloudflare
   |
Nginx :443 at finance.lucky-click.com
   |-- /              -> Next.js on 127.0.0.1:3000
   |-- /api/          -> Express on 127.0.0.1:3001
   `-- /health-check  -> Express on 127.0.0.1:3001
                              |
                      /data/financeos.sqlite3
```

Keep one API process. SQLite is a single-file database and should not be shared by horizontally scaled API processes.

## EC2, DNS, and security-group setup

1. Attach an EBS volume to the EC2 instance.
2. Format and mount it at `/data`.
3. Add its UUID to `/etc/fstab` so it mounts after reboot.
4. Point `finance.lucky-click.com` at the EC2 Elastic IP.
5. Allow ports 80 and 443 from the internet.
6. Allow port 22 only from trusted IP addresses.
7. Do not expose ports 3000 or 3001.

EBS volumes provide attached block storage. EBS snapshots persist independently from the volume. [AWS EBS documentation](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/storage_ebs.html)

## Application layout

The deployed repository lives at `/var/www/financeos`, not `/opt/financeos`.

```text
/var/www/financeos                 application source and builds
/etc/financeos/server.env          server configuration and secrets
/data/financeos.sqlite3            production SQLite database
/data/backups                      local SQLite backups
```

Use `ubuntu` as the deployment account and `financeos` as the runtime account. Create the runtime account if it does not exist:

```bash
sudo useradd --system --create-home --shell /bin/bash financeos
```

Confirm that Node.js and pnpm are available to the deployment account:

```bash
command -v node
command -v pnpm
node --version
pnpm --version
```

Install dependencies from the repository root:

```bash
cd /var/www/financeos
pnpm install --frozen-lockfile
```

## SQLite storage and permissions

Create the database location on the mounted EBS volume:

```bash
sudo mkdir -p /data/backups
sudo touch /data/financeos.sqlite3
sudo chown financeos:financeos /data
sudo chown financeos:financeos /data/financeos.sqlite3
sudo chown financeos:financeos /data/backups
sudo chmod 750 /data /data/backups
sudo chmod 640 /data/financeos.sqlite3
```

The `financeos` user needs write access to `/data`. SQLite may create journal, WAL, and shared-memory files beside the main database.

Use an absolute SQLite URL:

```env
DB_FILE_NAME=file:/data/financeos.sqlite3
```

Do not use `file:./financeos.sqlite3` in production. That value is relative to the server working directory and may create a second database under `apps/server`.

Before switching paths, check whether an unintended database exists:

```bash
sudo test -f /data/financeos.sqlite3 && sudo ls -lh /data/financeos.sqlite3
sudo test -f /var/www/financeos/apps/server/financeos.sqlite3 \
  && sudo ls -lh /var/www/financeos/apps/server/financeos.sqlite3
```

Install the SQLite CLI before inspecting either file:

```bash
sudo apt update
sudo apt install -y sqlite3
```

Do not replace either database until their tables and row counts have been compared.

## Server environment and secrets

Keep production secrets outside Git in `/etc/financeos/server.env`.

```bash
sudo mkdir -p /etc/financeos
sudo chown root:financeos /etc/financeos
sudo chmod 750 /etc/financeos
sudo touch /etc/financeos/server.env
sudo chown root:financeos /etc/financeos/server.env
sudo chmod 640 /etc/financeos/server.env
sudoedit /etc/financeos/server.env
```

Use this shape:

```env
BETTER_AUTH_SECRET=long-random-secret
BETTER_AUTH_URL=https://finance.lucky-click.com
DB_FILE_NAME=file:/data/financeos.sqlite3
FRONTEND_URL=https://finance.lucky-click.com
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

Never publish screenshots or logs containing secrets. Rotate any secret that has been exposed, then restart the server. Changing `BETTER_AUTH_SECRET` invalidates existing sessions.

The web build uses the same public origin:

```env
NEXT_PUBLIC_BACKEND_URL=https://finance.lucky-click.com
```

Do not add `/api` to this value. The web client already adds `/api` to contract requests.

## Database migrations

Run migrations as the runtime user so generated SQLite files have the correct owner.

The direct Node command avoids relying on pnpm being available in the `financeos` user's shell:

```bash
sudo -u financeos sh -c '
  set -a
  . /etc/financeos/server.env
  set +a
  cd /var/www/financeos/apps/server
  /usr/bin/node node_modules/drizzle-kit/bin.cjs migrate \
    --config=drizzle.config.ts
'
```

Confirm that the schema exists:

```bash
sudo sqlite3 /data/financeos.sqlite3 \
  "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

## Build the applications

Build the Express server from the repository root:

```bash
cd /var/www/financeos
pnpm --filter @financeos/server build
```

`NEXT_PUBLIC_BACKEND_URL` is embedded into browser JavaScript during `next build`. Always provide the production HTTPS origin when building.

If `.next` came from an earlier build by `financeos`, return it to the deployment account first:

```bash
cd /var/www/financeos
if [ -d apps/web/.next ]; then
  sudo chown -R ubuntu:ubuntu apps/web/.next
fi
```

Build the web application:

```bash
NEXT_PUBLIC_BACKEND_URL=https://finance.lucky-click.com \
  pnpm --filter @financeos/web build
```

Give the generated web build to the runtime account:

```bash
sudo chown -R financeos:financeos /var/www/financeos/apps/web/.next
```

Confirm that no old IP address or HTTP backend URL remains in `.next` before restarting the service.

## systemd services

Systemd starts the applications after a reboot, restarts failed processes, and captures logs. Nginx cannot execute the Next.js or Express build by itself.

Create `/etc/systemd/system/financeos-server.service`:

```ini
[Unit]
Description=FinanceOS API
After=network-online.target
Wants=network-online.target
RequiresMountsFor=/data

[Service]
Type=simple
User=financeos
Group=financeos
WorkingDirectory=/var/www/financeos/apps/server
EnvironmentFile=/etc/financeos/server.env
ExecStart=/usr/bin/node /var/www/financeos/apps/server/dist/index.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Create `/etc/systemd/system/financeos-web.service`:

```ini
[Unit]
Description=FinanceOS web application
After=network-online.target financeos-server.service
Wants=network-online.target

[Service]
Type=simple
User=financeos
Group=financeos
WorkingDirectory=/var/www/financeos/apps/web
Environment=NODE_ENV=production
Environment=NEXT_PUBLIC_BACKEND_URL=https://finance.lucky-click.com
ExecStart=/usr/bin/node /var/www/financeos/apps/web/node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3000
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

If `command -v node` does not return `/usr/bin/node`, replace that path in the migration command and both service files with the actual system-wide Node.js path.

The current Express entrypoint does not bind an explicit hostname and may listen on every interface. Keep port 3001 closed in the EC2 security group.

Enable the services:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now financeos-server financeos-web
sudo systemctl status financeos-server --no-pager -l
sudo systemctl status financeos-web --no-pager -l
```

Inspect logs with:

```bash
sudo journalctl -u financeos-server -n 100 --no-pager
sudo journalctl -u financeos-web -n 100 --no-pager
```

## Nginx path-based routing

Use one hostname. Requests under `/api/` go to Express, while all other application requests go to Next.js.

Create `/etc/nginx/sites-available/financeos`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name finance.lucky-click.com;

    location ^~ /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location = /health-check {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

The API `proxy_pass` has no trailing slash. This preserves request paths such as `/api/auth/sign-in/social`.

Enable and verify Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/financeos \
  /etc/nginx/sites-enabled/financeos
sudo nginx -t
sudo systemctl reload nginx
```

## HTTPS with Certbot

After DNS resolves and port 80 is reachable, install a certificate:

```bash
sudo certbot --nginx -d finance.lucky-click.com
sudo certbot renew --dry-run
```

After the origin certificate works, use Cloudflare SSL/TLS mode `Full (strict)`.

## Verification and troubleshooting

Confirm that all required processes are listening:

```bash
sudo ss -lntp | grep -E ':80|:443|:3000|:3001'
```

Test each upstream directly:

```bash
curl -I http://127.0.0.1:3000
curl -i http://127.0.0.1:3001/health-check
```

Test Nginx locally before involving Cloudflare:

```bash
curl -I -H 'Host: finance.lucky-click.com' http://127.0.0.1/
curl -i -H 'Host: finance.lucky-click.com' \
  http://127.0.0.1/health-check
```

Test the public site:

```bash
curl -I https://finance.lucky-click.com/
curl -i https://finance.lucky-click.com/health-check
```

A 502 from Nginx usually means the process on port 3000 or 3001 is not running. Check systemd and `/var/log/nginx/error.log` before changing Cloudflare settings.

## Backups

Create application-consistent backups with the SQLite backup command:

```bash
sudo -u financeos /usr/bin/sqlite3 /data/financeos.sqlite3 \
  ".backup '/data/backups/financeos-$(date +%F).sqlite3'"
```

Run this daily with cron or a systemd timer. Copy encrypted backups to a private S3 bucket or another machine. The `/data/backups` directory alone is not an off-instance backup.

Take regular EBS snapshots as a second recovery option. Do not rely on `cp` of a live SQLite database as the only backup method.

## Updating the application

Create a database backup before each release. Stop both processes so the build and migration cannot race with live traffic.

```bash
cd /var/www/financeos
sudo systemctl stop financeos-web financeos-server

sudo -u financeos /usr/bin/sqlite3 /data/financeos.sqlite3 \
  ".backup '/data/backups/financeos-predeploy-$(date +%F-%H%M%S).sqlite3'"

git pull
pnpm install --frozen-lockfile

sudo -u financeos sh -c '
  set -a
  . /etc/financeos/server.env
  set +a
  cd /var/www/financeos/apps/server
  /usr/bin/node node_modules/drizzle-kit/bin.cjs migrate \
    --config=drizzle.config.ts
'

pnpm --filter @financeos/server build

if [ -d apps/web/.next ]; then
  sudo chown -R ubuntu:ubuntu apps/web/.next
fi

NEXT_PUBLIC_BACKEND_URL=https://finance.lucky-click.com \
  pnpm --filter @financeos/web build

sudo chown -R financeos:financeos apps/web/.next
sudo systemctl start financeos-server financeos-web
```

Finish every update by checking both services, the health endpoint, sign-in, and one representative ledger read/write flow.
