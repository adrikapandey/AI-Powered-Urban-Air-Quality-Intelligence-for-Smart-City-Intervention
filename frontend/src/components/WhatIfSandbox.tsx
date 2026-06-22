import type { PolicyLevers } from "../types";
import { Sliders, ZapOff, Sparkles, Building2, Car, CloudRain } from "lucide-react";

interface WhatIfSandboxProps {
  policies: PolicyLevers;
  onChangePolicies: (policies: PolicyLevers) => void;
}

export const WhatIfSandbox: React.FC<WhatIfSandboxProps> = ({
  policies,
  onChangePolicies
}) => {
  const handleToggle = (key: keyof Omit<PolicyLevers, "factory_scaling">) => {
    onChangePolicies({
      ...policies,
      [key]: !policies[key]
    });
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangePolicies({
      ...policies,
      factory_scaling: parseFloat(e.target.value)
    });
  };

  // Helper to count active policies
  const activeCount = [
    policies.odd_even,
    policies.stubble_ban,
    policies.smog_cannons,
    policies.construction_ban,
    policies.factory_scaling < 100
  ].filter(Boolean).length;

  return (
    <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Title */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: "1.05rem" }}>
          <Sliders size={16} style={{ color: "var(--color-primary)" }} />
          What-If Policy Sandbox
        </h2>
        {activeCount > 0 && (
          <div className="pulse-badge" style={{ background: "rgba(59, 130, 246, 0.12)", border: "1px solid rgba(59, 130, 246, 0.25)", color: "var(--color-primary)" }}>
            <Sparkles size={10} />
            <span>{activeCount} ACTIVES</span>
          </div>
        )}
      </div>

      <p style={{ fontSize: "0.8rem", marginTop: "-8px" }}>
        Toggle policy levers to simulate future air quality improvements:
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Toggle 1: Stubble Ban */}
        <div className="switch-container" style={{ borderBottom: "1px solid rgba(255,255,255,0.02)", paddingBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ZapOff size={16} style={{ color: policies.stubble_ban ? "var(--color-warning)" : "var(--text-muted)" }} />
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: "600" }}>Stubble Burning Ban</div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Enforce 90% agricultural fire suppression</div>
            </div>
          </div>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={policies.stubble_ban} 
              onChange={() => handleToggle("stubble_ban")} 
            />
            <span className="slider-round"></span>
          </label>
        </div>

        {/* Toggle 2: Odd-Even Traffic */}
        <div className="switch-container" style={{ borderBottom: "1px solid rgba(255,255,255,0.02)", paddingBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Car size={16} style={{ color: policies.odd_even ? "var(--color-primary)" : "var(--text-muted)" }} />
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: "600" }}>Odd-Even Traffic Rule</div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Restricts private cars (35% exhaust drop)</div>
            </div>
          </div>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={policies.odd_even} 
              onChange={() => handleToggle("odd_even")} 
            />
            <span className="slider-round"></span>
          </label>
        </div>

        {/* Toggle 3: Construction Ban */}
        <div className="switch-container" style={{ borderBottom: "1px solid rgba(255,255,255,0.02)", paddingBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Building2 size={16} style={{ color: policies.construction_ban ? "var(--color-danger)" : "var(--text-muted)" }} />
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: "600" }}>GRAP Stage IV Construction Ban</div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Halt all active excavation & dusty works</div>
            </div>
          </div>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={policies.construction_ban} 
              onChange={() => handleToggle("construction_ban")} 
            />
            <span className="slider-round"></span>
          </label>
        </div>

        {/* Toggle 4: Smog Cannons */}
        <div className="switch-container" style={{ borderBottom: "1px solid rgba(255,255,255,0.02)", paddingBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <CloudRain size={16} style={{ color: policies.smog_cannons ? "var(--color-success)" : "var(--text-muted)" }} />
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: "600" }}>Water Sprinklers / Cannons</div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Deploy localized dust suppressants (25% drop)</div>
            </div>
          </div>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={policies.smog_cannons} 
              onChange={() => handleToggle("smog_cannons")} 
            />
            <span className="slider-round"></span>
          </label>
        </div>

        {/* Slider: Factory Output Scaling */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingTop: "6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Building2 size={16} style={{ color: policies.factory_scaling < 100 ? "var(--color-secondary)" : "var(--text-muted)" }} />
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: "600" }}>Industrial Boiler Cap</div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Restrict manufacturing stack operations</div>
              </div>
            </div>
            <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--color-secondary)" }}>
              {policies.factory_scaling}%
            </span>
          </div>
          <input
            type="range"
            min="20"
            max="100"
            step="5"
            value={policies.factory_scaling}
            onChange={handleSliderChange}
            className="custom-slider"
          />
        </div>
      </div>
    </div>
  );
};
