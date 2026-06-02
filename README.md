# Career Autopilot

AI-powered job tracking and application management. Scores job postings against your profile and guides you through the full application pipeline.

## Features

- **AI scoring** — heuristic scoring across seniority, stack, domain, geography, salary, and more
- **Application Pipeline** — Kanban board tracking jobs from discovery to offer
- **Bulk ingest** — paste multiple URLs or job descriptions at once
- **Tailored CV** — generate a markdown CV draft per job
- **Dashboard metrics** — counts + interview/offer conversion rates

## Application Pipeline

Jobs move through these stages:

```
DISCOVERED → APPLY / MAYBE / SKIP
                 ↓
              APPLIED
                 ↓
            INTERVIEW
                 ↓
              OFFER
```

At any stage after APPLIED a job can be marked **REJECTED**.  
From REJECTED, a job can be reopened to **APPLY**.

| Status       | Meaning                                  |
|--------------|------------------------------------------|
| DISCOVERED   | Ingested, not yet triaged                |
| APPLY        | AI recommends applying (auto-set)        |
| MAYBE        | AI is unsure (auto-set)                  |
| SKIP         | AI recommends skipping (auto-set)        |
| APPLIED      | You have submitted the application       |
| INTERVIEW    | You have been invited to interview       |
| OFFER        | You have received an offer               |
| REJECTED     | Application was rejected / withdrawn     |

When a job is ingested, `applicationStatus` is automatically set from the AI label (APPLY / MAYBE / SKIP). You can then manually advance it through the pipeline from the job detail page or the Pipeline board.

## Local Setup

### 1. Configure environment

```bash
cp .env.example .env
# Edit .env — set DATABASE_URL to your Postgres connection string
```

### 2. Start Postgres (Docker)

```bash
npm run db:up
```

### 3. Install dependencies

```bash
npm install
```

### 4. Run database migrations

```bash
npm run prisma:migrate
# or for production:
npx prisma migrate deploy
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

1. **Set up your profile** — go to `/profile` and fill in your skills, target roles, location, and salary range. This drives the AI scoring.
2. **Ingest a job** — paste a URL or job description on the dashboard.
3. **Review the score** — click the job row to see the score breakdown, reasons, risks, and gaps.
4. **Track progress** — use the **Pipeline Status** controls on the job detail page to advance the job through the pipeline.
5. **View the board** — go to `/applications` for a Kanban overview of all stages.
6. **Generate a CV** — click "Generate Tailored CV" on the job detail page.

## Deployment

The `build` script runs migrations automatically:

```bash
npm run build   # runs: prisma generate && prisma migrate deploy && next build
npm start
```

Set the `DATABASE_URL` environment variable in your hosting provider (e.g. Vercel, Render, Railway).

## Environment Variables

| Variable                     | Required | Description                              |
|------------------------------|----------|------------------------------------------|
| `DATABASE_URL`               | Yes      | PostgreSQL connection string             |
| `OPENAI_API_KEY`             | No       | For LLM-powered CV generation            |
| `OPENAI_MODEL`               | No       | Default: `gpt-4o-mini`                   |
| `CAREER_AUTOPILOT_BASE_URL`  | No       | Used for absolute URL generation         |
