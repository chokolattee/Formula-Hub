const express = require('express');
const router = express.Router();
const upload = require("../utils/multer");
const {
  getReviews,  
  getOneReview,
  createReview,
  updateReview,
  deleteReview,
  getMyReviews, 
  deleteMyReview,
  getProductReviews
} = require('../controllers/review');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');

router.get("/review", getReviews); 
router.get('/review/product', isAuthenticatedUser, authorizeRoles('admin'), getProductReviews);
router.delete('/review', isAuthenticatedUser, authorizeRoles('admin'), deleteReview);
router.get("/review/:id", getOneReview);
router.get("/reviews/me", isAuthenticatedUser, getMyReviews);
router.post("/review", isAuthenticatedUser, upload.array("images", 10), createReview);
router.put("/review/:id", isAuthenticatedUser, upload.array("images", 10), updateReview);
router.delete("/review/:id", isAuthenticatedUser, deleteMyReview);
router.delete("/admin/review/:id", isAuthenticatedUser, authorizeRoles("admin"), deleteReview);

module.exports = router;