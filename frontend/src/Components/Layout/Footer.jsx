import React from 'react'

const Footer = () => {
    return (
        <>
            <footer className="py-5 mt-5" style={{
                background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
                borderTop: '3px solid #dc0000',
                boxShadow: '0 -5px 20px rgba(220, 0, 0, 0.2)'
            }}>
                <div className="container">
                    <div className="row">
                        {/* Brand Section */}
                        <div className="col-md-4 mb-4">
                            <h4 style={{
                                color: '#dc0000',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                letterSpacing: '2px',
                                marginBottom: '1.5rem'
                            }}>
                                <i className="fa fa-flag-checkered" style={{ marginRight: '10px' }}></i>
                                Formula Hub
                            </h4>
                            <p style={{ color: '#999', lineHeight: '1.8' }}>
                                Your premier destination for authentic Formula 1 memorabilia, 
                                die-cast models, team merchandise, and racing collectibles.
                            </p>
                            <div style={{ marginTop: '1.5rem' }}>
                                <a href="#" style={{
                                    color: '#dc0000',
                                    fontSize: '1.5rem',
                                    marginRight: '1rem',
                                    transition: 'all 0.3s ease'
                                }} onMouseOver={(e) => e.target.style.color = '#ff0000'}
                                   onMouseOut={(e) => e.target.style.color = '#dc0000'}>
                                    <i className="fab fa-facebook"></i>
                                </a>
                                <a href="#" style={{
                                    color: '#dc0000',
                                    fontSize: '1.5rem',
                                    marginRight: '1rem',
                                    transition: 'all 0.3s ease'
                                }} onMouseOver={(e) => e.target.style.color = '#ff0000'}
                                   onMouseOut={(e) => e.target.style.color = '#dc0000'}>
                                    <i className="fab fa-twitter"></i>
                                </a>
                                <a href="#" style={{
                                    color: '#dc0000',
                                    fontSize: '1.5rem',
                                    marginRight: '1rem',
                                    transition: 'all 0.3s ease'
                                }} onMouseOver={(e) => e.target.style.color = '#ff0000'}
                                   onMouseOut={(e) => e.target.style.color = '#dc0000'}>
                                    <i className="fab fa-instagram"></i>
                                </a>
                                <a href="#" style={{
                                    color: '#dc0000',
                                    fontSize: '1.5rem',
                                    transition: 'all 0.3s ease'
                                }} onMouseOver={(e) => e.target.style.color = '#ff0000'}
                                   onMouseOut={(e) => e.target.style.color = '#dc0000'}>
                                    <i className="fab fa-youtube"></i>
                                </a>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="col-md-2 mb-4">
                            <h5 style={{
                                color: '#ffffff',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                marginBottom: '1.5rem',
                                fontSize: '1rem'
                            }}>Quick Links</h5>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                <li style={{ marginBottom: '0.8rem' }}>
                                    <a href="/" style={{
                                        color: '#999',
                                        textDecoration: 'none',
                                        transition: 'all 0.3s ease'
                                    }} onMouseOver={(e) => e.target.style.color = '#dc0000'}
                                       onMouseOut={(e) => e.target.style.color = '#999'}>
                                        <i className="fa fa-angle-right" style={{ marginRight: '8px' }}></i>
                                        Home
                                    </a>
                                </li>
                                <li style={{ marginBottom: '0.8rem' }}>
                                    <a href="/products" style={{
                                        color: '#999',
                                        textDecoration: 'none',
                                        transition: 'all 0.3s ease'
                                    }} onMouseOver={(e) => e.target.style.color = '#dc0000'}
                                       onMouseOut={(e) => e.target.style.color = '#999'}>
                                        <i className="fa fa-angle-right" style={{ marginRight: '8px' }}></i>
                                        Products
                                    </a>
                                </li>
                                <li style={{ marginBottom: '0.8rem' }}>
                                    <a href="/cart" style={{
                                        color: '#999',
                                        textDecoration: 'none',
                                        transition: 'all 0.3s ease'
                                    }} onMouseOver={(e) => e.target.style.color = '#dc0000'}
                                       onMouseOut={(e) => e.target.style.color = '#999'}>
                                        <i className="fa fa-angle-right" style={{ marginRight: '8px' }}></i>
                                        Cart
                                    </a>
                                </li>
                                <li style={{ marginBottom: '0.8rem' }}>
                                    <a href="/orders/me" style={{
                                        color: '#999',
                                        textDecoration: 'none',
                                        transition: 'all 0.3s ease'
                                    }} onMouseOver={(e) => e.target.style.color = '#dc0000'}
                                       onMouseOut={(e) => e.target.style.color = '#999'}>
                                        <i className="fa fa-angle-right" style={{ marginRight: '8px' }}></i>
                                        Orders
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Categories */}
                        <div className="col-md-3 mb-4">
                            <h5 style={{
                                color: '#ffffff',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                marginBottom: '1.5rem',
                                fontSize: '1rem'
                            }}>Categories</h5>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                <li style={{ marginBottom: '0.8rem' }}>
                                    <a href="#" style={{
                                        color: '#999',
                                        textDecoration: 'none',
                                        transition: 'all 0.3s ease'
                                    }} onMouseOver={(e) => e.target.style.color = '#dc0000'}
                                       onMouseOut={(e) => e.target.style.color = '#999'}>
                                        <i className="fa fa-car" style={{ marginRight: '8px' }}></i>
                                        Die-Cast Models
                                    </a>
                                </li>
                                <li style={{ marginBottom: '0.8rem' }}>
                                    <a href="#" style={{
                                        color: '#999',
                                        textDecoration: 'none',
                                        transition: 'all 0.3s ease'
                                    }} onMouseOver={(e) => e.target.style.color = '#dc0000'}
                                       onMouseOut={(e) => e.target.style.color = '#999'}>
                                        <i className="fa fa-tshirt" style={{ marginRight: '8px' }}></i>
                                        Team Apparel
                                    </a>
                                </li>
                                <li style={{ marginBottom: '0.8rem' }}>
                                    <a href="#" style={{
                                        color: '#999',
                                        textDecoration: 'none',
                                        transition: 'all 0.3s ease'
                                    }} onMouseOver={(e) => e.target.style.color = '#dc0000'}
                                       onMouseOut={(e) => e.target.style.color = '#999'}>
                                        <i className="fa fa-trophy" style={{ marginRight: '8px' }}></i>
                                        Memorabilia
                                    </a>
                                </li>
                                <li style={{ marginBottom: '0.8rem' }}>
                                    <a href="#" style={{
                                        color: '#999',
                                        textDecoration: 'none',
                                        transition: 'all 0.3s ease'
                                    }} onMouseOver={(e) => e.target.style.color = '#dc0000'}
                                       onMouseOut={(e) => e.target.style.color = '#999'}>
                                        <i className="fa fa-pen-nib" style={{ marginRight: '8px' }}></i>
                                        Autographs
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Contact Info */}
                        <div className="col-md-3 mb-4">
                            <h5 style={{
                                color: '#ffffff',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                marginBottom: '1.5rem',
                                fontSize: '1rem'
                            }}>Contact Us</h5>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                <li style={{ marginBottom: '1rem', color: '#999' }}>
                                    <i className="fa fa-map-marker-alt" style={{ 
                                        color: '#dc0000', 
                                        marginRight: '10px',
                                        width: '20px'
                                    }}></i>
                                    123 Racing Street, Speed City
                                </li>
                                <li style={{ marginBottom: '1rem', color: '#999' }}>
                                    <i className="fa fa-phone" style={{ 
                                        color: '#dc0000', 
                                        marginRight: '10px',
                                        width: '20px'
                                    }}></i>
                                    +1 (555) F1-SPEED
                                </li>
                                <li style={{ marginBottom: '1rem', color: '#999' }}>
                                    <i className="fa fa-envelope" style={{ 
                                        color: '#dc0000', 
                                        marginRight: '10px',
                                        width: '20px'
                                    }}></i>
                                    info@f1collectibles.com
                                </li>
                                <li style={{ color: '#999' }}>
                                    <i className="fa fa-clock" style={{ 
                                        color: '#dc0000', 
                                        marginRight: '10px',
                                        width: '20px'
                                    }}></i>
                                    Mon - Fri: 9:00 AM - 6:00 PM
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Racing Stripe Divider */}
                    <div style={{
                        height: '3px',
                        background: 'linear-gradient(90deg, #dc0000 0%, #000000 50%, #dc0000 100%)',
                        margin: '2rem 0'
                    }}></div>

                    {/* Bottom Bar */}
                    <div className="row">
                        <div className="col-md-6 text-center text-md-left">
                            <p style={{ color: '#666', margin: 0, fontSize: '0.9rem' }}>
                                <i className="fa fa-copyright" style={{ marginRight: '5px' }}></i>
                                2025 Formula Hub. All Rights Reserved
                            </p>
                        </div>
                        <div className="col-md-6 text-center text-md-right">
                            <p style={{ color: '#666', margin: 0, fontSize: '0.9rem' }}>
                                <a href="#" style={{
                                    color: '#999',
                                    textDecoration: 'none',
                                    marginRight: '1rem',
                                    transition: 'all 0.3s ease'
                                }} onMouseOver={(e) => e.target.style.color = '#dc0000'}
                                   onMouseOut={(e) => e.target.style.color = '#999'}>
                                    Privacy Policy
                                </a>
                                <span style={{ color: '#444' }}>|</span>
                                <a href="#" style={{
                                    color: '#999',
                                    textDecoration: 'none',
                                    margin: '0 1rem',
                                    transition: 'all 0.3s ease'
                                }} onMouseOver={(e) => e.target.style.color = '#dc0000'}
                                   onMouseOut={(e) => e.target.style.color = '#999'}>
                                    Terms & Conditions
                                </a>
                                <span style={{ color: '#444' }}>|</span>
                                <a href="#" style={{
                                    color: '#999',
                                    textDecoration: 'none',
                                    marginLeft: '1rem',
                                    transition: 'all 0.3s ease'
                                }} onMouseOver={(e) => e.target.style.color = '#dc0000'}
                                   onMouseOut={(e) => e.target.style.color = '#999'}>
                                    Shipping Info
                                </a>
                            </p>
                        </div>
                    </div>

                    {/* Racing Badge */}
                    <div className="text-center mt-3">
                        <span style={{
                            display: 'inline-block',
                            padding: '0.5rem 1.5rem',
                            background: 'linear-gradient(135deg, #dc0000 0%, #8b0000 100%)',
                            color: 'white',
                            borderRadius: '25px',
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            border: '2px solid #ff0000'
                        }}>
                            <i className="fa fa-shield-alt" style={{ marginRight: '8px' }}></i>
                            Authentic F1 Merchandise
                        </span>
                    </div>
                </div>
            </footer>
        </>
    )
}

export default Footer