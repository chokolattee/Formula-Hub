const express = require('express');
const router = express.Router();

const {
    getDashboardStats,
    getMonthlySales,
    getMostOrderedProducts,
    getCategoryDistribution,
    getOrderStatusDistribution,
    getRevenueByCategory,
    getDailySales,
    getTopCustomers,
    getLowStockProducts,
    getAllDashboardData
} = require('../controllers/dashboard');

const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');

router.get('/admin/dashboard', isAuthenticatedUser, authorizeRoles('admin'), getAllDashboardData);

router.get('/admin/dashboard/stats', isAuthenticatedUser, authorizeRoles('admin'), getDashboardStats);
router.get('/admin/dashboard/sales', isAuthenticatedUser, authorizeRoles('admin'), getMonthlySales);
router.get('/admin/dashboard/products/top', isAuthenticatedUser, authorizeRoles('admin'), getMostOrderedProducts);
router.get('/admin/dashboard/categories/distribution', isAuthenticatedUser, authorizeRoles('admin'), getCategoryDistribution);
router.get('/admin/dashboard/orders/status', isAuthenticatedUser, authorizeRoles('admin'), getOrderStatusDistribution);
router.get('/admin/dashboard/revenue/category', isAuthenticatedUser, authorizeRoles('admin'), getRevenueByCategory);
router.get('/admin/dashboard/sales/daily', isAuthenticatedUser, authorizeRoles('admin'), getDailySales);
router.get('/admin/dashboard/customers/top', isAuthenticatedUser, authorizeRoles('admin'), getTopCustomers);
router.get('/admin/dashboard/products/low-stock', isAuthenticatedUser, authorizeRoles('admin'), getLowStockProducts);

module.exports = router;
