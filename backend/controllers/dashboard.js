const Order = require('../models/order');
const Product = require('../models/product');
const User = require('../models/user');
const Review = require('../models/review');

exports.getDashboardStats = async (req, res, next) => {
    try {
        // Get total counts
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();
        const totalUsers = await User.countDocuments();
        const totalReviews = await Review.countDocuments();

        // Get out of stock products
        const outOfStock = await Product.countDocuments({ stock: 0 });

        // Calculate total sales (only delivered orders)
        const deliveredOrders = await Order.find({ orderStatus: 'Delivered' });
        const totalSales = deliveredOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

        // Get order status distribution
        const orderStatusDistribution = await Order.aggregate([
            {
                $group: {
                    _id: '$orderStatus',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalProducts,
                totalOrders,
                totalUsers,
                totalReviews,
                outOfStock,
                totalSales,
                orderStatusDistribution: orderStatusDistribution.map(item => ({
                    status: item._id,
                    count: item.count
                }))
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getYearlySales = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        // Build match query for date filtering and delivered status
        let matchQuery = { orderStatus: 'Delivered' };
        if (startDate || endDate) {
            matchQuery.createdAt = {};
            if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
            if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
        }

        const yearlySales = await Order.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: { $year: '$createdAt' },
                    totalSales: { $sum: '$totalPrice' }
                }
            },
            {
                $sort: { _id: 1 }
            },
            {
                $project: {
                    _id: 0,
                    year: { $toString: '$_id' },
                    sales: '$totalSales'
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: yearlySales
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getMonthlySales = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        // Build query - only delivered orders
        let query = { orderStatus: 'Delivered' };
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        // Get orders
        const orders = await Order.find(query);

        // Group by month
        const monthlyData = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        // Initialize all months
        months.forEach(month => {
            monthlyData[month] = 0;
        });

        // Calculate sales per month
        orders.forEach(order => {
            const date = new Date(order.createdAt);
            const month = months[date.getMonth()];
            monthlyData[month] += order.totalPrice || 0;
        });

        // Convert to array format
        const salesData = months.map(month => ({
            month,
            sales: monthlyData[month]
        }));

        res.status(200).json({
            success: true,
            data: salesData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getMostOrderedProducts = async (req, res, next) => {
    try {
        const { startDate, endDate, limit = 10 } = req.query;

        // Build query
        let query = {};
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        // Get orders
        const orders = await Order.find(query);

        // Count products
        const productCount = {};
        orders.forEach(order => {
            order.orderItems?.forEach(item => {
                const productName = item.name || 'Unknown';
                const productId = item.product?.toString() || 'unknown';
                
                if (!productCount[productId]) {
                    productCount[productId] = {
                        name: productName,
                        units: 0
                    };
                }
                productCount[productId].units += item.quantity || 0;
            });
        });

        // Sort and get top products
        const topProducts = Object.values(productCount)
            .sort((a, b) => b.units - a.units)
            .slice(0, parseInt(limit))
            .map(product => ({
                name: product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name,
                units: product.units
            }));

        res.status(200).json({
            success: true,
            data: topProducts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getCategoryDistribution = async (req, res, next) => {
    try {
        const categoryDistribution = await Product.aggregate([
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'categoryInfo'
                }
            },
            {
                $unwind: {
                    path: '$categoryInfo',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $group: {
                    _id: '$categoryInfo.name',
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    name: { $ifNull: ['$_id', 'Uncategorized'] },
                    value: '$count'
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: categoryDistribution
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getOrderStatusDistribution = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        // Build query
        let query = {};
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const statusDistribution = await Order.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$orderStatus',
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    name: { $ifNull: ['$_id', 'Unknown'] },
                    value: '$count'
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: statusDistribution
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getRevenueByCategory = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        // Build query - only delivered orders
        let query = { orderStatus: 'Delivered' };
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const orders = await Order.find(query).populate({
            path: 'orderItems.product',
            populate: {
                path: 'category',
                model: 'Category'
            }
        });

        const categoryRevenue = {};

        orders.forEach(order => {
            order.orderItems?.forEach(item => {
                const categoryName = item.product?.category?.name || 'Uncategorized';
                const itemTotal = (item.price || 0) * (item.quantity || 0);
                
                if (!categoryRevenue[categoryName]) {
                    categoryRevenue[categoryName] = 0;
                }
                categoryRevenue[categoryName] += itemTotal;
            });
        });

        const revenueData = Object.entries(categoryRevenue).map(([name, revenue]) => ({
            name,
            revenue: parseFloat(revenue.toFixed(2))
        }));

        res.status(200).json({
            success: true,
            data: revenueData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getDailySales = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both startDate and endDate'
            });
        }

        const dailySales = await Order.aggregate([
            {
                $match: {
                    orderStatus: 'Delivered',
                    createdAt: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate)
                    }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    totalSales: { $sum: '$totalPrice' },
                    orderCount: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            },
            {
                $project: {
                    _id: 0,
                    date: '$_id',
                    sales: '$totalSales',
                    orders: '$orderCount'
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: dailySales
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getLowStockProducts = async (req, res, next) => {
    try {
        const { threshold = 10 } = req.query;

        const lowStockProducts = await Product.find({
            stock: { $lte: parseInt(threshold), $gt: 0 }
        })
        .select('name stock category')
        .populate('category', 'name')
        .sort({ stock: 1 })
        .limit(20);

        const formattedData = lowStockProducts.map(product => ({
            name: product.name,
            stock: product.stock,
            category: product.category?.name || 'Uncategorized'
        }));

        res.status(200).json({
            success: true,
            data: formattedData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getAllDashboardData = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        // Get all data in parallel
        const [
            stats,
            monthlySales,
            yearlySales,
            topProducts,
            categoryDistribution,
            orderStatusDistribution
        ] = await Promise.all([
            // Stats
            (async () => {
                const totalProducts = await Product.countDocuments();
                const totalOrders = await Order.countDocuments();
                const totalUsers = await User.countDocuments();
                const outOfStock = await Product.countDocuments({ stock: 0 });
                
                // Only count delivered orders for total sales
                const deliveredOrders = await Order.find({ orderStatus: 'Delivered' });
                const totalSales = deliveredOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
                
                return {
                    totalProducts,
                    totalOrders,
                    totalUsers,
                    outOfStock,
                    totalSales
                };
            })(),
            
            // Monthly Sales
            (async () => {
                let query = { orderStatus: 'Delivered' };
                if (startDate || endDate) {
                    query.createdAt = {};
                    if (startDate) query.createdAt.$gte = new Date(startDate);
                    if (endDate) query.createdAt.$lte = new Date(endDate);
                }
                
                const orders = await Order.find(query);
                const monthlyData = {};
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                
                months.forEach(month => { monthlyData[month] = 0; });
                
                orders.forEach(order => {
                    const date = new Date(order.createdAt);
                    const month = months[date.getMonth()];
                    monthlyData[month] += order.totalPrice || 0;
                });
                
                return months.map(month => ({ month, sales: monthlyData[month] }));
            })(),
            
            // Yearly Sales
            (async () => {
                let matchQuery = { orderStatus: 'Delivered' };
                if (startDate || endDate) {
                    matchQuery.createdAt = {};
                    if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
                    if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
                }

                const yearlySales = await Order.aggregate([
                    { $match: matchQuery },
                    {
                        $group: {
                            _id: { $year: '$createdAt' },
                            totalSales: { $sum: '$totalPrice' }
                        }
                    },
                    {
                        $sort: { _id: 1 }
                    },
                    {
                        $project: {
                            _id: 0,
                            year: { $toString: '$_id' },
                            sales: '$totalSales'
                        }
                    }
                ]);

                return yearlySales;
            })(),
            
            // Top Products
            (async () => {
                let query = {};
                if (startDate || endDate) {
                    query.createdAt = {};
                    if (startDate) query.createdAt.$gte = new Date(startDate);
                    if (endDate) query.createdAt.$lte = new Date(endDate);
                }
                
                const orders = await Order.find(query);
                const productCount = {};
                
                orders.forEach(order => {
                    order.orderItems?.forEach(item => {
                        const productName = item.name || 'Unknown';
                        const productId = item.product?.toString() || 'unknown';
                        
                        if (!productCount[productId]) {
                            productCount[productId] = { name: productName, units: 0 };
                        }
                        productCount[productId].units += item.quantity || 0;
                    });
                });
                
                return Object.values(productCount)
                    .sort((a, b) => b.units - a.units)
                    .slice(0, 10)
                    .map(p => ({
                        name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
                        units: p.units
                    }));
            })(),
            
            // Category Distribution
            Product.aggregate([
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'category',
                        foreignField: '_id',
                        as: 'categoryInfo'
                    }
                },
                {
                    $unwind: {
                        path: '$categoryInfo',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $group: {
                        _id: '$categoryInfo.name',
                        count: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        name: { $ifNull: ['$_id', 'Uncategorized'] },
                        value: '$count'
                    }
                }
            ]),
            
            // Order Status Distribution
            (async () => {
                let query = {};
                if (startDate || endDate) {
                    query.createdAt = {};
                    if (startDate) query.createdAt.$gte = new Date(startDate);
                    if (endDate) query.createdAt.$lte = new Date(endDate);
                }
                
                return await Order.aggregate([
                    { $match: query },
                    {
                        $group: {
                            _id: '$orderStatus',
                            count: { $sum: 1 }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            name: { $ifNull: ['$_id', 'Unknown'] },
                            value: '$count'
                        }
                    }
                ]);
            })()
        ]);

        res.status(200).json({
            success: true,
            data: {
                stats,
                monthlySales,
                yearlySales,
                topProducts,
                categoryDistribution,
                orderStatusDistribution
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};