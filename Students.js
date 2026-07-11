import React, { useEffect, useState, useCallback } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const emptyForm = {
  admissionNo: "",
  name: "",
  dateOfBirth: "",
  gender: "Male",
  classGrade: "",
  section: "A",
  rollNumber: "",
  guardianName: "",
  guardianPhone: "",
};

export default function Students() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === "admin";

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/students", { params: { search, limit: 100 } });
      setStudents(data.students);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load students.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(loadStudents, 300); // debounce search
    return () => clearTimeout(timer);
  }, [loadStudents]);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (student) => {
    setEditingId(student._id);
    setForm({
      ...student,
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split("T")[0] : "",
    });
    setFormError("");
    setShowModal(true);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/students/${editingId}`, form);
      } else {
        await api.post("/students", form);
      }
      setShowModal(false);
      loadStudents();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save student.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove ${name} from the system? This cannot be undone.`)) return;
    try {
      await api.delete(`/students/${id}`);
      loadStudents();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete student.");
    }
  };

  const statusBadge = (status) => {
    const map = { active: "badge-success", inactive: "badge-neutral", graduated: "badge-neutral", transferred: "badge-warning" };
    return <span className={`badge ${map[status] || "badge-neutral"}`}>{status}</span>;
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Students</h1>
          <p>Manage admissions, profiles, and student records.</p>
        </div>
        {isAdmin && (
          <button className="btn btn-accent" onClick={openAddModal}>
            + New admission
          </button>
        )}
      </div>

      <div className="search-bar">
        <input
          placeholder="Search by name or admission number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="card">
        {loading ? (
          <div className="loading-state">Loading students...</div>
        ) : students.length === 0 ? (
          <div className="empty-state">No students found. {isAdmin && "Add your first admission to get started."}</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Admission No.</th>
                <th>Name</th>
                <th>Class</th>
                <th>Guardian</th>
                <th>Status</th>
                {isAdmin && <th></th>}
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s._id}>
                  <td>{s.admissionNo}</td>
                  <td>{s.name}</td>
                  <td>{s.classGrade}-{s.section}</td>
                  <td>{s.guardianName || "—"}</td>
                  <td>{statusBadge(s.status)}</td>
                  {isAdmin && (
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => openEditModal(s)} style={{ marginRight: 8 }}>
                        Edit
                      </button>
                      <button className="btn btn-danger-outline btn-sm" onClick={() => handleDelete(s._id, s.name)}>
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? "Edit student" : "New admission"}</h2>
            {formError && <div className="auth-error" style={{ marginBottom: 16 }}>{formError}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-field">
                  <label>Admission No.</label>
                  <input name="admissionNo" value={form.admissionNo} onChange={handleChange} required disabled={!!editingId} />
                </div>
                <div className="form-field">
                  <label>Full name</label>
                  <input name="name" value={form.name} onChange={handleChange} required />
                </div>
                <div className="form-field">
                  <label>Date of birth</label>
                  <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} required />
                </div>
                <div className="form-field">
                  <label>Gender</label>
                  <select name="gender" value={form.gender} onChange={handleChange}>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Class / Grade</label>
                  <input name="classGrade" value={form.classGrade} onChange={handleChange} required placeholder="e.g. 10" />
                </div>
                <div className="form-field">
                  <label>Section</label>
                  <input name="section" value={form.section} onChange={handleChange} placeholder="e.g. A" />
                </div>
                <div className="form-field">
                  <label>Guardian name</label>
                  <input name="guardianName" value={form.guardianName} onChange={handleChange} />
                </div>
                <div className="form-field">
                  <label>Guardian phone</label>
                  <input name="guardianPhone" value={form.guardianPhone} onChange={handleChange} />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Saving..." : editingId ? "Save changes" : "Create admission"}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
