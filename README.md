# PSK Brothers Builders & Constructions
React + Spring Boot + MySQL website.

## Setup

1. MySQL: `CREATE DATABASE psk_builders;` (or just let it auto-create — see below)
2. Set your DB credentials as environment variables (don't hardcode passwords):
   - `DB_USERNAME` (defaults to `root`)
   - `DB_PASSWORD` (defaults to `root`)
3. Run API: `cd backend` then `mvn spring-boot:run` → starts on http://localhost:8080
4. Run site: `cd frontend`, `npm install`, `npm run dev` → starts on http://localhost:5173
   (Vite is configured to proxy `/api` calls to the backend automatically, so no CORS issues in dev.)
5. Open http://localhost:5173

## What's included

- **Public site**: Home, About, Services, Why Us, 4 Pillars, Cost Calculator (blueprint-style, up to 1,00,000 sqft), Process, Projects, Testimonials, multi-step Contact form
- **Staff login** at `/admin` — for the owner and admin/staff (both get identical full access):
  - Update the ₹/sqft rate (used everywhere: calculator + every customer's estimate)
  - View/delete enquiries
  - Manage **Employees & Labour** (name, role, daily wage)
  - Mark **Attendance** (present/absent, hours) per employee per day
  - Record **Payments** made to employees
  - Create/manage **Customer logins**
  - Post **Site Progress Updates** (photo + note) — assigned to one specific customer
- **Customer portal** at `/portal` — each customer logs in and sees only:
  - Their own project name, size, and estimated cost
  - A live feed of photo/update posts the staff have posted for *their* project only
  - They never see other customers' data, employees, payments, or the admin dashboard

### Login credentials (seeded on first run — CHANGE THESE)
| Role | Username | Password (default) |
|---|---|---|
| Owner | `owner` | `psk@owner123` |
| Admin/Staff | `admin` | `psk@admin123` |
| Demo customer | `customer1` | `customer123` |

Change defaults via `application.properties` (`owner.password`, `admin.password`, `demo.customer.password`) or the matching `OWNER_PASSWORD` / `ADMIN_PASSWORD` / `DEMO_CUSTOMER_PASSWORD` env vars, **before** first run (they're only used to seed accounts).

### API summary
- Public: `GET /api/services|projects|testimonials|settings`, `POST /api/enquiries`
- Staff (`ROLE_ADMIN`, under `/api/admin/**`): enquiries, settings, employees, attendance, payments, customers, updates (multipart photo upload)
- Customer (`ROLE_ADMIN` or `ROLE_CUSTOMER`, under `/api/customer/**`): `GET /me`, `GET /updates` — both scoped to the logged-in account only

### Site progress photos
Uploaded photos are saved to `backend/uploads/` on disk and served at `/uploads/<filename>`. This folder is gitignored — back it up separately, or move to cloud storage (S3 etc.) before scaling up.

## Before going live

- **Change all three default passwords** above — this matters more than anything else on this list.
- Move DB and login credentials into a proper `.env`/secrets manager, and
  set `spring.jpa.hibernate.ddl-auto=validate` (not `update`) once your schema is stable.
- Swap the Unsplash placeholder project photos for your own project images.
- `/uploads/**` is currently publicly readable (not listable, but guessable if someone has the exact URL) —
  fine for a small site, but move to authenticated/signed URLs if photos are sensitive.
- For production, move file uploads off local disk (ephemeral on most hosts) to S3 or similar,
  since a redeploy can wipe the `uploads/` folder depending on your host.

## Deploying live

This project isn't hosted anywhere yet — you'll need to pick a host and deploy it yourself. A simple path:
1. **Database**: a managed MySQL (PlanetScale, Railway, AWS RDS, or your hosting provider's MySQL).
2. **Backend**: deploy the Spring Boot jar to Railway, Render, or a VPS (`mvn clean package` → run the jar with `DB_USERNAME`/`DB_PASSWORD`/`OWNER_PASSWORD`/`ADMIN_PASSWORD` env vars set).
3. **Frontend**: `npm run build` → deploy the `dist/` folder to Vercel, Netlify, or your hosting provider's static hosting. Point its API calls at your live backend URL (update `vite.config.js` proxy target, or set an env-based API base URL for production).
4. **Domain**: point your domain's DNS at the frontend host, and set up HTTPS (most hosts above do this automatically).

Happy to help prepare the exact deployment config once you've picked a host.
