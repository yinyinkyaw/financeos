# FinanceOS AWS VPS deployment with SQLite

Research date: 2026-08-24

## Recommendation

For this personal project, use one Amazon Lightsail Linux instance as the VPS and keep SQLite on a separate attached Lightsail block-storage disk.

Run these processes on the VPS:

- Next.js web app on 127.0.0.1:3000.
- Express API on 127.0.0.1:3001.
- SQLite at /data/financeos.sqlite3 on the attached disk.
- Caddy or Nginx as the public HTTPS reverse proxy.

This keeps the database inside the VPS while separating application code from the data volume. Lightsail attached disks persist independently from the instance and can be detached, moved, and snapshotted. [Lightsail block storage](https://docs.aws.amazon.com/lightsail/latest/userguide/amazon-lightsail-faq-block-storage.html)

The limitation is that this is a single-server, single-writer design. Run exactly one API container while using SQLite. Do not scale the API horizontally or place the SQLite file on a shared filesystem.

## Target architecture

~~~text
app.example.com  ---> Caddy/Nginx ---> Next.js :3000
api.example.com  ---> Caddy/Nginx ---> Express :3001 ---> /data/financeos.sqlite3
                                                           attached Lightsail disk
~~~

Use a Lightsail static IP so the public address does not change after a stop/start, then point DNS records at that IP. [Lightsail static IPs](https://docs.aws.amazon.com/lightsail/latest/userguide/lightsail-create-static-ip.html)

## AWS setup

1. Create an Ubuntu Linux Lightsail instance.
2. Create and attach a Lightsail static IP.
3. Create and attach a Lightsail block-storage disk for application data.
4. Format and mount the disk at /data, adding it to /etc/fstab using its UUID.
5. Allow only TCP 22 from your own IP and TCP 80/443 from the internet.
6. Do not expose ports 3000 or 3001 publicly.
7. Install Docker Engine and the Docker Compose plugin.
8. Create a non-root deployment user and keep the project under /opt/financeos.

Store only the SQLite database and database backups on /data. Keep the operating system, source code, Docker layers, and temporary files on the system disk.

## Changes needed in this repository

The repository already matches this deployment shape:

- apps/web is a Next.js application with next build and next start.
- apps/server is an Express API listening on port 3001.
- The API uses Drizzle with @libsql/client and SQLite.
- The database variable is DB_FILE_NAME.
- The API exposes /health-check.
- The web app uses NEXT_PUBLIC_BACKEND_URL and credentialed requests.

The repository does not currently contain production Dockerfiles or a Compose file. Add:

- apps/web/Dockerfile
- apps/server/Dockerfile
- a root docker-compose.yml
- a root .dockerignore

Build from the monorepo root so workspace package @financeos/contract is available. Do not copy financeos.sqlite3, .env files, node_modules, or .git into the images.

Next.js supports Docker deployments with full feature support and the normal next build/next start flow. [Next.js deployment](https://nextjs.org/docs/app/getting-started/deploying)

## Compose design

The intended service shape is:

~~~yaml
services:
  server:
    build:
      context: .
      dockerfile: apps/server/Dockerfile
    env_file: .env.production
    volumes:
      - /data:/data
    expose:
      - "3001"

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    env_file: .env.production
    expose:
      - "3000"
~~~

The current libSQL client should use:

~~~env
DB_FILE_NAME=file:/data/financeos.sqlite3
~~~

Use a bind mount, not a container-only volume. Keep one server container because SQLite is the single source of truth.

## Production environment

Create /opt/financeos/.env.production with permissions restricted to the deployment user:

~~~env
BETTER_AUTH_SECRET=long-random-secret
BETTER_AUTH_URL=https://api.example.com
DB_FILE_NAME=file:/data/financeos.sqlite3
FRONTEND_URL=https://app.example.com
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXT_PUBLIC_BACKEND_URL=https://api.example.com
~~~

Set NEXT_PUBLIC_BACKEND_URL before building the web image because it is used by browser code and may be included during the Next.js build. FRONTEND_URL must exactly match the production web origin for CORS and credentialed requests. Update Google OAuth origins and redirect URIs to use the production API domain.

## HTTPS reverse proxy

Use Caddy for the simplest automatic HTTPS setup:

~~~text
app.example.com {
    reverse_proxy 127.0.0.1:3000
}

api.example.com {
    reverse_proxy 127.0.0.1:3001
}
~~~

Run Caddy on the host or as a third Compose service. Publish only ports 80 and 443. Caddy can request and renew certificates when DNS points to the static IP and those ports are reachable.

Verify:

~~~bash
curl http://127.0.0.1:3001/health-check
curl https://api.example.com/health-check
~~~

## SQLite backup strategy

The attached disk protects the database from ordinary container replacement, but it is not a complete backup strategy.

- Enable Lightsail automatic snapshots. Lightsail keeps the latest seven automatic snapshots; manual snapshots can be retained longer. [Lightsail snapshots](https://docs.aws.amazon.com/lightsail/latest/userguide/understanding-snapshots-in-amazon-lightsail.html)
- Create an application-consistent SQLite backup daily using SQLite's backup mechanism:

  ~~~bash
  sqlite3 /data/financeos.sqlite3 ".backup '/data/backups/financeos-$(date +%F).sqlite3'"
  ~~~

- Do not rely on copying a live SQLite file with cp as the only backup method.
- Copy encrypted backups to a private S3 bucket or another machine. The live database can remain inside the VPS while backups are stored elsewhere.
- Test restoring a backup to a temporary SQLite file periodically.
- Before migrations, create a backup and verify that it can be opened.

AWS notes that a snapshot of an in-use disk may exclude data still cached by the application or operating system. Pause writes briefly when taking a disk snapshot if possible. [Lightsail disk snapshots](https://docs.aws.amazon.com/cli/latest/reference/lightsail/create-disk-snapshot.html)

## Deployment workflow

~~~bash
cd /opt/financeos
git pull
docker compose build web server
docker compose run --rm server pnpm --filter @financeos/server db:migrate
docker compose up -d web server caddy
docker compose ps
~~~

Before every migration or release:

1. Create a SQLite backup.
2. Pull the new commit.
3. Build the images.
4. Run db:migrate once.
5. Restart the services.
6. Check logs and /health-check.
7. Test sign-in, account creation, transaction creation, transfers, and dashboard reads.

Continue using the existing SQLite Drizzle migrations. Do not run the migration command concurrently from multiple containers.

## Operational checklist

- [ ] Static IP is attached to the VPS.
- [ ] Attached disk is mounted at /data through /etc/fstab.
- [ ] financeos.sqlite3 is stored on /data, not in the image or system disk.
- [ ] Ports 3000 and 3001 are not publicly exposed.
- [ ] SSH is restricted to your IP and key authentication is used.
- [ ] HTTPS works for both production domains.
- [ ] Google OAuth uses the production callback URL.
- [ ] Daily SQLite backups run successfully.
- [ ] Backups are copied away from the VPS.
- [ ] Lightsail snapshots are enabled.
- [ ] Restore testing has been performed.

## EC2 alternative

If you prefer regular Amazon EC2, use the same Docker Compose design with an EC2 instance and an EBS data volume mounted at /data. EBS volumes behave like attached block storage, and EBS snapshots are point-in-time backups that persist independently from the volume. [EBS storage and snapshots](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/storage_ebs.html)

Lightsail is simpler for this personal deployment; EC2 gives more networking, IAM, monitoring, and automation control.
