from fastapi import Query
from pathlib import Path

import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


# --------------------------------------------------
# Application
# --------------------------------------------------

app = FastAPI(
    title="AI Factory Energy Copilot",
    description="AI-powered Energy & Production Optimization Copilot for Indian SMEs",
    version="1.0.0",
)


# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# Dataset
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR.parent / "data" / "factory_energy.csv"


def load_data():
    """Load the factory dataset."""

    if not DATA_FILE.exists():
        raise FileNotFoundError(
            f"Factory dataset not found at: {DATA_FILE}"
        )

    df = pd.read_csv(DATA_FILE)

    df["timestamp"] = pd.to_datetime(df["timestamp"])

    return df


# --------------------------------------------------
# Basic routes
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "AI Factory Energy Copilot API is running",
        "status": "online",
    }


@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "service": "factory-energy-copilot",
    }


# --------------------------------------------------
# Dashboard
# --------------------------------------------------

@app.get("/api/dashboard")
def dashboard():

    df = load_data()

    latest_date = df["timestamp"].dt.date.max()

    today = df[
        df["timestamp"].dt.date == latest_date
    ]

    total_energy = today["energy_kwh"].sum()
    total_production = today["production_units"].sum()
    total_cost = today["energy_cost_inr"].sum()

    efficiency = (
        total_production / total_energy
        if total_energy > 0
        else 0
    )

    anomaly_count = int(
        today["is_anomaly"].sum()
    )

    return {
        "date": str(latest_date),
        "energy_kwh": round(total_energy, 2),
        "production_units": round(total_production, 2),
        "energy_cost_inr": round(total_cost, 2),
        "efficiency_units_per_kwh": round(
            efficiency,
            2,
        ),
        "anomalies": anomaly_count,
        "machines": int(
            df["machine_id"].nunique()
        ),
    }


# --------------------------------------------------
# Machine summary
# --------------------------------------------------

@app.get("/api/machines")
def machines():

    df = load_data()

    machine_summary = (
        df.groupby(
            [
                "machine_id",
                "machine_type",
            ]
        )
        .agg(
            energy_kwh=(
                "energy_kwh",
                "sum",
            ),
            production_units=(
                "production_units",
                "sum",
            ),
            average_temperature=(
                "temperature_c",
                "mean",
            ),
            operating_hours=(
                "operating_hours",
                "sum",
            ),
            anomalies=(
                "is_anomaly",
                "sum",
            ),
        )
        .reset_index()
    )

    machine_summary[
        "efficiency_units_per_kwh"
    ] = (
        machine_summary[
            "production_units"
        ]
        / machine_summary["energy_kwh"]
    )

    return machine_summary.round(2).to_dict(
        orient="records"
    )


# --------------------------------------------------
# Energy trend
# --------------------------------------------------

@app.get("/api/energy")
def energy(period: str = "hour"):

    df = load_data()

    if period == "hour":

        grouped = (
            df.groupby(
                df["timestamp"].dt.strftime("%Y-%m-%d %H:00")
            )
            .agg(
                energy_kwh=("energy_kwh", "sum"),
                production_units=("production_units", "sum"),
            )
            .reset_index()
        )

    elif period == "day":

        grouped = (
            df.groupby(
                df["timestamp"].dt.strftime("%Y-%m-%d")
            )
            .agg(
                energy_kwh=("energy_kwh", "sum"),
                production_units=("production_units", "sum"),
            )
            .reset_index()
        )

    elif period == "week":

        df["week"] = df["timestamp"].dt.to_period("W").astype(str)

        grouped = (
            df.groupby("week")
            .agg(
                energy_kwh=("energy_kwh", "sum"),
                production_units=("production_units", "sum"),
            )
            .reset_index()
            .rename(columns={"week": "timestamp"})
        )

    else:
        return {
            "error": "Invalid period. Use hour, day, or week."
        }

    return grouped.to_dict(orient="records")
@app.get("/api/machines")
def machines():

    df = load_data()

    machine_data = (
        df.groupby("machine_id")
        .agg(
            energy_kwh=("energy_kwh", "sum"),
            production_units=("production_units", "sum"),
        )
        .reset_index()
    )

    machine_data["efficiency"] = (
        machine_data["energy_kwh"]
        / machine_data["production_units"].replace(0, 1)
    )

    machine_data = machine_data.sort_values(
        "energy_kwh",
        ascending=False
    )

    return machine_data.to_dict(
        orient="records"
    )
