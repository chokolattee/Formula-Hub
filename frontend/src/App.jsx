import { useState, useCallback } from 'react'
import { ToastContainer, } from 'react-toastify';

import './App.css'
import Header from './Components/Layout/Header';
import Footer from './Components/Layout/Footer';

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Home from './Components/Home';
import Store from "./Components/Store";
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
import axios from 'axios';

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

      // Also save to localStorage immediately
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
          <Route path="/" element={<Home />} exact="true" />
          <Route path="/store" element={<Store />} exact="true" />
          <Route path="/product/:id" element={<ProductDetails cartItems={state.cartItems} addItemToCart={addItemToCart} />} exact="true" />
          <Route path="/search/:keyword" element={<Home />} exact="true" />
          <Route path="/login" element={<Login />} exact="true" />
          <Route path="/password/forgot" element={<ForgotPassword />} exact="true" />
          <Route path="/password/reset/:token" element={<NewPassword />} exact="true" />
          <Route path="/me" element={<Profile />} exact="true" />
          <Route path="/cart" element={<Cart cartItems={state.cartItems} addItemToCart={addItemToCart} removeItemFromCart={removeItemFromCart} />} exact="true" />
          <Route path="/shipping" element={<Shipping shipping={state.shippingInfo} saveShippingInfo={saveShippingInfo} />} />
          <Route path="/confirm" element={<ConfirmOrder cartItems={state.cartItems} shippingInfo={state.shippingInfo} />} />
          <Route path="/payment" element={<Payment cartItems={state.cartItems} shippingInfo={state.shippingInfo} clearCart={clearCart} />} />
          <Route path="/success" element={<OrderSuccess clearCart={clearCart} />} />
          <Route path="/orders/me" element={<ListOrders />} />
          <Route path="/order/:id" element={<OrderDetails />} />
          
          {/* Admin Routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin/products" element={<ProductsList />} />
          <Route path="/admin/orders" element={<OrdersList />} />
          <Route path="/admin/order/:id" element={<ProcessOrder />} />
          <Route path="/admin/teams" element={<TeamsList />} />
          <Route path="/admin/users" element={<UsersList />} />
          <Route path="/admin/categories" element={<CategoriesList />} />
        </Routes>
      </Router>
      <Footer />
      <ToastContainer />
    </>
  )
}

export default App