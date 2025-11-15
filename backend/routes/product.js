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
  getProductDetails,
  getProductByCategory,
  getProductByPrice,
  getProductByMultipleFilters,
  getProductByRating,
  searchProduct,
} = require('../controllers/product');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');

router.get('/product/all', getAllProduct);
router.get('/product', getProduct);
router.post('/product', isAuthenticatedUser, authorizeRoles('admin'), upload.array('images', 10), createProduct);
router.get('/product/:id', getOneProduct);
router.put('/product/:id', isAuthenticatedUser, authorizeRoles('admin'), upload.array('images', 10), updateProduct);
router.delete('/product/:id', isAuthenticatedUser, authorizeRoles('admin'), deleteProduct);
router.get('/getproduct/:id', getProductDetails);
router.get('/search/:keyword', searchProduct);

//filters
router.get('/category/:categoryId', getProductByCategory);
router.get('/price', getProductByPrice);
router.get('/rating', getProductByRating);
router.get('/search', getProductByMultipleFilters);

module.exports = router;