@app.get("/api/insights")
def insights():

    df = load_data()

    machine_data = (
        df.groupby("machine_id")
        .agg(
            energy_kwh=("energy_kwh", "sum"),
            production_units=("production_units", "sum"),
        )
        .reset_index()
    )

    machine_data["efficiency"] = (
        machine_data["energy_kwh"]
        / machine_data["production_units"].replace(0, 1)
    )

    # Machine using the most energy
    highest_energy = machine_data.loc[
        machine_data["energy_kwh"].idxmax()
    ]

    # Machine using the most energy per production unit
    lowest_efficiency = machine_data.loc[
        machine_data["efficiency"].idxmax()
    ]

    # Overall efficiency
    total_energy = machine_data["energy_kwh"].sum()
    total_production = machine_data["production_units"].sum()

    overall_efficiency = (
        total_energy / total_production
        if total_production > 0
        else 0
    )

    return {
        "highest_energy_machine": {
            "machine_id": highest_energy["machine_id"],
            "energy_kwh": round(
                float(highest_energy["energy_kwh"]), 2
            ),
        },

        "least_efficient_machine": {
            "machine_id": lowest_efficiency["machine_id"],
            "efficiency": round(
                float(lowest_efficiency["efficiency"]), 2
            ),
        },

        "overall_efficiency": round(
            float(overall_efficiency), 2
        ),
    }
@app.get("/api/copilot")
def copilot():

    df = load_data()

    machine_data = (
        df.groupby("machine_id")
        .agg(
            energy_kwh=("energy_kwh", "sum"),
            production_units=("production_units", "sum"),
        )
        .reset_index()
    )

    machine_data["efficiency"] = (
        machine_data["energy_kwh"]
        / machine_data["production_units"].replace(0, 1)
    )

    highest_energy = machine_data.loc[
        machine_data["energy_kwh"].idxmax()
    ]

    least_efficient = machine_data.loc[
        machine_data["efficiency"].idxmax()
    ]

    total_energy = machine_data["energy_kwh"].sum()
    total_production = machine_data["production_units"].sum()

    overall_efficiency = (
        total_energy / total_production
        if total_production > 0
        else 0
    )

    message = (
        f"Machine {highest_energy['machine_id']} has the "
        f"highest total energy consumption at "
        f"{highest_energy['energy_kwh']:.2f} kWh. "
        f"Machine {least_efficient['machine_id']} has the "
        f"highest energy consumption per production unit at "
        f"{least_efficient['efficiency']:.2f} kWh/unit. "
        f"The overall factory efficiency is "
        f"{overall_efficiency:.2f} kWh/unit. "
        f"Consider reviewing the operating conditions and "
        f"maintenance status of the least efficient machine."
    )

    return {
        "message": message,
        "highest_energy_machine": highest_energy["machine_id"],
        "least_efficient_machine": least_efficient["machine_id"],
        "overall_efficiency": round(
            float(overall_efficiency), 2
        )
    }
