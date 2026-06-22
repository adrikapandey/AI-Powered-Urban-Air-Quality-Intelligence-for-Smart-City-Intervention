import React from "react";
import type { Station } from "../types";
import { Compass, Wind, AlertTriangle } from "lucide-react";

interface GISMapProps {
  stations: Station[];
  selectedStationId: string;
  onSelectStation: (id: string) => void;
  windSpeed: number;
  windDirection: number;
  activeFires: number;
  simulatedMitigatedAqi: number | null;
}

export const GISMap: React.FC<GISMapProps> = ({
  stations,
  selectedStationId,
  onSelectStation,
  windSpeed,
  windDirection,
  activeFires,
  simulatedMitigatedAqi
}) => {
  // Define stylized zones for the Delhi NCR vector map
  const ZONES = [
    { id: "northwest", name: "North-West Delhi (Bawana)", points: "100,80 200,60 220,180 140,220 90,170", baseColor: "rgba(147, 197, 253, 0.05)", border: "rgba(147, 197, 253, 0.2)" },
    { id: "north", name: "North Delhi", points: "200,60 280,70 280,150 220,180", baseColor: "rgba(147, 197, 253, 0.05)", border: "rgba(147, 197, 253, 0.2)" },
    { id: "west", name: "West Delhi (Shadipur)", points: "140,220 220,180 240,260 170,300", baseColor: "rgba(147, 197, 253, 0.05)", border: "rgba(147, 197, 253, 0.2)" },
    { id: "central", name: "Central Delhi (ITO)", points: "220,180 280,150 310,240 240,260", baseColor: "rgba(147, 197, 253, 0.05)", border: "rgba(147, 197, 253, 0.2)" },
    { id: "east", name: "East Delhi (Anand Vihar)", points: "280,150 380,160 410,270 310,240", baseColor: "rgba(147, 197, 253, 0.05)", border: "rgba(147, 197, 253, 0.2)" },
    { id: "southwest", name: "South-West Delhi (Dwarka)", points: "70,320 170,300 240,260 210,380 100,410", baseColor: "rgba(147, 197, 253, 0.05)", border: "rgba(147, 197, 253, 0.2)" },
    { id: "south", name: "South Delhi (RK Puram)", points: "240,260 310,240 350,380 260,420 210,380", baseColor: "rgba(147, 197, 253, 0.05)", border: "rgba(147, 197, 253, 0.2)" }
  ];

  // Helper to map AQI values to their respective standard colors
  const getAqiColor = (aqi: number) => {
    if (aqi <= 50) return "var(--aqi-good)";
    if (aqi <= 100) return "var(--aqi-satisfactory)";
    if (aqi <= 200) return "var(--aqi-moderate)";
    if (aqi <= 300) return "var(--aqi-poor)";
    if (aqi <= 400) return "var(--aqi-very-poor)";
    return "var(--aqi-severe)";
  };

  // Convert GPS coordinates to local SVG viewBox points [width=500, height=500]
  // Delhi lat range: ~[28.5, 28.85], lon range: ~[76.95, 77.35]
  const convertCoords = (lat: number, lon: number) => {
    const latMin = 28.50;
    const latMax = 28.85;
    const lonMin = 76.95;
    const lonMax = 77.38;

    // SVG coordinates (0,0 in top-left)
    const x = ((lon - lonMin) / (lonMax - lonMin)) * 400 + 50;
    const y = 500 - (((lat - latMin) / (latMax - latMin)) * 400 + 50); // invert y for SVG coordinate space
    return { x, y };
  };

  // Calculate wind angle vectors for wind animation flow
  // SVG angle is clockwise from positive X-axis (East is 0 deg, South is 90 deg, etc.)
  // Meteorology wind direction is degrees clockwise from North (North is 0 deg, East is 90 deg, etc.)
  const windSvgAngle = (windDirection - 90) % 360;

  // Stubble burning smoke density factor (derived from fire count)
  const stubbleDensity = Math.min(1.0, activeFires / 1500);

  // Stubble smoke angle is from North-West. Let's see if wind points SE (around 130 deg)
  // If wind direction is around 310 deg (NW wind), stubble smoke travels towards Delhi center (SE)
  const isNWWind = Math.abs(windDirection - 310) < 45 || Math.abs(windDirection - 310) > 315;
  const smokeOpacity = isNWWind ? stubbleDensity * 0.45 : stubbleDensity * 0.1;

  return (
    <div className="map-canvas-container">
      {/* Title / Compass overlay */}
      <div style={{ position: "absolute", top: "16px", left: "16px", zIndex: 10, display: "flex", gap: "10px" }}>
        <div className="glass-panel" style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: "8px", border: "1px solid var(--border-light)" }}>
          <Compass className="text-blue-400" size={16} style={{ color: "var(--color-primary)" }} />
          <span style={{ fontSize: "0.8rem", fontWeight: "600", letterSpacing: "0.05em" }}>LIVE GEOSPATIAL RADAR</span>
        </div>
        <div className="glass-panel" style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: "8px", border: "1px solid var(--border-light)" }}>
          <Wind className="text-gray-400" size={16} style={{ transform: `rotate(${windDirection}deg)`, transition: "transform 0.5s ease" }} />
          <span style={{ fontSize: "0.8rem", fontWeight: "500" }}>
            Wind: {windSpeed} m/s @ {windDirection}°
          </span>
        </div>
      </div>

      {/* Crop fire notification banner on map if active */}
      {activeFires > 600 && isNWWind && (
        <div 
          className="glass-panel" 
          style={{ 
            position: "absolute", 
            top: "16px", 
            right: "16px", 
            zIndex: 10, 
            padding: "8px 12px", 
            display: "flex", 
            alignItems: "center", 
            gap: "8px", 
            borderColor: "rgba(249, 115, 22, 0.4)", 
            background: "rgba(249, 115, 22, 0.08)",
            color: "var(--color-warning)"
          }}
        >
          <AlertTriangle size={14} className="animate-bounce" />
          <span style={{ fontSize: "0.75rem", fontWeight: "600" }}>NORTH-WEST SMOKE PLUME ACTIVE</span>
        </div>
      )}

      {/* Map SVG */}
      <svg 
        viewBox="0 0 500 500" 
        width="100%" 
        height="100%" 
        style={{ display: "block" }}
      >
        <defs>
          {/* Grid pattern */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="1" />
          </pattern>

          {/* Stubble burning smoke plume gradient */}
          <radialGradient id="plumeGrad" cx="15%" cy="15%" r="70%">
            <stop offset="0%" stopColor="rgba(139, 92, 246, 0.6)" />
            <stop offset="35%" stopColor="rgba(249, 115, 22, 0.3)" />
            <stop offset="70%" stopColor="rgba(100, 116, 139, 0.15)" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
          </radialGradient>
          
          {/* Station selector glow filters */}
          <filter id="glow-good" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-moderate" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-severe" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background Grid */}
        <rect width="500" height="500" fill="url(#grid)" />

        {/* Dynamic Crop Smoke Plume Overlay (North-West origins dispersion) */}
        <path 
          d="M0,0 Q180,50 300,250 T500,500 L0,500 Z" 
          className="stubble-plume" 
          style={{ 
            opacity: smokeOpacity, 
            transform: `scale(${1 + windSpeed * 0.04})`,
            transformOrigin: "0% 0%",
            pointerEvents: "none"
          }}
        />

        {/* Map stylized zone polygons */}
        <g id="zones">
          {ZONES.map((zone) => {
            // Determine if zone is selected
            const hasSelectedStation = stations.some(
              (st) => st.id === selectedStationId && st.zone.toLowerCase().includes(zone.name.split(" ")[0].toLowerCase())
            );
            return (
              <polygon
                key={zone.id}
                points={zone.points}
                className="ward-polygon"
                style={{
                  fill: hasSelectedStation ? "rgba(59, 130, 246, 0.08)" : zone.baseColor,
                  stroke: hasSelectedStation ? "var(--color-primary)" : zone.border,
                  strokeWidth: hasSelectedStation ? 1.5 : 0.8,
                  pointerEvents: "none"
                }}
              />
            );
          })}
        </g>

        {/* Dynamic Wind Dispersion Lines */}
        <g 
          id="wind-vectors" 
          style={{ 
            transform: `rotate(${windSvgAngle}deg)`, 
            transformOrigin: "250px 250px", 
            transition: "transform 1s ease",
            pointerEvents: "none"
          }}
        >
          <path d="M 50,100 L 450,100" className="wind-flow-line" style={{ animationDuration: `${12 / windSpeed}s` }} />
          <path d="M 100,200 L 400,200" className="wind-flow-line" style={{ animationDuration: `${9 / windSpeed}s` }} />
          <path d="M 50,300 L 450,300" className="wind-flow-line" style={{ animationDuration: `${14 / windSpeed}s` }} />
          <path d="M 150,400 L 350,400" className="wind-flow-line" style={{ animationDuration: `${10 / windSpeed}s` }} />
        </g>

        {/* Interactive Station Markers */}
        <g id="station-pins">
          {stations.map((station) => {
            const { x, y } = convertCoords(station.lat, station.lon);
            const isSelected = station.id === selectedStationId;
            
            // Current AQI color
            const currentAqi = isSelected && simulatedMitigatedAqi !== null 
              ? simulatedMitigatedAqi 
              : station.telemetry.aqi;
              
            const pinColor = getAqiColor(currentAqi);
            
            // Choose glow level depending on severity
            let filterGlow = "url(#glow-good)";
            if (currentAqi > 200) filterGlow = "url(#glow-moderate)";
            if (currentAqi > 350) filterGlow = "url(#glow-severe)";

            return (
              <g
                key={station.id}
                transform={`translate(${x}, ${y})`}
                className="station-marker"
                onClick={() => onSelectStation(station.id)}
              >
                {/* Glowing Background Ripple if selected */}
                {isSelected && (
                  <circle
                    r="24"
                    fill="none"
                    stroke={pinColor}
                    strokeWidth="1.5"
                    opacity="0.5"
                    style={{
                      animation: "pulse-green 1.8s infinite",
                      stroke: pinColor
                    }}
                  />
                )}

                {/* Main pin marker */}
                <circle
                  r={isSelected ? 10 : 8}
                  fill={pinColor}
                  className="station-marker-circle"
                  filter={isSelected ? filterGlow : undefined}
                />
                
                {/* Inner core circle */}
                <circle r={isSelected ? 4 : 3} fill="#ffffff" />
                
                {/* Station Label text */}
                <text
                  y={isSelected ? -18 : -14}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize={isSelected ? "11px" : "9px"}
                  fontWeight={isSelected ? "700" : "500"}
                  style={{
                    textShadow: "0px 1px 4px rgba(0,0,0,0.8)",
                    letterSpacing: "0.02em"
                  }}
                >
                  {station.name} ({Math.round(currentAqi)})
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      
      {/* Map Legend Overlay */}
      <div 
        className="glass-panel" 
        style={{ 
          position: "absolute", 
          bottom: "16px", 
          right: "16px", 
          padding: "10px 14px", 
          fontSize: "0.7rem", 
          display: "flex", 
          flexDirection: "column",
          gap: "6px",
          border: "1px solid var(--border-light)"
        }}
      >
        <div style={{ fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "4px" }}>
          AQI Severity Scale
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--aqi-good)" }}></span>
          <span>0 - 50: Good</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--aqi-satisfactory)" }}></span>
          <span>51 - 100: Satisfactory</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--aqi-moderate)" }}></span>
          <span>101 - 200: Moderate</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--aqi-poor)" }}></span>
          <span>201 - 300: Poor</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--aqi-very-poor)" }}></span>
          <span>301 - 400: Very Poor</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--aqi-severe)" }}></span>
          <span>401 - 500: Severe</span>
        </div>
      </div>
    </div>
  );
};
