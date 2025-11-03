import React, { Fragment, useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import MetaData from '../Layout/MetaData'
import CheckoutSteps from './CheckoutSteps'
import { getToken } from '../Utils/helpers'
import { toast } from 'react-toastify'
import axios from 'axios'
import '../../Styles/confirmOrder.css'

const ConfirmOrder = ({cartItems, shippingInfo}) => {
    const [user, setUser] = useState(null)
    const [orderConfirmed, setOrderConfirmed] = useState(false)
    let navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (orderConfirmed || location.state?.fromSuccess || location.state?.fromPayment) {
            return;
        }

        const fetchUserProfile = async () => {
            try {
                const token = getToken()
                
                if (!token) {
                    toast.error('Please login to continue')
                    navigate('/login')
                    return
                }

                const config = {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }

                const { data } = await axios.get('http://localhost:8000/api/v1/me', config)
                
                if (data.success && data.user) {
                    setUser(data.user)
                } else {
                    toast.error('Please login to continue')
                    navigate('/login')
                }
            } catch (error) {
                console.error('Error fetching user:', error)
                toast.error('Please login to continue')
                navigate('/login')
            }
        }

        fetchUserProfile()

        // Validate cart and shipping info
        if (!cartItems || cartItems.length === 0) {
            toast.error('Your cart is empty')
            navigate('/cart')
            return
        }

        if (!shippingInfo || !shippingInfo.address) {
            toast.error('Please add shipping information')
            navigate('/shipping')
            return
        }
    }, [cartItems, shippingInfo, navigate, orderConfirmed, location])

    // Calculate Order Prices
    const itemsPrice = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
    const shippingPrice = itemsPrice > 5000 ? 0 : 150 // Free shipping over ₱5000
    const taxPrice = Number((0.12 * itemsPrice).toFixed(2)) // 12% VAT
    const totalPrice = (itemsPrice + shippingPrice + taxPrice).toFixed(2)

    const processToPayment = () => {
        const data = {
            itemsPrice: Number(itemsPrice.toFixed(2)),
            shippingPrice,
            taxPrice,
            totalPrice: Number(totalPrice)
        }

        sessionStorage.setItem('orderInfo', JSON.stringify(data))
        setOrderConfirmed(true) 
        navigate('/payment', { state: { fromConfirm: true } })
    }


    const getUserFullName = () => {
        if (!user) return 'Guest'
        
        if (user.first_name && user.last_name) {
            return `${user.first_name} ${user.last_name}`.trim()
        }
        
        if (user.first_name) {
            return user.first_name
        }
        
        if (user.name) {
            return user.name
        }
        
        return user.email || 'Guest'
    }

    return (
        <Fragment>
            <MetaData title={'Confirm Order'} />
            <CheckoutSteps shipping confirmOrder />
            
            <div className="confirm-order-wrapper">
                <div className="container-fluid">
                    <div className="row justify-content-center">
                        <div className="col-12 col-xl-10">
                            <div className="row">
                                {/* Left Column - Order Details */}
                                <div className="col-12 col-lg-7 col-xl-8">
                                    <div className="card shipping-info-card fade-in" style={{ marginBottom: "12px" }}>
    <div className="card-body" style={{ padding: "12px 16px" }}>
        <h4 className="section-title" style={{ marginBottom: "8px" }}>
            <i className="fa fa-shipping-fast section-icon"></i>
            Shipping Information
        </h4>
        
        {user && (
            <div className="user-info">
                <p className="info-row" style={{ marginBottom: "4px", lineHeight: "1.3" }}>
                    <strong className="info-label">Name:</strong> 
                    <span className="info-value">{getUserFullName()}</span>
                </p>
                <p className="info-row" style={{ marginBottom: "4px", lineHeight: "1.3" }}>
                    <strong className="info-label">Email:</strong> 
                    <span className="info-value">{user.email}</span>
                </p>
            </div>
        )}
        
        <p className="info-row" style={{ marginBottom: "4px", lineHeight: "1.3" }}>
            <strong className="info-label">Phone:</strong> 
            <span className="info-value">{shippingInfo.phoneNo}</span>
        </p>
        
        <p className="info-row" style={{ marginBottom: "0", paddingBottom: "0", lineHeight: "1.3" }}>
            <strong className="info-label">Address:</strong> 
            <span className="info-value">
                {`${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.postalCode}, ${shippingInfo.country}`}
            </span>
        </p>
    </div>
</div>


                                    <div className="card order-items-card fade-in">
                                        <div className="card-body">
                                            <h4 className="section-title">
                                                <i className="fa fa-shopping-cart section-icon"></i>
                                                Order Items ({cartItems.length})
                                            </h4>

                                            <div className="items-container">
                                                {cartItems.map((item, index) => (
                                                    <div key={item.product} className="order-item">
                                                        <div className="row align-items-center g-2">
                                                            <div className="col-4 col-sm-3 col-md-2">
                                                                <img 
                                                                    src={item.image} 
                                                                    alt={item.name} 
                                                                    className="item-image"
                                                                />
                                                            </div>

                                                            <div className="col-8 col-sm-5 col-md-6">
                                                                <Link 
                                                                    to={`/product/${item.product}`}
                                                                    className="item-name-link"
                                                                >
                                                                    {item.name}
                                                                </Link>
                                                            </div>

                                                            <div className="col-12 col-sm-4 text-sm-end">
                                                                <div className="item-pricing">
                                                                    <div className="item-quantity">
                                                                        {item.quantity} x ₱{item.price.toFixed(2)}
                                                                    </div>
                                                                    <div className="item-total-price">
                                                                        ₱{(item.quantity * item.price).toFixed(2)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - Order Summary */}
                                <div className="col-12 col-lg-5 col-xl-4">
                                    <div className="summary-sticky-wrapper">
                                        <div className="card order-summary-card fade-in">
                                            <div className="card-body">
                                                <h4 className="summary-title">Order Summary</h4>

                                                <div className="price-breakdown">
                                                    <div className="price-row">
                                                        <span className="price-label">Subtotal:</span>
                                                        <span className="price-value">₱{itemsPrice.toFixed(2)}</span>
                                                    </div>

                                                    <div className="price-row">
                                                        <span className="price-label">Shipping:</span>
                                                        <span className={`price-value ${shippingPrice === 0 ? 'free' : ''}`}>
                                                            {shippingPrice === 0 ? 'FREE' : `₱${shippingPrice.toFixed(2)}`}
                                                        </span>
                                                    </div>

                                                    {shippingPrice === 0 && (
                                                        <div className="shipping-alert shipping-alert-success">
                                                            <i className="fa fa-check-circle"></i>
                                                            <span>You've qualified for free shipping!</span>
                                                        </div>
                                                    )}

                                                    {shippingPrice > 0 && itemsPrice < 5000 && (
                                                        <div className="shipping-alert shipping-alert-info">
                                                            <i className="fa fa-info-circle"></i>
                                                            <span>Add ₱{(5000 - itemsPrice).toFixed(2)} more for free shipping</span>
                                                        </div>
                                                    )}

                                                    <div className="price-row">
                                                        <span className="price-label">Tax (12% VAT):</span>
                                                        <span className="price-value">₱{taxPrice}</span>
                                                    </div>
                                                </div>

                                                <hr className="summary-divider" />

                                                <div className="total-row">
                                                    <span className="total-label">Total:</span>
                                                    <span className="total-value">₱{totalPrice}</span>
                                                </div>

                                                <button 
                                                    id="checkout_btn" 
                                                    className="btn payment-btn" 
                                                    onClick={processToPayment}
                                                >
                                                    <i className="fa fa-lock"></i>
                                                    <span>Proceed to Payment</span>
                                                </button>

                                                <Link 
                                                    to="/cart" 
                                                    className="btn back-to-cart-btn"
                                                >
                                                    <i className="fa fa-arrow-left"></i>
                                                    <span>Back to Cart</span>
                                                </Link>

                                                <div className="security-badge">
                                                    <i className="fa fa-shield-alt"></i>
                                                    Your information is secure
                                                </div>
                                            </div>
                                        </div>

                                        {/* Order Details Summary */}
                                        <div className="card additional-info-card fade-in">
                                            <div className="card-body">
                                                <div className="info-item">
                                                    <i className="fa fa-truck"></i>
                                                    <span>Estimated delivery: 3-5 business days</span>
                                                </div>
                                                <div className="info-item">
                                                    <i className="fa fa-undo"></i>
                                                    <span>30-day return policy</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Fragment>
    )
}

export default ConfirmOrder