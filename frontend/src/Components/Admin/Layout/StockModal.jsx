import React from 'react'
import '../../../Styles/Modal.css'
import TextField from '@mui/material/TextField';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import { Paper, Button, colors } from '@mui/material'
import { FaArrowAltCircleRight } from "react-icons/fa";
import { FaArrowAltCircleLeft } from "react-icons/fa";

const InfoModal = ({ setOpenModal, modalData: { title, content, fields } }) => {

    const closeModals = () => {
        setOpenModal(false)
    }

  return (
    <div 
        className='modal-background'
        onClick={() => {
            closeModals();
        }}
    >
        <div 
            className="modal-container__inventory"
            onClick={(e) => e.stopPropagation()}
        >
        
        </div>
    </div>
  )
}
export default InfoModal