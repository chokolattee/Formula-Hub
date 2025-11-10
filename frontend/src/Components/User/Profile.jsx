import React, { Fragment, useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Loader from '../Layout/Loader'
import MetaData from '../Layout/MetaData'
import { FaRegUser } from "react-icons/fa";
import { MdOutlineShoppingBag, MdSettings } from "react-icons/md";
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getToken } from '../Utils/helpers';
import '../../Styles/profile.css'

const Profile = () => {
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState('')
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const fileInputRef = useRef(null);

    const handleAvatarUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file', {
                position: 'bottom-center'
            });
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB', {
                position: 'bottom-center'
            });
            return;
        }

        console.log("Uploading avatar...", file.name)

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
                // Update avatar immediately
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
            console.error("Error uploading avatar:", error);
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
            console.log("User data:", data.user)
            setUser(data.user)

            // Handle avatar - check if it's an array and has items
            if (data.user.avatar && Array.isArray(data.user.avatar) && data.user.avatar.length > 0) {
                setAvatarUrl(data.user.avatar[0].url)
            } else {
                // Create initials from first_name and last_name or email
                const displayName = data.user.first_name
                    ? `${data.user.first_name} ${data.user.last_name}`.trim()
                    : data.user.email.split('@')[0];
                setAvatarUrl(`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=512&background=E10600&color=fff`)
            }
            setLoading(false)
        } catch (error) {
            console.log(error)
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
                                {/* Tab Buttons */}
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

                                {/* Tab Content */}
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
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        birthday: '',
        gender: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                birthday: user.birthday || '',
                gender: user.gender || ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
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
            console.log(error);
            toast.error(error.response?.data?.message || 'Error updating profile', {
                position: 'bottom-center'
            });
        }
    };

    const handleCancel = () => {
        setFormData({
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
                <form className="edit-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">First Name</label>
                        <input
                            type="text"
                            name="first_name"
                            className="form-input"
                            value={formData.first_name}
                            onChange={handleChange}
                            placeholder="Enter your first name"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Last Name</label>
                        <input
                            type="text"
                            name="last_name"
                            className="form-input"
                            value={formData.last_name}
                            onChange={handleChange}
                            placeholder="Enter your last name"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email Address *</label>
                        <input
                            type="email"
                            name="email"
                            className="form-input"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled
                            style={{ opacity: 0.6, cursor: 'not-allowed' }}
                        />
                        <small style={{ color: '#7a7a8a', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                            Email cannot be changed
                        </small>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Birthday</label>
                        <input
                            type="date"
                            name="birthday"
                            className="form-input"
                            value={formData.birthday}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Gender</label>
                        <select
                            name="gender"
                            className="form-input"
                            value={formData.gender}
                            onChange={handleChange}
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
    const [isSettingPassword, setIsSettingPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        password: '',
        confirmPassword: ''
    });

    // Check if user needs to set password (OAuth users)
    const needsPasswordSetup = !user.password && (user.authProvider === 'google' || user.authProvider === 'facebook');

    const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.password !== passwordData.confirmPassword) {
        toast.error('Passwords do not match', {
            position: 'bottom-center'
        });
        return;
    }

    if (passwordData.password.length < 6) {
        toast.error('Password must be at least 6 characters', {
            position: 'bottom-center'
        });
        return;
    }

    const config = {
        headers: {
            'Authorization': `Bearer ${getToken()}`
        }
    }

    try {
        let endpoint;
        let payload;

        if (needsPasswordSetup) {
            // Get current Firebase user token
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
            
            // Setting password for first time
            endpoint = 'http://localhost:8000/api/v1/password/set';
            payload = { 
                password: passwordData.password,
                token: firebaseToken
            };
        } else {
            // Changing existing password
            endpoint = 'http://localhost:8000/api/v1/password/update';
            payload = {
                oldPassword: passwordData.oldPassword,
                password: passwordData.password
            };
        }

        const { data } = await axios.put(endpoint, payload, config);

        toast.success(data.message || 'Password updated successfully', {
            position: 'bottom-center'
        });
        
        setPasswordData({
            oldPassword: '',
            password: '',
            confirmPassword: ''
        });
        setShowPasswordForm(false);
        getProfile();
    } catch (error) {
        console.log(error);
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
                <form className="edit-form" onSubmit={handlePasswordSubmit}>
                    {!needsPasswordSetup && (
                        <div className="form-group">
                            <label className="form-label">Current Password *</label>
                            <input
                                type="password"
                                name="oldPassword"
                                className="form-input"
                                value={passwordData.oldPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                placeholder="Enter your current password"
                                required
                            />
                        </div>
                    )}
                    <div className="form-group">
                        <label className="form-label">New Password *</label>
                        <input
                            type="password"
                            name="password"
                            className="form-input"
                            value={passwordData.password}
                            onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                            placeholder="Enter new password (min 6 characters)"
                            required
                            minLength="6"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Confirm New Password *</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            className="form-input"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            placeholder="Confirm your new password"
                            required
                            minLength="6"
                        />
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
                                setPasswordData({
                                    oldPassword: '',
                                    password: '',
                                    confirmPassword: ''
                                });
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