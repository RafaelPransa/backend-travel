const express = require("express");
const router = express.Router();
const assignmentController = require("../controllers/assignment.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");

// GET /api/admin/assignments
router.get("/", authenticate, authorize("super_admin"), assignmentController.getAssignments);

// GET /api/admin/assignments/available-fleets
router.get("/available-fleets", authenticate, authorize("super_admin"), assignmentController.getAvailableReplacementFleets);

// PUT /api/admin/assignments/:type/:id/assign
router.put("/:type/:id/assign", authenticate, authorize("super_admin"), assignmentController.assignDriver);

// PUT /api/admin/assignments/:type/:id/change-fleet
router.put("/:type/:id/change-fleet", authenticate, authorize("super_admin"), assignmentController.changeFleet);

// PUT /api/admin/assignments/:type/:id/reject
router.put("/:type/:id/reject", authenticate, authorize("super_admin"), assignmentController.rejectAssignment);

// PUT /api/admin/assignments/:type/:id/unassign
router.put("/:type/:id/unassign", authenticate, authorize("super_admin"), assignmentController.unassignDriver);

module.exports = router;
