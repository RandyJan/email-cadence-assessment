"use client";

import { useEffect, useMemo, useState } from "react";

type CadenceStep =
  | { id: string; type: "SEND_EMAIL"; subject: string; body: string }
  | { id: string; type: "WAIT"; seconds: number };

type CadencePayload = { id: string; name: string; steps: CadenceStep[] };

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
  const API = useMemo(() => process.env.NEXT_PUBLIC_API_URL!, []);
  console.log(API);
  const [cadenceId, setCadenceId] = useState(defaultCadence.id);
  const [jsonText, setJsonText] = useState(JSON.stringify(defaultCadence, null, 2));

  const [contactEmail, setContactEmail] = useState("test@example.com");
  const [enrollmentId, setEnrollmentId] = useState<string>("");
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    if (!enrollmentId) return;
    const timer = setInterval(async () => {
      const res = await fetch(`${API}/enrollments/${enrollmentId}`);
      const data = await res.json();
      setStatus(data);
    }, 1000);

    return () => clearInterval(timer);
  }, [API, enrollmentId]);

  function parseCadence(): CadencePayload {
    return JSON.parse(jsonText) as CadencePayload;
  }

  async function createCadence() {
    const cadence = parseCadence();
    const res = await fetch(`${API}/cadences`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cadence),
    });
    const data = await res.json();
    alert(`Created: ${data.id ?? JSON.stringify(data)}`);
    setCadenceId(cadence.id);
  }

  async function updateCadenceDefinition() {
    const cadence = parseCadence();
    const res = await fetch(`${API}/cadences/${cadence.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cadence),
    });
    const data = await res.json();
    alert(`Updated: ${data.id ?? JSON.stringify(data)}`);
    setCadenceId(cadence.id);
  }

  async function enroll() {
    const res = await fetch(`${API}/enrollments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cadenceId, contactEmail }),
    });
    const data = await res.json();
    if (data.error) return alert(data.error);
    setEnrollmentId(data.id);
  }

  async function updateRunningWorkflowSteps() {
    if (!enrollmentId) return alert("Enroll first");
    const cadence = parseCadence();

    const res = await fetch(`${API}/enrollments/${enrollmentId}/update-cadence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ steps: cadence.steps }),
    });
    const data = await res.json();
    alert(`Signal sent: ${JSON.stringify(data)}`);
  }

  return (
    <main style={{ padding: 16, fontFamily: "system-ui, sans-serif", maxWidth: 1000 }}>
      <h1>Email Cadence (Assessment)</h1>

      <section style={{ marginTop: 16 }}>
        <h2>Cadence JSON</h2>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          <button onClick={createCadence}>POST /cadences</button>
          <button onClick={updateCadenceDefinition}>PUT /cadences/:id</button>

          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            Cadence ID:
            <input
              value={cadenceId}
              onChange={(e) => setCadenceId(e.target.value)}
              style={{ padding: 6, minWidth: 200 }}
            />
          </label>
        </div>

        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          rows={18}
          style={{ width: "100%", fontFamily: "Consolas, monospace", padding: 10 }}
        />
      </section>

      <hr style={{ margin: "24px 0" }} />

      <section>
        <h2>Enroll Contact</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="contact email"
            style={{ padding: 6, minWidth: 240 }}
          />
          <button onClick={enroll}>POST /enrollments</button>
          <button onClick={updateRunningWorkflowSteps} disabled={!enrollmentId}>
            POST /enrollments/:id/update-cadence
          </button>
        </div>

        <div style={{ marginTop: 12 }}>
          <div>
            <b>Enrollment ID:</b> {enrollmentId || "-"}
          </div>

          <div style={{ marginTop: 8 }}>
            <b>Workflow State (polled):</b>
            <pre style={{ background: "gray", padding: 10 }}>
              {JSON.stringify(status, null, 2)}
            </pre>
          </div>
        </div>
      </section>
    </main>
  );
}
