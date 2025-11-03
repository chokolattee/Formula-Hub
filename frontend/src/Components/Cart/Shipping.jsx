import React, { useState, useEffect } from 'react'
import { useNavigate } from "react-router-dom";
import { countries } from 'countries-list'
import MetaData from '../Layout/MetaData'
import CheckoutSteps from './CheckoutSteps'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { getToken } from '../Utils/helpers'

const Shipping = ({ shipping, saveShippingInfo }) => {

    const countriesList = Object.values(countries)
    const [user, setUser] = useState(null)
    const [address, setAddress] = useState(shipping.address || '')
    const [city, setCity] = useState(shipping.city || '')
    const [postalCode, setPostalCode] = useState(shipping.postalCode || '')
    const [phoneNo, setPhoneNo] = useState(shipping.phoneNo || '')
    const [country, setCountry] = useState(shipping.country || '')
    const [savedAddresses, setSavedAddresses] = useState([])
    const [selectedAddressId, setSelectedAddressId] = useState('new')
    const [loading, setLoading] = useState(true)
    const [showNewAddressForm, setShowNewAddressForm] = useState(!shipping.address)
    
    let navigate = useNavigate();

    useEffect(() => {
        const fetchUserAndAddresses = async () => {
            try {
                const config = {
                    headers: {
                        'Authorization': `Bearer ${getToken()}`
                    }
                }

                // Fetch user profile 
                const userResponse = await axios.get('http://localhost:8000/api/v1/me', config)
                if (userResponse.data.success && userResponse.data.user) {
                    setUser(userResponse.data.user)
                }

                // Fetch saved addresses
                const { data } = await axios.get('http://localhost:8000/api/v1/orders/me', config)
                
                if (data.success && data.orders && data.orders.length > 0) {
                    const addresses = data.orders.map((order, index) => ({
                        id: `address-${index}`,
                        orderId: order._id,
                        ...order.shippingInfo
                    }))
                    
                    const uniqueAddresses = addresses.filter((addr, index, self) =>
                        index === self.findIndex((a) => (
                            a.address === addr.address &&
                            a.city === addr.city &&
                            a.postalCode === addr.postalCode &&
                            a.phoneNo === addr.phoneNo &&
                            a.country === addr.country
                        ))
                    )
                    
                    setSavedAddresses(uniqueAddresses)
                    
                    // If current shipping info matches a saved address, select it
                    if (shipping.address) {
                        const matchingAddress = uniqueAddresses.find(addr =>
                            addr.address === shipping.address &&
                            addr.city === shipping.city &&
                            addr.postalCode === shipping.postalCode
                        )
                        if (matchingAddress) {
                            setSelectedAddressId(matchingAddress.id)
                            setShowNewAddressForm(false)
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchUserAndAddresses()
    }, [])

    // Get user's full name
    const getUserFullName = () => {
        if (!user) return ''
        
        if (user.first_name && user.last_name) {
            return `${user.first_name} ${user.last_name}`.trim()
        }
        
        if (user.first_name) {
            return user.first_name
        }
        
        if (user.name) {
            return user.name
        }
        
    }

    const handleAddressSelect = (e) => {
        const selectedId = e.target.value
        setSelectedAddressId(selectedId)
        
        if (selectedId === 'new') {
            setShowNewAddressForm(true)
            setAddress('')
            setCity('')
            setPostalCode('')
            setPhoneNo('')
            setCountry('')
        } else {
            // Fill form with selected address
            const selectedAddress = savedAddresses.find(addr => addr.id === selectedId)
            if (selectedAddress) {
                setShowNewAddressForm(false)
                setAddress(selectedAddress.address)
                setCity(selectedAddress.city)
                setPostalCode(selectedAddress.postalCode)
                setPhoneNo(selectedAddress.phoneNo)
                setCountry(selectedAddress.country)
            }
        }
    }

    const handleEditAddress = () => {
        setShowNewAddressForm(true)
    }

    const submitHandler = (e) => {
        e.preventDefault()

        if (!address || !city || !phoneNo || !postalCode || !country) {
            toast.error('Please fill in all fields')
            return
        }

        // Save shipping info with current user's name 
        const shippingData = {
            address,
            city,
            phoneNo,
            postalCode,
            country,
            name: getUserFullName(),
        }

        saveShippingInfo(shippingData)
        toast.success('Shipping information saved')
        navigate('/confirm')
    }

    return (
        <>
            <MetaData title={'Shipping Info'} />
            <CheckoutSteps shipping />
            <div className="row wrapper">
                <div className="col-10 col-lg-5">
                    <form
                        className="shadow-lg"
                        onSubmit={submitHandler}
                        style={{ padding: '30px' }}
                    >
                        <h1 className="mb-4">Shipping Info</h1>

                        {/* Display Current User Info */}
                        {user && (
                            <div 
                                className="alert alert-info mb-4" 
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '12px 15px',
                                    backgroundColor: '#d1ecf1',
                                    borderColor: '#bee5eb',
                                    color: '#0c5460',
                                    borderRadius: '5px'
                                }}
                            >
                                <i className="fa fa-user-circle" style={{ marginRight: '10px', fontSize: '20px' }}></i>
                                <div>
                                    <strong>Delivering to:</strong> {getUserFullName()}
                                    <br />
                                </div>
                            </div>
                        )}

                        {/* Saved Addresses Dropdown */}
                        {!loading && savedAddresses.length > 0 && (
                            <div className="form-group mb-4">
                                <label htmlFor="saved_addresses" style={{ fontWeight: 'bold' }}>
                                    Select Saved Address
                                </label>
                                <select
                                    id="saved_addresses"
                                    className="form-control"
                                    value={selectedAddressId}
                                    onChange={handleAddressSelect}
                                    style={{ marginBottom: '10px' }}
                                >
                                    <option value="new">+ Enter New Address</option>
                                    {savedAddresses.map((addr, index) => (
                                        <option key={addr.id} value={addr.id}>
                                            {addr.address}, {addr.city}, {addr.country}
                                        </option>
                                    ))}
                                </select>
                                
                                {selectedAddressId !== 'new' && !showNewAddressForm && (
                                    <div 
                                        style={{
                                            padding: '15px',
                                            backgroundColor: '#585a5cff',
                                            borderRadius: '5px',
                                            marginTop: '10px'
                                        }}
                                    >
                                        <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                            <strong>Address:</strong> {address}
                                        </p>
                                        <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                            <strong>City:</strong> {city}
                                        </p>
                                        <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                            <strong>Postal Code:</strong> {postalCode}
                                        </p>
                                        <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                            <strong>Phone:</strong> {phoneNo}
                                        </p>
                                        <p style={{ margin: '5px 0', fontSize: '14px' }}>
                                            <strong>Country:</strong> {country}
                                        </p>
                                        <button
                                            type="button"
                                            className="btn btn-outline-primary btn-sm mt-2"
                                            onClick={handleEditAddress}
                                        >
                                            Edit This Address
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Address Form - Show when new address or editing */}
                        {(selectedAddressId === 'new' || showNewAddressForm) && (
                            <>
                                <div className="form-group">
                                    <label htmlFor="address_field">Address</label>
                                    <input
                                        type="text"
                                        id="address_field"
                                        className="form-control"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        placeholder="Enter your street address"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="city_field">City</label>
                                    <input
                                        type="text"
                                        id="city_field"
                                        className="form-control"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        placeholder="Enter your city"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="phone_field">Phone No</label>
                                    <input
                                        type="tel"
                                        id="phone_field"
                                        className="form-control"
                                        value={phoneNo}
                                        onChange={(e) => setPhoneNo(e.target.value)}
                                        placeholder="e.g., +63 912 345 6789"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="postal_code_field">Postal Code</label>
                                    <input
                                        type="text"
                                        id="postal_code_field"
                                        className="form-control"
                                        value={postalCode}
                                        onChange={(e) => setPostalCode(e.target.value)}
                                        placeholder="Enter postal code"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="country_field">Country</label>
                                    <select
                                        id="country_field"
                                        className="form-control"
                                        value={country}
                                        onChange={(e) => setCountry(e.target.value)}
                                        required
                                    >
                                        <option value="">Select Country</option>
                                        {countriesList.map(country => (
                                            <option key={country.name} value={country.name}>
                                                {country.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}

                        <button
                            id="shipping_btn"
                            type="submit"
                            className="btn btn-block py-3"
                            style={{ marginTop: '20px' }}
                        >
                            CONTINUE
                        </button>
                    </form>
                </div>
            </div>
        </>
    )
}

export default Shipping