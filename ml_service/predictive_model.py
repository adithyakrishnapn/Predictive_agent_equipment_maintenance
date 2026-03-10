import pandas as pd
import joblib
import numpy as np
import json
import os


# -----------------------------------
# Load Trained AI Model
# -----------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "training", "equipment_failure_model.pkl")
ENCODER_PATH = os.path.join(BASE_DIR, "training", "label_encoder.pkl")
TELEMETRY_PATH = os.path.join(BASE_DIR, "telemetry_data.json")

model = joblib.load(MODEL_PATH)
label_encoder = joblib.load(ENCODER_PATH)


# -----------------------------------
# Get Equipment Telemetry
# -----------------------------------

def get_equipment_telemetry(machine_id):

    with open(TELEMETRY_PATH, "r") as f:
        data = json.load(f)

    df = pd.DataFrame(data)

    machine_data = df[df["machine_id"] == machine_id]

    return machine_data


# -----------------------------------
# Compute Baseline
# -----------------------------------

def compute_baseline(df):

    baseline = {
        "temperature_mean": df["temperature"].mean(),
        "pressure_mean": df["helium_pressure"].mean(),
        "vibration_mean": df["vibration"].mean(),
        "error_mean": df["error_count"].mean()
    }

    return baseline


# -----------------------------------
# Predict Risk Using XGBoost
# -----------------------------------

def classify_failure_risk(df):

    latest = df.iloc[-1]

    features = np.array([[
        latest["temperature"],
        latest["helium_pressure"],
        latest["vibration"],
        latest["error_count"],
        latest["scan_volume"]
    ]])

    prediction = model.predict(features)

    risk = label_encoder.inverse_transform(prediction)

    return risk[0]


# -----------------------------------
# Detect Pressure Trend
# -----------------------------------

def detect_pressure_trend(df):

    first = df["helium_pressure"].iloc[0]
    last = df["helium_pressure"].iloc[-1]

    if last < first - 2:
        return "Declining"

    elif last > first + 2:
        return "Increasing"

    else:
        return "Stable"


# -----------------------------------
# Predict Failure Days
# -----------------------------------

def predict_failure_days(df):

    start = df["helium_pressure"].iloc[0]
    current = df["helium_pressure"].iloc[-1]

    drop_rate = (start - current) / len(df)

    critical_pressure = 80

    if drop_rate <= 0:
        return None

    days_left = (current - critical_pressure) / drop_rate

    return int(days_left)


# -----------------------------------
# Health Score
# -----------------------------------

def calculate_health_score(risk):

    score_map = {
        "Normal": 100,
        "Monitor": 75,
        "Maintenance": 40,
        "Critical": 10
    }

    return score_map.get(risk, 50)


# -----------------------------------
# Cost Impact Calculator
# -----------------------------------

def cost_analysis():

    preventive_cost = 60000
    repair_cost = 300000
    lost_revenue = 1000000

    breakdown_cost = repair_cost + lost_revenue

    savings = breakdown_cost - preventive_cost

    return {
        "preventive_maintenance_cost": preventive_cost,
        "breakdown_cost": breakdown_cost,
        "estimated_savings": savings
    }


# -----------------------------------
# Vendor Directory
# -----------------------------------

vendors = [
    {
        "name": "GE Healthcare",
        "service_rate": 60000,
        "availability": ["Tomorrow 10AM", "Tomorrow 2PM"]
    },
    {
        "name": "Siemens Healthineers",
        "service_rate": 70000,
        "availability": ["Tomorrow 11AM", "Day After Tomorrow 9AM"]
    }
]


# -----------------------------------
# Contact Service Vendor
# -----------------------------------

def contact_service_vendor(machine_id, fault_summary, urgency):

    vendor = vendors[0]

    print("\n📞 Vendor Contacted:", vendor["name"])

    return {
        "vendor": vendor["name"],
        "fault": fault_summary,
        "urgency": urgency,
        "scheduled_window": vendor["availability"][0]
    }


# -----------------------------------
# Get Scan Schedule
# -----------------------------------

def get_scan_schedule(machine_id):

    schedule = [
        {"appointment_id": 1, "patient": "Patient A", "time": "10:00"},
        {"appointment_id": 2, "patient": "Patient B", "time": "11:00"},
        {"appointment_id": 3, "patient": "Patient C", "time": "12:00"},
        {"appointment_id": 4, "patient": "Patient D", "time": "14:00"},
        {"appointment_id": 5, "patient": "Patient E", "time": "15:00"}
    ]

    return schedule


# -----------------------------------
# Reschedule Appointment
# -----------------------------------

def reschedule_appointment(appointment_id):

    print(f"🔄 Appointment {appointment_id} rescheduled")


# -----------------------------------
# Notify Engineering Team
# -----------------------------------

def notify_engineering_team(machine_id, risk, failure_days):

    message = f"""
⚠ ALERT

Machine: {machine_id}
Risk Level: {risk}
Predicted Failure In: {failure_days} days

Recommended Action: Schedule Maintenance
"""

    print(message)

    return True


# -----------------------------------
# Main AI Maintenance Agent
# -----------------------------------

def run_prediction(machine_id):

    df = get_equipment_telemetry(machine_id)

    baseline = compute_baseline(df)

    risk = classify_failure_risk(df)

    pressure_trend = detect_pressure_trend(df)

    failure_days = predict_failure_days(df)

    health_score = calculate_health_score(risk)

    cost = cost_analysis()

    vendor_info = None

    if risk in ["Maintenance", "Critical"]:

        vendor_info = contact_service_vendor(
            machine_id,
            "Cooling system pressure drop",
            "High"
        )

        notify_engineering_team(machine_id, risk, failure_days)

        schedule = get_scan_schedule(machine_id)

        for appointment in schedule:

            reschedule_appointment(appointment["appointment_id"])

    report = {
        "machine_id": machine_id,
        "risk_level": risk,
        "pressure_trend": pressure_trend,
        "predicted_failure_days": failure_days,
        "health_score": health_score,
        "baseline": baseline,
        "cost_analysis": cost,
        "vendor_service": vendor_info,
        "telemetry": df.tail(10).to_dict(orient="records")
    }

    return report


# -----------------------------------
# Run Example
# -----------------------------------

if __name__ == "__main__":

    result = run_agent("MRI_001")

    print("\n FINAL REPORT\n")

    print(result)