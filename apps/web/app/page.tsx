"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type CadenceStep =
  | { id: string; type: "SEND_EMAIL"; subject: string; body: string }
  | { id: string; type: "WAIT"; seconds: number };

type CadencePayload = { id: string; name: string; steps: CadenceStep[] };

type Toast = { type: "success" | "error" | "info"; message: string };

const defaultCadence: CadencePayload = {
  id: "cad_123",
  name: "Welcome Flow",
  steps: [
    { id: "1", type: "SEND_EMAIL", subject: "Welcome", body: "Hello there" },
    { id: "2", type: "WAIT", seconds: 10 },
    { id: "3", type: "SEND_EMAIL", subject: "Follow up", body: "Checking in" },
  ],
};

export default function Page() {
  const API = useMemo(() => process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001", []);

  const [jsonText, setJsonText] = useState(JSON.stringify(defaultCadence, null, 2));
  const [cadenceId, setCadenceId] = useState(defaultCadence.id);
  const [contactEmail, setContactEmail] = useState("test@example.com");
  const [enrollmentId, setEnrollmentId] = useState("");
  const [status, setStatus] = useState<any>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<any>(null);

  const [busy, setBusy] = useState({
    create: false,
    update: false,
    enroll: false,
    signal: false,
  });

  function showToast(t: Toast) {
    setToast(t);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }

  function parseCadence(): CadencePayload | null {
    try {
      return JSON.parse(jsonText);
    } catch {
      return null;
    }
  }

  useEffect(() => {
    if (!enrollmentId) return;

    const t = setInterval(async () => {
      const res = await fetch(`${API}/enrollments/${enrollmentId}`);
      const data = await res.json();
      setStatus(data);
    }, 1000);

    return () => clearInterval(t);
  }, [API, enrollmentId]);

  async function createCadence() {
    const cadence = parseCadence();
    if (!cadence) return showToast({ type: "error", message: "Invalid JSON" });

    setBusy((b) => ({ ...b, create: true }));
    try {
      await fetch(`${API}/cadences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cadence),
      });
      setCadenceId(cadence.id);
      showToast({ type: "success", message: "Cadence created" });
    } finally {
      setBusy((b) => ({ ...b, create: false }));
    }
  }

  async function updateCadence() {
    const cadence = parseCadence();
    if (!cadence) return showToast({ type: "error", message: "Invalid JSON" });

    setBusy((b) => ({ ...b, update: true }));
    try {
      await fetch(`${API}/cadences/${cadence.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cadence),
      });
      showToast({ type: "success", message: "Cadence updated" });
    } finally {
      setBusy((b) => ({ ...b, update: false }));
    }
  }

  async function enroll() {
    setBusy((b) => ({ ...b, enroll: true }));
    try {
      const res = await fetch(`${API}/enrollments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cadenceId, contactEmail }),
      });
      const data = await res.json();
      setEnrollmentId(data.id);
      showToast({ type: "success", message: "Enrollment started" });
    } finally {
      setBusy((b) => ({ ...b, enroll: false }));
    }
  }

  async function updateRunning() {
    const cadence = parseCadence();
    if (!cadence || !enrollmentId) return;

    setBusy((b) => ({ ...b, signal: true }));
    try {
      await fetch(`${API}/enrollments/${enrollmentId}/update-cadence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps: cadence.steps }),
      });
      showToast({ type: "info", message: "Workflow updated" });
    } finally {
      setBusy((b) => ({ ...b, signal: false }));
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f3f4f6", padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <h1 style={{ fontSize: 26, fontWeight: 600 }}>Email Cadence</h1>
        <p style={{ color: "#555", marginBottom: 16 }}>
          Manage cadence JSON, enroll contacts, and update running workflows.
        </p>

        {toast && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: 6,
              background:
                toast.type === "success"
                  ? "green"
                  : toast.type === "error"
                  ? "red"
                  : "#2b4b51",
            }}
          >
            {toast.message}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* JSON Editor */}
          <section style={card}>
            <h2 style={cardTitle}>Cadence JSON</h2>

            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <button style={btn} onClick={createCadence} disabled={busy.create}>
                Create
              </button>
              <button style={btnDark} onClick={updateCadence} disabled={busy.update}>
                Update
              </button>
            </div>

            <label style={label}>Cadence ID</label>
            <input
              value={cadenceId}
              onChange={(e) => setCadenceId(e.target.value)}
              style={input}
            />

            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={18}
              style={{ ...textarea, marginTop: 10 }}
            />
          </section>

          {/* Enrollment */}
          <section style={card}>
            <h2 style={cardTitle}>Enroll & Monitor</h2>

            <label style={label}>Contact Email</label>
            <input
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              style={input}
            />

            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button style={btnDark} onClick={enroll} disabled={busy.enroll}>
                Enroll
              </button>
              <button
                style={btn}
                onClick={updateRunning}
                disabled={!enrollmentId || busy.signal}
              >
                Update Running Workflow
              </button>
            </div>

            <div style={{ marginTop: 16 }}>
              <b>Enrollment ID:</b> {enrollmentId || "-"}
            </div>

            <pre style={pre}>{JSON.stringify(status, null, 2)}</pre>
          </section>
        </div>
      </div>
    </main>
  );
}

/* ---------- styles ---------- */

const card: React.CSSProperties = {
  background: "#4a4646",
  borderRadius: 8,
  padding: 16,
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
};

const cardTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  marginBottom: 12,
};

const label: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  marginBottom: 4,
  color: "#444",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #ccc",
};

const textarea: React.CSSProperties = {
  width: "100%",
  fontFamily: "monospace",
  padding: 10,
  borderRadius: 6,
  border: "1px solid #010101",
};

const btn: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 6,
  border: "1px solid #ccc",
  background: "#080808",
  cursor: "pointer",
};

const btnDark: React.CSSProperties = {
  ...btn,
  background: "#111",
  color: "#fff",
};

const pre: React.CSSProperties = {
  marginTop: 12,
  background: "black",
  padding: 12,
  borderRadius: 6,
  maxHeight: 260,
  overflow: "auto",
};
