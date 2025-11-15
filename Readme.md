# Synergy IBA - Coin Trading Dashboard

A real-time simulated coin trading dashboard with a static frontend and Netlify serverless functions backed by Supabase.

---

## Quick Links (Source Files & Entry Points)

* **Netlify config:** [netlify.toml](netlify.toml)
* **Frontend HTML:**

  * [src/index.html](src/index.html)
  * [src/user.html](src/user.html)
  * [src/dummy.html](src/dummy.html)
* **Frontend JS:**

  * [src/js/teamdata.js](src/js/teamdata.js) — `setTeamkey`, `getTeamkey`
  * [src/js/login.js](src/js/login.js) — `signIn`
  * [src/js/user.js](src/js/user.js) — `master`, `readdata`, `calculateBuyingPower`
  * [src/js/dummy.js](src/js/dummy.js) — realtime demo
* **Frontend CSS:**

  * [src/css/index.css](src/css/index.css)
  * [src/css/user.css](src/css/user.css)
* **Serverless Functions (Netlify):**

  * [functions/read.js](functions/read.js) — `read.handler`
  * [functions/update.js](functions/update.js) — `update.handler`
  * [functions/mainfunction.js](functions/mainfunction.js) — `mainfunction.handler`
  * [functions/totalworth.js](functions/totalworth.js) — `totalworth.handler`
* **Project & Config:**

  * [package.json](package.json)
  * [.gitignore](.gitignore)

---

## Project Overview

* **Frontend Features:**

  * Display Master coin prices, percent changes, and trends.
  * Show per-team coin holdings and total worth.
  * Login page stores team key in `localStorage` via `teamdata.js`.
* **Serverless Function Features:**

  * Read team data: `read.handler`
  * Buy/sell transactions: `update.handler`
  * Update MasterCoins stock and percent changes: `mainfunction.handler`
  * Recalculate total worth / leaderboard: `totalworth.handler`

---

## Local Setup

1. Clone the repo:

   ```bash
   git clone <repo_url>
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file at project root:

   ```
   SUPABASE_URL=<your_supabase_url>
   SUPABASE_KEY=<your_service_or_anon_key>
   ```

4. Build frontend with Parcel:

   ```bash
   npm run build
   ```

5. Run locally:

   ```bash
   npx parcel src/user.html
   ```

> `.env` is ignored by Git. Netlify functions directory is configured in `netlify.toml`.

---

## API Endpoints

* **Read team data:**

  ```
  GET /.netlify/functions/read?teamkey=<TEAM_KEY>
  ```

* **Buy/Sell transactions:**

  ```
  GET /.netlify/functions/update?cointype=<COIN>&teamId=<TEAM>&transactiontype=<buy|sell>&coinval=<VALUE>
  ```

* **MasterCoins update:**
  See `mainfunction.handler`

* **Leaderboard / total worth update:**
  See `totalworth.handler`

---

## Data Model (Supabase/Postgres)

Table: `userdata`

* `Team_password` (key for fetching row)
* `Team_name`
* `Stock` (array of numbers)
* `StockChange` (array of percent changes)
* `free_money` (number)
* `total_worth` (number)

> Functions read/write these fields using Supabase client (`@supabase/supabase-js`).

---

## Security & Deployment

* Use service role key for server-side functions. Avoid exposing in frontend.
* Frontend uses public anon key for read-only operations.
* Netlify builds and deploys using `netlify.toml`. Ensure environment variables are set in Netlify UI.

---

## Maintenance & Extensions

* Add unit tests for buy/sell boundaries (Decimal.js logic).
* Add input validation and CSRF protections for public endpoints.
* Centralize frontend error handling for better UX.
