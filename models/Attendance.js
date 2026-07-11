const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["present", "absent", "late", "half-day", "excused"],
      required: true,
    },
    classGrade: { type: String, required: true, trim: true },
    section: { type: String, trim: true },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // teacher
    remarks: { type: String, trim: true },
    method: {
      type: String,
      enum: ["manual", "qr", "biometric"],
      default: "manual",
    },
  },
  { timestamps: true }
);

// Prevent duplicate attendance entries for the same student on the same day
attendanceSchema.index({ student: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
