const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true
        },
        rating: {
            type: Number,
            required: [true, 'Please provide a rating'],
            min: [1, 'Rating must be at least 1'],
            max: [5, 'Rating cannot be more than 5'],
            validate: {
                validator: Number.isInteger,
                message: 'Rating must be a whole number between 1 and 5'
            }
        },
        comment: {
            type: String,
            required: [true, 'Please provide a comment'],
            maxlength: [1000, 'Comment cannot exceed 1000 characters']
        },
        images: [
            {
                public_id: {
                    type: String,
                    required: true
                },
                url: {
                    type: String,
                    required: true
                }
            }
        ],
    },
    {
        timestamps: true,
    }
);

reviewSchema.index({ user: 1, product: 1, order: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);