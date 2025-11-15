import { useState, useEffect } from 'react'
import { useNavigate, useParams } from "react-router-dom";
import MetaData from '../Layout/MetaData'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import '../../Styles/auth.css'

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

const schema = yup.object().shape({
    password: yup
        .string()
        .required("Password is required")
        .min(6, "Password must be at least 6 characters"),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref("password")], "Passwords do not match")
        .required("Confirm Password is required")
});

const NewPassword = () => {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const { token } = useParams();

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm({
        resolver: yupResolver(schema)
    });

    const resetPassword = async (token, formData) => {
        try {
            const config = { headers: { 'Content-Type': 'application/json' } };

            const { data } = await axios.put(
                `http://localhost:8000/api/v1/password/reset/${token}`,
                formData,
                config
            );

            setSuccess(data.success);
        } catch (error) {
            setError(error.response?.data?.message || "Something went wrong");
        }
    };

    useEffect(() => {
        if (error) {
            toast.error(error, { position: 'bottom-right' });
        }
        if (success) {
            toast.success('Password updated successfully!', { position: 'bottom-right' });
            navigate('/login');
        }
    }, [error, success, navigate]);

    const onSubmit = (data) => {
        const formData = new FormData();
        formData.set('password', data.password);
        formData.set('confirmPassword', data.confirmPassword);

        resetPassword(token, formData);
    };

    return (
        <>
            <MetaData title="New Password Reset" />

            <div className="auth-wrapper">
                <div className="auth-container">
                    <div className="auth-card">

                        <div className="auth-header">
                            <h2 className="auth-title">Reset Password</h2>
                            <p className="auth-subtitle">
                                Enter your new password below
                            </p>
                        </div>

                        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>

                            {/* Password */}
                            <div className="form-group">
                                <label className="form-label">New Password</label>

                                <div className="input-wrapper">
                                    <i className="input-icon ri-lock-password-line"></i>

                                    <input
                                        type="password"
                                        className={`form-input ${errors.password ? "invalid" : ""}`}
                                        {...register("password")}
                                    />
                                </div>

                                {/* Validation Error */}
                                {errors.password && (
                                    <p className="error-message">{errors.password.message}</p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="form-group">
                                <label className="form-label">Confirm New Password</label>

                                <div className="input-wrapper">
                                    <i className="input-icon ri-lock-line"></i>

                                    <input
                                        type="password"
                                        className={`form-input ${errors.confirmPassword ? "invalid" : ""}`}
                                        {...register("confirmPassword")}
                                    />
                                </div>

                                {/* Validation Error */}
                                {errors.confirmPassword && (
                                    <p className="error-message">{errors.confirmPassword.message}</p>
                                )}
                            </div>

                            <button type="submit" className="auth-submit-btn">
                                Set Password
                            </button>

                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default NewPassword;
