const Fee = require("../models/Fee");

// POST /api/fees   (create a fee record/invoice for a student)
exports.createFee = async (req, res) => {
  try {
    const fee = await Fee.create(req.body);
    return res.status(201).json(fee);
  } catch (err) {
    return res.status(500).json({ message: "Failed to create fee record.", error: err.message });
  }
};

// GET /api/fees   (list all fee records, filterable by student/status)
exports.getFees = async (req, res) => {
  try {
    const { student, status, academicYear, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (student) filter.student = student;
    if (status) filter.status = status;
    if (academicYear) filter.academicYear = academicYear;

    const skip = (Number(page) - 1) * Number(limit);
    const [fees, total] = await Promise.all([
      Fee.find(filter)
        .populate("student", "name admissionNo classGrade section")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Fee.countDocuments(filter),
    ]);

    return res.json({ fees, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch fees.", error: err.message });
  }
};

// GET /api/fees/:id
exports.getFeeById = async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id).populate(
      "student",
      "name admissionNo classGrade section"
    );
    if (!fee) return res.status(404).json({ message: "Fee record not found." });
    return res.json(fee);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch fee record.", error: err.message });
  }
};

// POST /api/fees/:id/pay   (record a payment / generate digital receipt)
exports.recordPayment = async (req, res) => {
  try {
    const { amount, method, collectedBy } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "A valid payment amount is required." });
    }

    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(404).json({ message: "Fee record not found." });

    const remaining = fee.totalAmount - fee.paidAmount;
    if (amount > remaining) {
      return res.status(400).json({
        message: `Payment exceeds remaining due amount of ${remaining}.`,
      });
    }

    const receiptNo = `RCPT-${Date.now()}`;
    fee.payments.push({ amount, method, collectedBy, receiptNo });
    fee.paidAmount += Number(amount);

    await fee.save(); // pre-save hook recalculates status

    return res.json({ message: "Payment recorded successfully.", receiptNo, fee });
  } catch (err) {
    return res.status(500).json({ message: "Failed to record payment.", error: err.message });
  }
};

// GET /api/fees/dues/list   (all pending/overdue fees - for dashboard)
exports.getDues = async (req, res) => {
  try {
    const dues = await Fee.find({ status: { $in: ["pending", "partial", "overdue"] } })
      .populate("student", "name admissionNo classGrade section guardianPhone")
      .sort({ dueDate: 1 });

    return res.json(dues);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch dues.", error: err.message });
  }
};

// GET /api/fees/stats/summary  (for dashboard)
exports.getFeeStats = async (req, res) => {
  try {
    const result = await Fee.aggregate([
      {
        $group: {
          _id: null,
          totalBilled: { $sum: "$totalAmount" },
          totalCollected: { $sum: "$paidAmount" },
        },
      },
    ]);

    const summary = result[0] || { totalBilled: 0, totalCollected: 0 };
    summary.totalDue = summary.totalBilled - summary.totalCollected;

    const statusBreakdown = await Fee.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    return res.json({ ...summary, statusBreakdown });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch fee stats.", error: err.message });
  }
};
