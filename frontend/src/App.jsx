import { useState, useCallback } from 'react'
import { ToastContainer, } from 'react-toastify';

import './App.css'
import Header from './Components/Layout/Header';
import Footer from './Components/Layout/Footer';

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Home from './Components/Home';
import Store from "./Components/Store";
import AboutUs from "./Components/AboutUs";
import Support from "./Components/Support";
import ProductDetails from './Components/Product/ProductDetails';
import Login from './Components/User/Login';
import ForgotPassword from './Components/User/ForgotPassword';
import NewPassword from './Components/User/NewPassword';
import Profile from './Components/User/Profile';
import Cart from './Components/Cart/Cart';
import Shipping from './Components/Cart/Shipping';
import ConfirmOrder from './Components/Cart/ConfirmOrder';
import Payment from './Components/Cart/Payment';
import OrderSuccess from './Components/Cart/OrderSuccess';
import ListOrders from './Components/Order/ListOrders';
import OrderDetails from './Components/Order/OrderDetails';
import Dashboard from './Components/Admin/Dashboard';
import ProductsList from './Components/Admin/ProductsList';
import TeamsList from './Components/Admin/TeamsList';
import UsersList from './Components/Admin/UsersList';
import CategoriesList from './Components/Admin/CategoriesList';
import OrdersList from './Components/Admin/OrdersList';
import ProcessOrder from './Components/Admin/ProcessOrder';
import ReviewsList from './Components/Admin/ReviewsList';
import AdminProfile from './Components/Admin/Layout/AdminProfile';
import MyReviews from './Components/Review/ListReviews';
import axios from 'axios';
import { getUser } from './Components/Utils/helpers';

// Protected Route Component for Admin
const ProtectedAdminRoute = ({ children }) => {
  const user = getUser();
  
  if (!user) {
    toast.error('Please login to access this page', { position: 'top-center' });
    return <Navigate to="/login" replace />;
  }
  
  if (user.role !== 'admin') {
    toast.error('Access denied. Admin privileges required.', { position: 'top-center' });
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const ProtectedRoute = ({ children }) => {
  const user = getUser();
  
  if (!user) {
    toast.error('Please login to access this page', { position: 'top-center' });
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const HomeRoute = () => {
  const user = getUser();
  
  if (user && user.role === 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Home />;
};

function App() {
  const [state, setState] = useState({
    cartItems: localStorage.getItem('cartItems')
      ? JSON.parse(localStorage.getItem('cartItems'))
      : [],

    shippingInfo: localStorage.getItem('shippingInfo')
      ? JSON.parse(localStorage.getItem('shippingInfo'))
      : {},
  })

  const addItemToCart = async (id, quantity) => {
    try {
      const { data } = await axios.get(`http://localhost:8000/api/v1/getproduct/${id}`)
      
      const product = data.data;
      
      if (!product) {
        throw new Error('Product not found');
      }

      const item = {
        product: product._id,
        name: product.name,
        price: product.price,
        image: product.images && product.images[0] ? product.images[0].url : '/images/default_product.png',
        stock: product.stock,
        quantity: quantity
      }

      const isItemExist = state.cartItems.find(i => i.product === item.product)
      
      // Single state update instead of multiple
      const newCartItems = isItemExist 
        ? state.cartItems.map(i => i.product === item.product ? item : i)
        : [...state.cartItems, item];

      setState({
        ...state,
        cartItems: newCartItems
      })

      // Save to localStorage immediately
      localStorage.setItem('cartItems', JSON.stringify(newCartItems))

      toast.success('Item Added to Cart', {
        position: 'bottom-right'
      })

    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to add item to cart', {
        position: 'top-left'
      });
    }
  }

  const removeItemFromCart = async (id) => {
    const newCartItems = state.cartItems.filter(i => i.product !== id);
    setState({
      ...state,
      cartItems: newCartItems
    })
    localStorage.setItem('cartItems', JSON.stringify(newCartItems))
    
    toast.info('Item removed from cart', {
      position: 'bottom-right'
    })
  }

  const saveShippingInfo = async (data) => {
    setState({
      ...state,
      shippingInfo: data
    })
    localStorage.setItem('shippingInfo', JSON.stringify(data))
  }

  const clearCart = useCallback(() => {
    setState({
      cartItems: [],
      shippingInfo: {}
    })
    localStorage.removeItem('cartItems')
    localStorage.removeItem('shippingInfo')
    sessionStorage.removeItem('orderInfo')
  }, [])

  return (
    <>
      <Router>
        <Header cartItems={state.cartItems} />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomeRoute />} />
          <Route path="/store" element={<Store />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/support" element={<Support />} />
          <Route path="/product/:id" element={<ProductDetails cartItems={state.cartItems} addItemToCart={addItemToCart} />} />
          <Route path="/search/:keyword" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/password/forgot" element={<ForgotPassword />} />
          <Route path="/password/reset/:token" element={<NewPassword />} />
          
          {/* Protected User Routes */}
          <Route path="/me" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/cart" element={
            <ProtectedRoute>
              <Cart cartItems={state.cartItems} addItemToCart={addItemToCart} removeItemFromCart={removeItemFromCart} />
            </ProtectedRoute>
          } />
          <Route path="/shipping" element={
            <ProtectedRoute>
              <Shipping shipping={state.shippingInfo} saveShippingInfo={saveShippingInfo} />
            </ProtectedRoute>
          } />
          <Route path="/confirm" element={
            <ProtectedRoute>
              <ConfirmOrder cartItems={state.cartItems} shippingInfo={state.shippingInfo} />
            </ProtectedRoute>
          } />
          <Route path="/payment" element={
            <ProtectedRoute>
              <Payment cartItems={state.cartItems} shippingInfo={state.shippingInfo} clearCart={clearCart} />
            </ProtectedRoute>
          } />
          <Route path="/success" element={
            <ProtectedRoute>
              <OrderSuccess clearCart={clearCart} />
            </ProtectedRoute>
          } />
          <Route path="/orders/me" element={
            <ProtectedRoute>
              <ListOrders />
            </ProtectedRoute>
          } />
          <Route path="/order/:id" element={
            <ProtectedRoute>
              <OrderDetails />
            </ProtectedRoute>
          } />
          <Route path="/reviews/me" element={
            <ProtectedRoute>
              <MyReviews />
            </ProtectedRoute>
          } />
          
          {/* Protected Admin Routes */}
          <Route path="/dashboard" element={
            <ProtectedAdminRoute>
              <Dashboard />
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/products" element={
            <ProtectedAdminRoute>
              <ProductsList />
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/orders" element={
            <ProtectedAdminRoute>
              <OrdersList />
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/order/:id" element={
            <ProtectedAdminRoute>
              <ProcessOrder />
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/teams" element={
            <ProtectedAdminRoute>
              <TeamsList />
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedAdminRoute>
              <UsersList />
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/categories" element={
            <ProtectedAdminRoute>
              <CategoriesList />
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/reviews" element={
            <ProtectedAdminRoute>
              <ReviewsList />
            </ProtectedAdminRoute>
          } />
          <Route path="/admin/profile" element={
            <ProtectedAdminRoute>
              <AdminProfile />
            </ProtectedAdminRoute>
          } />
        </Routes>
      </Router>
      <Footer />
      <ToastContainer />
    </>
  )
}

export default App