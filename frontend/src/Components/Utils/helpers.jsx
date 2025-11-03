// Utils/helpers.jsx

export const authenticate = (data, next) => {
    if (typeof window !== 'undefined') {
        // Store token as plain string, not JSON
        sessionStorage.setItem('token', data.token);
        // Store user as JSON string
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

// Remove token from session storage
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
            // Return token as-is, no JSON parsing needed
            return token.trim();
        } else {
            return false;
        }
    }
};