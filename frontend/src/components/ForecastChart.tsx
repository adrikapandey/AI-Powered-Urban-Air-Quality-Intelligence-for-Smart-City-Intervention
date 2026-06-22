import React from "react";
import type { ForecastItem } from "../types";
import { Calendar, Wind, Thermometer } from "lucide-react";

interface ForecastChartProps {
  baseline: ForecastItem[];
  mitigated: ForecastItem[];
  scrubHour: number;
  onChangeScrubHour: (hour: number) => void;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({
  baseline,
  mitigated,
  scrubHour,
  onChangeScrubHour
}) => {

  if (baseline.length === 0 || mitigated.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: "20px", display: "flex", justifyContent: "center", alignItems: "center", height: "240px" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Loading Hyperlocal 72-Hour Predictions...</p>
      </div>
    );
  }

  // Find max AQI to scale Y axis appropriately
  const maxAqi = Math.max(
    ...baseline.map((d) => d.aqi),
    ...mitigated.map((d) => d.aqi),
    150 // Minimum height represent limit
  );

  // SVG Chart boundaries
  const width = 600;
  const height = 180;
  const paddingX = 40;
  const paddingY = 20;

  // Helper to map values to coordinates
  const getCoords = (index: number, value: number) => {
    const x = paddingX + (index / (baseline.length - 1)) * (width - 2 * paddingX);
    // Scale Y: value maxAqi translates to paddingY, value 0 translates to height - paddingY
    const y = height - paddingY - (value / maxAqi) * (height - 2 * paddingY);
    return { x, y };
  };

  // Build SVG path string for baseline (Solid red/orange)
  let baselinePath = "";
  baseline.forEach((d, i) => {
    const { x, y } = getCoords(i, d.aqi);
    if (i === 0) {
      baselinePath += `M ${x} ${y}`;
    } else {
      baselinePath += ` L ${x} ${y}`;
    }
  });

  // Build SVG path string for mitigated (Glow blue)
  let mitigatedPath = "";
  mitigated.forEach((d, i) => {
    const { x, y } = getCoords(i, d.aqi);
    if (i === 0) {
      mitigatedPath += `M ${x} ${y}`;
    } else {
      mitigatedPath += ` L ${x} ${y}`;
    }
  });

  // Calculate coordinates for scrub/hover indicator
  const selectedIndex = Math.min(baseline.length - 1, Math.max(0, scrubHour));
  const activeBaselineItem = baseline[selectedIndex];
  const activeMitigatedItem = mitigated[selectedIndex];

  const { x: scrubX, y: scrubBaselineY } = getCoords(selectedIndex, activeBaselineItem.aqi);
  const { y: scrubMitigatedY } = getCoords(selectedIndex, activeMitigatedItem.aqi);

  // Generate vertical grid lines at 24h, 48h, 72h
  const gridHours = [0, 12, 24, 36, 48, 60, 72];

  return (
    <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Header telemetry info */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: "1.05rem" }}>
          <Calendar size={16} style={{ color: "var(--color-primary)" }} />
          Hyperlocal AQI Trend & Forecasting (72h)
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--color-danger)" }}></span>
            <span style={{ color: "var(--text-muted)", fontWeight: "500" }}>Baseline Forecast</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--color-primary)" }}></span>
            <span style={{ color: "var(--text-muted)", fontWeight: "500" }}>Mitigated Forecast</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-light)", borderRadius: "10px", padding: "10px 14px", marginTop: "-6px" }}>
        <div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>TIMELINE INDEX</span>
          <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#fff" }}>
            Hour +{activeBaselineItem.hour}h <span style={{ fontWeight: "400", fontSize: "0.8rem", color: "var(--text-muted)" }}>(Projections)</span>
          </div>
        </div>
        
        <div style={{ display: "flex", gap: "20px" }}>
          <div>
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Baseline AQI</span>
            <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--color-danger)" }}>
              {Math.round(activeBaselineItem.aqi)}
            </div>
          </div>
          <div>
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Mitigated AQI</span>
            <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--color-success)" }}>
              {Math.round(activeMitigatedItem.aqi)}
            </div>
          </div>
          <div style={{ borderLeft: "1px solid var(--border-light)", paddingLeft: "16px", display: "flex", flexDirection: "column", justifyContent: "center", fontSize: "0.72rem", color: "var(--text-muted)", gap: "2px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Wind size={10} /> WS: {activeBaselineItem.wind_speed} m/s
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Thermometer size={10} /> Inversion: {activeBaselineItem.mixing_height}m
            </span>
          </div>
        </div>
      </div>

      {/* SVG Plot */}
      <div style={{ width: "100%", overflow: "hidden", position: "relative" }}>
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          width="100%" 
          height="100%" 
          style={{ overflow: "visible" }}
        >
          {/* Grid lines */}
          {gridHours.map((hr) => {
            const indexVal = Math.round((hr / 72) * (baseline.length - 1));
            const { x } = getCoords(indexVal, 0);
            return (
              <g key={hr}>
                <line
                  x1={x}
                  y1={paddingY}
                  x2={x}
                  y2={height - paddingY}
                  stroke="rgba(255,255,255,0.04)"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
                <text
                  x={x}
                  y={height - 4}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontSize="8px"
                  fontWeight="600"
                >
                  +{hr}h
                </text>
              </g>
            );
          })}

          {/* AQI Reference Horizontal Guidelines */}
          {[100, 200, 300, 400].map((level) => {
            if (level > maxAqi) return null;
            const { y } = getCoords(0, level);
            return (
              <g key={level}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="rgba(255,255,255,0.03)"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill="var(--text-dark)"
                  fontSize="8px"
                  fontWeight="600"
                >
                  {level}
                </text>
              </g>
            );
          })}

          {/* Baseline Curve Path */}
          <path
            d={baselinePath}
            fill="none"
            stroke="var(--color-danger)"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.45"
          />

          {/* Mitigated Curve Path with glowing shadow */}
          <path
            d={mitigatedPath}
            fill="none"
            stroke="var(--color-success)"
            strokeWidth="3"
            strokeLinecap="round"
            style={{
              filter: "drop-shadow(0px 0px 4px rgba(16,185,129,0.3))"
            }}
          />

          {/* Vertical Scrubber Line */}
          <line
            x1={scrubX}
            y1={paddingY}
            x2={scrubX}
            y2={height - paddingY}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1.5"
          />

          {/* Baseline Scrubber node */}
          <circle
            cx={scrubX}
            cy={scrubBaselineY}
            r="5"
            fill="var(--color-danger)"
            stroke="#ffffff"
            strokeWidth="1"
          />

          {/* Mitigated Scrubber node */}
          <circle
            cx={scrubX}
            cy={scrubMitigatedY}
            r="6"
            fill="var(--color-success)"
            stroke="#ffffff"
            strokeWidth="1.5"
            style={{
              filter: "drop-shadow(0 0 4px var(--color-success))"
            }}
          />
        </svg>
      </div>

      {/* Scrub Slider controller */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: "600", color: "var(--text-muted)" }}>
          <span>Timeline Scrubber</span>
          <span>Deploy/Simulate at selected interval</span>
        </div>
        <input
          type="range"
          min="0"
          max={baseline.length - 1}
          value={scrubHour}
          onChange={(e) => onChangeScrubHour(parseInt(e.target.value))}
          className="custom-slider"
          style={{ margin: "4px 0 0 0" }}
        />
      </div>
    </div>
  );
};
