import axios from 'axios';

const api = axios.create({
    baseURL: 'https://flashlearn-7ayp.onrender.com',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('flashlearn_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('flashlearn_token');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
