from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional, Dict
import numpy as np
import os
import math

app = FastAPI(title="Delhi NCR Urban Air Quality Intelligence API")

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------------------------------
# Static Stations Database (Delhi NCR CAAQMS Stations)
# ----------------------------------------------------
STATIONS = [
    {
        "id": "anand_vihar",
        "name": "Anand Vihar",
        "lat": 28.6476,
        "lon": 77.3158,
        "zone": "East Delhi",
        "base_traffic": 90,
        "base_industry": 40,
        "base_dust": 80,
        "base_biomass": 30,
        "description": "Heavy transit corridor near ISBT & UPSRTC border. High traffic congestion and resuspended road dust."
    },
    {
        "id": "rk_puram",
        "name": "RK Puram",
        "lat": 28.5660,
        "lon": 77.1731,
        "zone": "South Delhi",
        "base_traffic": 50,
        "base_industry": 10,
        "base_dust": 40,
        "base_biomass": 20,
        "description": "Primarily residential sector with moderate vehicle density and high green canopy cover."
    },
    {
        "id": "dwarka",
        "name": "Dwarka Sector 8",
        "lat": 28.5714,
        "lon": 77.0719,
        "zone": "South-West Delhi",
        "base_traffic": 65,
        "base_industry": 15,
        "base_dust": 70,
        "base_biomass": 25,
        "description": "Sub-urban residential area undergoing infrastructure expansion. High construction dust impact."
    },
    {
        "id": "shadipur",
        "name": "Shadipur",
        "lat": 28.6514,
        "lon": 77.1504,
        "zone": "West Delhi",
        "base_traffic": 70,
        "base_industry": 60,
        "base_dust": 50,
        "base_biomass": 30,
        "description": "Commercial-industrial mix zone with metal-working units and print presses nearby."
    },
    {
        "id": "bawana",
        "name": "Bawana",
        "lat": 28.7972,
        "lon": 77.0505,
        "zone": "North-West Delhi",
        "base_traffic": 45,
        "base_industry": 95,
        "base_dust": 60,
        "base_biomass": 45,
        "description": "Major industrial cluster with plastic manufacturing, boiler operations, and waste-incineration hotspots."
    },
    {
        "id": "ito",
        "name": "ITO",
        "lat": 28.6282,
        "lon": 77.2410,
        "zone": "Central Delhi",
        "base_traffic": 95,
        "base_industry": 15,
        "base_dust": 55,
        "base_biomass": 20,
        "description": "High-density traffic junction. Continuous idling and stop-and-go exhaust emissions."
    }
]

# ----------------------------------------------------
# Models & Request Schemas
# ----------------------------------------------------
class PolicyLevers(BaseModel):
    odd_even: bool = False
    stubble_ban: bool = False
    smog_cannons: bool = False
    factory_scaling: float = 100.0  # Percentage (0 - 100)
    construction_ban: bool = False

class SimulateRequest(BaseModel):
    station_id: str
    forecast_hours: int = 72
    policies: PolicyLevers

# ----------------------------------------------------
# Computational Functions (AI simulation logic)
# ----------------------------------------------------
def get_stubble_wind_factor(wind_direction: float) -> float:
    """
    Stubble fires are located North-West of Delhi (Punjab/Haryana).
    Wind directions from 290° to 330° bring maximum stubble smoke.
    """
    diff = abs(wind_direction - 310)
    if diff > 180:
        diff = 360 - diff
    # Gaussian dispersion representing wind angle alignment
    return float(np.exp(- (diff ** 2) / (2 * (25 ** 2))))

