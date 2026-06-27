import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import RiderSignup from './pages/RiderSignup'
import RestaurantSignup from './pages/RestaurantSignup'
import Dashboard from './pages/Dashboard'
import RestaurantPage from './pages/RestaurantPage'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Orders from './pages/Orders'
import Profile from './pages/Profile'
import RestaurantDashboard from './pages/restaurant/Dashboard'
import RestaurantOrders from './pages/restaurant/Orders'
import RestaurantMenu from './pages/restaurant/Menu'
import RestaurantEarnings from './pages/restaurant/Earnings'
import RestaurantProfile from './pages/restaurant/Profile'
import RiderDashboard from './pages/rider/Dashboard'
import RiderDeliveries from './pages/rider/Deliveries'
import RiderEarnings from './pages/rider/Earnings'
import RiderProfile from './pages/rider/Profile'
import AdminDashboard from './pages/admin/Dashboard'
import AdminOrders from './pages/admin/Orders'
import AdminUsers from './pages/admin/Users'
import AdminRestaurants from './pages/admin/Restaurants'
import AdminRiders from './pages/admin/Riders'
import AdminDisbursements from './pages/admin/Disbursements'
import AdminSettings from './pages/admin/Settings'
import AdminPromotions from './pages/admin/Promotions'
import GroupOrder from './pages/GroupOrder'
import RestaurantPromotions from './pages/restaurant/Promotions'
import AdminAudit from './pages/admin/Audit'
import AdminMarketing from './pages/admin/Marketing'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/rider/signup" element={<RiderSignup />} />
        <Route path="/restaurant/signup" element={<RestaurantSignup />} />
        
        {/* Customer */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/restaurant/:id" element={<RestaurantPage />} />
        <Route path="/group/:code" element={<GroupOrder />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/profile" element={<Profile />} />
        
        {/* Restaurant */}
        <Route path="/restaurant/dashboard" element={<RestaurantDashboard />} />
        <Route path="/restaurant/orders" element={<RestaurantOrders />} />
        <Route path="/restaurant/menu" element={<RestaurantMenu />} />
        <Route path="/restaurant/earnings" element={<RestaurantEarnings />} />
        <Route path="/restaurant/profile" element={<RestaurantProfile />} />
        <Route path="/restaurant/promotions" element={<RestaurantPromotions />} />
        
        {/* Rider */}
        <Route path="/rider/dashboard" element={<RiderDashboard />} />
        <Route path="/rider/deliveries" element={<RiderDeliveries />} />
        <Route path="/rider/earnings" element={<RiderEarnings />} />
        <Route path="/rider/profile" element={<RiderProfile />} />
        
        {/* Admin */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/restaurants" element={<AdminRestaurants />} />
        <Route path="/admin/riders" element={<AdminRiders />} />
        <Route path="/admin/disbursements" element={<AdminDisbursements />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/promotions" element={<AdminPromotions />} />
        <Route path="/admin/audit" element={<AdminAudit />} />
        <Route path="/admin/marketing" element={<AdminMarketing />} />
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
