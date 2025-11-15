import React, { Fragment, useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import Loader from '../../Layout/Loader'
import MetaData from '../../Layout/MetaData'
import { FaRegUser } from "react-icons/fa";
import { MdOutlineShoppingBag, MdSettings } from "react-icons/md";
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getToken } from '../../Utils/helpers';
import '../../../Styles/profile.css'

const Profile = () => {
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState('')
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const fileInputRef = useRef(null);

    const handleAvatarUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file', {
                position: 'bottom-center'
            });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB', {
                position: 'bottom-center'
            });
            return;
        }

        const formData = new FormData();
        formData.append('avatar', file);

        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${getToken()}`
            }
        }

        try {
            const { data } = await axios.put(`http://localhost:8000/api/v1/me/update`, formData, config);
            
            if (data.success) {
                toast.success('Avatar updated successfully', {
                    position: 'bottom-center'
                });
                if (data.user.avatar && data.user.avatar.length > 0) {
                    setAvatarUrl(data.user.avatar[0].url);
                }
                getProfile();
            } else {
                toast.error(data.message || 'Failed to upload avatar', {
                    position: 'bottom-center'
                });
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to upload avatar';
            toast.error(errorMessage, {
                position: 'bottom-center'
            });
        }
    };

    const handleImageClick = () => {
        fileInputRef.current.click();
    };

    const getProfile = async () => {
        const config = {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        }
        try {
            const { data } = await axios.get(`http://localhost:8000/api/v1/me`, config)
            setUser(data.user)

            if (data.user.avatar && Array.isArray(data.user.avatar) && data.user.avatar.length > 0) {
                setAvatarUrl(data.user.avatar[0].url)
            } else {
                const displayName = data.user.first_name
                    ? `${data.user.first_name} ${data.user.last_name}`.trim()
                    : data.user.email.split('@')[0];
                setAvatarUrl(`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=512&background=E10600&color=fff`)
            }
            setLoading(false)
        } catch (error) {
            toast.error("Failed to load profile", {
                position: 'bottom-center'
            })
            setLoading(false)
        }
    }

    useEffect(() => {
        getProfile()
    }, [])

    return (
        <>
            {loading ? <Loader /> : (
                <>
                    <MetaData title={'Your Profile'} />
                    <section className="profile-container">
                        <div className="side">
                            <div className="main-info">
                                <div className="user-avatar__container" onClick={handleImageClick}>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleAvatarUpload}
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                    />
                                    <img
                                        className='user-img__actual'
                                        src={avatarUrl}
                                        alt={`User Avatar`}
                                    />
                                </div>
                                <div className="user-main__text">
                                    <h6 className='pale'>Welcome,</h6>
                                    <h4>
                                        {user.first_name && user.last_name
                                            ? `${user.first_name} ${user.last_name}`
                                            : user.email?.split('@')[0] || 'User'}
                                    </h4>
                                </div>
                            </div>
                        </div>
                        <div className="profile-main">
                            <div className="profile-content">
                                <div className="profile-tabs">
                                    <button
                                        className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('overview')}
                                    >
                                        PROFILE OVERVIEW
                                    </button>
                                    <button
                                        className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('settings')}
                                    >
                                        SETTINGS
                                    </button>
                                </div>

                                {activeTab === 'overview' ? (
                                    <AccountOverview user={user} getProfile={getProfile} />
                                ) : (
                                    <Settings user={user} getProfile={getProfile} />
                                )}
                            </div>
                        </div>
                    </section>
                </>
            )}
        </>
    )
}