@app.get("/api/copilot/ask")
def copilot_ask(question: str = Query(...)):

    df = load_data()

    machine_data = (
        df.groupby("machine_id")
        .agg(
            energy_kwh=("energy_kwh", "sum"),
            production_units=("production_units", "sum"),
        )
        .reset_index()
    )

    machine_data["efficiency"] = (
        machine_data["energy_kwh"]
        / machine_data["production_units"].replace(0, 1)
    )

    total_energy = machine_data["energy_kwh"].sum()
    total_production = machine_data["production_units"].sum()

    overall_efficiency = (
        total_energy / total_production
        if total_production > 0
        else 0
    )

    highest_energy = machine_data.loc[
        machine_data["energy_kwh"].idxmax()
    ]

    least_efficient = machine_data.loc[
        machine_data["efficiency"].idxmax()
    ]

    q = question.lower()

    if "least efficient" in q or "inefficient" in q:
        answer = (
            f"{least_efficient['machine_id']} has the highest "
            f"energy consumption per production unit at "
            f"{least_efficient['efficiency']:.2f} kWh/unit."
        )

    elif "highest energy" in q or "most energy" in q:
        answer = (
            f"{highest_energy['machine_id']} has the highest "
            f"total energy consumption at "
            f"{highest_energy['energy_kwh']:.2f} kWh."
        )

    elif "efficiency" in q:
        answer = (
            f"The overall factory efficiency is "
            f"{overall_efficiency:.2f} kWh per production unit."
        )

    elif "production" in q:
        answer = (
            f"Total production across the dataset is "
            f"{total_production:,.0f} units."
        )

    elif "energy" in q:
        answer = (
            f"Total energy consumption across the dataset is "
            f"{total_energy:,.2f} kWh."
        )

    elif "improve" in q or "reduce" in q:
        answer = (
            f"Start by investigating {least_efficient['machine_id']}, "
            f"which currently uses {least_efficient['efficiency']:.2f} "
            f"kWh per production unit. Reviewing its operating "
            f"conditions and maintenance status may help identify "
            f"possible efficiency improvements."
        )

    else:
        answer = (
            f"The factory currently has an overall efficiency of "
            f"{overall_efficiency:.2f} kWh/unit. "
            f"{highest_energy['machine_id']} has the highest total "
            f"energy consumption, while "
            f"{least_efficient['machine_id']} has the highest "
            f"energy use per production unit."
        )

    return {
        "question": question,
        "answer": answer
    }
@app.get("/api/copilot/ask")
def copilot_ask(question: str = Query(...)):

    df = load_data()

    machine_data = (
        df.groupby("machine_id")
        .agg(
            energy_kwh=("energy_kwh", "sum"),
            production_units=("production_units", "sum"),
        )
        .reset_index()
    )

    machine_data["efficiency"] = (
        machine_data["energy_kwh"]
        / machine_data["production_units"].replace(0, 1)
    )

    total_energy = machine_data["energy_kwh"].sum()
    total_production = machine_data["production_units"].sum()

    overall_efficiency = (
        total_energy / total_production
        if total_production > 0
        else 0
    )

    highest_energy = machine_data.loc[
        machine_data["energy_kwh"].idxmax()
    ]

    least_efficient = machine_data.loc[
        machine_data["efficiency"].idxmax()
    ]

    q = question.lower()

    if "least efficient" in q or "inefficient" in q:
        answer = (
            f"{least_efficient['machine_id']} has the highest "
            f"energy consumption per production unit at "
            f"{least_efficient['efficiency']:.2f} kWh/unit."
        )

    elif "highest energy" in q or "most energy" in q:
        answer = (
            f"{highest_energy['machine_id']} has the highest "
            f"total energy consumption at "
            f"{highest_energy['energy_kwh']:.2f} kWh."
        )

    elif "efficiency" in q:
        answer = (
            f"The overall factory efficiency is "
            f"{overall_efficiency:.2f} kWh per production unit."
        )

    elif "production" in q:
        answer = (
            f"Total production across the dataset is "
            f"{total_production:,.0f} units."
        )

    elif "energy" in q:
        answer = (
            f"Total energy consumption across the dataset is "
            f"{total_energy:,.2f} kWh."
        )

    elif "improve" in q or "reduce" in q:
        answer = (
            f"Start by investigating {least_efficient['machine_id']}, "
            f"which currently uses {least_efficient['efficiency']:.2f} "
            f"kWh per production unit. Reviewing its operating "
            f"conditions and maintenance status may help identify "
            f"possible efficiency improvements."
        )

    else:
        answer = (
            f"The factory currently has an overall efficiency of "
            f"{overall_efficiency:.2f} kWh/unit. "
            f"{highest_energy['machine_id']} has the highest total "
            f"energy consumption, while "
            f"{least_efficient['machine_id']} has the highest "
            f"energy use per production unit."
        )

    return {
        "question": question,
        "answer": answer
    }
# --------------------------------------------------
# Anomalies
# --------------------------------------------------

@app.get("/api/anomalies")
def anomalies():

    df = load_data()

    anomalies = df[
        df["is_anomaly"] == True
    ].copy()

    anomalies = anomalies.sort_values(
        "timestamp",
        ascending=False,
    )

    return anomalies.head(50).to_dict(
        orient="records"
    )