def compute_aqi_components(
    station: dict,
    hour_idx: int,
    wind_speed: float,
    wind_direction: float,
    mixing_height: float,
    active_crop_fires: int,
    policies: Optional[PolicyLevers] = None
) -> Dict[str, float]:
    """
    Performs physical-chemical dispersion modeling of pollutants.
    Fuses weather parameters, diurnal curves, and active policy interventions.
    """
    if policies is None:
        policies = PolicyLevers()

    # 1. Diurnal variations
    # Traffic peaks during morning/evening commute: 9 AM (hour 9) and 6 PM (hour 18)
    hour = hour_idx % 24
    traffic_diurnal = 1.0 + 0.6 * math.sin((hour - 9) * math.pi / 6) ** 2
    # Wind speed diurnal (typically slightly calmer during nights)
    ws_adj = max(0.5, wind_speed * (1.0 + 0.15 * math.sin((hour - 14) * math.pi / 12)))
    # Mixing height diurnal (collapses at night, trapping pollutants)
    mh_adj = max(100.0, mixing_height * (1.0 + 0.45 * math.sin((hour - 14) * math.pi / 12)))

    # 2. Policy multipliers
    traffic_mult = 0.65 if policies.odd_even else 1.0
    stubble_mult = 0.10 if policies.stubble_ban else 1.0
    dust_mult = 0.75 if policies.smog_cannons else 1.0
    if policies.construction_ban:
        dust_mult *= 0.40  # 60% reduction on construction ban
    industry_mult = policies.factory_scaling / 100.0

    # 3. Source calculations using atmospheric physics
    # Traffic emissions disperse inversely with wind speed
    traffic_contrib = (station["base_traffic"] * traffic_diurnal * traffic_mult) * (8.0 / (ws_adj + 1.5))
    
    # Industrial emissions disperse inversely with mixing height
    industry_contrib = (station["base_industry"] * industry_mult) * (600.0 / mh_adj)
    
    # Stubble burning dispersion based on wind alignment
    wind_alignment = get_stubble_wind_factor(wind_direction)
    biomass_contrib = (station["base_biomass"] * stubble_mult * (active_crop_fires / 500.0) * wind_alignment) * (15.0 / (ws_adj + 2.0))
    
    # Dust emissions depend inversely on wind speed (less build up at high speed, but can resuspend if dry)
    dust_contrib = (station["base_dust"] * dust_mult) * (6.0 / (ws_adj + 1.2))

    # 4. Synthesizing PM2.5 and PM10 metrics (Chemical Fingerprinting)
    # Different sources have characteristic PM2.5 / PM10 ratio distributions
    pm25 = (
        traffic_contrib * 0.70 + 
        industry_contrib * 0.55 + 
        biomass_contrib * 0.88 + 
        dust_contrib * 0.15
    )
    pm10 = (
        traffic_contrib * 0.30 + 
        industry_contrib * 0.45 + 
        biomass_contrib * 0.12 + 
        dust_contrib * 0.85
    )

    # Add slight random micro-fluctuations (IoT noise)
    np.random.seed(42 + hour_idx + int(hash(station["id"]) % 1000))
    noise_25 = float(np.random.normal(0, pm25 * 0.03))
    noise_10 = float(np.random.normal(0, pm10 * 0.03))
    
    pm25 = max(5.0, pm25 + noise_25)
    pm10 = max(10.0, pm10 + noise_10)

    # 5. Convert to India standard AQI
    # Simplified index calculation
    aqi_from_pm25 = pm25 * 1.35
    aqi_from_pm10 = pm10 * 0.90
    aqi = float(max(aqi_from_pm25, aqi_from_pm10))
    
    # Bounds for index ranges
    aqi = min(500.0, max(0.0, aqi))

    return {
        "aqi": round(aqi, 1),
        "pm25": round(pm25, 1),
        "pm10": round(pm10, 1),
        "traffic": round(traffic_contrib, 1),
        "industry": round(industry_contrib, 1),
        "biomass": round(biomass_contrib, 1),
        "dust": round(dust_contrib, 1)
    }

# ----------------------------------------------------
# API Routes
# ----------------------------------------------------

@app.get("/api/stations")
def get_stations():
    """
    Returns the telemetry of all stations under baseline weather settings.
    """
    # Baseline weather settings: Moderate wind from West-North-West, medium mixing height
    base_ws = 2.5 # m/s
    base_wd = 300.0 # NW wind direction
    base_mh = 450.0 # meters
    active_crop_fires = 850 # active counts in neighboring states
    
    results = []
    for s in STATIONS:
        metrics = compute_aqi_components(s, 12, base_ws, base_wd, base_mh, active_crop_fires)
        results.append({
            "id": s["id"],
            "name": s["name"],
            "lat": s["lat"],
            "lon": s["lon"],
            "zone": s["zone"],
            "description": s["description"],
            "telemetry": metrics,
            "weather": {
                "wind_speed": base_ws,
                "wind_direction": base_wd,
                "mixing_height": base_mh,
                "active_fires": active_crop_fires
            }
        })
    return results

