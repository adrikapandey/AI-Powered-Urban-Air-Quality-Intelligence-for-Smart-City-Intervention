# Hackathon Submission Whitepaper: Aero-Grid AI
**AI-Powered Urban Air Quality Intelligence & Smart City Intervention**

---

## 1. Executive Summary

### Project Title
**Aero-Grid AI**: Fusing Multi-Modal Feeds for Proactive Urban Air Quality Intervention in Delhi NCR

### Problem Statement Track
**Track 5**: Urban Air Quality Intelligence (Smart Cities / Environmental Intelligence / Geospatial Analytics / Public Health)

### Value Proposition
Aero-Grid AI is a full-stack smart city control room designed to transition Delhi NCR's environmental response from **reactive monitoring** (advising citizens after the air is polluted) to **proactive source-level intervention** (deploying enforcement assets before pollution peaks). 

By fusing simulated IoT ground sensor arrays (CAAQMS), remote sensing thermal anomalies (crop fires), meteorological forecasts, and road traffic patterns, the platform calculates real-time geospatial source attribution, predicts hyperlocal AQI trends 72 hours in advance, simulates policy interventions in a visual sandbox, and routes automated enforcement tickets to municipal inspectors.

---

## 2. Problem Context: The Delhi NCR Crisis

Delhi NCR suffers from a seasonal and structural air quality crisis. In winter, a combination of factors pushes the Air Quality Index (AQI) into the "Severe" and "Emergency" categories (>400), creating a public health crisis that causes thousands of premature deaths annually.

### Key Factors of the Crisis
1. **Source Complexity**: Pollution is not caused by a single source. It is a compound mixture of vehicular combustion (high-density traffic at intersections like ITO), industrial stack emissions (metal and plastic clusters in Bawana), mechanical road and construction dust (metro extensions in Dwarka), and regional crop-residue burning (carried from Punjab/Haryana).
2. **Meteorological Trap (Thermal Inversions)**: During winter, wind speeds drop and the mixing height (the atmospheric boundary layer) collapses from over 1,000 meters to under 200 meters. This creates a dense lid of cool air that traps pollutants near the ground.
3. **The Stubble Smoke Plume**: North-West winds (blowing at angles between 290° and 330°) act as a direct transit lane, carrying agricultural fire smoke straight into the Delhi basin.
4. **The Action Gap**: Delhi has over 40 Continuous Ambient Air Quality Monitoring Stations (CAAQMS). The data exists. However, city administrations lack the analytical intelligence to determine which specific source is causing a spike at a specific location, leading to delayed, blanket shutdowns that cause economic harm.

---

## 3. Product Features & Problem-Solving Matrix

| Feature | What It Does | Problem It Solves | Smart City Impact |
| :--- | :--- | :--- | :--- |
| **Geospatial Vector GIS Map** | Renders live sensor markers, wind vectors, and crop fire smoke overlays. | Traditional data is represented in spreadsheets or disjointed numbers. | Gives a visual, real-time spatial radar of how pollution is dispersing. |
| **Geospatial Source Attribution** | Computes the percentage contribution of Traffic, Industry, Biomass, and Dust. | Blanket bans are economically damaging because the root cause of a local spike is unknown. | Enables surgical, source-specific local interventions (e.g. deploy water spray instead of closing factories). |
| **Hyperlocal 72h Forecasting** | Forecasts AQI trends based on weather forecasts and diurnal cycles. | City response is reactive—acting only *after* the air becomes hazardous. | Gives a 3-day head start to schedule traffic diversions or halt construction *before* stagnation begins. |
| **"What-If" Policy Sandbox** | Simulates AQI changes under rules like Odd-Even traffic, stubble bans, or factory limits. | Policy decisions are made through guesswork with no pre-evaluated outcomes. | Allows testing policies in a simulator to optimize environmental and economic trade-offs. |
| **Enforcement Dispatch Console** | Automatically generates prioritized tickets with coordinates and instructions. | Long delays between hotspot detection and inspector deployment. | Speeds up response times by routing resources directly to the source of emission anomalies. |
| **Citizen Health Advisory** | Translates safety directives into Hindi, English, and Punjabi. | Banners do not reach all demographics or provide specific directives. | Keeps schools and pediatric/geriatric wards safe with localized, readable guidelines. |

---

## 4. Technical Architecture

Aero-Grid AI is structured as a full-stack, single-container application optimized for deployment on Hugging Face Spaces.

```text
                     +---------------------------------------+
                     |         React Dashboard (UI)          |
                     |  (GIS Map, Chart, Sandbox Controls)   |
                     +---------------------------------------+
                                  ▲              │
                     GET /api/... │              │ POST /api/simulate
                                  │              ▼
                     +---------------------------------------+
                     |         FastAPI Router (API)          |
                     |             (main.py)                 |
                     +---------------------------------------+
                                  ▲              │
                                  │              │
                                  │              ▼
                     +---------------------------------------+
                     |        Simulation Core (Math)         |
                     |          (NumPy Calculations)         |
                     +---------------------------------------+
```

