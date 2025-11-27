# Chess Analyzer v2

A Vite + React experience for importing Chess.com games, running lightweight AI-style analysis in the browser, and exploring performance trends through rich UI components.

## Platform Highlights

- **Game ingestion**: Pull recent games directly from Chess.com or load curated demo games to explore the interface instantly.
- **Local analysis engine**: `src/api/analysisEngine.js` inspects PGNs, flags blunders/mistakes, estimates accuracy, and produces actionable coaching notes without calling external LLMs.
- **Persistent library**: Games, analyses, and profile settings are saved to browser `localStorage` via `src/api/platformClient.js`, so refreshes keep your data intact.
- **Dashboards & insights**: Batch processing flows, per-game deep dives, and statistics pages provide timelines, accuracy charts, opening breakdowns, and more.
- **Modern UI toolkit**: Tailwind CSS, shadcn/ui primitives, Lucide icons, and custom chess widgets deliver a cohesive, responsive layout.

## UI Tour

### Dashboard — Loaded Library
The dashboard highlights aggregated counts, a configurable fetch form, and a paginated list of the most recent 50 games. Status pills surface which games have already been analyzed, so you can immediately jump to deeper insights.

![Dashboard populated with 50 games and analysis counters](screenshots/dashboard-library.png)

### Statistics Overview
The statistics route summarizes win rate, average accuracy, and tactical cleanliness, pairing KPI tiles with interactive Recharts visuals. It makes time-control trends and recent performance dips obvious without leaving the browser.

![Statistics screen with win rate donut and time-control chart](screenshots/statistics-overview.png)

### Batch Analysis Queue
Batch mode processes multiple PGNs in parallel, shows pending/completed counts, and keeps granular logs so failures are easy to rerun. Pending games can be selected in bulk or one-by-one before kicking off another wave.

![Batch analysis queue with success banner and selectable games](screenshots/batch-analysis.png)

### Game Analysis Deep Dive
Each game opens in a focused layout that syncs the board, move list, accuracy bars, opening metadata, and AI coaching copy. Players can replay the PGN, copy it, or trigger a fresh AI run without leaving the page.

![Single game analysis view with board, moves, and AI advice](screenshots/game-analysis.png)

### Dashboard — Recent Fetch
When only a few games are loaded the layout still showcases the same controls, making it clear how to fetch the latest archive snapshots or switch to Demo Mode for offline exploration.

![Dashboard showing three freshly imported games](screenshots/dashboard-recent.png)

### Settings — AI Provider Config
The AI Config tab lets you switch between local heuristics and external providers such as xAI, OpenAI, Anthropic, Hugging Face, Replicate, or Amazon Bedrock. Each option reveals the exact credential fields required for routing analysis traffic securely.

![Settings modal open to AI provider dropdown](screenshots/settings-ai-config.png)

### Settings — Chess.com Account (Success)
The Account tab persists your preferred Chess.com username and includes a built-in connectivity check. Passing the test surfaces a green confirmation so you know the public API is reachable before attempting a bulk fetch.

![Settings modal showing Chess.com username with success state](screenshots/settings-account-success.png)

### Settings — Chess.com Account (Blank State)
New users see the same form without saved data, reinforcing where to enter their handle before fetching games. The modal keeps the Test Connection action available even before persisting changes.

![Settings modal empty with Test Connection button](screenshots/settings-account-empty.png)

### Empty Library Onboarding
First-time sessions display a clear call-to-action to load demo games, making it easy to experience the analyzer even without Chess.com credentials. Once real data arrives these tiles transition into the dashboard widgets above.

![Empty library panel prompting Load Demo Games](screenshots/empty-library.png)

## Tech Stack

