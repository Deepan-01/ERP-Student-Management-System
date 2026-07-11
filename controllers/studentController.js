const Student = require("../models/Student");

// POST /api/students   (admin/clerk - create admission)
exports.createStudent = async (req, res) => {
  try {
    const student = await Student.create(req.body);
    return res.status(201).json(student);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Admission number already exists." });
    }
    return res.status(500).json({ message: "Failed to create student.", error: err.message });
  }
};

// GET /api/students   (list, with optional filters + search)
exports.getStudents = async (req, res) => {
  try {
    const { classGrade, section, status, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (classGrade) filter.classGrade = classGrade;
    if (section) filter.section = section;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { admissionNo: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [students, total] = await Promise.all([
      Student.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Student.countDocuments(filter),
    ]);

    return res.json({ students, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch students.", error: err.message });
  }
};

// GET /api/students/:id
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found." });
    return res.json(student);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch student.", error: err.message });
  }
};

// PUT /api/students/:id
exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!student) return res.status(404).json({ message: "Student not found." });
    return res.json(student);
  } catch (err) {
    return res.status(500).json({ message: "Failed to update student.", error: err.message });
  }
};

// DELETE /api/students/:id
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found." });
    return res.json({ message: "Student deleted successfully." });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete student.", error: err.message });
  }
};

// GET /api/students/stats/summary  (for dashboard)
exports.getStudentStats = async (req, res) => {
  try {
    const total = await Student.countDocuments();
    const active = await Student.countDocuments({ status: "active" });
    const byClass = await Student.aggregate([
      { $group: { _id: "$classGrade", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    const byGender = await Student.aggregate([
      { $group: { _id: "$gender", count: { $sum: 1 } } },
    ]);

    return res.json({ total, active, byClass, byGender });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch stats.", error: err.message });
  }
};