### Technological Stack Choice & Rationale
- **Frontend (React + TypeScript + Vite)**: React manages the dashboard's interactive state (station selection, policy changes) instantly, while Vite compiles a highly optimized static build.
- **Styling (Vanilla CSS)**: Hand-crafted HSL variables, dark glassmorphism, and keyframe animations drive the visual interface (wind flow lines, pulsing hotspots, smoke plume opacities) without the performance overhead of UI frameworks.
- **Backend (Python + FastAPI)**: FastAPI handles request routing with high throughput and low latency. Python provides direct access to scientific libraries like NumPy.
- **Mathematical Core (NumPy)**: All physical dispersion calculations run in high-performance NumPy arrays, ensuring rapid execution.

---

## 5. Mathematical Simulation Engine

The backend implements physics-based dispersion and chemical fingerprinting models.

### 1. Atmospheric Boundary Layer Trapping
Pollutants accumulate inversely with the boundary mixing height ($MH$). During a winter thermal inversion, $MH$ drops, compounding concentration:
$$\text{Emission Concentration} \propto \frac{\text{Base Output}}{MH}$$

### 2. Gaussian Wind Dispersion & Directional Alignment
The impact of regional stubble burning depends on the active fire count ($F$), wind speed ($WS$), and how closely the wind direction ($WD$) aligns with the North-West axis ($310^\circ$):
$$\text{Wind Alignment Factor} = e^{-\frac{(WD - 310)^2}{2 \cdot 25^2}}$$
$$\text{Biomass Contribution} = \text{Base Biomass} \cdot \text{Wind Alignment Factor} \cdot \left(\frac{F}{500}\right) \cdot \left(\frac{15}{WS + 2}\right)$$

### 3. Diurnal Vehicular Curves
Traffic volume is modeled as a double-peak diurnal cycle (morning and evening rush hours):
$$\text{Traffic Volume}(t) = 1.0 + 0.6 \cdot \sin^2\left(\frac{(t - 9) \cdot \pi}{6}\right)$$

### 4. Particulate Ratio & Chemical Fingerprinting
Different source categories generate distinct $PM_{2.5}$ to $PM_{10}$ ratios. Particulate concentrations are calculated as weighted sums:
$$PM_{2.5} = 0.70 \cdot C_{\text{traffic}} + 0.55 \cdot C_{\text{industry}} + 0.88 \cdot C_{\text{biomass}} + 0.15 \cdot C_{\text{dust}}$$
$$PM_{10} = 0.30 \cdot C_{\text{traffic}} + 0.45 \cdot C_{\text{industry}} + 0.12 \cdot C_{\text{biomass}} + 0.85 \cdot C_{\text{dust}}$$

---

## 6. API Endpoint Contracts

### 1. `GET /api/stations`
- **Description**: Returns all monitoring stations with base parameters and live telemetry under baseline weather conditions.
- **Inputs**: None.
- **Output**: JSON array of stations.

### 2. `GET /api/attribution`
- **Description**: Fuses current meteorology parameters to calculate source breakdown percentages and chemical fingerprint ratios.
- **Inputs**: `station_id` (string), `wind_speed` (float), `wind_direction` (float), `mixing_height` (float), `active_fires` (int).
- **Output**:
  ```json
  {
    "station_id": "anand_vihar",
    "confidence_score": 93.5,
    "source_breakdown": {
      "Vehicular Exhaust": 32.1,
      "Industrial Stacks": 12.4,
      "Crop Residue Burning": 25.5,
      "Road & Construction Dust": 30.0
    },
    "fingerprints": {
      "PM2.5_PM10_Ratio": 0.66,
      "SO2_NOx_Ratio": 0.22,
      "CO_NO2_Ratio": 9.15
    }
  }
  ```

### 3. `POST /api/simulate`
- **Description**: Simulates the 72-hour forecast timeline, returning baseline trends alongside predicted curves with policies active.
- **Inputs**: JSON containing `station_id` (string) and `policies` (object of toggles and sliders).
- **Output**: JSON timelines containing forecast parameters (AQI, PM2.5, PM10) for each hour.

### 4. `GET /api/enforcement`
- **Description**: Returns prioritized enforcement tickets with GPS coordinates, reasoning, and recommended action steps.
- **Inputs**: None.
- **Output**: JSON array of pending/active tickets.

---

## 7. Scalability & Future Roadmap

To move from this prototype to city-wide scale:
1. **Real-time CAAQMS API Integration**: Replace the simulation generator with direct webhook listeners from the National Air Quality Index (NAQI) portal.
2. **Atmospheric Dispersion Modeling (WRF-Chem)**: Integrate with actual regional weather forecasting systems (like the WRF model) to pull live wind vectors, temperature profiles, and planetary boundary heights.
3. **Database Layer (TimescaleDB / PostGIS)**: Store spatial and temporal historical data, allowing spatial indexing for fast regional queries.
4. **Machine Learning Refinement**: Train a Long Short-Term Memory (LSTM) or Transformer network on historical Delhi data to replace the statistical forecasting engine with deep-learning predictions.
