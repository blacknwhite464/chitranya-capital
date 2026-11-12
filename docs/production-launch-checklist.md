# Website production launch checklist

This checklist is for the CHITRANYA CAPITAL website only. The responsive browser website is the product; no native mobile application is in scope.

## 1. Hosting and domain

- [ ] Select a Node.js-compatible Next.js host (the static Firebase Hosting deployment used by the separate CHITRANYA marketplace is not sufficient for these server routes).
- [ ] Connect the production GitHub repository and deploy from the protected `main` branch.
- [ ] Configure the production domain and HTTPS.
- [ ] Set `SITE_URL` to the exact canonical HTTPS origin.
- [ ] Verify `/robots.txt`, `/sitemap.xml`, `/account`, `/api/auth/me` and `/admin`.

## 2. PostgreSQL

- [ ] Provision managed PostgreSQL with TLS, automated backups and point-in-time recovery.
- [ ] Apply `docs/database-schema.sql` using a migration/owner role.
- [ ] Create a separate restricted runtime database role.
- [ ] Set `DATABASE_URL` in the hosting provider's server-side secret manager.
- [ ] Test connection limits, backup restoration and session cleanup.

## 3. First administrator

Create a normal account through `/account`. Then, using a privileged database administration session, grant the administrator role to the verified email:

```sql
UPDATE users
SET role = 'admin'
WHERE email = LOWER('YOUR_VERIFIED_ADMIN_EMAIL');
```

Do not expose an administrator-role selector in public registration. Enable MFA and maintain a break-glass recovery procedure before inviting staff.

## 4. Account lifecycle

- [ ] Configure transactional email delivery and implement email verification.
- [ ] Implement secure password reset and account recovery.
- [ ] Implement account deletion/export and retention workflows.
- [ ] Configure trusted edge rate limiting and WAF rules for auth endpoints.
- [ ] Add audit logging and administrator MFA.
- [ ] Review privacy notice and applicable Nepal requirements.

## 5. Market data and AI

- [ ] Complete the Source Code MDP subscription and obtain production API specifications and written usage rights.
- [ ] Configure server-only MDP credentials; never use `NEXT_PUBLIC_*` for secrets.
- [ ] Implement schema-validated endpoints for each subscribed module.
- [ ] Verify timestamp, session status, data freshness, missing values and provider outages.
- [ ] Confirm redistribution, caching, historical storage and AI-derived analytics rights.
- [ ] Connect a model and evidence retrieval service only after source citations and risk gates are enforced.

## 6. Final release checks

- [ ] TypeScript check, lint and production build pass on the release commit.
- [ ] Test desktop, tablet and mobile browser layouts.
- [ ] Test registration, login, logout, expired sessions and role authorization.
- [ ] Test database outage and provider outage states.
- [ ] Verify no sample market data is shown as real.
- [ ] Verify privacy, methodology and risk disclosures.
- [ ] Enable error monitoring, uptime checks and incident alerts.
- [ ] Complete a production backup and restore drill.

A successful code build is not equivalent to a production launch. Do not announce live market data, secure multi-device storage or AI investment analysis until the corresponding external services are configured and tested.
