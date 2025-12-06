const Order = require('../models/order');
const Product = require('../models/product');
const sendEmail = require('../utils/sendEmail');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

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

        for (const item of orderItems) {
            await updateStock(item.product, item.quantity);
        }

        await order.populate('user', 'name email first_name last_name');

        // Send order confirmation email 
        let pdfPath = null;
        try {
            pdfPath = await generatePDFReceipt(order);
            console.log(`PDF ready for email attachment: ${pdfPath}`);

            if (!fs.existsSync(pdfPath)) {
                throw new Error('PDF file was not created successfully');
            }

            const emailHTML = getOrderStatusEmailTemplate(order, null);

            await sendEmail({
                email: order.user.email,
                subject: `Order Confirmation - Order #${order._id}`,
                html: emailHTML,
                attachments: [{
                    filename: `receipt-${order._id.toString().slice(-8).toUpperCase()}.pdf`,
                    path: pdfPath,
                    contentType: 'application/pdf'
                }]
            });

            console.log(`Order confirmation email with PDF sent to ${order.user.email}`);

        } catch (emailError) {
            console.error('Failed to send order confirmation email:', emailError);
            console.error('Email error details:', {
                message: emailError.message,
                stack: emailError.stack,
                pdfPath: pdfPath
            });
        } finally {
            if (pdfPath && fs.existsSync(pdfPath)) {
                try {
                    fs.unlinkSync(pdfPath);
                    console.log(`Cleaned up PDF file: ${pdfPath}`);
                } catch (cleanupError) {
                    console.error('Failed to clean up PDF:', cleanupError);
                }
            }
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
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email first_name last_name');

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
        const orders = await Order.find()
            .populate('user', 'name email first_name last_name')
            .sort({ createdAt: -1 });

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

        // Restore stock when order is deleted if not delivered or cancelled
        if (order.orderStatus !== 'Delivered' && order.orderStatus !== 'Cancelled') {
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
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email first_name last_name');

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

        if (order.orderStatus === 'Cancelled') {
            return res.status(400).json({
                success: false,
                message: 'This order has already been cancelled'
            });
        }

        const previousStatus = order.orderStatus;
        const newStatus = req.body.status;

        if (newStatus === 'Cancelled' && previousStatus !== 'Cancelled') {
            for (const item of order.orderItems) {
                await restoreStock(item.product, item.quantity);
            }
            console.log(`Stock restored for cancelled order ${order._id}`);
        }

        order.orderStatus = newStatus;
        order.updatedAt = Date.now();

        await order.save();

        // Send status update email
        let pdfPath = null;
        try {
            pdfPath = await generatePDFReceipt(order);
            console.log(`PDF ready for email attachment: ${pdfPath}`);

            if (!fs.existsSync(pdfPath)) {
                throw new Error('PDF file was not created successfully');
            }

            const emailHTML = getOrderStatusEmailTemplate(order, previousStatus);

            // Send email with attachment
            await sendEmail({
                email: order.user.email,
                subject: `Order Status Update - Order #${order._id}`,
                html: emailHTML,
                attachments: [{
                    filename: `receipt-${order._id}.pdf`,
                    path: pdfPath,
                    contentType: 'application/pdf'
                }]
            });

            console.log(`Status update email with PDF sent to ${order.user.email} for order ${order._id}`);

        } catch (emailError) {
            console.error('Failed to send status update email:', emailError);
            console.error('Email error details:', {
                message: emailError.message,
                stack: emailError.stack,
                pdfPath: pdfPath
            });
        } finally {
            if (pdfPath && fs.existsSync(pdfPath)) {
                try {
                    fs.unlinkSync(pdfPath);
                    console.log(`Cleaned up PDF file: ${pdfPath}`);
                } catch (cleanupError) {
                    console.error('Failed to clean up PDF:', cleanupError);
                }
            }
        }

        res.status(200).json({
            success: true,
            message: 'Order updated successfully. Customer notification email has been sent.',
            order
        });
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.cancelOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate("user", "name email first_name last_name");

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "No Order found with this ID"
            });
        }

        if (order.orderStatus === "Cancelled") {
            return res.status(400).json({
                success: false,
                message: "This order has already been cancelled"
            });
        }

        const previousStatus = order.orderStatus;

        for (const item of order.orderItems) {
            await restoreStock(item.product, item.quantity);
        }

        order.orderStatus = "Cancelled";
        order.updatedAt = Date.now();
        await order.save();

        let pdfPath = null;
        try {
            pdfPath = await generatePDFReceipt(order);
            console.log(`PDF ready for email attachment: ${pdfPath}`);

            if (!fs.existsSync(pdfPath)) {
                throw new Error('PDF file was not created successfully');
            }

            const emailHTML = getOrderStatusEmailTemplate(order, previousStatus);

            await sendEmail({
                email: order.user.email,
                subject: `Order Cancelled - #${order._id}`,
                html: emailHTML,
                attachments: [{
                    filename: `receipt-${order._id}.pdf`,
                    path: pdfPath,
                    contentType: 'application/pdf'
                }]
            });

            console.log(`Cancellation email with PDF sent to ${order.user.email}`);

        } catch (emailError) {
            console.error("Failed to send cancellation email:", emailError);
            console.error('Email error details:', {
                message: emailError.message,
                stack: emailError.stack,
                pdfPath: pdfPath
            });
        } finally {
            if (pdfPath && fs.existsSync(pdfPath)) {
                try {
                    fs.unlinkSync(pdfPath);
                    console.log(`Cleaned up PDF file: ${pdfPath}`);
                } catch (cleanupError) {
                    console.error('Failed to clean up PDF:', cleanupError);
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: "Order cancelled & stock restored. Email sent.",
            order
        });

    } catch (error) {
        console.error("Cancel order error:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

async function generatePDFReceipt(order) {
    return new Promise((resolve, reject) => {
        try {
            const tempDir = path.join(__dirname, '..', 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const pdfPath = path.join(tempDir, `receipt-${order._id}.pdf`);
            const doc = new PDFDocument({ margin: 50 });
            const stream = fs.createWriteStream(pdfPath);

            doc.pipe(stream);

            // F1 Theme Colors
            const F1_RED = '#DC0000';
            const F1_DARK_RED = '#A00000';
            const F1_BLACK = '#15151E';
            const F1_DARK_GRAY = '#2A2A2A';
            const F1_LIGHT_GRAY = '#E5E5E5';
            const F1_WHITE = '#FFFFFF';
            const F1_ACCENT = '#FFD700';

            // Get customer name
            let customerName = 'Valued Customer';
            if (order.user.first_name) {
                customerName = order.user.last_name
                    ? `${order.user.first_name} ${order.user.last_name}`.trim()
                    : order.user.first_name;
            } else if (order.user.name) {
                customerName = order.user.name;
            }

            // Header with F1 Racing Style
            // Red racing stripe at top
            doc.rect(0, 0, 612, 15).fill(F1_RED);
            doc.rect(0, 15, 612, 5).fill(F1_ACCENT);

            doc.moveDown(1);

            // Company Name - Bold F1 Style
            doc.fontSize(32)
                .fillColor(F1_RED)
                .font('Helvetica-Bold')
                .text('FORMULAHUB', { align: 'center' });

            doc.moveDown(0.3);

            // Subtitle with accent
            doc.fontSize(10)
                .fillColor(F1_DARK_GRAY)
                .font('Helvetica')
                .text('PERFORMANCE • PRECISION • EXCELLENCE', { align: 'center' });

            doc.moveDown(0.5);

            // Order Receipt Title
            doc.fontSize(22)
                .fillColor(F1_BLACK)
                .font('Helvetica-Bold')
                .text('ORDER RECEIPT', { align: 'center' });

            doc.moveDown(0.3);

            // Order ID with racing number style
            doc.fontSize(12)
                .fillColor(F1_DARK_GRAY)
                .font('Helvetica')
                .text(`ORDER #${order._id.toString().slice(-8).toUpperCase()}`, { align: 'center' });

            doc.moveDown(1.5);

            // Racing-style divider line
            doc.moveTo(50, doc.y)
                .lineTo(562, doc.y)
                .lineWidth(3)
                .strokeColor(F1_RED)
                .stroke();

            doc.moveDown(0.5);

            // Order Status Badge - Racing Flag Style
            const statusColors = {
                'Processing': F1_ACCENT,
                'Shipped': '#2196f3',
                'Delivered': '#4caf50',
                'Cancelled': F1_DARK_RED
            };
            const statusColor = statusColors[order.orderStatus] || F1_DARK_GRAY;

            // Status box background
            const statusY = doc.y;
            doc.roundedRect(200, statusY, 212, 35, 5)
                .fill(statusColor);

            // Status text
            doc.fontSize(16)
                .fillColor(F1_WHITE)
                .font('Helvetica-Bold')
                .text(`STATUS: ${order.orderStatus.toUpperCase()}`, 200, statusY + 10, {
                    width: 212,
                    align: 'center'
                });

            doc.moveDown(3);

            // Order Information Section
            doc.fontSize(16)
                .fillColor(F1_RED)
                .font('Helvetica-Bold')
                .text('ORDER INFORMATION', { underline: true });

            doc.moveDown(0.5);

            doc.fontSize(10)
                .fillColor(F1_BLACK)
                .font('Helvetica');

            doc.text(`Order Date: ${new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })}`);

            // Payment status with colored indicator
            const paymentPaid = order.paymentInfo?.status === 'succeeded';
            doc.text('Payment Status: ', { continued: true })
                .fillColor(paymentPaid ? '#4caf50' : F1_DARK_RED)
                .font('Helvetica-Bold')
                .text(paymentPaid ? 'PAID ✓' : 'NOT PAID')
                .fillColor(F1_BLACK)
                .font('Helvetica');

            doc.text('Updated At: ' + (order.updatedAt ?
                new Date(order.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }) : 'N/A'));

            doc.moveDown(1.5);

            // Shipping Information with racing border
            doc.fontSize(16)
                .fillColor(F1_RED)
                .font('Helvetica-Bold')
                .text('SHIPPING ADDRESS', { underline: true });

            doc.moveDown(0.5);

            // Address box with F1 styling
            const addressY = doc.y;
            doc.roundedRect(50, addressY, 512, 100, 5)
                .lineWidth(2)
                .strokeColor(F1_LIGHT_GRAY)
                .stroke();

            // Red accent stripe on left
            doc.rect(50, addressY, 5, 100)
                .fill(F1_RED);

            doc.fontSize(11)
                .fillColor(F1_BLACK)
                .font('Helvetica-Bold')
                .text(customerName, 65, addressY + 15);

            doc.fontSize(10)
                .fillColor(F1_DARK_GRAY)
                .font('Helvetica')
                .text(order.shippingInfo.address, 65, addressY + 32)
                .text(`${order.shippingInfo.city}, ${order.shippingInfo.postalCode}`, 65, addressY + 47)
                .text(order.shippingInfo.country, 65, addressY + 62)
                .fillColor(F1_RED)
                .text(`Phone: ${order.shippingInfo.phoneNo}`, 65, addressY + 77);

            doc.moveDown(7);

            // Order Items Table with Racing Grid Style
            doc.fontSize(16)
                .fillColor(F1_RED)
                .font('Helvetica-Bold')
                .text('ORDER ITEMS', { underline: true });

            doc.moveDown(0.5);

            // Table Header with F1 Red background
            const tableTop = doc.y;
            doc.rect(50, tableTop, 512, 25)
                .fill(F1_BLACK);

            doc.fontSize(10)
                .fillColor(F1_WHITE)
                .font('Helvetica-Bold');

            doc.text('PRODUCT', 60, tableTop + 8, { width: 250 });
            doc.text('QTY', 310, tableTop + 8, { width: 40, align: 'center' });
            doc.text('PRICE', 360, tableTop + 8, { width: 80, align: 'right' });
            doc.text('SUBTOTAL', 450, tableTop + 8, { width: 100, align: 'right' });

            let yPosition = tableTop + 35;

            // Table Items with alternating background
            doc.fontSize(9).font('Helvetica');
            order.orderItems.forEach((item, index) => {
                // Alternating row background
                if (index % 2 === 0) {
                    doc.rect(50, yPosition - 5, 512, 25)
                        .fill(F1_LIGHT_GRAY);
                }

                doc.fillColor(F1_BLACK)
                    .text(item.name, 60, yPosition, { width: 240 });

                doc.fillColor(F1_DARK_GRAY)
                    .text(item.quantity.toString(), 310, yPosition, { width: 40, align: 'center' });

                doc.text(`PHP ${item.price.toFixed(2)}`, 360, yPosition, { width: 80, align: 'right' });

                doc.fillColor(F1_BLACK)
                    .font('Helvetica-Bold')
                    .text(`PHP ${(item.price * item.quantity).toFixed(2)}`, 450, yPosition, { width: 100, align: 'right' })
                    .font('Helvetica');

                yPosition += 25;

                // Add new page if needed - with more conservative threshold
                if (yPosition > 650) { // Changed from 700 to 650 to give more space
                    doc.addPage();
                    yPosition = 50;
                    
                    // Add header for new page
                    doc.fontSize(10)
                        .fillColor(F1_DARK_GRAY)
                        .font('Helvetica')
                        .text(`Order #${order._id.toString().slice(-8).toUpperCase()} - Continued`, 50, 30);
                }
            });

            // Racing stripe divider
            doc.moveTo(50, yPosition)
                .lineTo(562, yPosition)
                .lineWidth(2)
                .strokeColor(F1_RED)
                .stroke();

            yPosition += 20;

            // Check if we need a new page for the totals section
            if (yPosition > 600) { // If we're too close to the bottom, start new page
                doc.addPage();
                yPosition = 50;
                
                // Add header for new page
                doc.fontSize(10)
                    .fillColor(F1_DARK_GRAY)
                    .font('Helvetica')
                    .text(`Order #${order._id.toString().slice(-8).toUpperCase()} - Totals`, 50, 30);
            }

            // Totals Section with F1 Styling
            doc.fontSize(10)
                .fillColor(F1_DARK_GRAY)
                .font('Helvetica');

            doc.text('Items Subtotal:', 360, yPosition, { width: 80, align: 'right' });
            doc.fillColor(F1_BLACK)
                .font('Helvetica-Bold')
                .text(`PHP ${order.itemsPrice.toFixed(2)}`, 450, yPosition, { width: 100, align: 'right' });
            yPosition += 20;

            doc.fillColor(F1_DARK_GRAY)
                .font('Helvetica')
                .text('Tax:', 360, yPosition, { width: 80, align: 'right' });
            doc.fillColor(F1_BLACK)
                .font('Helvetica-Bold')
                .text(`PHP ${order.taxPrice.toFixed(2)}`, 450, yPosition, { width: 100, align: 'right' });
            yPosition += 20;

            doc.fillColor(F1_DARK_GRAY)
                .font('Helvetica')
                .text('Shipping:', 360, yPosition, { width: 80, align: 'right' });
            doc.fillColor(F1_BLACK)
                .font('Helvetica-Bold')
                .text(`PHP ${order.shippingPrice.toFixed(2)}`, 450, yPosition, { width: 100, align: 'right' });
            yPosition += 20;

            // Grand total racing box - ensure we have enough space
            if (yPosition > 700) { // If not enough space for grand total, start new page
                doc.addPage();
                yPosition = 50;
            }

            // Grand total racing box
            doc.roundedRect(350, yPosition, 200, 40, 5)
                .fill(F1_RED);

            doc.fontSize(12)
                .fillColor(F1_WHITE)
                .font('Helvetica-Bold')
                .text('GRAND TOTAL:', 360, yPosition + 8, { width: 80, align: 'right' });

            doc.fontSize(16)
                .fillColor(F1_ACCENT)
                .text(`Php ${order.totalPrice.toFixed(2)}`, 450, yPosition + 8, { width: 90, align: 'right' });

            yPosition += 60; // Space after grand total

            // Footer with racing stripes - ensure footer is on same page
            const footerY = Math.max(yPosition, 700); // Ensure footer is at bottom
            
            // Racing stripes at bottom
            doc.rect(0, footerY, 612, 5).fill(F1_ACCENT);
            doc.rect(0, footerY + 5, 612, 15).fill(F1_RED);

            doc.fontSize(8)
                .fillColor(F1_DARK_GRAY)
                .font('Helvetica')
                .text(
                    `© ${new Date().getFullYear()} FormulaHub. All rights reserved. | Questions? Contact: formulahub@support.com`,
                    50,
                    footerY - 20,
                    { align: 'center', width: 512 }
                );

            doc.end();

            stream.on('finish', () => {
                console.log(`PDF generated successfully at: ${pdfPath}`);
                resolve(pdfPath);
            });

            stream.on('error', (error) => {
                console.error('Stream error:', error);
                reject(error);
            });

        } catch (error) {
            console.error('PDF generation error:', error);
            reject(error);
        }
    });
}

const getOrderStatusEmailTemplate = (order, previousStatus) => {
    const statusColors = {
        'Processing': { bg: '#ff9800', light: '#fff3e0' },
        'Shipped': { bg: '#2196f3', light: '#e3f2fd' },
        'Delivered': { bg: '#4caf50', light: '#e8f5e9' },
        'Cancelled': { bg: '#f44336', light: '#ffebee' }
    };

    const statusIcons = {
        'Processing': '⏳',
        'Shipped': '📦',
        'Delivered': '✅',
        'Cancelled': '❌'
    };

    const statusColor = statusColors[order.orderStatus] || { bg: '#757575', light: '#f5f5f5' };
    const statusIcon = statusIcons[order.orderStatus] || '📋';

    let customerName = 'Valued Customer';

    if (order.user.first_name) {
        customerName = order.user.last_name
            ? `${order.user.first_name} ${order.user.last_name}`.trim()
            : order.user.first_name;
    } else if (order.user.name) {
        customerName = order.user.name;
    }

    // Generate order items HTML
    const orderItemsHTML = order.orderItems.map(item => `
        <tr>
            <td style="padding: 15px; border-bottom: 1px solid #eee;">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <img src="${item.image}" alt="${item.name}" 
                         style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; border: 1px solid #eee;">
                    <div>
                        <div style="font-weight: 600; color: #333; margin-bottom: 5px;">${item.name}</div>
                        <div style="color: #666; font-size: 14px;">Quantity: ${item.quantity} × ₱${item.price.toFixed(2)}</div>
                    </div>
                </div>
            </td>
            <td style="padding: 15px; text-align: right; border-bottom: 1px solid #eee;">
                <div style="font-weight: 700; color: #d32f2f; font-size: 16px;">₱${(item.price * item.quantity).toFixed(2)}</div>
            </td>
        </tr>
    `).join('');

    // Status message based on order status
    let statusMessage = '';
    if (order.orderStatus === 'Delivered') {
        statusMessage = `
            <div style="background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%); padding: 25px; border-radius: 12px; text-align: center; margin: 30px 0;">
                <div style="font-size: 48px; margin-bottom: 15px;">🎉</div>
                <h2 style="margin: 0 0 10px 0; color: #ffffff; font-size: 24px;">Your Order Is Being Processed</h2>
                <p style="margin: 0; color: #ffffff; font-size: 16px; opacity: 0.95;">
                    We're preparing your order. You'll be notified when it ships!
                </p>
            </div>
        `;
    }

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Status Updated</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%); padding: 40px 30px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Order Status Updated</h1>
                <p style="margin: 10px 0 0 0; color: #ffcdd2; font-size: 16px;">Hi ${customerName}, your order has been updated</p>
            </div>

            <!-- Status Badge -->
            <div style="padding: 30px 30px 0 30px; text-align: center;">
                <div style="display: inline-block; background-color: ${statusColor.bg}; color: #ffffff; padding: 15px 35px; border-radius: 30px; font-weight: 700; font-size: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                    ${statusIcon} ${order.orderStatus}
                </div>
                ${previousStatus ? `
                <p style="margin: 15px 0 0 0; color: #666; font-size: 14px;">
                    Previous status: <span style="color: #999; text-decoration: line-through;">${previousStatus}</span>
                </p>
                ` : ''}
            </div>

            ${statusMessage}

            <!-- PDF Attachment Notice -->
            <div style="padding: 0 30px 20px 30px;">
                <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; border-radius: 8px;">
                    <p style="margin: 0; color: #1565c0; font-size: 14px;">
                        📎 <strong>Receipt Attached:</strong> Your order receipt is attached as a PDF file to this email.
                    </p>
                </div>
            </div>

            <!-- Order Details Card -->
            <div style="padding: 0 30px 30px 30px;">
                <div style="background-color: #fafafa; padding: 20px; border-radius: 10px; border: 1px solid #eee;">
                    <h2 style="margin: 0 0 20px 0; color: #333; font-size: 18px; font-weight: 700;">📋 Order Information</h2>
                    
                    <table width="100%" cellpadding="8" cellspacing="0">
                        <tr>
                            <td style="color: #666; font-size: 14px; padding: 8px 0;">Order ID:</td>
                            <td style="text-align: right; color: #333; font-weight: 600; font-family: monospace; padding: 8px 0;">
                                #${order._id.toString().slice(-8).toUpperCase()}
                            </td>
                        </tr>
                        <tr>
                            <td style="color: #666; font-size: 14px; padding: 8px 0;">Order Date:</td>
                            <td style="text-align: right; color: #333; font-weight: 600; padding: 8px 0;">
                                ${new Date(order.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })}
                            </td>
                        </tr>
                        <tr>
                            <td style="color: #666; font-size: 14px; padding: 8px 0;">Payment Status:</td>
                            <td style="text-align: right; padding: 8px 0;">
                                <span style="background-color: ${order.paymentInfo?.status === 'succeeded' ? '#4caf50' : '#f44336'}; color: #ffffff; padding: 5px 12px; border-radius: 15px; font-size: 12px; font-weight: 600;">
                                    ${order.paymentInfo?.status === 'succeeded' ? '✓ PAID' : '✗ NOT PAID'}
                                </span>
                            </td>
                        </tr>
                    </table>
                </div>
            </div>

            <!-- Shipping Address -->
            <div style="padding: 0 30px 30px 30px;">
                <h2 style="margin: 0 0 15px 0; color: #333; font-size: 18px; font-weight: 700; display: flex; align-items: center;">
                    📍 Shipping Address
                </h2>
                <div style="background-color: #fafafa; padding: 20px; border-radius: 10px; border: 1px solid #eee;">
                    <p style="margin: 0; color: #333; line-height: 1.8; font-size: 14px;">
                        <strong style="color: #000; font-size: 16px;">${customerName}</strong><br>
                        ${order.shippingInfo.address}<br>
                        ${order.shippingInfo.city}, ${order.shippingInfo.postalCode}<br>
                        ${order.shippingInfo.country}<br>
                        📞 ${order.shippingInfo.phoneNo}
                    </p>
                </div>
            </div>

            <!-- Order Items -->
            <div style="padding: 0 30px 30px 30px;">
                <h2 style="margin: 0 0 15px 0; color: #333; font-size: 18px; font-weight: 700;">🛍️ Order Items</h2>
                <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
                    <thead>
                        <tr style="background-color: #fafafa;">
                            <th style="padding: 12px 15px; text-align: left; color: #666; font-weight: 600; font-size: 14px; border-bottom: 2px solid #eee;">Product</th>
                            <th style="padding: 12px 15px; text-align: right; color: #666; font-weight: 600; font-size: 14px; border-bottom: 2px solid #eee;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orderItemsHTML}
                    </tbody>
                </table>
            </div>

            <!-- Order Summary -->
            <div style="padding: 0 30px 30px 30px;">
                <div style="background-color: #fafafa; border-radius: 10px; padding: 20px; border: 1px solid #eee;">
                    <table width="100%" cellpadding="8" cellspacing="0">
                        <tr>
                            <td style="color: #666; font-size: 15px;">Items Subtotal:</td>
                            <td style="text-align: right; color: #333; font-weight: 600; font-size: 15px;">₱${order.itemsPrice.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td style="color: #666; font-size: 15px;">Tax:</td>
                            <td style="text-align: right; color: #333; font-weight: 600; font-size: 15px;">₱${order.taxPrice.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td style="color: #666; font-size: 15px;">Shipping:</td>
                            <td style="text-align: right; color: #333; font-weight: 600; font-size: 15px;">₱${order.shippingPrice.toFixed(2)}</td>
                        </tr>
                        <tr style="border-top: 2px solid #d32f2f;">
                            <td style="color: #000; font-size: 18px; font-weight: 700; padding-top: 15px;">Grand Total:</td>
                            <td style="text-align: right; color: #d32f2f; font-size: 24px; font-weight: 700; padding-top: 15px;">₱${order.totalPrice.toFixed(2)}</td>
                        </tr>
                    </table>
                </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #fafafa; padding: 30px; text-align: center; border-top: 1px solid #eee;">
                <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                    Questions? Contact us at <a href="mailto:formulahub@support.com" style="color: #d32f2f; text-decoration: none; font-weight: 600;">formulahub@support.com</a>
                </p>
                <p style="margin: 0; color: #999; font-size: 12px;">
                    © ${new Date().getFullYear()} FormulaHub. All rights reserved.
                </p>
            </div>

        </div>
    </div>
</body>
</html>
    `;
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