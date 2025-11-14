import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaFacebook } from "react-icons/fa";
import { BiLogoGmail } from "react-icons/bi";
import TextField from '@mui/material/TextField';
import axios from 'axios';
import { authenticate, getUser } from '../Utils/helpers';
import Loader from '../Layout/Loader'
import MetaData from '../Layout/MetaData';
import { 
  firebaseLogin, 
  firebaseRegister, 
  signInWithGoogle, 
  signInWithFacebook 
} from '../Firebase/auth';


const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [formActive, setFormActive] = useState('login')
    const [isOpen, setIsOpen] = useState(true)

    let location = useLocation()
    const navigate = useNavigate()

    const redirect = location.search ? new URLSearchParams(location.search).get('redirect') : ''

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'email') setEmail(value);
        if (name === 'password') setPassword(value);
        setError('');
    };

    const loginAttempt = async () => {
        try {
            setError('')
            console.log("=== LOGIN ATTEMPT ===");
            console.log("Email:", email);
            console.log("Password length:", password.length);

            const user = await firebaseLogin(email, password)
            console.log("Firebase login successful!");
            console.log("User UID:", user.uid);
            console.log("User Email:", user.email);

            const token = await user.getIdToken();
            console.log("Token obtained, length:", token.length);

            console.log("Sending token to backend...");
            const res = await axios.post("http://localhost:8000/api/v1/auth", { token });
            console.log("Backend response:", res.data);

            if (res.data.success) {
                console.log("Login successful!");
                authenticate(res.data, () => navigate("/"))
                return true;
            } else {
                setError(res.data.message || "Login failed")
                return false;
            }
        } catch (e) {
            console.error("=== LOGIN ERROR ===");
            console.error("Error code:", e.code);
            console.error("Error message:", e.message);
            console.error("Full error:", e);

            let errorMessage = "Login failed. Please check your credentials.";

            // Handle specific Firebase errors
            if (e.code === 'auth/invalid-credential') {
                errorMessage = "Invalid email or password. Please check your credentials or register first.";
            } else if (e.code === 'auth/user-not-found') {
                errorMessage = "No account found with this email. Please register first.";
            } else if (e.code === 'auth/wrong-password') {
                errorMessage = "Incorrect password. Please try again.";
            } else if (e.code === 'auth/invalid-email') {
                errorMessage = "Invalid email format.";
            } else if (e.code === 'auth/too-many-requests') {
                errorMessage = "Too many failed attempts. Please try again later.";
            } else if (e.response?.data?.message) {
                errorMessage = e.response.data.message;
            }

            setError(errorMessage);
            toast.error(errorMessage, {
                position: 'bottom-right'
            });
            return false;
        }
    }

    const registerAttempt = async () => {
        try {
            setError('')
            console.log("=== REGISTER ATTEMPT ===");

            // Register with Firebase
            const user = await firebaseRegister(email, password)
            console.log("Firebase registration successful!");
            console.log("User UID:", user.uid);

            // Get token and send to backend WITH PASSWORD
            const token = await user.getIdToken();
            
            // CRITICAL FIX: Send password to backend so MongoDB can store the same password
            const res = await axios.post("http://localhost:8000/api/v1/register", { 
                token,
                password  // ✅ Now sending the actual password user entered
            });

            if (res.data.success) {
                toast.success("Registration successful! Please login.", {
                    position: 'bottom-right'
                })
                setFormActive('login')
                resetForm()
                return true;
            } else {
                setError(res.data.message || "Registration failed")
                return false;
            }
        } catch (e) {
            console.error("Registration error:", e)
            let errorMessage = "Registration failed. Please try again."
            
            // Handle specific Firebase errors
            if (e.code === 'auth/email-already-in-use') {
                errorMessage = "This email is already registered. Please login instead.";
            } else if (e.code === 'auth/weak-password') {
                errorMessage = "Password should be at least 6 characters.";
            } else if (e.code === 'auth/invalid-email') {
                errorMessage = "Invalid email format.";
            } else if (e.response?.data?.message) {
                errorMessage = e.response.data.message;
            }
            
            setError(errorMessage)
            toast.error(errorMessage, {
                position: 'bottom-right'
            })
            return false;
        }
    }

    const submitHandler = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            setError("Please enter both email and password")
            return;
        }

        setLoading(true)
        
        if (formActive === 'login') {
            const success = await loginAttempt()
            if (success) {
                setTimeout(() => {
                    navigate('/');
                    window.location.reload();
                }, 1000)
            }
            setLoading(false)
        } else {
            await registerAttempt()
            setLoading(false)
        }
        setLoading(false)
    }

    const loginWithGoogle = async () => {
        try {
            setLoading(true)
            setError('')
            const user = await signInWithGoogle()  
            const token = await user.getIdToken();

            const res = await axios.post("http://localhost:8000/api/v1/auth/google", { token });

            if (res.data.success) {
                authenticate(res.data, () => {
                    setTimeout(() => {
                        navigate('/');
                        window.location.reload();
                    }, 1000);
                })
            }
        } catch (e) {
            console.error("Google login error:", e)
            const errorMessage = e.response?.data?.message || "Google login failed. Please try again."
            setError(errorMessage)
            toast.error(errorMessage, {
                position: 'bottom-right'
            });
            setLoading(false)
        }
    }

    const loginWithFacebook = async () => {
        try {
            setLoading(true)
            setError('')
            
            const user = await signInWithFacebook()
            const token = await user.getIdToken();

            const res = await axios.post("http://localhost:8000/api/v1/auth/facebook", { token });

            if (res.data.success) {
                authenticate(res.data, () => {
                    setTimeout(() => {
                        navigate('/');
                        window.location.reload();
                    }, 1000);
                })
            }
        } catch (e) {
            console.error("Facebook login error:", e)
            const errorMessage = e.response?.data?.message || "Facebook login failed. Please try again."
            setError(errorMessage)
            toast.error(errorMessage, {
                position: 'bottom-right'
            });
            setLoading(false)
        }
    }

    const resetForm = () => {
        setEmail('')
        setPassword('')
        setError('')
    }

    const handleClose = () => {
        setIsOpen(false)
        navigate('/')
    }

    useEffect(() => {
        if (getUser() && redirect === 'shipping') {
            navigate(`/${redirect}`)
        }
    }, [])

    if (!isOpen) return null;

    return (
        <>
            {loading ? <Loader /> : (
                <>
                    <MetaData title={formActive === 'login' ? 'Login' : 'Register'} />
                    <div className="modal-background" onClick={handleClose}>
                        <div className="login-modal__container" onClick={(e) => e.stopPropagation()}>
                            <div className="logo-container">
                                <img src="/images/logo.png" alt="Logo" />
                            </div>
                            <hr />

                            {error && (
                                <div style={{
                                    backgroundColor: '#fee',
                                    color: '#c33',
                                    padding: '10px',
                                    borderRadius: '4px',
                                    marginBottom: '10px',
                                    textAlign: 'center'
                                }}>
                                    {error}
                                </div>
                            )}

                            <div className="form-selection">
                                <button
                                    className={`styled-button ${formActive === 'login' ? 'active' : ''}`}
                                    onClick={() => {
                                        setFormActive('login')
                                        resetForm()
                                    }}
                                    disabled={loading}
                                >
                                    Sign In
                                </button>

                                <button
                                    className={`styled-button ${formActive === 'register' ? 'active' : ''}`}
                                    onClick={() => {
                                        setFormActive('register')
                                        resetForm()
                                    }}
                                    disabled={loading}
                                >
                                    Sign Up
                                </button>
                            </div>

                            <div className={`form-panel ${formActive === 'login' ? 'login-active' : 'register-active'}`}>
                                <form onSubmit={submitHandler} className="login-form">
                                    <div className="input-group">
                                        <TextField
                                            label="Email"
                                            variant="standard"
                                            name="email"
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={handleChange}
                                            disabled={loading}
                                            required
                                            fullWidth
                                            sx={{
                                                "& .MuiInputLabel-root.Mui-focused": {
                                                    color: "var(--primary-color)"
                                                },
                                                "& .MuiInput-underline:after": {
                                                    borderBottomColor: "var(--primary-color)"
                                                },
                                                "& .MuiInput-underline:before": {
                                                    borderBottomColor: "#666666"
                                                },
                                                "& .MuiInputBase-input": {
                                                    color: "#000000 !important",
                                                    fontWeight: "500",
                                                    WebkitTextFillColor: "#000000 !important"
                                                },
                                                "& .MuiInputLabel-root": {
                                                    color: "#333333",
                                                    fontWeight: "500"
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <TextField
                                            label="Password"
                                            variant="standard"
                                            name="password"
                                            id="password"
                                            type="password"
                                            placeholder='Enter your Password'
                                            value={password}
                                            onChange={handleChange}
                                            disabled={loading}
                                            required
                                            fullWidth
                                            sx={{
                                                "& .MuiInputLabel-root.Mui-focused": {
                                                    color: "var(--primary-color)"
                                                },
                                                "& .MuiInput-underline:after": {
                                                    borderBottomColor: "var(--primary-color)"
                                                },
                                                "& .MuiInput-underline:before": {
                                                    borderBottomColor: "#666666"
                                                },
                                                "& .MuiInputBase-input": {
                                                    color: "#000000 !important",
                                                    fontWeight: "500",
                                                    WebkitTextFillColor: "#000000 !important"
                                                },
                                                "& .MuiInputLabel-root": {
                                                    color: "#333333",
                                                    fontWeight: "500"
                                                }
                                            }} />
                                    </div>
                                    
                                    {formActive === 'login' && (
                                        <div className="between-utils">
                                            <div className="remember-me">
                                                <input type="checkbox" className='remember-me__checkbox' />
                                                <label htmlFor="checkbox" style={{ color: '#000000', fontWeight: '500' }}>Remember Me?</label>
                                            </div>
                                            <div>
                                                <Link to="/password/forgot" style={{ color: '#000000', fontWeight: '500', textDecoration: 'underline' }}>Forgot Password</Link>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <button type="submit" className='full-width prime-button' disabled={loading}>
                                        {loading ? (formActive === 'login' ? 'Logging in...' : 'Signing up...') : (formActive === 'login' ? 'Login' : 'Sign Up')}
                                    </button>
                                </form>
                            </div>

                            <div className="line-break">
                                <span style={{ color: '#000000', fontWeight: '500' }}>Or Sign in with</span>
                            </div>

                            <div className="alt-login">
                                <button
                                    className='prime-button facebook-button'
                                    onClick={loginWithFacebook}
                                    disabled={loading}
                                    type="button"
                                >
                                    <FaFacebook className='btn-icon' />
                                    Facebook
                                </button>
                                <button
                                    className='prime-button gmail-button'
                                    onClick={loginWithGoogle}
                                    disabled={loading}
                                    type="button"
                                >
                                    <BiLogoGmail className='btn-icon' />
                                    Gmail
                                </button>
                            </div>
                        </div>
                    </div>

                    <style jsx>{`
                        :root {
                            --primary-color: #E10600;
                        }

                        .modal-background {
                            position: fixed;
                            top: 0;
                            left: 0;
                            right: 0;
                            bottom: 0;
                            background: rgba(0, 0, 0, 0.7);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            z-index: 9999;
                            padding: 20px;
                            backdrop-filter: blur(5px);
                        }

                        .login-modal__container {
                            background: white;
                            border-radius: 20px;
                            padding: 40px;
                            width: 100%;
                            max-width: 450px;
                            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                            max-height: 90vh;
                            overflow-y: auto;
                            animation: slideIn 0.3s ease-out;
                        }

                        @keyframes slideIn {
                            from {
                                opacity: 0;
                                transform: translateY(-50px);
                            }
                            to {
                                opacity: 1;
                                transform: translateY(0);
                            }
                        }

                        .logo-container {
                            text-align: center;
                            margin-bottom: 20px;
                        }

                        .logo-container img {
                            max-width: 150px;
                            height: auto;
                        }

                        hr {
                            border: none;
                            border-top: 1px solid #e0e0e0;
                            margin: 20px 0;
                        }

                        .form-selection {
                            display: flex;
                            gap: 10px;
                            margin-bottom: 30px;
                        }

                        .styled-button {
                            flex: 1;
                            padding: 12px 20px;
                            border: 2px solid #e0e0e0;
                            background: white;
                            color: #666;
                            font-weight: 600;
                            font-size: 16px;
                            border-radius: 10px;
                            cursor: pointer;
                            transition: all 0.3s ease;
                        }

                        .styled-button:hover {
                            border-color: var(--primary-color);
                            color: var(--primary-color);
                        }

                        .styled-button.active {
                            background: var(--primary-color);
                            color: white;
                            border-color: var(--primary-color);
                        }

                        .styled-button:disabled {
                            opacity: 0.6;
                            cursor: not-allowed;
                        }

                        .form-panel {
                            margin-bottom: 20px;
                        }

                        .login-form {
                            display: flex;
                            flex-direction: column;
                            gap: 20px;
                        }

                        .input-group {
                            margin-bottom: 10px;
                            color: #1a1a1aff;
                        }

                        .between-utils {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin: 10px 0;
                        }

                        .remember-me {
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        }

                        .remember-me__checkbox {
                            width: 16px;
                            height: 16px;
                            cursor: pointer;
                        }

                        .full-width {
                            width: 100%;
                        }

                        .prime-button {
                            padding: 12px 24px;
                            background: var(--primary-color);
                            color: white;
                            border: none;
                            border-radius: 10px;
                            font-weight: 600;
                            font-size: 16px;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 10px;
                        }

                        .prime-button:hover {
                            background: #B80500;
                            transform: translateY(-2px);
                            box-shadow: 0 5px 15px rgba(225, 6, 0, 0.3);
                        }

                        .prime-button:disabled {
                            opacity: 0.6;
                            cursor: not-allowed;
                            transform: none;
                        }

                        .line-break {
                            text-align: center;
                            margin: 30px 0 20px;
                            position: relative;
                        }

                        .line-break::before,
                        .line-break::after {
                            content: '';
                            position: absolute;
                            top: 50%;
                            width: 40%;
                            height: 1px;
                            background: #e0e0e0;
                        }

                        .line-break::before {
                            left: 0;
                        }

                        .line-break::after {
                            right: 0;
                        }

                        .alt-login {
                            display: flex;
                            gap: 10px;
                        }

                        .facebook-button {
                            background: #1877f2;
                            flex: 1;
                        }

                        .facebook-button:hover {
                            background: #0c63d4;
                        }

                        .gmail-button {
                            background: #db4437;
                            flex: 1;
                        }

                        .gmail-button:hover {
                            background: #c23321;
                        }

                        .btn-icon {
                            font-size: 20px;
                        }

                        .mt-20 {
                            margin-top: 20px;
                        }

                        @media (max-width: 576px) {
                            .login-modal__container {
                                padding: 30px 20px;
                                max-height: 95vh;
                            }

                            .alt-login {
                                flex-direction: column;
                            }
                        }
                    `}</style>
                </>
            )}
        </>
    )
}

export default Login