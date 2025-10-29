const express = require('express')
const router = express.Router();

const { newOrder,
	myOrders,
	getSingleOrder,
	allOrders,
	deleteOrder,
	updateOrder,
		

	} = require('../controllers/order')
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth')

router.route('/order/new').post(isAuthenticatedUser, newOrder);
router.get('/orders/me', isAuthenticatedUser, myOrders);
router.get('/order/:id', isAuthenticatedUser, getSingleOrder);
router.get('/admin/orders/', isAuthenticatedUser, allOrders);
router.route('/admin/order/:id').put(isAuthenticatedUser, updateOrder).delete(isAuthenticatedUser, deleteOrder);
// router.route('/admin/order/:id').delete(isAuthenticatedUser, deleteOrder);

module.exports = router;