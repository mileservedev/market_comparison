# Pickwise comparison app

This is a standard Next.js Node application using Hostinger MySQL for durable voting data.

## Local setup

1. Copy `.env.example` to `.env.local` and enter MySQL credentials.
2. Import `database/schema.sql` into the database.
3. Run `npm install`, then `npm run dev`.

## Hostinger deployment

1. In hPanel, create a MySQL database under **Websites → Dashboard → Databases → Management**.
2. Open phpMyAdmin and import `database/schema.sql`.
3. Deploy this repository as a **Node.js Web App** with Node.js 22.
4. Add `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` as environment variables. Hostinger commonly uses `localhost` for `DB_HOST`.
5. Use `npm run build` as the build command and `npm start` as the start command.

The database enforces one vote per visitor key and feature. Selecting the opposite product updates that vote instead of inserting a duplicate.