@app.get("/api/attribution")
def get_attribution(station_id: str, wind_speed: float = 2.5, wind_direction: float = 300.0, mixing_height: float = 450.0, active_fires: int = 850):
    """
    Returns source attribution and chemical fingerprinting ratios.
    """
    station = next((s for s in STATIONS if s["id"] == station_id), None)
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
        
    metrics = compute_aqi_components(station, 12, wind_speed, wind_direction, mixing_height, active_fires)
    
    total = metrics["traffic"] + metrics["industry"] + metrics["biomass"] + metrics["dust"]
    
    # Calculate ratios for chemical fingerprinting display
    pm25_to_pm10_ratio = metrics["pm25"] / metrics["pm10"] if metrics["pm10"] > 0 else 0.7
    
    # Simulated secondary species
    so2_nox_ratio = 0.15 + 0.8 * (metrics["industry"] / (total + 1))
    co_no2_ratio = 12.0 - 6.0 * (metrics["traffic"] / (total + 1))
    
    confidence = 94.2 - (0.01 * (wind_speed ** 2)) - (0.005 * abs(wind_direction - 310))
    confidence = max(65.0, min(99.0, confidence))

    return {
        "station_id": station_id,
        "station_name": station["name"],
        "confidence_score": round(confidence, 1),
        "source_breakdown": {
            "Vehicular Exhaust": round(metrics["traffic"] / total * 100, 1),
            "Industrial Stacks": round(metrics["industry"] / total * 100, 1),
            "Crop Residue Burning": round(metrics["biomass"] / total * 100, 1),
            "Road & Construction Dust": round(metrics["dust"] / total * 100, 1)
        },
        "fingerprints": {
            "PM2.5_PM10_Ratio": round(pm25_to_pm10_ratio, 2),
            "SO2_NOx_Ratio": round(so2_nox_ratio, 2),
            "CO_NO2_Ratio": round(co_no2_ratio, 2)
        },
        "meteorology_applied": {
            "wind_speed": wind_speed,
            "wind_direction": wind_direction,
            "mixing_height": mixing_height,
            "active_fires": active_fires
        }
    }

@app.post("/api/simulate")
def simulate_forecast(req: SimulateRequest):
    """
    Simulates a 72-hour forecast for a station under baseline vs policy conditions.
    """
    station = next((s for s in STATIONS if s["id"] == req.station_id), None)
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
        
    baseline_timeline = []
    mitigated_timeline = []
    
    # Generate 72 hours of weather parameters with a modeled weather shift:
    # A cold front settles in from hour 24 to 48, dropping wind speed and mixing height
    for h in range(req.forecast_hours):
        # 1. Simulate weather evolution
        if h < 24:
            ws = 3.5 - 0.05 * h
            wd = 295.0 + 0.2 * h
            mh = 600.0 - 5.0 * h
            fires = 950 + h * 5
        elif h < 48:
            # Stagnation front settle
            ws = 1.2 + 0.02 * (h - 24)
            wd = 315.0 - 0.5 * (h - 24)
            mh = 250.0 - 2.0 * (h - 24)
            fires = 1100 + (h - 24) * 8
        else:
            # Clearing up due to rising winds
            ws = 1.2 + 0.15 * (h - 48)
            wd = 270.0 - 1.2 * (h - 48)
            mh = 250.0 + 15.0 * (h - 48)
            fires = 1200 - (h - 48) * 12
            
        # Baseline components (No policies)
        base_metrics = compute_aqi_components(station, h, ws, wd, mh, fires, PolicyLevers())
        # Mitigated components (With custom policy levers)
        mit_metrics = compute_aqi_components(station, h, ws, wd, mh, fires, req.policies)
        
        baseline_timeline.append({
            "hour": h,
            "aqi": base_metrics["aqi"],
            "pm25": base_metrics["pm25"],
            "pm10": base_metrics["pm10"],
            "wind_speed": round(ws, 1),
            "wind_direction": round(wd, 0),
            "mixing_height": round(mh, 0)
        })
        
        mitigated_timeline.append({
            "hour": h,
            "aqi": mit_metrics["aqi"],
            "pm25": mit_metrics["pm25"],
            "pm10": mit_metrics["pm10"],
            "wind_speed": round(ws, 1),
            "wind_direction": round(wd, 0),
            "mixing_height": round(mh, 0)
        })
        
    return {
        "station_id": req.station_id,
        "station_name": station["name"],
        "baseline": baseline_timeline,
        "mitigated": mitigated_timeline
    }

