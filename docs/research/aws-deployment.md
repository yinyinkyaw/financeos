# FinanceOS AWS deployment research

Research date: 2026-08-24

> For the personal single-VPS SQLite deployment, use [aws-vps-sqlite-deployment.md](aws-vps-sqlite-deployment.md). This document preserves the separate RDS/PostgreSQL option for a future multi-server deployment.

## Recommendation

Deploy FinanceOS as two containers on Amazon ECS with AWS Fargate:

- `web`: the Next.js application, listening on port 3000.
- `server`: the Express API, listening on port 3001.
- Amazon RDS for PostgreSQL: the durable production database.
- Amazon ECR: private container image repositories.
- Application Load Balancer: HTTPS entry point and routing to both ECS services.
- AWS Certificate Manager and Route 53: TLS certificate and DNS.
- AWS Secrets Manager: database credentials and application secrets.
- Amazon CloudWatch Logs: container logs and operational visibility.

This is a better fit than putting the current SQLite file on a server. The ledger is the source of truth, and a container-local SQLite file is not durable across task replacement or suitable for multiple API tasks. Fargate can use additional storage, but that does not remove the single-writer and failover concerns of file-based SQLite. The application should migrate to PostgreSQL before production.

## Target architecture

```text
Users
  |
Route 53 DNS -> ACM certificate -> public HTTPS Application Load Balancer
                                      | host: app.example.com
                                      v
                                ECS Fargate web service :3000
                                      |
                                      | browser requests to api.example.com
                                      v
                                ECS Fargate API service :3001
                                      |
                                      v
                                private RDS PostgreSQL :5432
```

Use one AWS Region and a VPC spanning at least two Availability Zones. Put the load balancer in public subnets, ECS tasks in private subnets, and RDS in private database subnets. The API security group should be reachable from the load balancer security group; the RDS security group should allow TCP 5432 only from the API task security group.

An alternative is to use one ALB with host-based rules for `app.example.com` and `api.example.com`. This matches the current code because the browser already uses a separate `NEXT_PUBLIC_BACKEND_URL`, and the API already enables credentialed CORS for one configured `FRONTEND_URL`.

AWS documents that ECS services on Fargate support Application Load Balancers and recommends ALBs for HTTP/HTTPS routing, path-based routing, and multiple services. [ECS service load balancing](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/service-load-balancing.html)

## Repository findings and required changes

The repository currently contains:

- `apps/web`: Next.js 16.2 application with `next build` and `next start` scripts.
- `apps/server`: Express API with a fixed listener on port 3001 and `/health-check`.
- `apps/server/src/db`: Drizzle ORM using `drizzle-orm/libsql/sqlite3` and `@libsql/client`.
- `apps/server/env.ts`: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `DB_FILE_NAME`, `FRONTEND_URL`, and Google OAuth credentials.
- `apps/web/env.ts`: public `NEXT_PUBLIC_BACKEND_URL`.
- Existing SQLite migrations under `apps/server/src/db/migrations`.

Before the AWS deployment work:

1. Add production Dockerfiles for the web and server, or one multi-target Dockerfile. Use Node 20 or newer; current Next.js documentation lists Node 20.9 as the minimum.
2. Add a `.dockerignore` so `node_modules`, `.git`, local SQLite files, test output, and secrets are not copied into images.
3. Change the server to PostgreSQL:
   - use Drizzle's PostgreSQL driver and `pgTable` schema types;
   - replace `DB_FILE_NAME` with a `DATABASE_URL` connection string (or equivalent host/port/user/password variables);
   - change `drizzle.config.ts` to the PostgreSQL dialect;
   - change Better Auth's Drizzle adapter provider from `sqlite` to `pg`;
   - add `pg` and the relevant Drizzle PostgreSQL driver package;
   - regenerate and review migrations rather than attempting to run the SQLite migrations unchanged.
4. Add a configurable `PORT` with a default of 3001, or keep the container contract at 3001 and configure the ECS target group accordingly.
5. Ensure the server handles `SIGTERM` gracefully so ECS deployments can drain in-flight requests.
6. Add a real readiness check if startup will include migrations. `/health-check` is suitable for a basic ALB liveness check, but it does not currently verify database connectivity.

