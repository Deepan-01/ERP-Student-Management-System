const express = require("express");
const router = express.Router();
const {
  createFee,
  getFees,
  getFeeById,
  recordPayment,
  getDues,
  getFeeStats,
} = require("../controllers/feeController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);

router.get("/stats/summary", authorize("admin"), getFeeStats);
router.get("/dues/list", authorize("admin"), getDues);

router
  .route("/")
  .get(getFees)
  .post(authorize("admin"), createFee);

router.route("/:id").get(getFeeById);

router.post("/:id/pay", authorize("admin"), recordPayment);

module.exports = router;
