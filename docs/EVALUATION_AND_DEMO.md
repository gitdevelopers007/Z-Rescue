# Hackathon Demonstration Walkthrough & Evaluation Plan
**Project: Z-Rescue | Team: UNI MIND | Event: IBM Z Datathon 2026 (SSF2026)**
**Theme: Real-Time AI for Critical Decisions**

---

## 1. Quick Demonstration Walkthrough (3-Minute Hackathon Pitch)

### Step 1: Open the Application
- Access the frontend dashboard at `http://localhost:5173`.
- Notice the **Overview Dashboard** displaying:
  - Total Active Shipments: 6
  - High / Critical Risk: 2
  - Average Disruption Risk: 45.5%
  - Persistent Header Badge: *"Local Demo Processor — IBM Z integration adapter ready"*
  - Mode: *"Demo Mode"* with pulsating green *"Live Telemetry"* indicator.

### Step 2: Launch the Interactive Insulin Demo Scenario
- Click the glowing **"Run Demo Scenario"** button in the header.
- The interactive modal opens, presenting shipment **`SHP-801` (Insulin Glargine 100U/mL)** en route to St. Jude Memorial Hospital with initial nominal risk (28.5%).

### Step 3: Trigger Step 1 (Monsoon Weather Warning)
- Click **"Trigger Step 1"**.
- 55 mm heavy rainfall is ingested over the Vellore corridor via the `/api/v1/events` pipeline.
- Notice the live event feed updates instantaneously via WebSockets without page reload.
- Risk recalculates to **Moderate (44.5%)**.

### Step 4: Trigger Step 2 (Highway Congestion & Delay)
- Click **"Trigger Step 2"**.
- Transit delay escalates by +50 minutes due to hydroplaning hazards.
- Risk score jumps to **High (68.0%)**. An automated alert is generated.

### Step 5: Trigger Step 3 (Destination Emergency Demand Surge)
- Click **"Trigger Step 3"**.
- St. Jude Emergency Wing experiences an ICU surge; on-hand Lantus stock drops to 10 units (below safety stock 50).
- Risk engine escalates risk to **Critical (84.0%)**.
- A **Critical Disruption Risk Alert** and an **Inventory Safety Deficit Alert** are created in the Alerts Center.
- A **Recommendation** appears: *"Alert dispensary to quarantine reserve and evaluate Highway 44 Bypass."*

### Step 6: Review & Human Authorization
- Close the modal and navigate to **Alerts Center**.
- Click **"Acknowledge"** and then **"Resolve"** on the alert.
- Navigate to **Recommendations** and click **"Authorize Recommendation"**.
- Navigate to **Audit Log** to inspect the cryptographically correlated audit trail of the entire sequence.

---

## 2. Testing & Evaluation Matrix

All 25 automated tests pass with 100% success rate (`python backend/run_tests.py`):

| Test # | Test Scenario | Verified Result |
| :--- | :--- | :--- |
| 1 | Health Check endpoint (`/health`) | Passed (HTTP 200, status UP, SSF2026) |
| 2 | Database initialization | Passed (Tables created & verified) |
| 3 | Shipment creation API | Passed (Created `SHP-NEW-999`) |
| 4 | Shipment update API | Passed (Patched delay & status) |
| 5 | Event schema validation | Passed (Valid schema persisted) |
| 6 | Duplicate event rejection | Passed (HTTP 409 Conflict on reused ID) |
| 7 | Valid event persistence | Passed (Found in SQLite query) |
| 8 | Risk score bounds (0 to 100) | Passed (Checked extreme low/high boundaries) |
| 9 | Risk category threshold mapping | Passed (Low, Moderate, High, Critical) |
| 10 | Rule-based fallback behavior | Passed (Triggered on missing model file) |
| 11 | Model loading & live inference API | Passed (Probabilities & factors returned) |
| 12 | High-risk alert creation | Passed (Alert generated on threshold breach) |
| 13 | Duplicate alert suppression | Passed (Suppressed redundant alert spam) |
| 14 | Alert acknowledgment | Passed (Status changed to ACKNOWLEDGED with actor) |
| 15 | Alert resolution | Passed (Status changed to RESOLVED with actor) |
| 16 | Inventory safety-stock alert | Passed (Raised on inventory < safety threshold) |
| 17 | Stock coverage calculation | Passed (Hours remaining correctly computed) |
| 18 | Malformed request handling | Passed (HTTP 422 Unprocessable Entity) |
| 19 | Missing shipment handling | Passed (HTTP 404 Not Found) |
| 20 | Transaction Processor interface | Passed (Correlation ID & latency logged) |
| 21 | Demo event generator start/stop | Passed (Async background task controls) |
| 22 | Dashboard metrics updating | Passed (Live aggregate metrics recomputed) |
| 23 | External weather API fallback | Passed (Deterministic fallback on timeout) |
| 24 | Audit trail recording | Passed (Immutable logs retrieved) |
| 25 | Demo scenario step-by-step execution | Passed (Step 1, 2, 3 verified end-to-end) |