@app.get("/api/enforcement")
def get_enforcement_recommendations():
    """
    Returns prioritized enforcement tickets for administrative intervention.
    """
    # Pre-calculated priorities matching simulated hotspot zones
    return [
        {
            "id": "ENF-001",
            "station_id": "anand_vihar",
            "zone": "Anand Vihar (ISBT Corridor)",
            "priority": "CRITICAL",
            "reason": "PM10 levels exceeding 420 ug/m3. Wind speed stagnant (< 1.2 m/s) trapping road dust along construction perimeter.",
            "source_category": "Road & Construction Dust",
            "recommended_actions": [
                "Deploy 4 High-Capacity Smog Cannons immediately.",
                "Execute mechanical water-sprinkling along the Ghazipur-ISBT highway lane.",
                "Issue a temporary halt to excavation works at Metro Phase IV construction sites (within 1.5km)."
            ],
            "gps": {"lat": 28.6480, "lon": 77.3162},
            "status": "PENDING"
        },
        {
            "id": "ENF-002",
            "station_id": "bawana",
            "zone": "Bawana Industrial Area Phase 2",
            "priority": "HIGH",
            "reason": "VOC and PM2.5 ratios indicate plastic/boiler fuel exhaust anomaly. Wind carries plumes SE towards residential sectors.",
            "source_category": "Industrial Stacks",
            "recommended_actions": [
                "Dispatch emissions inspector teams to Bawana Sector 4 clusters.",
                "Enforce shutdown of unapproved coal-fired boilers in metal-plating shops.",
                "Verify scrubber compliance at Unit 42 (Recycle Plastics)."
            ],
            "gps": {"lat": 28.7985, "lon": 77.0520},
            "status": "PENDING"
        },
        {
            "id": "ENF-003",
            "station_id": "ito",
            "zone": "ITO Crossroad Intersection",
            "priority": "MEDIUM",
            "reason": "Severe morning peak idling. NOx ratios elevated, suggesting diesel heavy-vehicle cargo bypass violation.",
            "source_category": "Vehicular Exhaust",
            "recommended_actions": [
                "Coordinate traffic police to activate red-light engine shut-down compliance campaign.",
                "Reroute interstate diesel commercial trucks to Eastern Peripheral Expressway."
            ],
            "gps": {"lat": 28.6290, "lon": 77.2405},
            "status": "ACTIVE"
        },
        {
            "id": "ENF-004",
            "station_id": "dwarka",
            "zone": "Dwarka Sector 8 Metro Bypass",
            "priority": "LOW",
            "reason": "Localized dust storm from open soil stockpiles at flyover construction zone.",
            "source_category": "Road & Construction Dust",
            "recommended_actions": [
                "Issue alert to road contractor to cover soil stockpiles with geotextile sheets.",
                "Spray chemical dust suppressants on unpaved service lanes."
            ],
            "gps": {"lat": 28.5725, "lon": 77.0730},
            "status": "RESOLVED"
        }
    ]

# ----------------------------------------------------
# Static Files Mounting
# ----------------------------------------------------
# Mount front-end build directory (dist) for production single-port deployment.
# In development, Vite will run in proxy mode or separate port.
dist_path = os.path.join(os.path.dirname(__file__), "frontend/dist")
if os.path.exists(dist_path):
    app.mount("/", StaticFiles(directory=dist_path, html=True), name="static")
else:
    @app.get("/")
    def index_fallback():
        return {"status": "running", "message": "FastAPI running. Build the React frontend in /frontend directory to serve it from root."}
