import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Public
import Login from './pages/Login';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import RetailParties from './pages/admin/RetailParties';
import ProductCatalog from './pages/admin/ProductCatalog';
import ManageOrders from './pages/admin/ManageOrders';
import FinancialLedger from './pages/admin/FinancialLedger';
import StaffManagement from './pages/admin/StaffManagement';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard';
import PurchaseHistory from './pages/admin/PurchaseHistory';
import PurchaseBillUpload from './pages/admin/PurchaseBillUpload';
import ExportToBusy from './pages/admin/ExportToBusy';

// Staff
import StaffDashboard from './pages/staff/StaffDashboard';
import BookOrder from './pages/staff/BookOrder';
import StaffOrders from './pages/staff/MyOrders';
import CollectPayment from './pages/staff/CollectPayment';
import AssignedParties from './pages/staff/AssignedParties';

// Retailer
import RetailerDashboard from './pages/retailer/RetailerDashboard';
import ShopCatalog from './pages/retailer/ShopCatalog';
import RetailerOrders from './pages/retailer/MyOrders';
import RetailerLedger from './pages/retailer/MyLedger';
import RetailerProfile from './pages/retailer/Profile';

const RootRedirect = () => {
  const { user, token, loading, getDashboardPath } = useAuth();
  if (loading) return null;
  if (!token || !user) return <Navigate to="/login" replace />;
  return <Navigate to={getDashboardPath(user.role)} replace />;
};

function App() {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public Login */}
      <Route path="/login" element={<Login />} />

      {/* Admin Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/parties" element={<RetailParties />} />
        <Route path="/admin/products" element={<ProductCatalog />} />
        <Route path="/admin/orders" element={<ManageOrders />} />
        <Route path="/admin/ledger" element={<FinancialLedger />} />
        <Route path="/admin/staff" element={<StaffManagement />} />
        <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
        <Route path="/admin/purchases" element={<PurchaseHistory />} />
        <Route path="/admin/purchases/upload" element={<PurchaseBillUpload />} />
        <Route path="/admin/export" element={<ExportToBusy />} />
      </Route>

      {/* Staff Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['staff', 'admin']} />}>
        <Route path="/staff/dashboard" element={<StaffDashboard />} />
        <Route path="/staff/book-order" element={<BookOrder />} />
        <Route path="/staff/orders" element={<StaffOrders />} />
        <Route path="/staff/collect-payment" element={<CollectPayment />} />
        <Route path="/staff/parties" element={<AssignedParties />} />
      </Route>

      {/* Retailer Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['retailer']} />}>
        <Route path="/retailer/dashboard" element={<RetailerDashboard />} />
        <Route path="/retailer/shop" element={<ShopCatalog />} />
        <Route path="/retailer/orders" element={<RetailerOrders />} />
        <Route path="/retailer/ledger" element={<RetailerLedger />} />
        <Route path="/retailer/profile" element={<RetailerProfile />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

export default App;