const AccountOverview = ({ user, getProfile }) => {
    const [isEditing, setIsEditing] = useState(false);
    const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
        defaultValues: {
            first_name: '',
            last_name: '',
            email: '',
            birthday: '',
            gender: ''
        }
    });

    useEffect(() => {
        if (user) {
            setValue('first_name', user.first_name || '');
            setValue('last_name', user.last_name || '');
            setValue('email', user.email || '');
            setValue('birthday', user.birthday || '');
            setValue('gender', user.gender || '');
        }
    }, [user, setValue]);

    const onSubmit = async (formData) => {
        const config = {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        }
        try {
            const { data } = await axios.put(`http://localhost:8000/api/v1/me/update`, formData, config);
            toast.success('Profile updated successfully', {
                position: 'bottom-center'
            });
            setIsEditing(false);
            getProfile();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error updating profile', {
                position: 'bottom-center'
            });
        }
    };

    const handleCancel = () => {
        reset({
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            email: user.email || '',
            birthday: user.birthday || '',
            gender: user.gender || ''
        });
        setIsEditing(false);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not set';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <div className="tab-content-wrapper">
            {!isEditing ? (
                <div className="info-card">
                    <div className="info-card-row">
                        <span className="info-label">First Name</span>
                        <span className="info-value">{user.first_name || 'Not set'}</span>
                    </div>
                    <div className="info-card-row">
                        <span className="info-label">Last Name</span>
                        <span className="info-value">{user.last_name || 'Not set'}</span>
                    </div>
                    <div className="info-card-row">
                        <span className="info-label">Email Address</span>
                        <span className="info-value">{user.email}</span>
                    </div>
                    <div className="info-card-row">
                        <span className="info-label">Birthday</span>
                        <span className="info-value">{user.birthday || 'Not set'}</span>
                    </div>
                    <div className="info-card-row">
                        <span className="info-label">Gender</span>
                        <span className="info-value">{user.gender || 'Not set'}</span>
                    </div>
                    <div className="info-card-row">
                        <span className="info-label">Account Status</span>
                        <span className="info-value">{user.status}</span>
                    </div>
                    <div className="info-card-row">
                        <span className="info-label">Joined On</span>
                        <span className="info-value">{formatDate(user.createdAt)}</span>
                    </div>
                    <div className="edit-button-container">
                        <button className="edit-profile-button" onClick={() => setIsEditing(true)}>
                            <FaRegUser /> Edit Profile
                        </button>
                    </div>
                </div>
            ) : (
                <form className="edit-form" onSubmit={handleSubmit(onSubmit)}>
                    <div className="form-group">
                        <label className="form-label">First Name</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter your first name"
                            {...register('first_name', {
                                minLength: {
                                    value: 2,
                                    message: 'First name must be at least 2 characters'
                                },
                                maxLength: {
                                    value: 50,
                                    message: 'First name must not exceed 50 characters'
                                },
                                pattern: {
                                    value: /^[a-zA-Z\s'-]+$/,
                                    message: 'First name can only contain letters, spaces, hyphens and apostrophes'
                                }
                            })}
                        />
                        {errors.first_name && (
                            <span className="error-message">{errors.first_name.message}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Last Name</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter your last name"
                            {...register('last_name', {
                                minLength: {
                                    value: 2,
                                    message: 'Last name must be at least 2 characters'
                                },
                                maxLength: {
                                    value: 50,
                                    message: 'Last name must not exceed 50 characters'
                                },
                                pattern: {
                                    value: /^[a-zA-Z\s'-]+$/,
                                    message: 'Last name can only contain letters, spaces, hyphens and apostrophes'
                                }
                            })}
                        />
                        {errors.last_name && (
                            <span className="error-message">{errors.last_name.message}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email Address *</label>
                        <input
                            type="email"
                            className="form-input"
                            disabled
                            style={{ opacity: 0.6, cursor: 'not-allowed' }}
                            {...register('email')}
                        />
                        <small style={{ color: '#7a7a8a', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                            Email cannot be changed
                        </small>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Birthday</label>
                        <input
                            type="date"
                            className="form-input"
                            {...register('birthday', {
                                validate: {
                                    notFuture: (value) => {
                                        if (!value) return true;
                                        return new Date(value) <= new Date() || 'Birthday cannot be in the future';
                                    },
                                    validAge: (value) => {
                                        if (!value) return true;
                                        const birthDate = new Date(value);
                                        const today = new Date();
                                        const age = today.getFullYear() - birthDate.getFullYear();
                                        return age >= 13 || 'You must be at least 13 years old';
                                    }
                                }
                            })}
                        />
                        {errors.birthday && (
                            <span className="error-message">{errors.birthday.message}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Gender</label>
                        <select
                            className="form-input"
                            {...register('gender')}
                        >
                            <option value="">Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                            <option value="prefer-not-to-say">Prefer not to say</option>
                        </select>
                    </div>

                    <div className="form-buttons">
                        <button type="submit" className="save-button">
                            Save Changes
                        </button>
                        <button type="button" className="cancel-button" onClick={handleCancel}>
                            Cancel
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}

const Settings = ({ user, getProfile }) => {
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
        defaultValues: {
            oldPassword: '',
            password: '',
            confirmPassword: ''
        }
    });

    const needsPasswordSetup = !user.password && (user.authProvider === 'google' || user.authProvider === 'facebook');
    const password = watch('password');

    const onSubmit = async (formData) => {
        const config = {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        }

        try {
            let endpoint;
            let payload;

            if (needsPasswordSetup) {
                const { getAuth } = await import('firebase/auth');
                const auth = getAuth();
                const currentUser = auth.currentUser;
                
                if (!currentUser) {
                    toast.error('Please login again to set password', {
                        position: 'bottom-center'
                    });
                    return;
                }
                
                const firebaseToken = await currentUser.getIdToken();
                
                endpoint = 'http://localhost:8000/api/v1/password/set';
                payload = { 
                    password: formData.password,
                    token: firebaseToken
                };
            } else {
                endpoint = 'http://localhost:8000/api/v1/password/update';
                payload = {
                    oldPassword: formData.oldPassword,
                    password: formData.password
                };
            }

            const { data } = await axios.put(endpoint, payload, config);

            toast.success(data.message || 'Password updated successfully', {
                position: 'bottom-center'
            });
            
            reset();
            setShowPasswordForm(false);
            getProfile();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error updating password', {
                position: 'bottom-center'
            });
        }
    };

    return (
        <div className="tab-content-wrapper">
            {!showPasswordForm ? (
                <div className="settings-card">
                    <button
                        className="settings-action-button"
                        onClick={() => setShowPasswordForm(true)}
                    >
                        <MdSettings size={20} />
                        <span>{needsPasswordSetup ? 'Set Password' : 'Change Password'}</span>
                    </button>
                </div>
            ) : (
                <form className="edit-form" onSubmit={handleSubmit(onSubmit)}>
                    {!needsPasswordSetup && (
                        <div className="form-group">
                            <label className="form-label">Current Password *</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="Enter your current password"
                                {...register('oldPassword', {
                                    required: 'Current password is required'
                                })}
                            />
                            {errors.oldPassword && (
                                <span className="error-message">{errors.oldPassword.message}</span>
                            )}
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">New Password *</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Enter new password (min 6 characters)"
                            {...register('password', {
                                required: 'New password is required',
                                minLength: {
                                    value: 6,
                                    message: 'Password must be at least 6 characters'
                                },
                                maxLength: {
                                    value: 128,
                                    message: 'Password must not exceed 128 characters'
                                },
                                pattern: {
                                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                                    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
                                }
                            })}
                        />
                        {errors.password && (
                            <span className="error-message">{errors.password.message}</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Confirm New Password *</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Confirm your new password"
                            {...register('confirmPassword', {
                                required: 'Please confirm your password',
                                validate: (value) => value === password || 'Passwords do not match'
                            })}
                        />
                        {errors.confirmPassword && (
                            <span className="error-message">{errors.confirmPassword.message}</span>
                        )}
                    </div>

                    <div className="form-buttons">
                        <button type="submit" className="save-button">
                            {needsPasswordSetup ? 'Set Password' : 'Update Password'}
                        </button>
                        <button
                            type="button"
                            className="cancel-button"
                            onClick={() => {
                                setShowPasswordForm(false);
                                reset();
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}

export default Profile