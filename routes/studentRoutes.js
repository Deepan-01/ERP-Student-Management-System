const express = require("express");
const router = express.Router();
const {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getStudentStats,
} = require("../controllers/studentController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect); // all student routes require login

router.get("/stats/summary", getStudentStats);

router
  .route("/")
  .get(getStudents) // any logged-in role can view (frontend further restricts what's shown)
  .post(authorize("admin"), createStudent);

router
  .route("/:id")
  .get(getStudentById)
  .put(authorize("admin", "teacher"), updateStudent)
  .delete(authorize("admin"), deleteStudent);

module.exports = router;
