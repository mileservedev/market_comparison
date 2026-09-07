# Pickwise comparison app

This is a standard Next.js Node application using Hostinger MySQL for durable voting data.

## Local setup

1. Copy `.env.example` to `.env.local`, enter MySQL credentials, set a stable random `VOTE_HASH_SECRET` of at least 32 characters, and provide `PRIVACY_CONTACT_EMAIL`.
2. Import `database/schema.sql` into the database.
3. Run `npm install`, then `npm run dev`.

## Hostinger deployment

1. In hPanel, create a MySQL database under **Websites → Dashboard → Databases → Management**.
2. Open phpMyAdmin and import `database/schema.sql`.
3. Deploy this repository as a **Node.js Web App** with Node.js 22.
4. Add `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `VOTE_HASH_SECRET`, `VOTE_RETENTION_DAYS`, and `PRIVACY_CONTACT_EMAIL` as environment variables. Hostinger commonly uses `localhost` for `DB_HOST`. Keep `VOTE_HASH_SECRET` stable across deployments; generate it with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
5. Use `npm run build` as the build command and `npm start` as the start command.

The app includes two independently shareable campaigns:

- `/campaigns/running-shoes` — adidas vs Nike
- `/campaigns/suv-showdown` — Hyundai vs Honda

Existing deployments are migrated automatically when the app first connects with a database user that has `ALTER` permission. If automatic migration is not permitted, import `database/migrate-add-campaigns.sql` once in phpMyAdmin before deploying this version.

For the privacy-hardening upgrade, import `database/migrate-privacy-hardening.sql` if the database user cannot remove the legacy raw-IP column automatically.

The database enforces one vote per pseudonymous HMAC visitor key, campaign, and feature during the configured retention period. Once a visitor chooses a product for a feature, the opposite product is locked. A persistent browser device ID restores that visitor's choices after refresh. Voting records expire after 90 days by default.
