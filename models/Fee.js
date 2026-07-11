const mongoose = require("mongoose");

const feeSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    feeType: {
      type: String,
      enum: ["Tuition", "Transport", "Library", "Lab", "Exam", "Other"],
      default: "Tuition",
    },
    academicYear: { type: String, required: true, trim: true }, // e.g. "2026-2027"
    term: { type: String, trim: true, default: "Annual" }, // e.g. "Term 1"

    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },

    dueDate: { type: Date, required: true },

    status: {
      type: String,
      enum: ["pending", "partial", "paid", "overdue"],
      default: "pending",
    },

    payments: [
      {
        amount: { type: Number, required: true },
        paidOn: { type: Date, default: Date.now },
        method: {
          type: String,
          enum: ["Cash", "Card", "UPI", "BankTransfer", "Cheque"],
          default: "Cash",
        },
        receiptNo: { type: String },
        collectedBy: { type: String }, // name of staff who collected
      },
    ],
  },
  { timestamps: true }
);

// Auto-update status whenever paidAmount changes
feeSchema.pre("save", function (next) {
  if (this.paidAmount >= this.totalAmount) {
    this.status = "paid";
  } else if (this.paidAmount > 0) {
    this.status = "partial";
  } else if (this.dueDate < new Date()) {
    this.status = "overdue";
  } else {
    this.status = "pending";
  }
  next();
});

module.exports = mongoose.model("Fee", feeSchema);
