const express = require('express');
const router = express.Router();
const upload = require("../utils/multer");
const {  getCategory,
  getOneCategory,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/category');

router.get('/category', getCategory);
router.get('/category/:id', getOneCategory);
router.post('/category', upload.array('images', 10), createCategory);
router.put('/category/:id', upload.array('images', 10), updateCategory)
router.delete("/category/:id", deleteCategory)

module.exports = router;
