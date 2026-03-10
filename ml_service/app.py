from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
try:
    from predictive_model import run_prediction
except ModuleNotFoundError:
    from ml_service.predictive_model import run_prediction
import pandas as pd
import json
import os
from datetime import datetime

app = FastAPI(
    title="Hospital Predictive Equipment Maintenance API",
    description="API for predicting MRI/CT machine failures using telemetry data"
)

# Allow React frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TELEMETRY_FILE = os.path.join(BASE_DIR, "telemetry_data.json")
monitoring_state = {}


# -----------------------------------
# Utility: Load JSON Telemetry
# -----------------------------------

def load_telemetry():

    with open(TELEMETRY_FILE, "r") as f:
        data = json.load(f)

    df = pd.DataFrame(data)

    return df


# -----------------------------------
# Root Endpoint
# -----------------------------------

@app.get("/")
def home():
    return {
        "message": "Predictive Maintenance API Running",
        "available_endpoints": [
            "/machines",
            "/machine/{machine_id}",
            "/telemetry/{machine_id}",
            "/monitoring/{machine_id}/start",
            "/monitoring/{machine_id}/stop",
            "/monitoring/{machine_id}/status"
        ]
    }


# -----------------------------------
# Get All Machines
# -----------------------------------

@app.get("/machines")
def get_all_machines():

    df = load_telemetry()

    machines = df["machine_id"].unique().tolist()

    results = []

    for machine in machines:
        results.append(run_prediction(machine))

    return {"machines": results}


# -----------------------------------
# Get Machine Health Prediction
# -----------------------------------

@app.get("/machine/{machine_id}")
def get_machine_health(machine_id: str):

    try:
        report = run_prediction(machine_id)

        return report

    except Exception as e:

        return {
            "error": str(e),
            "message": "Machine not found"
        }


# -----------------------------------
# Get Raw Telemetry Data
# -----------------------------------

@app.get("/telemetry/{machine_id}")
def get_telemetry(machine_id: str):

    df = load_telemetry()

    machine_data = df[df["machine_id"] == machine_id]

    if machine_data.empty:

        return {"error": "Machine not found"}

    return {
        "machine_id": machine_id,
        "telemetry": machine_data.to_dict(orient="records")
    }


# -----------------------------------
# Monitoring Controls
# -----------------------------------

@app.post("/monitoring/{machine_id}/start")
def start_monitoring(machine_id: str):

    monitoring_state[machine_id] = {
        "is_monitoring": True,
        "last_started_at": datetime.utcnow().isoformat() + "Z"
    }

    return {
        "machine_id": machine_id,
        "is_monitoring": True,
        "status": "started",
        "last_started_at": monitoring_state[machine_id]["last_started_at"]
    }


@app.post("/monitoring/{machine_id}/stop")
def stop_monitoring(machine_id: str):

    current_state = monitoring_state.get(machine_id, {})
    current_state["is_monitoring"] = False
    current_state["last_stopped_at"] = datetime.utcnow().isoformat() + "Z"
    monitoring_state[machine_id] = current_state

    return {
        "machine_id": machine_id,
        "is_monitoring": False,
        "status": "stopped",
        "last_stopped_at": current_state["last_stopped_at"]
    }


@app.get("/monitoring/{machine_id}/status")
def get_monitoring_status(machine_id: str):

    state = monitoring_state.get(machine_id, {
        "is_monitoring": False,
        "last_started_at": None,
        "last_stopped_at": None
    })

    return {
        "machine_id": machine_id,
        "is_monitoring": state.get("is_monitoring", False),
        "last_started_at": state.get("last_started_at"),
        "last_stopped_at": state.get("last_stopped_at")
    }