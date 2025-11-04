const express = require('express');
const router = express.Router();
const upload = require("../utils/multer");
const {
  getReviews,  
  getOneReview,
  createReview,
  updateReview,
  deleteReview,
  getMyReviews 
} = require('../controllers/review');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');

router.get("/review", getReviews); 
router.get("/review/:id", getOneReview);
router.get("/reviews/me", isAuthenticatedUser, getMyReviews);
router.post("/review", isAuthenticatedUser, upload.array("images", 10), createReview);
router.put("/review/:id", isAuthenticatedUser, upload.array("images", 10), updateReview);
router.delete("/review/:id", isAuthenticatedUser, deleteReview);

module.exports = router;