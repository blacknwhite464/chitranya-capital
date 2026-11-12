# Website accounts and security

The website account API uses PostgreSQL, bcrypt password hashes and opaque server-side sessions.

## Required production configuration

Set these server-only environment variables in the hosting platform:

- `DATABASE_URL`: PostgreSQL connection string. Use a managed database with TLS and backups.
- `SESSION_SECRET`: generate and store a high-entropy secret (32+ random bytes). Reserved for future signed state/CSRF integrations; never expose it to browser code.

Never prefix secrets with `NEXT_PUBLIC_`.

## Apply database schema

Run `docs/database-schema.sql` against the production PostgreSQL database using a migration role. The application runtime role should have only the permissions it needs. Do not run schema changes from public requests.

## Account API

- `POST /api/auth/register`: name, email, password (minimum 12 characters).
- `POST /api/auth/login`: email and password.
- `POST /api/auth/logout`: revoke the current session.
- `GET /api/auth/me`: return the current session identity.

Session tokens are random, stored only as SHA-256 hashes in PostgreSQL and sent as HttpOnly, SameSite=Lax cookies. Cookies are Secure in production. Sessions expire after 14 days. Passwords are hashed with bcrypt (12 rounds).

## Production hardening still required before public launch

- Put the application behind a managed WAF/reverse proxy with per-IP and per-account rate limits for registration and login.
- Configure email verification, password reset, account deletion and support workflows.
- Add CSRF protection to all state-changing endpoints before adding cross-site integrations.
- Add administrator MFA, explicit role-management tooling and audit logging before granting admin accounts.
- Configure database connection pooling, backups, restore drills and monitoring.
- Review privacy notice, data-retention schedule and Nepal legal/regulatory requirements.

The API returns a clear unavailable response until PostgreSQL is configured; it does not silently store account passwords in browser storage.
