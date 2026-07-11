import React, { useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [studentStats, setStudentStats] = useState(null);
  const [feeStats, setFeeStats] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const requests = [api.get("/students/stats/summary")];
        if (user?.role === "admin") {
          requests.push(api.get("/fees/stats/summary"));
        }
        if (user?.role === "admin" || user?.role === "teacher") {
          requests.push(api.get("/attendance/stats/today"));
        }

        const results = await Promise.all(requests);
        setStudentStats(results[0].data);

        let idx = 1;
        if (user?.role === "admin") {
          setFeeStats(results[idx].data);
          idx++;
        }
        if (user?.role === "admin" || user?.role === "teacher") {
          setAttendanceStats(results[idx]?.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const formatCurrency = (n) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Welcome back, {user?.name?.split(" ")[0]}</h1>
          <p>Here's what's happening across the campus today.</p>
        </div>
      </div>

      {error && <div className="auth-error" style={{ marginBottom: 20 }}>{error}</div>}
      {loading && <div className="loading-state">Loading dashboard...</div>}

      {!loading && (
        <div className="stat-grid">
          {studentStats && (
            <>
              <div className="stat-card">
                <div className="stat-label">Total students</div>
                <div className="stat-value">{studentStats.total}</div>
                <div className="stat-sub">{studentStats.active} active</div>
              </div>
            </>
          )}

          {attendanceStats && (
            <>
              <div className="stat-card">
                <div className="stat-label">Present today</div>
                <div className="stat-value">{attendanceStats.present}</div>
                <div className="stat-sub">of {attendanceStats.totalStudents} students</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Unmarked today</div>
                <div className="stat-value">{attendanceStats.unmarked}</div>
                <div className="stat-sub">attendance not yet taken</div>
              </div>
            </>
          )}

          {feeStats && (
            <>
              <div className="stat-card">
                <div className="stat-label">Fees collected</div>
                <div className="stat-value">{formatCurrency(feeStats.totalCollected)}</div>
                <div className="stat-sub">of {formatCurrency(feeStats.totalBilled)} billed</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Outstanding dues</div>
                <div className="stat-value">{formatCurrency(feeStats.totalDue)}</div>
                <div className="stat-sub">across all students</div>
              </div>
            </>
          )}
        </div>
      )}

      {studentStats?.byClass?.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2>Students by class</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Class</th>
                <th>Students</th>
              </tr>
            </thead>
            <tbody>
              {studentStats.byClass.map((row) => (
                <tr key={row._id}>
                  <td>{row._id}</td>
                  <td>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
