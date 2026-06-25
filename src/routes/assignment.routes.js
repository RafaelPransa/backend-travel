const express = require("express");
const router = express.Router();
const assignmentController = require("../controllers/assignment.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");

// GET /api/admin/assignments/pending
router.get("/pending", authenticate, authorize("super_admin"), assignmentController.getPendingAssignments);

// GET /api/admin/assignments/available-fleets
router.get("/available-fleets", authenticate, authorize("super_admin"), assignmentController.getAvailableReplacementFleets);

// PUT /api/admin/assignments/:type/:id/assign
router.put("/:type/:id/assign", authenticate, authorize("super_admin"), assignmentController.assignDriver);

module.exports = router;

