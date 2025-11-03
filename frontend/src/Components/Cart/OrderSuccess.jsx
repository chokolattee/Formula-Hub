import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import MetaData from '../Layout/MetaData'

const OrderSuccess = ({ clearCart }) => {
    useEffect(() => {
        if (clearCart) {
            clearCart()
        }
    }, [clearCart]);

    return (
        <>
            <MetaData title={'Order Success'} />

            <div className="row justify-content-center">
                <div className="col-6 mt-5 text-center">
                    <img 
                        className="my-5 img-fluid d-block mx-auto" 
                        src="/images/order_success.png" 
                        alt="Order Success" 
                        width="200" 
                        height="200" 
                    />

                    <h2>Your Order has been placed successfully.</h2>

                    <Link to="/orders/me" className="btn btn-primary mt-3">
                        Go to Orders
                    </Link>
                </div>
            </div>
        </>
    )
}

export default OrderSuccess