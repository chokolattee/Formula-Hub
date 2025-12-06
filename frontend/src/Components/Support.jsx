import React, { useState } from 'react'
import MetaData from './Layout/MetaData'
import { FaHeadset, FaShippingFast, FaUndo, FaShieldAlt, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa'
import { toast } from 'react-toastify'
import '../Styles/support.css'

const Support = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    })

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        
        if (!formData.name || !formData.email || !formData.subject || !formData.message) {
            toast.error('Please fill in all fields', { position: 'top-center' })
            return
        }

        // Here you would typically send the form data to your backend
        console.log('Support form submitted:', formData)
        
        toast.success('Message sent successfully! We will get back to you soon.', { 
            position: 'bottom-right' 
        })
        
        // Reset form
        setFormData({
            name: '',
            email: '',
            subject: '',
            message: ''
        })
    }

    const faqs = [
        {
            question: "How do I track my order?",
            answer: "Once your order ships, you'll receive a tracking number via email. You can also track your order by logging into your account and viewing your order history."
        },
        {
            question: "What is your return policy?",
            answer: "We offer a 30-day return policy for all unused items in original packaging. Limited edition items may have different terms. Please contact support for specific cases."
        },
        {
            question: "Are all products authentic?",
            answer: "Yes! All our F1 collectibles are 100% authentic and officially licensed. We guarantee the authenticity of every item we sell."
        },
        {
            question: "How long does shipping take?",
            answer: "Standard shipping takes 5-7 business days. Express shipping is available and takes 2-3 business days. International orders may take 10-14 business days."
        },
        {
            question: "Do you ship internationally?",
            answer: "Yes, we ship to most countries worldwide. Shipping costs and delivery times vary by location. Check our shipping calculator at checkout."
        },
        {
            question: "How can I contact customer support?",
            answer: "You can reach us via email at support@formulahub.com, call us at +1 (800) 123-4567, or use the contact form below. We respond within 24 hours."
        }
    ]

    return (
        <>
            <MetaData title="Support | FormulaHub" />
            
            {/* Hero Section */}
            <section className="support-hero">
                <div className="racing-stripes"></div>
                <div className="support-hero-content">
                    <FaHeadset className="support-hero-icon" />
                    <h1 className="support-hero-title">CUSTOMER SUPPORT</h1>
                    <p className="support-hero-subtitle">We're Here to Help You Race Ahead</p>
                </div>
            </section>

            {/* Quick Help Section */}
            <section className="quick-help-section">
                <div className="support-container">
                    <h2 className="section-title">QUICK HELP</h2>
                    <div className="quick-help-grid">
                        <div className="help-card">
                            <div className="help-icon">
                                <FaShippingFast />
                            </div>
                            <h3>Shipping Info</h3>
                            <p>Fast & reliable delivery worldwide. Track your order in real-time.</p>
                        </div>
                        <div className="help-card">
                            <div className="help-icon">
                                <FaUndo />
                            </div>
                            <h3>Returns</h3>
                            <p>30-day hassle-free returns on all eligible items.</p>
                        </div>
                        <div className="help-card">
                            <div className="help-icon">
                                <FaShieldAlt />
                            </div>
                            <h3>Authenticity</h3>
                            <p>100% genuine F1 collectibles with certificate of authenticity.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="faq-section">
                <div className="support-container">
                    <h2 className="section-title">FREQUENTLY ASKED QUESTIONS</h2>
                    <div className="faq-grid">
                        {faqs.map((faq, index) => (
                            <div key={index} className="faq-item">
                                <h3 className="faq-question">{faq.question}</h3>
                                <p className="faq-answer">{faq.answer}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section className="contact-section">
                <div className="support-container">
                    <div className="contact-wrapper">
                        {/* Contact Info */}
                        <div className="contact-info">
                            <h2 className="contact-title">GET IN TOUCH</h2>
                            <p className="contact-description">
                                Have a question? Our support team is ready to assist you.
                            </p>
                            
                            <div className="contact-details">
                                <div className="contact-item">
                                    <FaEnvelope className="contact-icon" />
                                    <div>
                                        <h4>Email</h4>
                                        <p>support@formulahub.com</p>
                                    </div>
                                </div>
                                <div className="contact-item">
                                    <FaPhone className="contact-icon" />
                                    <div>
                                        <h4>Phone</h4>
                                        <p>+1 (800) 123-4567</p>
                                    </div>
                                </div>
                                <div className="contact-item">
                                    <FaMapMarkerAlt className="contact-icon" />
                                    <div>
                                        <h4>Address</h4>
                                        <p>123 Racing Street, Metro Manila, PH</p>
                                    </div>
                                </div>
                            </div>

                            <div className="support-hours">
                                <h4>Support Hours</h4>
                                <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                                <p>Saturday: 10:00 AM - 4:00 PM</p>
                                <p>Sunday: Closed</p>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="contact-form-wrapper">
                            <form className="contact-form" onSubmit={handleSubmit}>
                                <h3 className="form-title">SEND US A MESSAGE</h3>
                                
                                <div className="form-group">
                                    <label htmlFor="name">Name</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Your name"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="email">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="your.email@example.com"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="subject">Subject</label>
                                    <input
                                        type="text"
                                        id="subject"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        placeholder="How can we help?"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="message">Message</label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        placeholder="Tell us more about your inquiry..."
                                        rows="5"
                                        required
                                    ></textarea>
                                </div>

                                <button type="submit" className="submit-btn">
                                    SEND MESSAGE
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}

export default Support