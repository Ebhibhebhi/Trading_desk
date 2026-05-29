# Sky Strike — Concert Ticket Intelligence

A single-page trading tool that ranks upcoming LA concerts by opportunity. Pull live market data from SeatGeek and Spotify, tune a weighted scoring formula with sliders, and get a ranked watchlist with BUY / WATCH / AVOID tiers.

---

## Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher
- Git

---

## API Keys

**SeatGeek** (optional but recommended for higher rate limits)
1. Go to [seatgeek.com/account/develop](https://seatgeek.com/account/develop)
2. Create a free account and register an app
3. Copy your **Client ID**

The app works without a SeatGeek client ID (uses their public endpoint), but you may hit rate limits faster without one.

---

## Setup

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd sky-strike
```

### 2. Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv

# On Mac/Linux:
source venv/bin/activate
# On Windows:
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Create your environment file
cp .env.example .env
```

Open `.env` and fill in your key:

```
SEATGEEK_CLIENT_ID=your_seatgeek_client_id
```

### 3. Frontend

Open a second terminal:

```bash
cd frontend
npm install
```

---

## Running the App

You need two terminals open at the same time.

**Terminal 1 — backend:**
```bash
cd backend
.\venv\Scripts\Activate.ps1   # Windows
# or: source venv/bin/activate  (Mac/Linux)
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — frontend:**
```bash
cd frontend
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## First Launch

On first run the backend automatically:
- Creates the local database (`skystrike.db`) — no setup required
- Pulls upcoming LA concerts from SeatGeek
- Fetches Spotify data for each artist

This takes about 5–10 seconds. If the table is empty, click **Refresh Data** and wait a few seconds.

The **Depletion Rate** signal shows "Pending" until 6+ hourly snapshots exist for an event — this is expected. The other three signals work immediately.

---

## How to Use

| Element | What it does |
|---|---|
| **Signal Weights sliders** | Adjust how much each signal contributes to the score. Hit **Normalize** to auto-balance to 1.0 |
| **Tier Thresholds** | Set the score cutoffs for BUY / WATCH / AVOID |
| **Refresh Data** | Triggers a fresh pull from SeatGeek and Spotify |
| **Click a row** | Opens a detail panel with full signal breakdown, price history chart, and artist stats |

Scores update instantly as you move sliders — no page reload needed.

---

## Signals

| Signal | Source | Description |
|---|---|---|
| Price Firmness | SeatGeek | Floor ÷ median price — tight spread signals strong demand |
| Supply Pressure | SeatGeek | Inverse of listing count — fewer listings scores higher |
| Depletion Rate | Computed | How fast listings are disappearing (needs 6+ hourly snapshots) |
| Timing Score | Computed | Trapezoid curve peaking at 14–45 days before the event |
