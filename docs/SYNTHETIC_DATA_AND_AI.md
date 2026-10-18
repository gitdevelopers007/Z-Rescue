# AI Risk Engine & Synthetic Training Dataset Methodology
**Project: Z-Rescue | Team: UNI MIND | Event: IBM Z Datathon 2026 (SSF2026)**
**Theme: Real-Time AI for Critical Decisions**

---

## 1. Overview & Objective

The objective of the Z-Rescue AI Risk Engine is to predict the likelihood that an ongoing essential medicine shipment will experience a clinically significant delivery disruption or stockout before reaching its destination facility.

Rather than returning an arbitrary or randomized risk number, Z-Rescue employs a reproducible supervised classification model trained on a curated synthetic dataset modeling real-world pharmaceutical logistics dynamics.

---

## 2. Feature Engineering & Time-Aware Construction

To prevent data leakage, all features are constructed strictly from information available **at or prior to the decision point**:

| Feature Name | Type | Description | Operational Significance |
| :--- | :--- | :--- | :--- |
| `delay_ratio` | Float (0.0 to 3.0) | Current accumulated delay divided by planned transit duration | Normalizes delay across short cross-town trips vs long regional hauls |
| `weather_severity` | Float (0.0 to 1.0) | Atmospheric hazard score derived from Open-Meteo telemetry | Reflects squalls, monsoon rain, high winds |
| `rainfall_mm` | Float (0.0 to 150.0) | Local precipitation volume reported on corridor | High values (>35 mm) trigger road hydroplaning |
| `road_closure_flag` | Binary (0 or 1) | Active blockage indicator from traffic police or driver | Strongest single predictor of complete route halt |
| `inventory_coverage_ratio` | Float (0.05 to 4.0) | Destination on-hand stock divided by safety threshold | Determines urgency: low coverage amplifies consequence |
| `temp_deviation_celsius` | Float (0.0 to 15.0) | Absolute excursion outside 2°C – 8°C cold chain target | Critical for insulin, blood products, and vaccines |
| `medicine_criticality_num` | Categorical (1, 2, 3) | 1: Normal, 2: High, 3: Critical emergency medicine | Weight multiplier for clinical urgency |
| `travel_progress_ratio` | Float (0.05 to 0.95) | Fraction of route traversed | Late-stage delays offer fewer rerouting alternatives |

---

## 3. Synthetic Dataset Assumptions & Generation

The training dataset was synthesized in `backend/app/ai/train_model.py` with reproducible seed `42` across 3,000 transit observations:

- **Delay distribution**: Modeled via an exponential distribution ($\lambda = 4.0$).
- **Precipitation**: Modeled via Beta distribution with heavy-tailed squalls.
- **Latent Ground-Truth Logit**:
  $$\text{Logit}(P) = 2.8 \times \text{delay\_ratio} + 1.9 \times \text{weather\_severity} + 0.02 \times \text{rainfall\_mm} + 2.5 \times \text{road\_closure} - 1.4 \times \ln(\text{inv\_coverage} + 0.01) + 0.6 \times \text{temp\_dev} + 0.5 \times (\text{crit} - 1) - 3.2$$
- **Outcome Target**: Binary $Y \in \{0, 1\}$ representing whether the delivery suffered critical stockout delay ($Y=1$) or arrived in safety buffer ($Y=0$).

---

## 4. Model Training & Validation Results

Trained using `RandomForestClassifier` with balanced class weights:
- **Training Samples**: 2,250
- **Validation Samples**: 750 (stratified test split)
- **Random Seed**: 42
- **Hyperparameters**: `n_estimators=120`, `max_depth=6`, `min_samples_split=8`

### Performance Metrics:
- **Accuracy**: 72.9%
- **Precision**: 61.2%
- **Recall**: 70.8%
- **F1 Score**: 0.6565
- **ROC-AUC**: **0.8057**

### Top Feature Importances:
1. `inventory_coverage_ratio`: **24.6%**
2. `road_closure_flag`: **21.4%**
3. `delay_ratio`: **17.2%**
4. `weather_severity`: **11.2%**
5. `temp_deviation_celsius`: **10.8%**
6. `rainfall_mm`: **7.9%**

---

## 5. Risk Categorization & Explainability

Calibrated probability is scaled to a normalized risk score from 0 to 100:
- **0 – 29: Low** (Nominal transit progress)
- **30 – 59: Moderate** (Minor delays or adverse weather alerts)
- **60 – 79: High** (Significant delay or approaching safety stock depletion)
- **80 – 100: Critical** (Catastrophic blockage, thermal failure, or imminent stockout)

### Deterministic Safety Fallback
If the model file is ever unreadable, the system automatically activates `DeterministicRuleBasedSafetyEngine`, which enforces identical threshold bounds without guessing.
