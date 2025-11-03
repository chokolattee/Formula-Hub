const Order = require('../models/order');
const Product = require('../models/product');

exports.newOrder = async (req, res, next) => {
    try {
        const {
            orderItems,
            shippingInfo,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            paymentInfo
        } = req.body;

        // Validate stock availability for all items before creating order
        for (const item of orderItems) {
            const product = await Product.findById(item.product);
            
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product not found: ${item.name}`
                });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
                });
            }
        }

        // Create the order
        const order = await Order.create({
            orderItems,
            shippingInfo,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            paymentInfo,
            paidAt: Date.now(),
            user: req.user._id
        });

        // Update stock for each item after order is created
        for (const item of orderItems) {
            await updateStock(item.product, item.quantity);
        }

        res.status(200).json({
            success: true,
            order
        });

    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error creating order'
        });
    }
};

exports.myOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({ user: req.user.id });
        
        res.status(200).json({
            success: true,
            orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getSingleOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'name email');
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'No Order found with this ID'
            });
        }
        
        res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.allOrders = async (req, res, next) => {
    try {
        const orders = await Order.find();
        
        let totalAmount = 0;
        orders.forEach(order => {
            totalAmount += order.totalPrice;
        });

        res.status(200).json({
            success: true,
            totalAmount,
            orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.deleteOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(400).json({
                success: false,
                message: 'No Order found with this ID'
            });
        }

        // Optional: Restore stock when order is deleted
        // Only if order status is not "Delivered"
        if (order.orderStatus !== 'Delivered') {
            for (const item of order.orderItems) {
                await restoreStock(item.product, item.quantity);
            }
        }

        await Order.findByIdAndDelete(req.params.id);

        return res.status(200).json({
            success: true,
            message: 'Order deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.updateOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'No Order found with this ID'
            });
        }

        if (order.orderStatus === 'Delivered') {
            return res.status(400).json({
                success: false,
                message: 'You have already delivered this order'
            });
        }

        // Update order status
        order.orderStatus = req.body.status;
        
        // Set delivered date if status is "Delivered"
        if (req.body.status === 'Delivered') {
            order.deliveredAt = Date.now();
        }

        await order.save();

        res.status(200).json({
            success: true,
            message: 'Order updated successfully',
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Helper function to update stock (decrease)
async function updateStock(id, quantity) {
    const product = await Product.findById(id);

    if (!product) {
        throw new Error(`Product with ID ${id} not found`);
    }

    product.stock = product.stock - quantity;

    await product.save({ validateBeforeSave: false });
}

// Helper function to restore stock (increase) - for order cancellation
async function restoreStock(id, quantity) {
    const product = await Product.findById(id);

    if (!product) {
        throw new Error(`Product with ID ${id} not found`);
    }

    product.stock = product.stock + quantity;

    await product.save({ validateBeforeSave: false });
}