Drizzle documents native PostgreSQL support and the `node-postgres` driver. [Drizzle PostgreSQL setup](https://orm.drizzle.team/docs/get-started-postgresql)

Better Auth's Drizzle adapter supports `provider: "pg"`. [Better Auth installation and Drizzle adapter](https://better-auth.com/docs/installation)

Next.js supports a Docker deployment with full feature support and documents `next build` followed by `next start` for a Node.js server. [Next.js deploying](https://nextjs.org/docs/app/getting-started/deploying) and [Next.js self-hosting](https://nextjs.org/docs/app/guides/self-hosting)

## Database migration plan

Do not point a new production container at `financeos.sqlite3` and treat the deployment as complete. Use a staged migration:

1. Create an RDS PostgreSQL instance in the same VPC and Region as ECS.
2. Create the PostgreSQL schema from the new Drizzle migrations in a staging database first.
3. Compare the PostgreSQL schema with the current SQLite schema. Pay special attention to:
   - millisecond timestamp fields;
   - Boolean `email_verified` values currently represented as SQLite integers;
   - foreign-key delete behavior;
   - the transaction endpoint check constraint;
   - THB amounts stored as integer satang, which should remain integer satang.
4. If the existing SQLite file has data, stop writes, take a copy, export each table, transform SQLite values to PostgreSQL values, import in foreign-key order, and verify row counts and representative records.
5. Verify ledger invariants after import: every transaction has valid endpoints, all amounts are positive integer satang, and current balances and annual category expense summaries match the SQLite result.
6. Run the API against the imported staging database and exercise sign-in, Google OAuth, account creation, transaction creation, transfers, and annual category expense summaries.
7. Schedule a short production write freeze, take a final SQLite backup, perform the final import, run migrations, and switch `DATABASE_URL` to RDS.
8. Keep the SQLite backup read-only until the PostgreSQL deployment has passed production verification.

RDS for PostgreSQL supports backups, point-in-time restore, Multi-AZ deployments, read replicas, VPC placement, and SSL connections. [RDS for PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)

## AWS provisioning sequence

### 1. Network and database

Create or select a VPC with subnets in at least two Availability Zones. Create:

- public subnets for the ALB;
- private application subnets for ECS;
- private database subnets for RDS;
- a DB subnet group spanning at least two Availability Zones;
- security groups for ALB, ECS tasks, and RDS.

Create RDS PostgreSQL with:

- a private DB subnet group;
- no public accessibility;
- storage encryption enabled;
- deletion protection in production;
- automated backups enabled, initially at least 7 days and aligned with the recovery requirement;
- Multi-AZ for production availability;
- SSL/TLS required for application connections where supported by the selected client configuration.

RDS requires a VPC and a DB subnet group covering at least two Availability Zones. AWS also recommends Secrets Manager for database credentials. [Creating an RDS DB instance](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_CreateDBInstance.html)

RDS automated backups support point-in-time recovery during the configured retention period. [RDS automated backups](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithAutomatedBackups.html)

### 2. Secrets

Store these in Secrets Manager rather than in Git, the Docker image, or a plain ECS environment value:

```text
BETTER_AUTH_SECRET
DATABASE_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
```

Non-sensitive configuration can be regular ECS environment values:

```text
BETTER_AUTH_URL=https://api.example.com
FRONTEND_URL=https://app.example.com
```

For the web task, set the public build/runtime value:

```text
NEXT_PUBLIC_BACKEND_URL=https://api.example.com
```

Because this variable is prefixed with `NEXT_PUBLIC_`, Next.js makes it available to browser code and may inline it during `next build`. Build the web image with the correct environment-specific public backend URL, or adopt a runtime configuration pattern before promoting the same image across environments.

ECS can inject Secrets Manager values into container environment variables, but a changed secret is not picked up by running tasks automatically; force a new ECS deployment after rotating a secret. [Passing sensitive data to ECS](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/specifying-sensitive-data.html) and [Secrets Manager environment injection](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/secrets-envvar-secrets-manager.html)

### 3. Images and ECS

Create two private ECR repositories, for example:

```text
financeos-web
financeos-server
```

Build and push immutable image tags based on the Git commit SHA. Avoid deploying only `latest`; immutable tags make rollback possible.

Create one ECS cluster and two task definitions/services:

| Service | Container port | Target group health check | Desired count initially |
|---|---:|---|---:|
| web | 3000 | `/` | 1 |
| server | 3001 | `/health-check` | 1 |

Use Fargate task definitions with `awsvpc` networking, CloudWatch `awslogs`, a task execution role that can pull from ECR and read the referenced secrets, and a task role with only the AWS permissions the application actually needs. Start with 0.25–0.5 vCPU and 0.5–1 GB memory per service, then size from metrics and load tests rather than treating those as production capacity recommendations.

ECS task definitions describe the image, CPU/memory, networking, logging, command, and container lifecycle; ECS services maintain the desired number of running tasks. [ECS task definitions](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definitions.html)

Private Fargate tasks need a NAT gateway or suitable VPC endpoints to pull images and reach required AWS services. [Fargate networking and logging](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/fargate-tasks-services.html)

### 4. Load balancer, DNS, and TLS

Create an internet-facing ALB with:

- HTTP listener on port 80 redirecting to HTTPS;
- HTTPS listener on port 443 using an ACM certificate;
- host rule `app.example.com` -> web target group;
- host rule `api.example.com` -> server target group;
- target group health checks and deregistration delay suitable for graceful deployments.

Create Route 53 alias records for both hostnames pointing to the ALB. The ACM certificate must include both names, or use an appropriate wildcard certificate.

AWS recommends ACM certificates for ALBs and supports automatic renewal for ACM-provided certificates. [ALB certificates](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/https-listener-certificates.html)

## Deployment workflow

The first deployment can be manual to validate the wiring, but the repeatable workflow should be CI/CD:

1. Run `pnpm install --frozen-lockfile`.
2. Run `pnpm check-types`, `pnpm lint`, and tests.
3. Build both Docker images.
4. Push images to ECR tagged with the commit SHA.
5. Run the database migration as a one-off ECS task or a controlled release step using the same server image and production secrets.
6. Register new ECS task-definition revisions with the new image tags.
7. Update both ECS services and wait for healthy replacement tasks.
8. Verify `/health-check`, sign-in, OAuth callback, account reads/writes, transaction writes, and summary queries.
9. Roll back the ECS task definitions if the application is unhealthy. Do not automatically roll back a database migration unless the migration was designed to be backward-compatible.

Keep schema migrations backward-compatible when possible: add new columns before deploying code that requires them, backfill, then remove old columns in a later release.

## Production checklist

- [ ] PostgreSQL migration is complete and ledger totals match the SQLite source.
- [ ] RDS is private, encrypted, backed up, and protected from accidental deletion.
- [ ] RDS inbound access is limited to the ECS API security group.
- [ ] No secrets or SQLite database files are in the image or repository.
- [ ] `BETTER_AUTH_URL`, `FRONTEND_URL`, and Google OAuth redirect URLs use the final HTTPS domains.
- [ ] `NEXT_PUBLIC_BACKEND_URL` points to the HTTPS API domain at web build time.
- [ ] ALB routes to both target groups and both health checks pass.
- [ ] CORS and credentialed cookies work from the production web origin.
- [ ] CloudWatch log retention and alarms are configured for task failures, 5xx responses, latency, and RDS storage/CPU/connections.
- [ ] A restore drill has been performed using an RDS snapshot or point-in-time restore.
- [ ] ECS deployment and database migration rollback procedures are written down.

## Lower-cost alternatives

For a temporary demo, a single EC2 instance running both Node processes with SQLite on an encrypted EBS volume is simpler and cheaper, but it creates a single-server failure domain and requires manual patching, process supervision, backups, and deployment handling. It should not be the default for a financial ledger.

Keeping libSQL/Turso as the database while running the containers on AWS is also technically possible because `DB_FILE_NAME` is a URL consumed by `@libsql/client`, but the database would not be inside AWS. It is a valid transitional arrangement only if that external database's availability, backups, access controls, and data residency meet the project's requirements.

## Sources

- [Amazon ECS Fargate and ALB](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/service-load-balancing.html)
- [Amazon RDS for PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)
- [Amazon RDS networking and creation](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_CreateDBInstance.html)
- [Amazon RDS backups and point-in-time recovery](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithAutomatedBackups.html)
- [ECS task definitions](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definitions.html)
- [ECS Fargate networking and CloudWatch logging](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/fargate-tasks-services.html)
- [ECS secrets injection](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/specifying-sensitive-data.html)
- [ALB HTTPS certificates](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/https-listener-certificates.html)
- [Next.js deployment](https://nextjs.org/docs/app/getting-started/deploying)
- [Next.js self-hosting](https://nextjs.org/docs/app/guides/self-hosting)
- [Drizzle PostgreSQL](https://orm.drizzle.team/docs/get-started-postgresql)
- [Better Auth Drizzle/PostgreSQL configuration](https://better-auth.com/docs/installation)
