const express = require('express');
const router = express.Router();
const upload = require("../utils/multer");
const {
  getAllProduct,
  getProduct,
  getOneProduct,
  createProduct,
  updateProduct,
  deleteProduct, 
  getProductDetails
} = require('../controllers/product');

router.get('/product/all', getAllProduct);
router.get('/product', getProduct);
router.post('/product', upload.array('images', 10), createProduct);
router.get('/product/:id', getOneProduct);
router.put('/product/:id', upload.array('images', 10), updateProduct);
router.delete('/product/:id', deleteProduct);
router.get('/getproduct/:id', getProductDetails);


module.exports = router;

