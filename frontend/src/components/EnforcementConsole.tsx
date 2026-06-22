import React, { useState } from "react";
import type { EnforcementTicket } from "../types";
import { ShieldAlert, ShieldCheck, MapPin, Eye, CheckCircle2, Navigation } from "lucide-react";

interface EnforcementConsoleProps {
  tickets: EnforcementTicket[];
  onUpdateTicketStatus: (id: string, newStatus: EnforcementTicket["status"]) => void;
}

export const EnforcementConsole: React.FC<EnforcementConsoleProps> = ({
  tickets,
  onUpdateTicketStatus
}) => {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(tickets[0]?.id || null);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId);

  // Helper to color priority text
  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "badge-priority critical";
      case "HIGH":
        return "badge-priority high";
      case "MEDIUM":
        return "badge-priority medium";
      default:
        return "badge-priority low";
    }
  };

  // Simulates dispatching inspectors with a loading indicator
  const handleDispatch = (id: string) => {
    setDispatchingId(id);
    setTimeout(() => {
      onUpdateTicketStatus(id, "ACTIVE");
      setDispatchingId(null);
    }, 1200);
  };

  const handleResolve = (id: string) => {
    onUpdateTicketStatus(id, "RESOLVED");
  };

  return (
    <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
      {/* Title */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <ShieldAlert size={16} style={{ color: "var(--color-danger)" }} />
        <h2 style={{ fontSize: "1.05rem" }}>Enforcement Dispatch Desk</h2>
      </div>

      <p style={{ fontSize: "0.8rem", marginTop: "-8px" }}>
        AI-prioritized hotspots with actionable municipal task tickets:
      </p>

      {/* Ticket List split layout */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1, maxHeight: "250px", overflowY: "auto", paddingRight: "4px" }}>
        {tickets.map((ticket) => {
          const isSelected = ticket.id === selectedTicketId;
          return (
            <div
              key={ticket.id}
              onClick={() => setSelectedTicketId(ticket.id)}
              className="glass-panel-interactive"
              style={{
                padding: "10px 12px",
                borderRadius: "10px",
                background: isSelected ? "rgba(255, 255, 255, 0.04)" : "rgba(255, 255, 255, 0.01)",
                border: isSelected ? "1px solid var(--color-primary)" : "1px solid var(--border-light)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#fff" }}>{ticket.id}</span>
                  <span className={getPriorityClass(ticket.priority)}>{ticket.priority}</span>
                </div>
                <span style={{ fontSize: "0.8rem", fontWeight: "600" }}>{ticket.zone}</span>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{ticket.source_category}</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {ticket.status === "PENDING" && (
                  <span style={{ fontSize: "0.65rem", padding: "2px 6px", background: "rgba(100,116,139,0.1)", color: "var(--text-muted)", borderRadius: "4px", fontWeight: "700", border: "1px solid rgba(255,255,255,0.05)" }}>
                    PENDING
                  </span>
                )}
                {ticket.status === "ACTIVE" && (
                  <span className="animate-pulse" style={{ fontSize: "0.65rem", padding: "2px 6px", background: "rgba(234,179,8,0.12)", color: "var(--color-warning)", borderRadius: "4px", fontWeight: "700", border: "1px solid rgba(234,179,8,0.2)" }}>
                    DISPATCHED
                  </span>
                )}
                {ticket.status === "RESOLVED" && (
                  <ShieldCheck size={14} style={{ color: "var(--color-success)" }} />
                )}
                <Eye size={14} style={{ color: isSelected ? "var(--color-primary)" : "var(--text-dark)", cursor: "pointer" }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Ticket Details */}
      {selectedTicket && (
        <div 
          style={{ 
            borderTop: "1px solid var(--border-light)", 
            paddingTop: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "10px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--color-primary)", display: "flex", alignItems: "center", gap: "4px" }}>
              <Navigation size={12} />
              DISPATCH SPECIFICATIONS
            </span>
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
              <MapPin size={10} />
              GPS: {selectedTicket.gps.lat.toFixed(4)}, {selectedTicket.gps.lon.toFixed(4)}
            </span>
          </div>

          <div 
            style={{ 
              padding: "10px", 
              borderRadius: "8px", 
              background: "rgba(255,255,255,0.02)", 
              border: "1px solid var(--border-light)",
              fontSize: "0.78rem"
            }}
          >
            <strong>Reasoning:</strong> {selectedTicket.reason}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-muted)" }}>AI Recommended Interventions:</span>
            <ul style={{ paddingLeft: "16px", fontSize: "0.75rem", color: "var(--text-main)", display: "flex", flexDirection: "column", gap: "4px" }}>
              {selectedTicket.recommended_actions.map((act, i) => (
                <li key={i}>{act}</li>
              ))}
            </ul>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            {selectedTicket.status === "PENDING" && (
              <button
                disabled={dispatchingId === selectedTicket.id}
                onClick={() => handleDispatch(selectedTicket.id)}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "var(--color-primary)",
                  color: "#fff",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.78rem",
                  fontWeight: "600",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px var(--color-primary-glow)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center"
                }}
              >
                {dispatchingId === selectedTicket.id ? (
                  <span className="animate-spin" style={{ display: "inline-block", width: "12px", height: "12px", border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%" }}></span>
                ) : (
                  "Dispatch Inspectors & Cannons"
                )}
              </button>
            )}

            {selectedTicket.status === "ACTIVE" && (
              <button
                onClick={() => handleResolve(selectedTicket.id)}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "var(--color-success)",
                  color: "#fff",
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.78rem",
                  fontWeight: "600",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <CheckCircle2 size={14} />
                Mark as Actioned / Resolved
              </button>
            )}

            {selectedTicket.status === "RESOLVED" && (
              <div 
                style={{ 
                  flex: 1, 
                  padding: "8px 12px", 
                  borderRadius: "8px", 
                  background: "rgba(16,185,129,0.08)", 
                  border: "1px solid rgba(16,185,129,0.2)",
                  color: "var(--color-success)",
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  textAlign: "center"
                }}
              >
                ✓ Intervention Deployed & Site Compliance Achieved
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
