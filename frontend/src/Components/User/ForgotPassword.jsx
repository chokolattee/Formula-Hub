import React, { useState } from 'react'
import MetaData from '../Layout/MetaData'
import axios from 'axios'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useNavigate, Link } from "react-router-dom"
import { MdEmail, MdArrowBack } from "react-icons/md"
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import '../../Styles/auth.css'

// Validation schema
const forgotPasswordSchema = yup.object({
    email: yup
        .string()
        .required('Email address is required')
        .email('Please enter a valid email address')
        .trim()
}).required()

const ForgotPassword = () => {
    const [loading, setLoading] = useState(false)
    
    const navigate = useNavigate()

    // React Hook Form setup
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm({
        mode: 'onBlur',
        resolver: yupResolver(forgotPasswordSchema),
        defaultValues: {
            email: ''
        }
    })

    const forgotPassword = async (email) => {
        const config = { headers: { 'Content-Type': 'application/json' } }
        setLoading(true)
        
        try {
            const { data } = await axios.post(
                'http://localhost:8000/api/v1/password/forgot',
                { email }, 
                config
            )
            toast.success(data.message, { position: 'bottom-center' })
            setLoading(false)
            reset() // Clear form on success
            setTimeout(() => {
                navigate('/login')
            }, 2000)
        } catch (error) {
            toast.error(error.response?.data?.error || 'Something went wrong', {
                position: 'bottom-center',
            })
            setLoading(false)
        }
    }

    const onSubmit = async (data) => {
        await forgotPassword(data.email)
    }

    return (
        <>
            <MetaData title={'Forgot Password'} />
            <div className="auth-wrapper">
                <div className="auth-container">
                    <div className="auth-card">
                        <div className="auth-header">
                            <h2 className="auth-title">Forgot Password?</h2>
                            <p className="auth-subtitle">
                                Enter your email address and we'll send you a link to reset your password.
                            </p>
                        </div>

                        <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
                            <div className="form-group">
                                <label htmlFor="email_field" className="form-label">
                                    Email Address
                                </label>
                                <div className="input-wrapper">
                                    <MdEmail className="input-icon" />
                                    <input
                                        type="email"
                                        id="email_field"
                                        className={`form-input ${errors.email ? 'input-error' : ''}`}
                                        placeholder="Enter your email"
                                        disabled={loading}
                                        {...register('email')}
                                    />
                                </div>
                                {errors.email && (
                                    <span className="error-message">
                                        {errors.email.message}
                                    </span>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="auth-submit-btn"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner"></span>
                                        Sending...
                                    </>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </button>

                            <div className="auth-footer">
                                <Link to="/login" className="back-link">
                                    <MdArrowBack /> Back to Login
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ForgotPassword