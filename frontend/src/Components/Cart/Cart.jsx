import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MetaData from '../Layout/MetaData'
import '../../Styles/cart.css'


const Cart = ({addItemToCart, removeItemFromCart, cartItems: propsCartItems}) => {
  
    const navigate = useNavigate()
    
    // Use props cart items or fallback to localStorage
    const [cartItems, setCartItems] = useState(() => {
        if (propsCartItems && propsCartItems.length > 0) {
            return propsCartItems.filter(item => item != null && item.product);
        }
        const localCart = localStorage.getItem('cartItems');
        if (localCart) {
            try {
                const parsed = JSON.parse(localCart);
                return Array.isArray(parsed) ? parsed.filter(item => item != null && item.product) : [];
            } catch (e) {
                console.error('Error parsing cart from localStorage:', e);
                return [];
            }
        }
        return [];
    });

    // Update cartItems when props change
    useEffect(() => {
        if (propsCartItems) {
            // Filter out any null/undefined items
            const validItems = propsCartItems.filter(item => item != null && item.product);
            setCartItems(validItems);
            localStorage.setItem('cartItems', JSON.stringify(validItems));
        }
    }, [propsCartItems]);

    // Save to localStorage whenever cartItems changes
    useEffect(() => {
        if (cartItems && cartItems.length >= 0) {
            const validItems = cartItems.filter(item => item != null && item.product);
            localStorage.setItem('cartItems', JSON.stringify(validItems));
        }
    }, [cartItems]);

    const increaseQty = (id, quantity, stock) => {
        const newQty = quantity + 1;
        if (newQty > stock) return;
        
        if (addItemToCart) {
            addItemToCart(id, newQty);
        } else {
            // Local update
            const updatedCart = cartItems.map(item => 
                item && item.product === id ? { ...item, quantity: newQty } : item
            ).filter(item => item != null);
            setCartItems(updatedCart);
        }
    }

    const decreaseQty = (id, quantity) => {
        const newQty = quantity - 1;
        if (newQty <= 0) return;
        
        if (addItemToCart) {
            addItemToCart(id, newQty);
        } else {
            // Local update
            const updatedCart = cartItems.map(item => 
                item && item.product === id ? { ...item, quantity: newQty } : item
            ).filter(item => item != null);
            setCartItems(updatedCart);
        }
    }

    const removeCartItemHandler = (id) => {
        if (removeItemFromCart) {
            removeItemFromCart(id);
        } else {
            // Local removal
            const updatedCart = cartItems.filter(item => item && item.product !== id);
            setCartItems(updatedCart);
        }
    }
    
    const checkoutHandler = () => {
        navigate('/login?redirect=shipping')
    }

    return (
        <>
            <MetaData title={'Your Cart'} />
            <div className="cart-container">
                {!cartItems || cartItems.length === 0 ? (
                    <div className="empty-cart">
                        <div className="empty-cart-icon">🛒</div>
                        <h2 className="empty-cart-title">Your Cart is Empty</h2>
                        <p className="empty-cart-text">Add some F1 collectibles to get started!</p>
                        <Link to="/store" className="continue-shopping-btn">
                            Continue Shopping
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="cart-header">
                            <h1 className="cart-title">Shopping Cart</h1>
                            <p className="cart-count">{cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'}</p>
                        </div>

                        <div className="cart-content">
                            <div className="cart-items-section">
                                {cartItems.filter(item => item != null && item.product).map((item, index) => (
                                    <div className="cart-item-card" key={item.product || `cart-item-${index}`}>
                                        <div className="cart-item-image">
                                            <img src={item.image || '/images/default_product.png'} alt={item.name || 'Product'} />
                                        </div>

                                        <div className="cart-item-details">
                                            <Link to={`/products/${item.product}`} className="cart-item-name">
                                                {item.name || 'Unknown Product'}
                                            </Link>
                                            <p className="cart-item-price">₱{(item.price || 0).toFixed(2)}</p>
                                        </div>

                                        <div className="cart-item-quantity">
                                            <div className="quantity-controls">
                                                <button 
                                                    className="qty-control-btn minus" 
                                                    onClick={() => decreaseQty(item.product, item.quantity)}
                                                    disabled={(item.quantity || 1) <= 1}
                                                >
                                                    −
                                                </button>
                                                <span className="qty-value">{item.quantity || 1}</span>
                                                <button 
                                                    className="qty-control-btn plus" 
                                                    onClick={() => increaseQty(item.product, item.quantity, item.stock)}
                                                    disabled={(item.quantity || 1) >= (item.stock || 0)}
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <p className="stock-info">{item.stock || 0} in stock</p>
                                        </div>

                                        <div className="cart-item-total">
                                            <p className="item-total-label">Total</p>
                                            <p className="item-total-price">₱{((item.quantity || 1) * (item.price || 0)).toFixed(2)}</p>
                                        </div>

                                        <button 
                                            className="remove-item-btn" 
                                            onClick={() => removeCartItemHandler(item.product)}
                                            title="Remove item"
                                        >
                                            <i className="fa fa-trash"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="cart-summary-section">
                                <div className="cart-summary-card">
                                    <h2 className="summary-title">Order Summary</h2>
                                    
                                    <div className="summary-divider"></div>
                                    
                                    <div className="summary-row">
                                        <span className="summary-label">Subtotal</span>
                                        <span className="summary-value">
                                            {cartItems.reduce((acc, item) => (acc + Number(item?.quantity || 0)), 0)} Units
                                        </span>
                                    </div>

                                    <div className="summary-row">
                                        <span className="summary-label">Shipping</span>
                                        <span className="summary-value">Calculated at checkout</span>
                                    </div>

                                    <div className="summary-divider"></div>

                                    <div className="summary-row total">
                                        <span className="summary-label">Est. Total</span>
                                        <span className="summary-value total-price">
                                            ₱{cartItems.reduce((acc, item) => acc + (item?.quantity || 0) * (item?.price || 0), 0).toFixed(2)}
                                        </span>
                                    </div>

                                    <button 
                                        className="checkout-btn" 
                                        onClick={checkoutHandler}
                                    >
                                        Proceed to Checkout
                                    </button>

                                    <Link to="/store" className="continue-shopping-link">
                                        ← Continue Shopping
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    )
}

export default Cart