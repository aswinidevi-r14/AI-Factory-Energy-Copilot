import os
import random
from datetime import datetime, timedelta

import numpy as np
import pandas as pd


# -----------------------------
# Factory configuration
# -----------------------------

MACHINES = [
    {
        "id": "M-001",
        "type": "CNC Machine",
        "base_energy": 32,
        "base_production": 42,
        "base_temperature": 55,
    },
    {
        "id": "M-002",
        "type": "Industrial Motor",
        "base_energy": 38,
        "base_production": 48,
        "base_temperature": 60,
    },
    {
        "id": "M-003",
        "type": "Compressor",
        "base_energy": 52,
        "base_production": 35,
        "base_temperature": 64,
    },
    {
        "id": "M-004",
        "type": "Hydraulic Press",
        "base_energy": 45,
        "base_production": 50,
        "base_temperature": 58,
    },
    {
        "id": "M-005",
        "type": "Cooling System",
        "base_energy": 28,
        "base_production": 30,
        "base_temperature": 52,
    },
]


# Approximate industrial electricity tariff.
# We can make this configurable later.
ENERGY_RATE = 8.0  # ₹ per kWh


def generate_factory_data(days=30):
    """Generate hourly factory data for the requested number of days."""

    random.seed(42)
    np.random.seed(42)

    start_time = datetime.now().replace(
        minute=0,
        second=0,
        microsecond=0,
    ) - timedelta(days=days)

    records = []

    for hour in range(days * 24):

        timestamp = start_time + timedelta(hours=hour)

        hour_of_day = timestamp.hour
        day_of_week = timestamp.weekday()

        # Factory operating schedule
        is_working_hour = 7 <= hour_of_day <= 19
        is_weekend = day_of_week >= 5

        for machine in MACHINES:

            machine_id = machine["id"]

            # ---------------------------------
            # Operating state
            # ---------------------------------

            if is_weekend:
                status = "Idle"
                operating_factor = 0.15

            elif is_working_hour:
                status = "Running"
                operating_factor = 1.0

            else:
                status = "Idle"
                operating_factor = 0.20

            # ---------------------------------
            # Daily production variation
            # ---------------------------------

            production_variation = np.random.normal(1.0, 0.08)

            production = (
                machine["base_production"]
                * operating_factor
                * production_variation
            )

            # ---------------------------------
            # Energy consumption
            # ---------------------------------

            energy_noise = np.random.normal(1.0, 0.06)

            energy = (
                machine["base_energy"]
                * operating_factor
                * energy_noise
            )

            # ---------------------------------
            # Temperature
            # ---------------------------------

            temperature = (
                machine["base_temperature"]
                + np.random.normal(0, 2)
            )

            # ---------------------------------
            # Create some abnormal events
            # ---------------------------------

            anomaly = False

            # Compressor abnormality
            if (
                machine_id == "M-003"
                and timestamp.day % 9 == 0
                and 11 <= hour_of_day <= 16
            ):
                energy *= 1.65
                production *= 0.85
                temperature += 10
                anomaly = True

            # Motor abnormality
            if (
                machine_id == "M-002"
                and timestamp.day % 13 == 0
                and 14 <= hour_of_day <= 17
            ):
                energy *= 1.45
                production *= 0.90
                temperature += 7
                anomaly = True

            # ---------------------------------
            # Clean values
            # ---------------------------------

            energy = max(0, round(energy, 2))
            production = max(0, round(production, 2))
            temperature = round(temperature, 2)

            operating_hours = (
                1.0 if status == "Running" else 0.2
            )

            energy_cost = round(
                energy * ENERGY_RATE,
                2,
            )

            records.append(
                {
                    "timestamp": timestamp,
                    "machine_id": machine_id,
                    "machine_type": machine["type"],
                    "energy_kwh": energy,
                    "production_units": production,
                    "temperature_c": temperature,
                    "operating_hours": operating_hours,
                    "machine_status": status,
                    "energy_cost_inr": energy_cost,
                    "is_anomaly": anomaly,
                }
            )

    return pd.DataFrame(records)


def main():
    df = generate_factory_data(days=30)

    # Create data directory if it doesn't exist
    data_dir = os.path.join(
        os.path.dirname(__file__),
        "..",
        "data",
    )

    os.makedirs(data_dir, exist_ok=True)

    output_path = os.path.join(
        data_dir,
        "factory_energy.csv",
    )

    df.to_csv(
        output_path,
        index=False,
    )

    print("======================================")
    print("Factory dataset generated successfully")
    print("======================================")
    print(f"Records: {len(df):,}")
    print(f"Machines: {df['machine_id'].nunique()}")
    print(f"Days: 30")
    print(f"Anomalies: {df['is_anomaly'].sum()}")
    print(f"Saved to: {output_path}")


if __name__ == "__main__":
    main()