const express = require('express');
const router = express.Router();
const upload = require("../utils/multer");
const {
  getTeam,
  getOneTeam,
  createTeam,
  updateTeam,
  deleteTeam
} = require('../controllers/team');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');

router.get("/team", getTeam);
router.get("/team/:id", getOneTeam);
router.post("/team", isAuthenticatedUser, authorizeRoles('admin'), upload.array("images", 10), createTeam);
router.put("/team/:id", isAuthenticatedUser, authorizeRoles('admin'), upload.array("images", 10), updateTeam);
router.delete("/team/:id", isAuthenticatedUser, authorizeRoles('admin'), deleteTeam);

module.exports = router; 
