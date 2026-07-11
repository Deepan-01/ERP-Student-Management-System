const Attendance = require("../models/Attendance");
const Student = require("../models/Student");

// POST /api/attendance   (mark attendance for ONE student)
exports.markAttendance = async (req, res) => {
  try {
    const { student, date, status, classGrade, section, remarks, method } = req.body;

    const record = await Attendance.findOneAndUpdate(
      { student, date: new Date(date).setHours(0, 0, 0, 0) },
      {
        student,
        date: new Date(date).setHours(0, 0, 0, 0),
        status,
        classGrade,
        section,
        remarks,
        method: method || "manual",
        markedBy: req.user?._id,
      },
      { upsert: true, new: true, runValidators: true }
    );

    return res.status(201).json(record);
  } catch (err) {
    return res.status(500).json({ message: "Failed to mark attendance.", error: err.message });
  }
};

// POST /api/attendance/bulk   (mark attendance for a whole class in one go)
exports.markBulkAttendance = async (req, res) => {
  try {
    const { date, classGrade, section, records } = req.body;
    // records = [{ student, status, remarks }, ...]

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: "records array is required." });
    }

    const day = new Date(date).setHours(0, 0, 0, 0);

    const ops = records.map((r) => ({
      updateOne: {
        filter: { student: r.student, date: day },
        update: {
          $set: {
            student: r.student,
            date: day,
            status: r.status,
            classGrade,
            section,
            remarks: r.remarks || "",
            markedBy: req.user?._id,
            method: "manual",
          },
        },
        upsert: true,
      },
    }));

    const result = await Attendance.bulkWrite(ops);
    return res.json({ message: "Bulk attendance saved.", result });
  } catch (err) {
    return res.status(500).json({ message: "Failed to save bulk attendance.", error: err.message });
  }
};

// GET /api/attendance   (filter by student, class, date range)
exports.getAttendance = async (req, res) => {
  try {
    const { student, classGrade, section, date, from, to } = req.query;
    const filter = {};

    if (student) filter.student = student;
    if (classGrade) filter.classGrade = classGrade;
    if (section) filter.section = section;

    if (date) {
      filter.date = new Date(date).setHours(0, 0, 0, 0);
    } else if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    const records = await Attendance.find(filter)
      .populate("student", "name admissionNo classGrade section")
      .sort({ date: -1 });

    return res.json(records);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch attendance.", error: err.message });
  }
};

// GET /api/attendance/student/:studentId/summary
exports.getStudentAttendanceSummary = async (req, res) => {
  try {
    const { studentId } = req.params;
    const records = await Attendance.find({ student: studentId });

    const total = records.length;
    const present = records.filter((r) => r.status === "present").length;
    const absent = records.filter((r) => r.status === "absent").length;
    const late = records.filter((r) => r.status === "late").length;
    const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : "0.00";

    return res.json({ total, present, absent, late, attendancePercentage: percentage });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch summary.", error: err.message });
  }
};

// GET /api/attendance/stats/today  (for dashboard)
exports.getTodayStats = async (req, res) => {
  try {
    const today = new Date().setHours(0, 0, 0, 0);
    const records = await Attendance.find({ date: today });
    const totalStudents = await Student.countDocuments({ status: "active" });

    const present = records.filter((r) => r.status === "present").length;
    const absent = records.filter((r) => r.status === "absent").length;
    const marked = records.length;

    return res.json({ totalStudents, marked, present, absent, unmarked: totalStudents - marked });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch today's stats.", error: err.message });
  }
};
