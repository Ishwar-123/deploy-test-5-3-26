import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';

// Components
import ScrollToTop from './components/ScrollToTop';
import Preloader from './components/Preloader';
import Footer from './components/Footer';

import ScrollToTopButton from './components/ScrollToTopButton';

// Routes jahan Footer NAHI dikhana (admin/vendor/reader dashboards, book reader, auth pages)
const NO_FOOTER_PATHS = [
  '/admin',
  '/vendor',
  '/reader',
  '/login',
  '/register',
  '/verify-otp',
  '/pin',
  '/forgot-password',
  '/reset-password',
  '/payment/success',
  '/payment/failure',
];

const GlobalFooter = () => {
  const { pathname } = useLocation();
  const hideFooter =
    NO_FOOTER_PATHS.some(p => pathname.startsWith(p)) ||
    pathname.includes('/read') ||
    pathname.includes('/read-3d') ||
    pathname.includes('/preview');
  if (hideFooter) return null;
  return <Footer />;
};


// Public Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import BookDetailsPage from './pages/BookDetailsPage';
import PDFPreviewPage from './pages/PDFPreviewPage';
import OTPVerificationPage from './pages/OTPVerificationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import HelpCenterPage from './pages/HelpCenterPage';
import PinPage from './pages/PinPage';

// Admin Pages
import AdminLayout from './components/Layout/AdminLayout';
import ReaderLayout from './components/Layout/ReaderLayout';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminBooks from './pages/Admin/Books';
import AdminVendors from './pages/Admin/Vendors';
import AdminPackages from './pages/Admin/Packages';
import AdminReports from './pages/Admin/Reports';
import AdminStorage from './pages/Admin/Storage';
import AdminSubmissions from './pages/Admin/Submissions';
import AdminReaders from './pages/Admin/Readers';
import AdminOrders from './pages/Admin/Orders';
import AdminReviews from './pages/Admin/Reviews';
import AdminSettings from './pages/Admin/Settings';
import AuthMonitor from './pages/Admin/AuthMonitor';

// Vendor & Reader Pages
import VendorDashboard from './pages/VendorDashboard';
import ReaderDashboard from './pages/ReaderDashboard';
import ReaderLibrary from './pages/ReaderLibrary';
import ReaderPremium from './pages/ReaderPremium';
import ReaderProfile from './pages/ReaderProfile';
import UnifiedReaderPage from './pages/UnifiedReaderPage'; // Unified PDF Reader with Theme Toggle
import CheckoutPage from './pages/CheckoutPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentFailurePage from './pages/PaymentFailurePage';
import CartPage from './pages/CartPage';
import ReaderOrders from './pages/ReaderOrders';
import Real3DReaderPage from './pages/Real3DReaderPage';

// Protected Route Component
import ProtectedRoute from './components/ProtectedRoute';

// Role-based redirect for the home page
// Admin aur Vendor ko public home page nahi dikhana
const RoleBasedHome = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (user?.role === 'vendor') {
    return <Navigate to="/vendor/dashboard" replace />;
  }

  // Reader ya guest - normal home page dikhao
  return <HomePage />;
};

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <ScrollToTop />
      <Preloader />
      <AuthProvider>
        <CartProvider>
          <ThemeProvider>
            <div className="min-h-screen transition-colors duration-300">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<RoleBasedHome />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/help" element={<HelpCenterPage />} />
                <Route path="/book/:id" element={<BookDetailsPage />} />
                <Route path="/book/:bookId/preview" element={<UnifiedReaderPage />} />
                <Route path="/book/:bookId/read-3d" element={<Real3DReaderPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/reader/read/:bookId" element={<UnifiedReaderPage />} />
                <Route path="/verify-otp" element={<OTPVerificationPage />} />
                <Route path="/pin" element={<PinPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* Admin Routes with Layout */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="books" element={<AdminBooks />} />
                  <Route path="vendors" element={<AdminVendors />} />
                  <Route path="packages" element={<AdminPackages />} />
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="storage" element={<AdminStorage />} />
                  <Route path="submissions" element={<AdminSubmissions />} />
                  <Route path="readers" element={<AdminReaders />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="reviews" element={<AdminReviews />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="auth-monitor" element={<AuthMonitor />} />
                </Route>

                {/* Vendor Routes */}
                <Route
                  path="/vendor/*"
                  element={
                    <ProtectedRoute allowedRoles={['vendor']}>
                      <VendorDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Reader Routes */}
                <Route
                  path="/reader"
                  element={
                    <ProtectedRoute allowedRoles={['reader']}>
                      <ReaderLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/reader/dashboard" replace />} />
                  <Route path="dashboard" element={<ReaderDashboard />} />
                  <Route path="library" element={<ReaderLibrary />} />
                  <Route path="subscription" element={<ReaderPremium />} />
                  <Route path="profile" element={<ReaderProfile />} />
                  <Route path="cart" element={<CartPage />} />
                  <Route path="orders" element={<ReaderOrders />} />
                </Route>



                {/* Payment Routes (No Layout) */}
                <Route
                  path="/checkout/:bookId"
                  element={
                    <ProtectedRoute allowedRoles={['reader']}>
                      <CheckoutPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payment/success"
                  element={
                    <ProtectedRoute allowedRoles={['reader', 'admin', 'vendor']}>
                      <PaymentSuccessPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payment/failure"
                  element={<PaymentFailurePage />}
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>





              {/* Scroll to Top Button */}
              <ScrollToTopButton />

              {/* Global Footer — shown on all public pages */}
              <GlobalFooter />
            </div>
          </ThemeProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
