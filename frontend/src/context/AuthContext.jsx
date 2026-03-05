import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/auth';
import { useNavigate } from 'react-router-dom';
import toast from '../utils/sweetalert';
import { io } from 'socket.io-client';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Socket instance
    const [socket, setSocket] = useState(null);

    // Initial load
    useEffect(() => {
        const storedUser = authService.getCurrentUser();
        if (storedUser) {
            setUser(storedUser);
        }
        setLoading(false);
    }, []);

    // Socket.io Connection & Session Enforcement
    useEffect(() => {
        let newSocket;

        if (user && (user._id || user.id)) {
            const userId = user._id || user.id;
            // console.log('🔌 Connecting to Socket.io for user:', userId);

            // Use the base URL (strip /api if present)
            const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace('/api', '');

            newSocket = io(apiUrl, {
                withCredentials: true,
                transports: ['websocket', 'polling']
            });

            newSocket.on('connect', () => {
                // console.log('✅ Socket connected:', newSocket.id);
                newSocket.emit('join', userId);
            });

            newSocket.on('force-logout', (data) => {
                // console.log('⚠️ Reached force-logout event:', data);
                // Clear state and storage immediately
                authService.logout().then(() => {
                    setUser(null);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    toast.error(data.message || 'Logged out because you signed in on another device', {
                        toastId: 'force-logout-toast', // Prevent duplicate toasts
                        autoClose: 5000
                    });
                    navigate('/login', { replace: true });
                });
            });

            setSocket(newSocket);
        }

        return () => {
            if (newSocket) {
                // console.log('🔌 Disconnecting socket');
                newSocket.disconnect();
            }
        };
    }, [user, navigate]);

    // Session Heartbeat
    useEffect(() => {
        let interval;
        if (user) {
            // Send heartbeat every 60 seconds
            const sendHeartbeat = () => authService.heartbeat().catch(err => {
                if (err.code === 'SESSION_EXPIRED') {
                    // This is handled by api.js interceptor usually, 
                    // but we can be proactive here too.
                    logout();
                }
            });

            sendHeartbeat(); // Immediate call
            interval = setInterval(sendHeartbeat, 60000);
        }
        return () => clearInterval(interval);
    }, [user]);

    const login = async (credentials) => {
        try {
            const response = await authService.login(credentials);

            // If PIN is required, redirect to PIN page
            if (response.pinRequired) {
                toast.info(response.message || 'Please complete PIN verification');
                return response;
            }

            if (response.data && response.data.user) {
                setUser(response.data.user);
                toast.success('Login successful!');

                // Redirect based on role
                const role = response.data.user.role;
                if (role === 'admin') {
                    navigate('/admin/dashboard', { replace: true });
                } else if (role === 'vendor') {
                    navigate('/vendor/dashboard', { replace: true });
                } else {
                    navigate('/reader/dashboard', { replace: true });
                }
            } else {
                console.error("Login response missing user data:", response);
                throw new Error('Invalid response from server');
            }

            return response;
        } catch (error) {
            console.error("Login Error:", error);
            if (error.code !== 'SESSION_ACTIVE') {
                toast.error(error.message || 'Login failed', { toastId: 'auth-toast' });
            }
            throw error;
        }
    };

    const requestLoginOTP = async (identifier, channel) => {
        try {
            const response = await authService.requestLoginOTP(identifier, channel);
            toast.success(`OTP sent to your ${channel}!`);
            return response;
        } catch (error) {
            toast.error(error.message || 'Failed to send OTP', { toastId: 'auth-toast' });
            throw error;
        }
    };

    const verifyLoginOTP = async (identifier, otp, channel) => {
        try {
            const response = await authService.verifyLoginOTP(identifier, otp, channel);
            if (response.data && response.data.user) {
                setUser(response.data.user);
                toast.success('Login successful!');

                // Redirect based on role
                const role = response.data.user.role;
                if (role === 'admin') {
                    navigate('/admin/dashboard', { replace: true });
                } else if (role === 'vendor') {
                    navigate('/vendor/dashboard', { replace: true });
                } else {
                    navigate('/reader/dashboard', { replace: true });
                }
            }
            return response;
        } catch (error) {
            toast.error(error.message || 'Verification failed', { toastId: 'auth-toast' });
            throw error;
        }
    };

    const register = async (userData) => {
        try {
            const response = await authService.register(userData);
            toast.success('Registration successful! Please verify your account.');
            return response;
        } catch (error) {
            toast.error(error.message || 'Registration failed', { toastId: 'auth-toast' });
            throw error;
        }
    };

    const verifyEmail = async (email, otp) => {
        try {
            const response = await authService.verifyEmail(email, otp);
            toast.success('Email verified successfully!');
            return response;
        } catch (error) {
            toast.error(error.message || 'Email verification failed', { toastId: 'auth-toast' });
            throw error;
        }
    };

    const verifyPhone = async (phone, otp) => {
        try {
            const response = await authService.verifyPhone(phone, otp);
            toast.success('Phone verified successfully!');
            return response;
        } catch (error) {
            toast.error(error.message || 'Phone verification failed', { toastId: 'auth-toast' });
            throw error;
        }
    };

    const resendOTP = async (email) => {
        try {
            const response = await authService.resendOTP(email);
            toast.success('OTP sent successfully!');
            return response;
        } catch (error) {
            toast.error(error.message || 'Failed to resend OTP', { toastId: 'auth-toast' });
            throw error;
        }
    };

    const forgotPassword = async (email) => {
        try {
            const response = await authService.forgotPassword(email);
            toast.success('OTP for password reset sent to your email!');
            return response;
        } catch (error) {
            toast.error(error.message || 'Failed to send reset OTP', { toastId: 'auth-toast' });
            throw error;
        }
    };

    const resetPassword = async (email, otp, newPassword) => {
        try {
            const response = await authService.resetPassword(email, otp, newPassword);
            toast.success('Password reset successful! Please login with your new password.');
            return response;
        } catch (error) {
            toast.error(error.message || 'Password reset failed', { toastId: 'auth-toast' });
            throw error;
        }
    };

    const verifyResetOTP = async (email, otp) => {
        try {
            const response = await authService.verifyResetOTP(email, otp);
            return response;
        } catch (error) {
            toast.error(error.message || 'OTP verification failed', { toastId: 'auth-toast' });
            throw error;
        }
    };

    const verifyDualOTP = async (email, emailOTP, phoneOTP, context) => {
        try {
            const response = await authService.verifyDualOTP(email, emailOTP, phoneOTP, context);
            if (context === 'login' && response.data?.user) {
                setUser(response.data.user);
                toast.success('Login successful!');
                const role = response.data.user.role;
                if (role === 'admin') navigate('/admin/dashboard', { replace: true });
                else if (role === 'vendor') navigate('/vendor/dashboard', { replace: true });
                else navigate('/', { replace: true });
            }
            return response;
        } catch (error) {
            toast.error(error.message || 'OTP verification failed', { toastId: 'auth-toast' });
            throw error;
        }
    };

    const resendBothOTPs = async (email) => {
        try {
            const response = await authService.resendBothOTPs(email);
            toast.success('OTPs resent to your email and WhatsApp!');
            return response;
        } catch (error) {
            toast.error(error.message || 'Failed to resend OTPs', { toastId: 'auth-toast' });
            throw error;
        }
    };

    // ============ PIN Authentication ============

    const setupPin = async (email, pin) => {
        try {
            const response = await authService.setupPin(email, pin);
            if (response.data?.user) {
                setUser(response.data.user);
                toast.success('PIN created successfully!');
                const role = response.data.user.role;
                if (role === 'admin') navigate('/admin/dashboard', { replace: true });
                else if (role === 'vendor') navigate('/vendor/dashboard', { replace: true });
                else navigate('/', { replace: true });
            }
            return response;
        } catch (error) {
            toast.error(error.message || 'Failed to create PIN', { toastId: 'auth-toast' });
            throw error;
        }
    };

    const verifyPinLogin = async (email, pin) => {
        try {
            const response = await authService.verifyPin(email, pin);
            if (response.data?.user) {
                setUser(response.data.user);
                toast.success('Login successful!');
                const role = response.data.user.role;
                if (role === 'admin') navigate('/admin/dashboard', { replace: true });
                else if (role === 'vendor') navigate('/vendor/dashboard', { replace: true });
                else navigate('/', { replace: true });
            }
            return response;
        } catch (error) {
            toast.error(error.message || 'PIN verification failed', { toastId: 'auth-toast' });
            throw error;
        }
    };

    const changePin = async (currentPin, newPin) => {
        try {
            const response = await authService.changePin(currentPin, newPin);
            toast.success('PIN changed successfully!');
            return response;
        } catch (error) {
            toast.error(error.message || 'Failed to change PIN', { toastId: 'auth-toast' });
            throw error;
        }
    };

    const forgotPin = async (identifier) => {
        try {
            const response = await authService.forgotPin(identifier);
            toast.success('OTP sent to your email and WhatsApp!');
            return response;
        } catch (error) {
            toast.error(error.message || 'Failed to send OTP', { toastId: 'auth-toast' });
            throw error;
        }
    };

    const resetPinWithOTP = async (identifier, otp, newPin) => {
        try {
            const response = await authService.resetPin(identifier, otp, newPin);
            toast.success('PIN reset successfully!');
            return response;
        } catch (error) {
            toast.error(error.message || 'PIN reset failed', { toastId: 'auth-toast' });
            throw error;
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
            setUser(null);
            navigate('/login');
            toast.success('Logged out successfully');
        } catch (error) {
            toast.error('Logout failed', { toastId: 'auth-toast' });
        }
    };

    const refreshUser = async () => {
        try {
            const response = await authService.getMe();
            if (response.success && response.data.user) {
                setUser(response.data.user);
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }
        } catch (error) {
            console.error("Failed to refresh user:", error);
        }
    };

    const value = {
        user,
        loading,
        login,
        requestLoginOTP,
        verifyLoginOTP,
        register,
        logout,
        verifyEmail,
        verifyPhone,
        resendOTP,
        verifyDualOTP,
        resendBothOTPs,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isVendor: user?.role === 'vendor',
        isReader: user?.role === 'reader',
        forgotPassword,
        resetPassword,
        verifyResetOTP,
        refreshUser,
        // PIN methods
        setupPin,
        verifyPinLogin,
        changePin,
        forgotPin,
        resetPinWithOTP
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
