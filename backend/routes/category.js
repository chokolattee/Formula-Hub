const express = require('express');
const router = express.Router();
const upload = require("../utils/multer");
const {  getCategory,
  getOneCategory,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/category');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');

router.get('/category', getCategory);
router.get('/admin/category/:id', isAuthenticatedUser, authorizeRoles('admin'), getOneCategory);
router.post('/category', isAuthenticatedUser, authorizeRoles('admin'), upload.array('images', 10), createCategory);
router.put('/category/:id', isAuthenticatedUser, authorizeRoles('admin'), upload.array('images', 10), updateCategory)
router.delete("/category/:id", isAuthenticatedUser, authorizeRoles('admin'), deleteCategory)

module.exports = router;