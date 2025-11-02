import React from 'react'
import '../../../Styles/Modal.css'
import TextField from '@mui/material/TextField';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import { Paper, Button, colors } from '@mui/material'
import { FaArrowAltCircleRight } from "react-icons/fa";
import { FaArrowAltCircleLeft } from "react-icons/fa";

const InfoModal = React.forwardRef(({ 
    setOpenModal, 
    modalData: { title, content, fields }, 
    formState,
    categories = [],
    teams = []
}, ref) => {
    const imagesToDisplay = formState.existingImages && formState.existingImages.length > 0 
        ? formState.existingImages 
        : (Array.isArray(formState.images) ? formState.images : []);

    const closeModals = () => {
        setOpenModal(false)
    }

    // Helper function to get display value
    const getDisplayValue = (field) => {
        if (field.type === 'select') {
            if (field.name === 'category') {
                const category = categories.find(cat => cat._id === field.value);
                return category ? category.name : 'N/A';
            } else if (field.name === 'team') {
                const team = teams.find(t => t._id === field.value);
                return team ? team.name : 'N/A';
            }
        }
        return field.value || 'N/A';
    };

    return (
        <div 
            ref={ref}
            className='modal-background'
            onClick={() => {
                closeModals();
            }}
        >
            <div 
                className="modal-container-portrait"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="display-modal__img-container">
                    <Carousel 
                        className='custom-carousel'
                        renderArrowNext={(onClickHandler, hasNext, label) =>
                            hasNext && (
                                <button type="button" onClick={onClickHandler} title={label} style={{
                                    position: 'absolute',
                                    zIndex: 2,
                                    top: 'calc(50% - 15px)',
                                    right: 15,
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}>
                                    <FaArrowAltCircleRight style={{ color: 'var(--primary-color)', fontSize: '30px' }}/>
                                </button>
                            )
                        }
                        renderArrowPrev={(onClickHandler, hasPrev, label) =>
                            hasPrev && (
                                <button type="button" onClick={onClickHandler} title={label} style={{
                                    position: 'absolute',
                                    zIndex: 2,
                                    top: 'calc(50% - 15px)',
                                    left: 15,
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}>
                                    <FaArrowAltCircleLeft style={{ color: 'var(--primary-color)', fontSize: '30px' }}/>
                                </button>
                            )
                        }
                        showThumbs={false}
                        showStatus={true}
                    >
                        {
                            imagesToDisplay.length > 0 ? (
                                imagesToDisplay.map((image, index) => (
                                    <div key={index} style={{ 
                                        display: 'flex', 
                                        justifyContent: 'center', 
                                        alignItems: 'center',
                                        minHeight: '400px',
                                        backgroundColor: '#f5f5f5'
                                    }}>
                                        <img 
                                            src={image.url} 
                                            alt={`${formState.name} - Image ${index + 1}`}
                                            style={{
                                                maxWidth: '100%',
                                                maxHeight: '500px',
                                                objectFit: 'contain'
                                            }}
                                        />
                                    </div>
                                ))
                            ) : (
                                <div style={{ padding: '40px', textAlign: 'center', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <p style={{ color: '#999', fontSize: '16px' }}>No images available</p>
                                </div>
                            )
                        }
                    </Carousel>
                </div>
                
                <div style={{ padding: '20px' }}>
                    {fields.map((field, index) => (
                        field.type !== 'file' && (
                            <div className="detail-container" key={index} style={{ 
                                marginBottom: '12px',
                                padding: '8px 0',
                                borderBottom: '1px solid #eee'
                            }}>
                                <strong>{field.label}:</strong> {getDisplayValue(field)}
                            </div>
                        )
                    ))}
                </div>
                
                <div style={{ padding: '16px', textAlign: 'center', borderTop: '1px solid #eee' }}>
                    <Button 
                        variant="contained" 
                        onClick={closeModals}
                        sx={{
                            backgroundColor: '#1976d2',
                            '&:hover': {
                                backgroundColor: '#1565c0',
                            }
                        }}
                    >
                        Close
                    </Button>
                </div>
            </div>
        </div>
    )
});

InfoModal.displayName = 'InfoModal';

export default InfoModal