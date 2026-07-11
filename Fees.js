import React, { useEffect, useState, useCallback } from "react";
import api from "../api/client";

export default function Fees() {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    student: "", feeType: "Tuition", academicYear: "2026-2027", term: "Term 1", totalAmount: "", dueDate: "",
  });
  const [createError, setCreateError] = useState("");
  const [saving, setSaving] = useState(false);

  const [payModal, setPayModal] = useState(null); // fee object being paid
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("Cash");
  const [payError, setPayError] = useState("");
  const [paying, setPaying] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const loadFees = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/fees", { params: { status: statusFilter || undefined, limit: 100 } });
      setFees(data.fees);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load fee records.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadFees();
  }, [loadFees]);

  useEffect(() => {
    api.get("/students", { params: { limit: 200 } }).then(({ data }) => setStudents(data.students)).catch(() => {});
  }, []);

  const formatCurrency = (n) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

  const openCreateModal = () => {
    setCreateForm({ student: "", feeType: "Tuition", academicYear: "2026-2027", term: "Term 1", totalAmount: "", dueDate: "" });
    setCreateError("");
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError("");
    setSaving(true);
    try {
      await api.post("/fees", createForm);
      setShowCreateModal(false);
      loadFees();
    } catch (err) {
      setCreateError(err.response?.data?.message || "Failed to create fee record.");
    } finally {
      setSaving(false);
    }
  };

  const openPayModal = (fee) => {
    setPayModal(fee);
    setPayAmount("");
    setPayError("");
    setReceipt(null);
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    setPayError("");
    setPaying(true);
    try {
      const { data } = await api.post(`/fees/${payModal._id}/pay`, {
        amount: Number(payAmount),
        method: payMethod,
        collectedBy: "Admin",
      });
      setReceipt(data);
      loadFees();
    } catch (err) {
      setPayError(err.response?.data?.message || "Payment failed.");
    } finally {
      setPaying(false);
    }
  };

  const statusBadge = (status) => {
    const map = { paid: "badge-success", partial: "badge-warning", pending: "badge-neutral", overdue: "badge-danger" };
    return <span className={`badge ${map[status] || "badge-neutral"}`}>{status}</span>;
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Fees</h1>
          <p>Create fee records, collect payments, and track dues.</p>
        </div>
        <button className="btn btn-accent" onClick={openCreateModal}>+ New fee record</button>
      </div>

      <div className="search-bar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="card">
        {loading ? (
          <div className="loading-state">Loading fee records...</div>
        ) : fees.length === 0 ? (
          <div className="empty-state">No fee records found.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Type</th>
                <th>Term</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Due date</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {fees.map((f) => (
                <tr key={f._id}>
                  <td>{f.student?.name} <span className="text-muted">({f.student?.admissionNo})</span></td>
                  <td>{f.feeType}</td>
                  <td>{f.term}</td>
                  <td>{formatCurrency(f.totalAmount)}</td>
                  <td>{formatCurrency(f.paidAmount)}</td>
                  <td>{new Date(f.dueDate).toLocaleDateString("en-IN")}</td>
                  <td>{statusBadge(f.status)}</td>
                  <td>
                    {f.status !== "paid" && (
                      <button className="btn btn-primary btn-sm" onClick={() => openPayModal(f)}>
                        Collect payment
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create fee modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2>New fee record</h2>
            {createError && <div className="auth-error" style={{ marginBottom: 16 }}>{createError}</div>}
            <form onSubmit={handleCreateSubmit}>
              <div className="form-grid">
                <div className="form-field" style={{ gridColumn: "1 / -1" }}>
                  <label>Student</label>
                  <select
                    value={createForm.student}
                    onChange={(e) => setCreateForm({ ...createForm, student: e.target.value })}
                    required
                  >
                    <option value="">Select a student</option>
                    {students.map((s) => (
                      <option key={s._id} value={s._id}>{s.name} ({s.admissionNo})</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label>Fee type</label>
                  <select
                    value={createForm.feeType}
                    onChange={(e) => setCreateForm({ ...createForm, feeType: e.target.value })}
                  >
                    {["Tuition", "Transport", "Library", "Lab", "Exam", "Other"].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label>Academic year</label>
                  <input
                    value={createForm.academicYear}
                    onChange={(e) => setCreateForm({ ...createForm, academicYear: e.target.value })}
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Term</label>
                  <input
                    value={createForm.term}
                    onChange={(e) => setCreateForm({ ...createForm, term: e.target.value })}
                  />
                </div>
                <div className="form-field">
                  <label>Total amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={createForm.totalAmount}
                    onChange={(e) => setCreateForm({ ...createForm, totalAmount: e.target.value })}
                    required
                  />
                </div>
                <div className="form-field" style={{ gridColumn: "1 / -1" }}>
                  <label>Due date</label>
                  <input
                    type="date"
                    value={createForm.dueDate}
                    onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Saving..." : "Create fee record"}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment modal */}
      {payModal && (
        <div className="modal-overlay" onClick={() => setPayModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            {receipt ? (
              <>
                <h2>Payment recorded</h2>
                <p>Receipt no: <strong>{receipt.receiptNo}</strong></p>
                <p>Amount collected: <strong>{formatCurrency(payAmount)}</strong></p>
                <p className="text-muted">Remaining due: {formatCurrency(receipt.fee.totalAmount - receipt.fee.paidAmount)}</p>
                <div className="form-actions">
                  <button className="btn btn-primary" onClick={() => setPayModal(null)}>Done</button>
                </div>
              </>
            ) : (
              <>
                <h2>Collect payment — {payModal.student?.name}</h2>
                <p className="text-muted">
                  Remaining due: {formatCurrency(payModal.totalAmount - payModal.paidAmount)}
                </p>
                {payError && <div className="auth-error" style={{ margin: "12px 0" }}>{payError}</div>}
                <form onSubmit={handlePaySubmit}>
                  <div className="form-field" style={{ marginBottom: 16 }}>
                    <label>Amount (₹)</label>
                    <input
                      type="number"
                      min="1"
                      max={payModal.totalAmount - payModal.paidAmount}
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-field" style={{ marginBottom: 16 }}>
                    <label>Payment method</label>
                    <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                      {["Cash", "Card", "UPI", "BankTransfer", "Cheque"].map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={paying}>
                      {paying ? "Processing..." : "Confirm payment"}
                    </button>
                    <button type="button" className="btn btn-outline" onClick={() => setPayModal(null)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
