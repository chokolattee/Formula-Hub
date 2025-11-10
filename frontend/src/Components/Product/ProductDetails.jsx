import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MetaData from '../Layout/MetaData'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import '../../Styles/details.css'
import { getUser } from '../Utils/helpers';
import ImageGallery from './ImageGallery';
import '../../Styles/reviews.css';
import Rating from '@mui/material/Rating';

const ProductDetails = ({ addItemToCart, cartItems, loggedUser: user }) => {
    const loggedUser = user || getUser();
    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [quantity, setQuantity] = useState(1)
    const [selectedImage, setSelectedImage] = useState(0)
    const [descriptionOpen, setDescriptionOpen] = useState(true)
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [galleryImages, setGalleryImages] = useState(null)
    const [galleryStartIndex, setGalleryStartIndex] = useState(0)
    const [reviews, setReviews] = useState([])
    const [loadingReviews, setLoadingReviews] = useState(false)
    const [ratingCounts, setRatingCounts] = useState({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 })

    const openImageGallery = (images, startIndex) => {
        setGalleryImages(images);
        setGalleryStartIndex(startIndex);
    };

    const closeImageGallery = () => {
        setGalleryImages(null);
    };

    let { id } = useParams()
    let navigate = useNavigate()

    const increaseQty = () => {
        if (quantity >= product.stock) return;
        setQuantity(quantity + 1)
    }

    const decreaseQty = () => {
        if (quantity <= 1) return;
        setQuantity(quantity - 1)
    }

    const nextImage = () => {
        if (product.images && product.images.length > 0) {
            setSelectedImage((prev) => (prev + 1) % product.images.length)
        }
    }

    const prevImage = () => {
        if (product.images && product.images.length > 0) {
            setSelectedImage((prev) => (prev - 1 + product.images.length) % product.images.length)
        }
    }

    const fetchReviews = async (productId) => {
        setLoadingReviews(true)
        try {
            const { data } = await axios.get(`http://localhost:8000/api/v1/review?product=${productId}`)
            console.log('Reviews data:', data)
            if (data.success && data.data) {
                setReviews(data.data)
                
                // Calculate rating counts
                const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
                data.data.forEach(review => {
                    if (review.rating) {
                        counts[Math.floor(review.rating)]++
                    }
                })
                setRatingCounts(counts)
            }
        } catch (err) {
            console.error('Error fetching reviews:', err)
            toast.error('Failed to load reviews')
        } finally {
            setLoadingReviews(false)
        }
    }

    const getProductDetails = async (id) => {
        setLoading(true)
        try {
            const { data } = await axios.get(`http://localhost:8000/api/v1/getproduct/${id}`)
            console.log('Product data:', data)
            setProduct(data.data)
            setError('')
            await fetchReviews(id);
        } catch (err) {
            console.error('Error fetching product:', err)
            setError('Product not found or server error')
            toast.error('Failed to load product details')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        getProductDetails(id)
    }, [id])

    const addToCart = async () => {
        if (!loggedUser) {
            toast.error('Please login to add items to cart');
            navigate('/login');
            return;
        }
        
        if (!product) {
            toast.error('Product information not available');
            return;
        }
        
        try {
            if (addItemToCart) {
                await addItemToCart(id, quantity);
            } else {
                const cartItem = {
                    product: id, 
                    name: product.name,
                    price: product.price,
                    image: product.images && product.images[0] ? product.images[0].url : '/images/default_product.png',
                    stock: product.stock,
                    quantity: quantity
                };
                
                const existingCart = JSON.parse(localStorage.getItem('cartItems') || '[]');
                const existingItemIndex = existingCart.findIndex(item => item.product === id);
                
                if (existingItemIndex > -1) {
                    existingCart[existingItemIndex].quantity = quantity;
                } else {
                    existingCart.push(cartItem);
                }
                
                localStorage.setItem('cartItems', JSON.stringify(existingCart));
            }
            
            toast.success('Item added to cart');
            navigate('/cart');
        } catch (error) {
            console.error('Error adding to cart:', error);
            toast.error('Failed to add item to cart');
        }
    }

    if (loggedUser && cartItems) {
        localStorage.setItem('cartItems', JSON.stringify(cartItems))
    }

    if (loading) {
        return (
            <div className="product-details-container">
                <div className="loading-container">
                    <div className="spinner"></div>
                </div>
            </div>
        )
    }

    if (error || !product) {
        return (
            <div className="product-details-container">
                <div className="container">
                    <div className="error-alert">
                        {error || 'Product not found'}
                    </div>
                </div>
            </div>
        )
    }

    const productImages = product.images && product.images.length > 0
        ? product.images
        : [{ url: '/images/default_product.png', public_id: 'default' }]

    return (
        <>
            <MetaData title={product.name} />
            <div className="product-details-container">
                <div className="product-details-wrapper">
                    <div className="row">
                        {/* Product Images - Left Side */}
                        <div className="col-12 col-lg-6 mb-4">
                            <div className="image-gallery-container">
                                {/* Thumbnail Gallery - Vertical on Left */}
                                <div className="thumbnail-gallery">
                                    {productImages.map((image, index) => (
                                        <div
                                            key={image?.public_id || `thumb-${index}`}
                                            className={`thumbnail-item ${selectedImage === index ? 'active' : ''}`}
                                            onClick={() => setSelectedImage(index)}
                                        >
                                            <img
                                                src={image?.url || '/images/default_product.png'}
                                                alt={`${product.name} ${index + 1}`}
                                                className="thumbnail-image"
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Main Image - Right Side of Thumbnails */}
                                <div className="main-image-wrapper">
                                    <img
                                        src={productImages[selectedImage]?.url || '/images/default_product.png'}
                                        alt={product.name}
                                        className="main-product-image"
                                    />
                                    {productImages.length > 1 && (
                                        <>
                                            <button className="image-nav-btn prev" onClick={prevImage}>
                                                ‹
                                            </button>
                                            <button className="image-nav-btn next" onClick={nextImage}>
                                                ›
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Product Details - Right Side */}
                        <div className="col-12 col-lg-6">
                            <div className="product-info-section">
                                <h1 className="product-title">
                                    {product.name}
                                </h1>

                                {/* Price Section */}
                                <div className="product-price-section">
                                    <span className="product-price">
                                        ₱{product.price}
                                    </span>
                                    {product.originalPrice && (
                                        <span className="original-price">
                                            ₱{product.originalPrice}
                                        </span>
                                    )}
                                </div>

                                {/* Stock Status */}
                                <div className="stock-status">
                                    <div>
                                        <span className="stock-label">In Stock</span>
                                        <span className={`stock-value ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                                            {product.stock > 0 ? '- This item will ship within a few business days. Please proceed to checkout for shipping options and additional transit times.' : 'Out of Stock'}
                                        </span>
                                    </div>
                                </div>

                                {/* Quantity Selector */}
                                <div className="quantity-box">
                                    <button
                                        className="qty-btn"
                                        onClick={decreaseQty}
                                        disabled={quantity <= 1}
                                    >
                                        −
                                    </button>

                                    <span className="qty-display">{quantity}</span>

                                    <button
                                        className="qty-btn"
                                        onClick={increaseQty}
                                        disabled={quantity >= product.stock}
                                    >
                                        +
                                    </button>
                                </div>

                                {/* Add to Cart Button */}
                                <button
                                    className="add-to-cart-btn"
                                    disabled={!loggedUser || product.stock === 0}
                                    onClick={addToCart}
                                >
                                    {product.stock === 0
                                        ? 'OUT OF STOCK'
                                        : !loggedUser
                                            ? 'LOGIN TO ADD TO CART'
                                            : 'Add to Cart'
                                    }
                                </button>

                                {/* Description Accordion */}
                                <div className="accordion-section">
                                    <div
                                        className="accordion-header"
                                        onClick={() => setDescriptionOpen(!descriptionOpen)}
                                    >
                                        <h3 className="accordion-title">Description</h3>
                                        <span className={`accordion-icon ${descriptionOpen ? 'open' : ''}`}>
                                            ▼
                                        </span>
                                    </div>
                                    <div className={`accordion-content ${descriptionOpen ? 'open' : ''}`}>
                                        <p className="accordion-text">
                                            {product.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Details Accordion */}
                                <div className="accordion-section">
                                    <div
                                        className="accordion-header"
                                        onClick={() => setDetailsOpen(!detailsOpen)}
                                    >
                                        <h3 className="accordion-title">Details</h3>
                                        <span className={`accordion-icon ${detailsOpen ? 'open' : ''}`}>
                                            ▼
                                        </span>
                                    </div>
                                    <div className={`accordion-content ${detailsOpen ? 'open' : ''}`}>
                                        <div className="product-meta">
                                            <div className="meta-item">
                                                <span className="meta-label">Category:</span>
                                                <span className="meta-value">
                                                    {product.category?.name || 'N/A'}
                                                </span>
                                            </div>
                                            <div className="meta-item">
                                                <span className="meta-label">Team:</span>
                                                <span className="meta-value">
                                                    {product.team?.name || 'N/A'}
                                                </span>
                                            </div>
                                            <div className="meta-item">
                                                <span className="meta-label">Stock:</span>
                                                <span className="meta-value">
                                                    {product.stock} available
                                                </span>
                                            </div>
                                        </div>

                                        {/* Rating */}
                                        <div className="rating-container" style={{ marginTop: '15px' }}>
                                            <Rating
                                                value={product.ratings || 0}
                                                precision={0.5}
                                                readOnly
                                                size="medium"
                                                sx={{
                                                    '& .MuiRating-iconFilled': {
                                                        color: '#dc0000',
                                                    },
                                                }}
                                            />
                                            <span className="review-count">
                                                ({product.numOfReviews || 0} Reviews)
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reviews Section - Below */}
                    <div className="row mt-4">
                        <div className="col-12">
                            <div className="reviews-section">
                                <div className="reviews-header">
                                    <div className="rating-summary">
                                        <h3 className="reviews-title mb-3">
                                            Customer Reviews ({reviews.length})
                                        </h3>
                                        <div className="average-rating">
                                            <Rating
                                                value={product.ratings || 0}
                                                precision={0.5}
                                                readOnly
                                                size="large"
                                                sx={{
                                                    '& .MuiRating-iconFilled': {
                                                        color: '#dc0000',
                                                    },
                                                }}
                                            />
                                            <span className="rating-value">{product.ratings || 0} out of 5</span>
                                        </div>
                                        <div className="rating-bars">
                                            {Object.entries(ratingCounts).reverse().map(([rating, count]) => (
                                                <div key={rating} className="rating-bar-item">
                                                    <div className="rating-label">{rating} star</div>
                                                    <div className="rating-bar-container">
                                                        <div 
                                                            className="rating-bar-fill"
                                                            style={{
                                                                width: `${reviews.length > 0 ? (count / reviews.length) * 100 : 0}%`
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <div className="rating-count">{count}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <hr className="divider" />

                                {loadingReviews ? (
                                    <div className="loading-container">
                                        <div className="spinner"></div>
                                    </div>
                                ) : reviews.length === 0 ? (
                                    <div className="no-reviews">
                                        No reviews yet. Be the first to review this product!
                                    </div>
                                ) : (
                                    <div className="reviews-list">
                                        {reviews.map((review, index) => (
                                            <div key={review?._id || `review-${index}`} className="review-card">
                                                <div className="row">
                                                    <div className="col-md-2 col-3">
                                                        <img
                                                            src={review?.user?.avatar?.[0]?.url || '/images/default_avatar.jpg'}
                                                            alt={review?.user?.first_name || 'User'}
                                                            className="review-avatar"
                                                            loading="lazy"
                                                        />
                                                    </div>
                                                    <div className="col-md-10 col-9">
                                                        <div className="review-header">
                                                            <div className="review-author">
                                                                <h5 className="reviewer-name">
                                                                    {review?.user?.first_name || 'User'}
                                                                </h5>
                                                                <small className="review-date">
                                                                    {new Date(review?.createdAt).toLocaleDateString()}
                                                                </small>
                                                            </div>
                                                            <Rating
                                                                value={review?.rating || 0}
                                                                precision={0.5}
                                                                readOnly
                                                                size="small"
                                                                sx={{
                                                                    '& .MuiRating-iconFilled': {
                                                                        color: '#dc0000',
                                                                    },
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="review-content">
                                                            <p className="review-comment">
                                                                {review?.comment || 'No comment provided'}
                                                            </p>
                                                            {review?.images && review.images.length > 0 && (
                                                                <div className="review-images-carousel">
                                                                    <div className="review-images-grid">
                                                                        {review.images.map((image, imgIndex) => (
                                                                            <img
                                                                                key={`review-img-${imgIndex}`}
                                                                                src={image.url}
                                                                                alt={`Review ${imgIndex + 1}`}
                                                                                className="review-image"
                                                                                loading="lazy"
                                                                                onClick={() => openImageGallery(review.images, imgIndex)}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {galleryImages && (
                <ImageGallery
                    images={galleryImages}
                    startIndex={galleryStartIndex}
                    onClose={closeImageGallery}
                />
            )}
        </>
    )
}

export default ProductDetails