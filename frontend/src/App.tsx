import { useState, useEffect } from "react";
import type { Station, AttributionData, ForecastItem, PolicyLevers, EnforcementTicket } from "./types";
import { GISMap } from "./components/GISMap";
import { SourceAttribution } from "./components/SourceAttribution";
import { WhatIfSandbox } from "./components/WhatIfSandbox";
import { EnforcementConsole } from "./components/EnforcementConsole";
import { CitizenAdvisory } from "./components/CitizenAdvisory";
import { ForecastChart } from "./components/ForecastChart";
import { 
  Activity, 
  RefreshCw, 
  Layers, 
  AlertTriangle
} from "lucide-react";

function App() {
  // --- Core State ---
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string>("anand_vihar");
  const [attribution, setAttribution] = useState<AttributionData | null>(null);
  const [forecastBaseline, setForecastBaseline] = useState<ForecastItem[]>([]);
  const [forecastMitigated, setForecastMitigated] = useState<ForecastItem[]>([]);
  const [tickets, setTickets] = useState<EnforcementTicket[]>([]);
  
  // --- User-Controlled Parameter States ---
  const [windSpeed, setWindSpeed] = useState<number>(2.5);
  const [windDirection, setWindDirection] = useState<number>(310);
  const [mixingHeight, setMixingHeight] = useState<number>(450);
  const [activeFires, setActiveFires] = useState<number>(850);
  
  const [policies, setPolicies] = useState<PolicyLevers>({
    odd_even: false,
    stubble_ban: false,
    smog_cannons: false,
    factory_scaling: 100,
    construction_ban: false
  });

  const [scrubHour, setScrubHour] = useState<number>(12);
  const [language, setLanguage] = useState<"en" | "hi" | "pb">("en");
  
  // --- Loading & Error States ---
  const [loadingStations, setLoadingStations] = useState<boolean>(true);
  const [loadingAttribution, setLoadingAttribution] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedStation = stations.find((s) => s.id === selectedStationId) || null;

  // 1. Fetch stations on mount
  const fetchStations = async () => {
    try {
      setLoadingStations(true);
      setErrorMsg(null);
      const res = await fetch("/api/stations");
      if (!res.ok) throw new Error("Failed to load telemetry stations from Python server.");
      const data = await res.json();
      setStations(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Connection failed. Please ensure the Python FastAPI backend is running.");
    } finally {
      setLoadingStations(false);
    }
  };

  // 2. Fetch enforcement tickets on mount
  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/enforcement");
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (err) {
      console.error("Failed to load enforcement tickets", err);
    }
  };

  useEffect(() => {
    fetchStations();
    fetchTickets();
  }, []);

  // 3. Fetch source attribution when selected station or weather parameters change
  const fetchAttribution = async () => {
    if (!selectedStationId) return;
    try {
      setLoadingAttribution(true);
      const url = `/api/attribution?station_id=${selectedStationId}&wind_speed=${windSpeed}&wind_direction=${windDirection}&mixing_height=${mixingHeight}&active_fires=${activeFires}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAttribution(data);
      }
    } catch (err) {
      console.error("Attribution fetch failed", err);
    } finally {
      setLoadingAttribution(false);
    }
  };

  useEffect(() => {
    fetchAttribution();
  }, [selectedStationId, windSpeed, windDirection, mixingHeight, activeFires]);

  // 4. Fetch forecast whenever selected station, weather, or policies change
  const fetchForecast = async () => {
    if (!selectedStationId) return;
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          station_id: selectedStationId,
          forecast_hours: 72,
          policies: {
            ...policies,
            // Override active fire scaling on backend if stubble ban is active
            stubble_ban: policies.stubble_ban
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        setForecastBaseline(data.baseline);
        setForecastMitigated(data.mitigated);
      }
    } catch (err) {
      console.error("Forecast simulation failed", err);
    }
  };

  useEffect(() => {
    // We add a tiny debounce to prevent hammering the simulation endpoint during slider adjustments
    const handler = setTimeout(() => {
      fetchForecast();
    }, 150);
    return () => clearTimeout(handler);
  }, [selectedStationId, policies]);

  // Handle updates to enforcement ticket status
  const handleUpdateTicketStatus = (id: string, newStatus: EnforcementTicket["status"]) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
  };

  // Synchronize dynamic values based on timeline scrub position
  const activeMitigatedForecast = forecastMitigated[scrubHour] || null;

  // Active AQI displayed on top headers
  const displayAqi = activeMitigatedForecast ? activeMitigatedForecast.aqi : (selectedStation?.telemetry.aqi || 0);
  const displayPm25 = activeMitigatedForecast ? activeMitigatedForecast.pm25 : (selectedStation?.telemetry.pm25 || 0);
  const displayPm10 = activeMitigatedForecast ? activeMitigatedForecast.pm10 : (selectedStation?.telemetry.pm10 || 0);

  const getAqiClass = (aqi: number) => {
    if (aqi <= 50) return "text-green-400";
    if (aqi <= 100) return "text-lime-400";
    if (aqi <= 200) return "text-yellow-400";
    if (aqi <= 300) return "text-orange-400";
    if (aqi <= 400) return "text-red-400";
    return "text-red-700";
  };

  const getAqiLabel = (aqi: number) => {
    if (aqi <= 50) return "Good";
    if (aqi <= 100) return "Satisfactory";
    if (aqi <= 200) return "Moderate";
    if (aqi <= 300) return "Poor";
    if (aqi <= 400) return "Very Poor";
    return "Severe Emergency";
  };

  return (
    <div className="dashboard-container">
      {/* 1. Header */}
      <header className="dashboard-header">
        <div className="header-title-container">
          <div 
            style={{ 
              width: "36px", 
              height: "36px", 
              borderRadius: "8px", 
              background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              boxShadow: "0 0 12px var(--color-primary-glow)"
            }}
          >
            <Activity size={18} style={{ color: "#fff" }} />
          </div>
          <div>
            <h1 style={{ fontSize: "1.15rem", margin: 0 }}>AERO-GRID AI</h1>
            <p style={{ fontSize: "0.68rem", fontWeight: "600", color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Urban Air Quality Intelligence & Enforcement System
            </p>
          </div>
        </div>

        {/* Global telemetry quick check */}
        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <span className="pulse-badge">
              <span className="pulse-circle"></span>
              LIVE CONNECTED (6/6 STATIONS)
            </span>
          </div>

          <button 
            onClick={() => {
              fetchStations();
              fetchTickets();
              fetchAttribution();
              fetchForecast();
            }} 
            style={{ 
              background: "rgba(255,255,255,0.05)", 
              border: "1px solid var(--border-light)", 
              borderRadius: "8px", 
              padding: "6px 12px", 
              color: "var(--text-main)", 
              cursor: "pointer", 
              display: "flex", 
              alignItems: "center", 
              gap: "6px",
              fontFamily: "var(--font-sans)",
              fontSize: "0.78rem",
              fontWeight: "600"
            }}
          >
            <RefreshCw size={12} className={loadingStations ? "animate-spin" : ""} />
            Poll Sensors
          </button>
        </div>
      </header>

      {/* Connection error display */}
      {errorMsg && (
        <div 
          style={{ 
            gridColumn: "span 3", 
            background: "rgba(185, 28, 28, 0.15)", 
            borderBottom: "1px solid rgba(185, 28, 28, 0.3)", 
            padding: "8px 24px", 
            display: "flex", 
            alignItems: "center", 
            gap: "12px",
            color: "#fca5a5",
            fontSize: "0.8rem",
            fontWeight: "600",
            zIndex: 100
          }}
        >
          <AlertTriangle size={16} className="animate-bounce" />
          <span>{errorMsg}</span>
          <button 
            onClick={fetchStations} 
            style={{ 
              marginLeft: "auto", 
              background: "var(--color-critical)", 
              border: "none", 
              borderRadius: "4px", 
              color: "#fff", 
              padding: "2px 8px", 
              cursor: "pointer", 
              fontSize: "0.75rem",
              fontWeight: "700" 
            }}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* 2. Left Sidebar - Weather Simulator & Policy Levers */}
      <aside className="dashboard-sidebar-left">
        {/* Weather parameters */}
        <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <h2>
            <Layers size={16} style={{ color: "var(--color-secondary)" }} />
            Meteorology Simulator
          </h2>
          <p style={{ fontSize: "0.8rem", marginTop: "-8px" }}>
            Adjust climatic conditions to trigger atmospheric dispersion modeling:
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Wind Direction */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: "600" }}>
                <span>Wind Direction (origin)</span>
                <span style={{ color: "var(--color-primary)" }}>{windDirection}° ({windDirection >= 280 && windDirection <= 330 ? "North-West" : "Local"})</span>
              </div>
              <input
                type="range"
                min="0"
                max="359"
                value={windDirection}
                onChange={(e) => setWindDirection(parseInt(e.target.value))}
                className="custom-slider"
              />
              <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "-6px" }}>
                *NW winds (290°-330°) transport stubble smoke directly into NCR.
              </span>
            </div>

            {/* Wind Speed */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: "600" }}>
                <span>Wind Speed</span>
                <span style={{ color: "var(--color-primary)" }}>{windSpeed} m/s</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="12.0"
                step="0.5"
                value={windSpeed}
                onChange={(e) => setWindSpeed(parseFloat(e.target.value))}
                className="custom-slider"
              />
              <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "-6px" }}>
                *Low speeds decrease horizontal dispersion.
              </span>
            </div>

            {/* Mixing Height (Inversion Layer) */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: "600" }}>
                <span>Boundary Mixing Height</span>
                <span style={{ color: "var(--color-primary)" }}>{mixingHeight} m</span>
              </div>
              <input
                type="range"
                min="100"
                max="1200"
                step="50"
                value={mixingHeight}
                onChange={(e) => setMixingHeight(parseInt(e.target.value))}
                className="custom-slider"
              />
              <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "-6px" }}>
                *Winter thermal inversions trap pollutants below 300m.
              </span>
            </div>

            {/* Active Stubble Fires */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: "600" }}>
                <span>Active Agricultural Fires</span>
                <span style={{ color: "var(--color-warning)" }}>{activeFires} count</span>
              </div>
              <input
                type="range"
                min="0"
                max="2200"
                step="50"
                value={activeFires}
                onChange={(e) => setActiveFires(parseInt(e.target.value))}
                className="custom-slider"
              />
            </div>
          </div>
        </div>

        {/* Policy Sandbox */}
        <WhatIfSandbox 
          policies={policies}
          onChangePolicies={setPolicies}
        />
      </aside>

      {/* 3. Main Center Area - GIS Map & Forecast Graph */}
      <main className="dashboard-main">
        {/* Telemetry quick look card */}
        {selectedStation && (
          <div 
            className="glass-panel" 
            style={{ 
              padding: "16px 20px", 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center"
            }}
          >
            <div>
              <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", fontWeight: "600" }}>
                SELECTED MONITORING STATION
              </span>
              <h2 style={{ fontSize: "1.3rem", marginTop: "2px" }}>
                {selectedStation.name}
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "400", marginLeft: "8px" }}>
                  ({selectedStation.zone})
                </span>
              </h2>
            </div>

            <div style={{ display: "flex", gap: "24px" }}>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>PREDICTED AQI</span>
                <div 
                  className={getAqiClass(displayAqi)}
                  style={{ fontSize: "1.65rem", fontWeight: "800", lineHeight: "1.2" }}
                >
                  {Math.round(displayAqi)}
                  <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-muted)", marginLeft: "6px" }}>
                    ({getAqiLabel(displayAqi)})
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", borderLeft: "1px solid var(--border-light)", paddingLeft: "20px" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>PM2.5</div>
                  <div style={{ fontSize: "1.05rem", fontWeight: "700" }}>{Math.round(displayPm25)}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>PM10</div>
                  <div style={{ fontSize: "1.05rem", fontWeight: "700" }}>{Math.round(displayPm10)}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GIS Map */}
        <GISMap 
          stations={stations}
          selectedStationId={selectedStationId}
          onSelectStation={setSelectedStationId}
          windSpeed={windSpeed}
          windDirection={windDirection}
          activeFires={activeFires}
          simulatedMitigatedAqi={activeMitigatedForecast ? activeMitigatedForecast.aqi : null}
        />

        {/* Projections graph */}
        <ForecastChart 
          baseline={forecastBaseline}
          mitigated={forecastMitigated}
          scrubHour={scrubHour}
          onChangeScrubHour={setScrubHour}
        />
      </main>

      {/* 4. Right Sidebar - Source Attribution & Citizen Health Risks */}
      <aside className="dashboard-sidebar-right">
        {/* Source Attribution */}
        <SourceAttribution 
          attribution={attribution}
          loading={loadingAttribution}
        />

        {/* Citizen Risk advisories */}
        <CitizenAdvisory 
          station={selectedStation}
          language={language}
          onChangeLanguage={setLanguage}
          simulatedMitigatedAqi={activeMitigatedForecast ? activeMitigatedForecast.aqi : null}
        />

        {/* Action terminal */}
        <EnforcementConsole 
          tickets={tickets}
          onUpdateTicketStatus={handleUpdateTicketStatus}
        />
      </aside>
    </div>
  );
}

export default App;
