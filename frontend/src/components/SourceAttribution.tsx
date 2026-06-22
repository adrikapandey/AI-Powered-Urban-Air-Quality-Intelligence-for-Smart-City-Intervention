import React from "react";
import type { AttributionData } from "../types";
import { Award, Zap, Activity, Info } from "lucide-react";

interface SourceAttributionProps {
  attribution: AttributionData | null;
  loading: boolean;
}

export const SourceAttribution: React.FC<SourceAttributionProps> = ({
  attribution,
  loading
}) => {
  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: "20px", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "220px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
          <div className="pulse-circle" style={{ width: "16px", height: "16px", background: "var(--color-primary)" }}></div>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "500" }}>Running Chemical Fingerprint AI...</span>
        </div>
      </div>
    );
  }

  if (!attribution) {
    return (
      <div className="glass-panel" style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", minHeight: "220px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p>Select a monitoring station on the map to trigger AI source attribution analysis.</p>
      </div>
    );
  }

  const { source_breakdown, fingerprints, confidence_score } = attribution;

  // Helper to color source bars
  const getSourceColor = (sourceName: string) => {
    switch (sourceName) {
      case "Vehicular Exhaust":
        return "#3b82f6"; // Blue
      case "Industrial Stacks":
        return "#8b5cf6"; // Purple
      case "Crop Residue Burning":
        return "#f97316"; // Orange
      case "Road & Construction Dust":
        return "#eab308"; // Yellow
      default:
        return "#10b981";
    }
  };

  // Helper to explain fingerprint diagnostics
  const getRatioExplanation = (key: string, val: number) => {
    if (key === "PM2.5_PM10_Ratio") {
      if (val > 0.75) return "Biomass/exhaust heavy (fine particulate dominance)";
      if (val < 0.40) return "Mechanical road dust/soil heavy (coarse dominance)";
      return "Balanced urban particulate distribution";
    }
    if (key === "SO2_NOx_Ratio") {
      if (val > 0.5) return "Industrial boiler/coal burning signature detected";
      return "Predominantly mobile combustion signature";
    }
    if (key === "CO_NO2_Ratio") {
      if (val > 8.0) return "Incomplete combustion: high vehicular idling indicator";
      return "Standard urban traffic progression signature";
    }
    return "";
  };

  return (
    <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Header and confidence score */}
      <div style={{ display: "flex", justifyContent: "between", alignItems: "center" }}>
        <h2 style={{ fontSize: "1.05rem" }}>
          <Zap size={16} style={{ color: "var(--color-warning)" }} />
          Source Attribution
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(59, 130, 246, 0.12)", border: "1px solid rgba(59, 130, 246, 0.2)", borderRadius: "4px", padding: "2px 6px" }}>
          <Award size={12} style={{ color: "var(--color-primary)" }} />
          <span style={{ fontSize: "0.65rem", fontWeight: "700", color: "var(--color-primary)" }}>
            AI CONFIDENCE: {confidence_score}%
          </span>
        </div>
      </div>

      <p style={{ fontSize: "0.8rem", marginTop: "-8px" }}>
        Real-time multi-modal attribution at receptor ward level:
      </p>

      {/* Attribution Bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {Object.entries(source_breakdown).map(([source, pct]) => {
          const color = getSourceColor(source);
          return (
            <div key={source} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: "600" }}>
                <span style={{ color: "var(--text-main)" }}>{source}</span>
                <span style={{ color: color }}>{pct}%</span>
              </div>
              <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", overflow: "hidden", border: "1px solid var(--border-light)" }}>
                <div 
                  style={{ 
                    width: `${pct}%`, 
                    height: "100%", 
                    background: color, 
                    borderRadius: "4px",
                    boxShadow: `0 0 8px ${color}`,
                    transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)" 
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Chemical Fingerprinting Diagnostic Ratios */}
      <div style={{ marginTop: "8px", borderTop: "1px solid var(--border-light)", paddingTop: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
          <Activity size={14} style={{ color: "var(--color-secondary)" }} />
          <span style={{ fontSize: "0.8rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.03em" }}>Chemical Fingerprinting</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {Object.entries(fingerprints).map(([key, val]) => {
            const cleanKey = key.replace(/_/g, " ");
            return (
              <div 
                key={key} 
                style={{ 
                  padding: "8px 10px", 
                  borderRadius: "8px", 
                  background: "rgba(255,255,255,0.02)", 
                  border: "1px solid var(--border-light)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", fontWeight: "600" }}>
                  <span style={{ color: "var(--text-muted)" }}>{cleanKey}</span>
                  <span style={{ color: "var(--color-secondary)" }}>{val}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.65rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                  <Info size={10} style={{ minWidth: "10px" }} />
                  <span>{getRatioExplanation(key, val)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
