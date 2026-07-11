import React, { useEffect, useState, useCallback } from "react";
import api from "../api/client";

const today = () => new Date().toISOString().split("T")[0];

export default function Attendance() {
  const [date, setDate] = useState(today());
  const [classGrade, setClassGrade] = useState("");
  const [section, setSection] = useState("");
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({}); // studentId -> status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  const loadClassRoster = useCallback(async () => {
    if (!classGrade) {
      setStudents([]);
      return;
    }
    setLoading(true);
    setError("");
    setSavedMsg("");
    try {
      const { data: studentData } = await api.get("/students", {
        params: { classGrade, section: section || undefined, limit: 200, status: "active" },
      });

      const { data: existing } = await api.get("/attendance", {
        params: { classGrade, section: section || undefined, date },
      });

      const existingMap = {};
      existing.forEach((r) => {
        existingMap[r.student._id] = r.status;
      });

      setStudents(studentData.students);
      const initialMarks = {};
      studentData.students.forEach((s) => {
        initialMarks[s._id] = existingMap[s._id] || "present";
      });
      setMarks(initialMarks);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load class roster.");
    } finally {
      setLoading(false);
    }
  }, [classGrade, section, date]);

  useEffect(() => {
    loadClassRoster();
  }, [loadClassRoster]);

  const setMark = (studentId, status) => {
    setMarks({ ...marks, [studentId]: status });
  };

  const markAllPresent = () => {
    const all = {};
    students.forEach((s) => (all[s._id] = "present"));
    setMarks(all);
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedMsg("");
    setError("");
    try {
      const records = students.map((s) => ({ student: s._id, status: marks[s._id] || "present" }));
      await api.post("/attendance/bulk", { date, classGrade, section, records });
      setSavedMsg(`Attendance saved for ${students.length} students.`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save attendance.");
    } finally {
      setSaving(false);
    }
  };

  const statusOptions = ["present", "absent", "late", "half-day", "excused"];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Attendance</h1>
          <p>Mark daily attendance for a class section.</p>
        </div>
      </div>

      <div className="card">
        <div className="form-grid" style={{ marginBottom: 0 }}>
          <div className="form-field">
            <label>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={today()} />
          </div>
          <div className="form-field">
            <label>Class / Grade</label>
            <input value={classGrade} onChange={(e) => setClassGrade(e.target.value)} placeholder="e.g. 10" />
          </div>
          <div className="form-field">
            <label>Section (optional)</label>
            <input value={section} onChange={(e) => setSection(e.target.value)} placeholder="e.g. A" />
          </div>
        </div>
      </div>

      {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
      {savedMsg && <div className="auth-error" style={{ marginBottom: 16, background: "#e3f1e8", color: "#2f6b4f" }}>{savedMsg}</div>}

      {!classGrade ? (
        <div className="card"><div className="empty-state">Enter a class to load the student roster.</div></div>
      ) : loading ? (
        <div className="card"><div className="loading-state">Loading roster...</div></div>
      ) : students.length === 0 ? (
        <div className="card"><div className="empty-state">No active students found for this class/section.</div></div>
      ) : (
        <div className="card">
          <div className="card-header">
            <h2>{classGrade}{section ? `-${section}` : ""} — {students.length} students</h2>
            <button className="btn btn-outline btn-sm" onClick={markAllPresent}>Mark all present</button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Roll</th>
                <th>Name</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s._id}>
                  <td>{s.rollNumber || "—"}</td>
                  <td>{s.name}</td>
                  <td>
                    <select value={marks[s._id] || "present"} onChange={(e) => setMark(s._id, e.target.value)}>
                      {statusOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save attendance"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
