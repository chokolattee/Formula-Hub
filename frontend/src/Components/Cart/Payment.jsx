import React, { Fragment, useEffect, useState } from 'react'
import { useNavigate, useLocation } from "react-router-dom";
import MetaData from '../Layout/MetaData'
import CheckoutSteps from './CheckoutSteps'
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getToken } from '../Utils/helpers';

const Payment = ({cartItems, shippingInfo, clearCart}) => {
    const [loading, setLoading] = useState(false)
    const [cardNumber, setCardNumber] = useState('')
    const [cardExpiry, setCardExpiry] = useState('')
    const [cardCVC, setCardCVC] = useState('')
    const [cardName, setCardName] = useState('')
    const [user, setUser] = useState(null)
    const [orderProcessed, setOrderProcessed] = useState(false)
    
    let navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (orderProcessed || location.state?.fromSuccess) {
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
                    // Pre-fill cardholder name with user's full name from database
                    const fullName = `${data.user.first_name || ''} ${data.user.last_name || ''}`.trim()
                    setCardName(fullName || data.user.name || '')
                }
            } catch (error) {
                console.error('Error fetching user:', error)
                toast.error('Please login to continue')
                navigate('/login')
            }
        }

        fetchUserProfile()

        // Check if cart is empty
        if (!cartItems || cartItems.length === 0) {
            toast.error('Your cart is empty')
            navigate('/cart')
            return
        }

        // Check if shipping info exists
        if (!shippingInfo || !shippingInfo.address) {
            toast.error('Please add shipping information')
            navigate('/shipping')
            return
        }
    }, [cartItems, shippingInfo, navigate, orderProcessed, location])

    const order = {
        orderItems: cartItems,
        shippingInfo
    }

    const orderInfo = JSON.parse(sessionStorage.getItem('orderInfo'));
    if (orderInfo) {
        order.itemsPrice = orderInfo.itemsPrice
        order.shippingPrice = orderInfo.shippingPrice
        order.taxPrice = orderInfo.taxPrice
        order.totalPrice = orderInfo.totalPrice
    }

    // Format card number with spaces (XXXX XXXX XXXX XXXX)
    const formatCardNumber = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
        const matches = v.match(/\d{4,16}/g)
        const match = (matches && matches[0]) || ''
        const parts = []

        for (let i = 0; i < match.length; i += 4) {
            parts.push(match.substring(i, i + 4))
        }

        if (parts.length) {
            return parts.join(' ')
        } else {
            return value
        }
    }

    // Format expiry date (MM/YY)
    const formatExpiry = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
        if (v.length >= 2) {
            return v.slice(0, 2) + '/' + v.slice(2, 4)
        }
        return v
    }

    const handleCardNumberChange = (e) => {
        const formatted = formatCardNumber(e.target.value)
        if (formatted.replace(/\s/g, '').length <= 16) {
            setCardNumber(formatted)
        }
    }

    const handleExpiryChange = (e) => {
        const formatted = formatExpiry(e.target.value)
        if (formatted.replace(/\//g, '').length <= 4) {
            setCardExpiry(formatted)
        }
    }

    const handleCVCChange = (e) => {
        const value = e.target.value.replace(/[^0-9]/gi, '')
        if (value.length <= 4) {
            setCardCVC(value)
        }
    }

    const validateCard = () => {
        const cardNum = cardNumber.replace(/\s/g, '')
        
        if (!cardName || cardName.trim().length < 3) {
            toast.error('Please enter a valid cardholder name')
            return false
        }

        if (cardNum.length !== 16) {
            toast.error('Card number must be 16 digits')
            return false
        }

        if (!cardExpiry || cardExpiry.length !== 5) {
            toast.error('Please enter a valid expiry date (MM/YY)')
            return false
        }

        const [month, year] = cardExpiry.split('/')
        const currentYear = new Date().getFullYear() % 100
        const currentMonth = new Date().getMonth() + 1

        if (parseInt(month) < 1 || parseInt(month) > 12) {
            toast.error('Invalid expiry month')
            return false
        }

        if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
            toast.error('Card has expired')
            return false
        }

        if (cardCVC.length < 3) {
            toast.error('CVC must be 3 or 4 digits')
            return false
        }

        return true
    }

    const createOrder = async (order) => {
        try {
            setOrderProcessed(true)
            
            // Get and validate token
            const token = getToken()
            
            if (!token) {
                toast.error('Authentication token not found. Please login again.', {
                    position: "bottom-right"
                });
                navigate('/login')
                return
            }
            
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            }
            
            const { data } = await axios.post(`${import.meta.env.VITE_API}/order/new`, order, config)
            
            setLoading(false)
            
            toast.success('Order placed successfully!', {
                position: "bottom-right"
            });
           
            // Clear cart 
            if (clearCart) {
                clearCart()
            }
            
            // Navigate to success page with state to prevent validation
            navigate('/success', { state: { fromPayment: true } })
    
        } catch (error) {
            setLoading(false)
            setOrderProcessed(false) // Reset if error occurs
            console.error('Order creation error:', error.response || error)
            
            if (error.response?.status === 401) {
                toast.error('Session expired. Please login again.', {
                    position: "bottom-right"
                });
                // Clear invalid token
                sessionStorage.removeItem('token')
                sessionStorage.removeItem('user')
                setTimeout(() => navigate('/login'), 1500)
            } else {
                toast.error(error.response?.data?.message || 'Failed to create order', {
                    position: "bottom-right"
                });
            }
        }
    }

    const submitHandler = async (e) => {
        e.preventDefault();
        
        if (!validateCard()) {
            return
        }

        setLoading(true)
        document.querySelector('#pay_btn').disabled = true;
        
        order.paymentInfo = {
            id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            status: 'succeeded',
            cardLast4: cardNumber.slice(-4),
            cardBrand: 'visa'
        }
        
        await createOrder(order)
        
        // Re-enable button in case of error
        if (!orderProcessed) {
            document.querySelector('#pay_btn').disabled = false;
        }
    }

    return (
        <>
            <MetaData title={'Payment'} />
            <CheckoutSteps shipping confirmOrder payment />
            
            <div className="row wrapper" style={{ marginTop: '50px', marginBottom: '50px' }}>
                <div className="col-12 col-lg-8 mx-auto">
                    <div className="row">
                        {/* Payment Form */}
                        <div className="col-12 col-md-7">
                            <form className="shadow-lg p-4" onSubmit={submitHandler}>
                                <h2 className="mb-4" style={{ color: '#333', fontWeight: '600' }}>
                                    Payment Details
                                </h2>

                                {user && (
                                    <div className="alert alert-info mb-4" style={{ fontSize: '14px' }}>
                                        <i className="fa fa-user mr-2"></i>
                                        Paying as: <strong>{user.first_name} {user.last_name}</strong>
                                    </div>
                                )}

                                <div className="form-group mb-3">
                                    <label htmlFor="card_name_field" style={{ fontWeight: '500' }}>
                                        <i className="fa fa-user mr-2"></i>Cardholder Name
                                    </label>
                                    <input
                                        type="text"
                                        id="card_name_field"
                                        className="form-control"
                                        value={cardName}
                                        onChange={(e) => setCardName(e.target.value)}
                                        placeholder="John Doe"
                                        required
                                        style={{ fontSize: '16px', padding: '12px' }}
                                    />
                                </div>

                                <div className="form-group mb-3">
                                    <label htmlFor="card_num_field" style={{ fontWeight: '500' }}>
                                        <i className="fa fa-credit-card mr-2"></i>Card Number
                                    </label>
                                    <input
                                        type="text"
                                        id="card_num_field"
                                        className="form-control"
                                        value={cardNumber}
                                        onChange={handleCardNumberChange}
                                        placeholder="1234 5678 9012 3456"
                                        required
                                        style={{ fontSize: '16px', padding: '12px', letterSpacing: '2px' }}
                                    />
                                    <small className="form-text text-muted">
                                        Enter 16-digit card number
                                    </small>
                                </div>

                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group mb-3">
                                            <label htmlFor="card_exp_field" style={{ fontWeight: '500' }}>
                                                <i className="fa fa-calendar mr-2"></i>Expiry Date
                                            </label>
                                            <input
                                                type="text"
                                                id="card_exp_field"
                                                className="form-control"
                                                value={cardExpiry}
                                                onChange={handleExpiryChange}
                                                placeholder="MM/YY"
                                                required
                                                style={{ fontSize: '16px', padding: '12px' }}
                                            />
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="form-group mb-3">
                                            <label htmlFor="card_cvc_field" style={{ fontWeight: '500' }}>
                                                <i className="fa fa-lock mr-2"></i>CVC
                                            </label>
                                            <input
                                                type="text"
                                                id="card_cvc_field"
                                                className="form-control"
                                                value={cardCVC}
                                                onChange={handleCVCChange}
                                                placeholder="123"
                                                required
                                                style={{ fontSize: '16px', padding: '12px' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="alert alert-warning mt-3" style={{ fontSize: '13px' }}>
                                    <i className="fa fa-info-circle mr-2"></i>
                                    <strong>Test Mode:</strong> This is a demo payment. Use any valid card format.
                                </div>

                                <button
                                    id="pay_btn"
                                    type="submit"
                                    className="btn btn-primary btn-block py-3 mt-4"
                                    disabled={loading}
                                    style={{ 
                                        fontSize: '18px', 
                                        fontWeight: '600',
                                        background: 'linear-gradient(to right, #667eea 0%, #764ba2 100%)',
                                        border: 'none'
                                    }}
                                >
                                    {loading ? (
                                        <>
                                            <i className="fa fa-spinner fa-spin mr-2"></i>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa fa-lock mr-2"></i>
                                            Pay ₱{orderInfo && orderInfo.totalPrice.toFixed(2)}
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Order Summary Sidebar */}
                        <div className="col-12 col-md-5 mt-4 mt-md-0">
                            <div className="card shadow-sm" style={{ position: 'sticky', top: '20px' }}>
                                <div className="card-body">
                                    <h5 className="card-title mb-3" style={{ fontWeight: '600' }}>
                                        Order Summary
                                    </h5>
                                    
                                    <div className="mb-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                        {cartItems && cartItems.map((item, index) => (
                                            <div key={index} className="d-flex align-items-center mb-2 pb-2" style={{ borderBottom: '1px solid #eee' }}>
                                                <img 
                                                    src={item.image} 
                                                    alt={item.name}
                                                    style={{ 
                                                        width: '50px', 
                                                        height: '50px', 
                                                        objectFit: 'cover',
                                                        borderRadius: '5px',
                                                        marginRight: '10px'
                                                    }}
                                                />
                                                <div style={{ flex: 1, fontSize: '14px' }}>
                                                    <div style={{ fontWeight: '500' }}>{item.name}</div>
                                                    <div className="text-muted">Qty: {item.quantity}</div>
                                                </div>
                                                <div style={{ fontWeight: '600' }}>
                                                    ₱{(item.price * item.quantity).toFixed(2)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <hr />

                                    {orderInfo && (
                                        <>
                                            <div className="d-flex justify-content-between mb-2">
                                                <span>Subtotal:</span>
                                                <span>₱{orderInfo.itemsPrice.toFixed(2)}</span>
                                            </div>
                                            <div className="d-flex justify-content-between mb-2">
                                                <span>Shipping:</span>
                                                <span>₱{orderInfo.shippingPrice.toFixed(2)}</span>
                                            </div>
                                            <div className="d-flex justify-content-between mb-3">
                                                <span>Tax:</span>
                                                <span>₱{orderInfo.taxPrice.toFixed(2)}</span>
                                            </div>
                                            <hr />
                                            <div className="d-flex justify-content-between mb-3" style={{ fontSize: '18px', fontWeight: '700' }}>
                                                <span>Total:</span>
                                                <span style={{ color: '#667eea' }}>
                                                    ₱{orderInfo.totalPrice.toFixed(2)}
                                                </span>
                                            </div>
                                        </>
                                    )}

                                    {shippingInfo && (
                                        <>
                                            <hr />
                                            <h6 style={{ fontWeight: '600', marginTop: '15px' }}>
                                                Shipping To:
                                            </h6>
                                            <div style={{ fontSize: '14px', color: '#666' }}>
                                                <p className="mb-1">{shippingInfo.address}</p>
                                                <p className="mb-1">{shippingInfo.city}, {shippingInfo.postalCode}</p>
                                                <p className="mb-1">{shippingInfo.country}</p>
                                                <p className="mb-0">
                                                    <i className="fa fa-phone mr-2"></i>{shippingInfo.phoneNo}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="text-center mt-3" style={{ fontSize: '12px', color: '#999' }}>
                                <i className="fa fa-shield-alt mr-2"></i>
                                Your payment information is secure
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Payment