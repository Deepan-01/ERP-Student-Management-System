const express = require("express");
const router = express.Router();
const {
  markAttendance,
  markBulkAttendance,
  getAttendance,
  getStudentAttendanceSummary,
  getTodayStats,
} = require("../controllers/attendanceController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);

router.get("/stats/today", getTodayStats);
router.get("/student/:studentId/summary", getStudentAttendanceSummary);

router
  .route("/")
  .get(getAttendance)
  .post(authorize("admin", "teacher"), markAttendance);

router.post("/bulk", authorize("admin", "teacher"), markBulkAttendance);

module.exports = router;
