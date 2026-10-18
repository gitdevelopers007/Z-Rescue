import json
import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

SEED = 42

FEATURE_COLUMNS = [
    "delay_ratio",              # current delay / planned travel duration
    "weather_severity",         # 0.0 to 1.0 (rainfall, storms)
    "rainfall_mm",              # mm of rainfall reported
    "road_closure_flag",        # 1 if road closure reported on route, 0 otherwise
    "inventory_coverage_ratio", # available inventory / safety stock threshold
    "temp_deviation_celsius",   # absolute deviation from safe storage temp (e.g. 4C for insulin)
    "medicine_criticality_num", # 1: normal, 2: high, 3: critical
    "travel_progress_ratio"     # 0.0 to 1.0 fraction of trip completed
]

def generate_synthetic_data(num_samples: int = 2500, random_state: int = SEED) -> pd.DataFrame:
    """
    Generates synthetic training records reflecting medical supply transit disruptions.
    Explicit causal assumptions:
    - High delay ratio combined with road closure strongly increases disruption risk.
    - Weather severity > 0.6 and heavy rainfall increase transit delay probability.
    - Destination inventory coverage < 0.5 critically amplifies urgency and disruption consequence.
    - Temperature deviations for cold-chain medicines multiply clinical risk score.
    """
    np.random.seed(random_state)
    
    # Generate feature distributions
    delay_ratio = np.clip(np.random.exponential(scale=0.25, size=num_samples), 0.0, 3.0)
    weather_severity = np.clip(np.random.beta(a=2, b=5, size=num_samples), 0.0, 1.0)
    rainfall_mm = np.where(weather_severity > 0.4, weather_severity * 65.0 + np.random.normal(5, 2, num_samples), 0.0)
    rainfall_mm = np.clip(rainfall_mm, 0.0, 150.0)
    
    road_closure_prob = np.clip(0.05 + 0.35 * weather_severity, 0.0, 0.9)
    road_closure_flag = (np.random.rand(num_samples) < road_closure_prob).astype(int)
    
    inventory_coverage_ratio = np.clip(np.random.gamma(shape=2.5, scale=0.6, size=num_samples), 0.05, 4.0)
    temp_deviation_celsius = np.clip(np.random.exponential(scale=0.8, size=num_samples), 0.0, 15.0)
    medicine_criticality_num = np.random.choice([1, 2, 3], p=[0.25, 0.45, 0.30], size=num_samples)
    travel_progress_ratio = np.random.uniform(0.05, 0.95, size=num_samples)
    
    # Ground truth latent risk function (no future leakage)
    latent_risk_logits = (
        2.8 * delay_ratio +
        1.9 * weather_severity +
        0.02 * rainfall_mm +
        2.5 * road_closure_flag +
        -1.4 * np.log(inventory_coverage_ratio + 0.01) +
        0.6 * temp_deviation_celsius +
        0.5 * (medicine_criticality_num - 1) -
        3.2
    )
    
    # Logistic probability
    disruption_prob = 1.0 / (1.0 + np.exp(-latent_risk_logits))
    # Disruption outcome (1 if disrupted, 0 if safely delivered within tolerance)
    target_disrupted = (np.random.rand(num_samples) < disruption_prob).astype(int)
    
    df = pd.DataFrame({
        "delay_ratio": delay_ratio,
        "weather_severity": weather_severity,
        "rainfall_mm": rainfall_mm,
        "road_closure_flag": road_closure_flag,
        "inventory_coverage_ratio": inventory_coverage_ratio,
        "temp_deviation_celsius": temp_deviation_celsius,
        "medicine_criticality_num": medicine_criticality_num,
        "travel_progress_ratio": travel_progress_ratio,
        "target_disrupted": target_disrupted
    })
    return df

def train_and_save_model(output_dir: str):
    os.makedirs(output_dir, exist_ok=True)
    model_path = os.path.join(output_dir, "risk_model.joblib")
    meta_path = os.path.join(output_dir, "model_metadata.json")
    
    df = generate_synthetic_data(num_samples=3000, random_state=SEED)
    X = df[FEATURE_COLUMNS]
    y = df["target_disrupted"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=SEED, stratify=y)
    
    clf = RandomForestClassifier(
        n_estimators=120,
        max_depth=6,
        min_samples_split=8,
        min_samples_leaf=4,
        random_state=SEED,
        class_weight="balanced"
    )
    clf.fit(X_train, y_train)
    
    y_pred = clf.predict(X_test)
    y_prob = clf.predict_proba(X_test)[:, 1]
    
    metrics = {
        "model_type": "RandomForestClassifier",
        "model_version": "1.0.0-ibmz-rf",
        "random_state": SEED,
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
        "precision": round(float(precision_score(y_test, y_pred)), 4),
        "recall": round(float(recall_score(y_test, y_pred)), 4),
        "f1_score": round(float(f1_score(y_test, y_pred)), 4),
        "roc_auc": round(float(roc_auc_score(y_test, y_prob)), 4),
        "feature_importances": {
            feat: round(float(imp), 4) for feat, imp in zip(FEATURE_COLUMNS, clf.feature_importances_)
        },
        "feature_names": FEATURE_COLUMNS,
        "trained_date": "2026-10-18T20:00:00Z",
        "is_trained": True
    }
    
    joblib.dump(clf, model_path)
    with open(meta_path, "w") as f:
        json.dump(metrics, f, indent=2)
        
    print(f"Model saved successfully to {model_path}")
    print(f"Metrics: {metrics}")
    return metrics

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    train_and_save_model(current_dir)
