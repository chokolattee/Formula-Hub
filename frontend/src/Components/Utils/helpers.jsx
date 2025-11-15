import { toast } from 'react-toastify';

export const authenticate = (data, next) => {
    if (typeof window !== 'undefined') {
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
    }
    next();
};

export const getUser = () => {
    if (typeof window !== 'undefined') {
        const userStr = sessionStorage.getItem('user');
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch (error) {
                console.error('Error parsing user:', error);
                return false;
            }
        } else {
            return false;
        }
    }
};

export const logout = next => {
    if (typeof window !== 'undefined') {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
    }
    next();
};

export const getToken = () => {
    if (typeof window !== 'undefined') {
        const token = sessionStorage.getItem('token');
        if (token && token !== 'undefined' && token !== 'null') {
            return token.trim();
        } else {
            return false;
        }
    }
};

export const isAdmin = () => {
    const user = getUser();
    return user && user.role === 'admin';
};

export const errMsg = (message = '') => toast.error(message, {
    position: 'bottom-center'
});

export const successMsg = (message = '') => toast.success(message, {
    position: 'bottom-center'
});