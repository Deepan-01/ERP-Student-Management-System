const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    admissionNo: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    classGrade: { type: String, required: true, trim: true }, // e.g. "10", "BSc-CS-2"
    section: { type: String, trim: true, default: "A" },
    rollNumber: { type: String, trim: true },

    // Contact details
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },

    // Parent / Guardian info
    guardianName: { type: String, trim: true },
    guardianPhone: { type: String, trim: true },
    guardianEmail: { type: String, trim: true, lowercase: true },

    // Status
    status: {
      type: String,
      enum: ["active", "inactive", "graduated", "transferred"],
      default: "active",
    },
    admissionDate: { type: Date, default: Date.now },

    // Documents (storing metadata only — actual files would live in /uploads)
    documents: [
      {
        name: String,
        fileUrl: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
