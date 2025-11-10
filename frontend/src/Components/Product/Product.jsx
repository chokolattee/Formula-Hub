import React from 'react'
import { Link } from 'react-router-dom'
import Rating from '@mui/material/Rating';
import Typography from '@mui/material/Typography';

const Product = ({ product, lastProductRef }) => {
    return (
        <div 
            ref={lastProductRef} 
            className="product-tile__primary f1-product-card"
        >
            <Link to={`/product/${product._id}`}>
                <div className="tile-img__container">
                    <img 
                        src={product.images && product.images[0] ? product.images[0].url : 'https://placehold.co/300x300'} 
                        alt={product.name}
                    />
                    {product.stock === 0 && (
                        <div className="f1-badge">OUT OF STOCK</div>
                    )}
                </div>
            </Link>
            <div className="tile-body__container">
                <div className="product-title f1-product-title">
                    <Link to={`/product/${product._id}`}>
                        {product.name}
                    </Link>
                </div>
                <div className="product-category f1-category">
                    {product.category?.name || 'Uncategorized'}
                </div>
                <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Rating
                        value={product.ratings || 0}
                        precision={0.5}
                        readOnly
                        size="small"
                        sx={{
                            '& .MuiRating-iconFilled': {
                                color: '#dc0000',
                            },
                        }}
                    />
                    <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>
                        {product.ratings ? product.ratings.toFixed(1) : '0.0'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#999' }}>
                        ({product.numOfReviews || 0} {product.numOfReviews === 1 ? 'review' : 'reviews'})
                    </Typography>
                </div>
                <div className="tile-controls f1-controls">
                    <div className="product-price f1-product-price">
                        ₱ {product.price}
                    </div>
                    <Link to={`/product/${product._id}`}>
                        <button className="prime-button tile-button f1-cart-button">
                            View Details
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default Product