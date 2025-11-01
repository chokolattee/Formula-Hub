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

router.get("/team", getTeam);
router.get("/team/:id", getOneTeam);
router.post("/team", upload.array("images", 10), createTeam);
router.put("/team/:id", upload.array("images", 10), updateTeam);
router.delete("/team/:id", deleteTeam);

module.exports = router; 