| Layer | Details |
| --- | --- |
| Build tooling | [Vite](https://vitejs.dev/), PostCSS, Tailwind |
| Framework | React 18, React Router DOM 7 |
| State/data | @tanstack/react-query for async state, custom platform client for persistence |
| UI | Tailwind, shadcn/ui components, Lucide icons |
| Charts | Recharts for accuracy, opening, and result visualizations |

## Quick Start

1. **Install prerequisites** – Node.js 18+ and npm.
2. **Download / unzip** the project.
3. **One-liner (macOS/Linux)**
   ```bash
   chmod +x scripts/install-and-launch.sh  # first time only
   ./scripts/install-and-launch.sh
   ```
   This installs dependencies and launches the dev server on `http://localhost:5173/`.
4. **Windows / manual setup**
   ```bash
   npm install
   npm run dev
   ```
5. When finished, stop the dev server with `Ctrl+C` (or close the terminal tab).

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Run the dev server**
   ```bash
   npm run dev
   ```
   Vite prints a local URL (typically http://localhost:5173). Open it in a modern browser.
3. **Build for production**
   ```bash
   npm run build
   npm run preview
   ```
   `preview` serves the optimized bundle locally so you can sanity-check before deploying to any static host.

> **Note:** No backend services are required. All data lives in the browser, so clearing site data resets the library.

## Testing

Vitest powers the automated test suite.

- `npm test` – Run the suite once in headless mode.
- `npm run test:watch` – Start Vitest in watch mode for local development.
- `npm run lint` – ESLint for static analysis.

Current coverage focuses on:

- `src/api/__tests__/analysisEngine.test.js` – heuristic analysis outputs
- `src/components/chess/__tests__/GameCard.test.jsx` – recent-games list item rendering
- `src/components/chess/__tests__/FetchGamesForm.test.jsx` – Dashboard fetch workflow interactions
- `src/pages/__tests__/Dashboard.test.jsx` – React Query driven dashboard data flows

Vitest enforces minimum coverage thresholds (60% statements/lines, 40% branches/functions). Extend the suites alongside these files to keep the quality gates green.

When the suite runs, coverage artifacts are written to `coverage/` (including `coverage/lcov.info`). Feed that LCOV file into your CI pipeline or coverage service of choice for historical reporting.

## Continuous Integration & Coverage Uploads

`.github/workflows/ci.yml` runs on every push (main/master) and pull request:

1. Install dependencies via `npm ci`.
2. Execute `npm test` (Vitest with coverage enabled).
3. Upload `coverage/lcov.info` to Codecov using `codecov/codecov-action@v4`.

To activate the upload step, create a `CODECOV_TOKEN` repository secret (from your Codecov project settings). Without the token the action will fail, so set it before merging CI changes into your default branch.

## Data & Storage Model

`src/api/platformClient.js` abstracts persistence. It exposes `entities.Game`, `entities.Analysis`, and `auth` helpers with simple `list`, `filter`, `create`, and `update` methods. Records are written to the following keys:

- `chess-platform/games`
- `chess-platform/analyses`
- `chess-platform/user`

Because everything runs client-side, writes are optimistic and return after a short artificial latency (≈120 ms) to mimic real network requests.

## Fetching Games from Chess.com

`src/api/gameSources.js` wraps the Chess.com public API:

1. The Dashboard form collects a username plus a fetch mode (last game, range, last X days, or demo).
2. `fetchGamesFromChessCom` pulls the last few monthly archives, filters them based on the selected mode, normalizes PGN metadata, and hands results to the platform client for storage.
3. If the API is unreachable (e.g., CORS blocks), the UI surfaces a friendly error and suggests Demo Mode.

Demo Mode seeds the local store with three famous games defined directly inside `src/pages/Dashboard.jsx`, so every feature can be exercised offline.

## AI-Style Analysis

The analyzer lives in `src/api/analysisEngine.js`:

- Parses moves from each PGN and looks for `?` / `??` annotations to flag mistakes and blunders.
- Estimates accuracy for both colors by combining total move count, outcome, and tactical misses.
- Generates `critical_moments`, `opening_assessment`, and natural-language `coaching_advice` strings.
- Returns results asynchronously so the UI can display progress indicators identical to real AI calls.

> **AI Provider Keys:** The default analyzer runs locally without calling any external model. To enable richer, provider-backed insights, open the in-app **Settings** dialog (gear icon in the header), pick an AI provider, and paste the requested credentials. Without a key you still get the heuristic analysis; with one configured the platform routes analysis requests to your provider. Credentials never leave your browser’s `localStorage`—use a backend proxy for production deployments.

### Connecting External AI Providers

Use these provider-specific checklists to obtain keys and wire them into the Settings dialog. Each entry maps 1:1 to the options inside the **AI Provider** select.

#### Local (Offline)
- Choose “Local (Offline)” when you do not want to call an external provider. No extra fields appear.

#### xAI · Grok
1. Generate an API key from https://console.x.ai/ (Settings → API Keys).
2. Note the model ID you plan to use (`grok-beta`, `grok-2`, etc.).
3. In Settings → AI Config choose **xAI (Grok)**, paste the key, and optionally override the model ID.

#### OpenAI
1. Create a secret key at https://platform.openai.com/account/api-keys.
2. Decide which chat completion model to run (`gpt-4o-mini`, `gpt-4.1`, etc.).
3. Select **OpenAI** in the dialog, paste the key, and enter the model ID.

#### Anthropic (Claude)
1. Visit https://console.anthropic.com/ and create an API key.
2. Copy your target model alias (e.g., `claude-3-5-sonnet-20241022`) and the API version header (`2023-06-01` by default).
3. Pick **Anthropic (Claude)**, fill in the model ID, optional version override, and API key.

#### Hugging Face Inference API
1. Create a Personal Access Token with `read` scope at https://huggingface.co/settings/tokens.
2. Copy the model slug you want (for example `mistralai/Mistral-7B-Instruct`).
3. Choose **Hugging Face Inference API** and enter both the model ID and token.

#### Replicate
1. Generate a token from https://replicate.com/account/api-tokens.
2. Copy the model slug (`owner/name`) and version hash.
3. Select **Replicate** in the dialog and fill all three fields (model, version, token).

#### Amazon Bedrock (AWS)
1. Ensure your AWS account/region has Bedrock enabled and you’ve requested access to the desired models.
2. Create IAM credentials with `bedrock:InvokeModel` access and note the region + model IDs (e.g., `anthropic.claude-3-sonnet-20240229-v1:0`).
3. Pick **Amazon Bedrock** and enter the region, model ID, access key, secret key, and optional session token.

> Tip: Credentials are saved to browser storage for demos only. In production, proxy AI calls through a secure backend and keep long-lived keys server-side.

`src/pages/Analysis.jsx` batches multiple games, whereas `src/pages/GameAnalysis.jsx` handles single-game deep dives. Both store their outputs through `platformClient.entities.Analysis`, unlocking the statistics page.

## Application Structure

- `src/pages/` – Route-level views (`Dashboard`, `Analysis`, `GameAnalysis`, `Statistics`).
- `src/components/chess/` – Chess-specific widgets (game cards, PGN viewers, settings modal, evaluation bar, etc.).
- `src/api/` – Platform services (`platformClient`, `analysisEngine`, `gameSources`).
- `src/components/ui/` – shadcn/ui building blocks.
- `src/utils/` – Helpers like `createPageUrl`.

React Router definitions live in `src/pages/index.jsx`, and `src/main.jsx` wires the router plus global providers.

## Typical Workflow

1. Open the Dashboard.
2. Fetch games from Chess.com **or** click “Demo Mode”.
3. Explore recent games, then either:
   - Hit **Batch Analysis** to process multiple games at once, or
   - Click an individual game to open the Game Analysis view.
4. Review AI insights, blunders, and accuracy metrics.
5. Jump to **Statistics** for aggregated trends (win rate, accuracy over time, top openings, time-control breakdowns).
6. Use the Settings dialog to store your default Chess.com username and optional AI provider notes (purely informational at this stage).

## Troubleshooting & Tips

- **No games appear after fetching**: Double-check the Chess.com username spelling. The API is case-insensitive, but private or brand-new accounts may not expose archives yet.
- **Stuck progress overlay**: All async flows rely on React Query. Refreshing the page resets in-flight state because data persists locally.
- **Want a clean slate?** Clear browser storage for the app’s origin or run `localStorage.clear()` in devtools.
- **Extending the analyzer**: Drop new heuristics into `analysisEngine.js` and include extra fields in the returned object; the UI surfaces any additional JSON stored alongside each analysis.

## Contributing / Next Steps

- Replace the heuristic analyzer with a real engine or cloud LLM call.
- Sync data to a backend instead of `localStorage` for multi-device access.
- Add authentication or shareable reports.

Until then, this README should give you everything needed to understand, run, and extend Chess Analyzer v2.
