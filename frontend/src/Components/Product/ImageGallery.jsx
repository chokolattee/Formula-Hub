import React, { useState } from 'react';
import Modal from '@mui/material/Modal';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

const ImageGallery = ({ images, startIndex, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(startIndex);

    const handlePrevious = () => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    return (
        <Modal
            open={true}
            onClose={onClose}
            aria-labelledby="image-gallery-modal"
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <div style={{
                position: 'relative',
                maxWidth: '90vw',
                maxHeight: '90vh',
                backgroundColor: '#000',
                borderRadius: '12px',
                overflow: 'hidden',
            }}>
                <IconButton
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: '#fff',
                        zIndex: 1,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        '&:hover': {
                            backgroundColor: 'rgba(255, 0, 0, 0.7)',
                        },
                    }}
                >
                    <CloseIcon />
                </IconButton>

                {images.length > 1 && (
                    <>
                        <IconButton
                            onClick={handlePrevious}
                            sx={{
                                position: 'absolute',
                                left: 8,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#fff',
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 0, 0, 0.7)',
                                },
                            }}
                        >
                            <NavigateBeforeIcon />
                        </IconButton>
                        <IconButton
                            onClick={handleNext}
                            sx={{
                                position: 'absolute',
                                right: 8,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#fff',
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 0, 0, 0.7)',
                                },
                            }}
                        >
                            <NavigateNextIcon />
                        </IconButton>
                    </>
                )}

                <img
                    src={images[currentIndex].url}
                    alt={`Gallery image ${currentIndex + 1}`}
                    style={{
                        maxWidth: '100%',
                        maxHeight: '90vh',
                        objectFit: 'contain',
                        display: 'block',
                    }}
                />

                {images.length > 1 && (
                    <div style={{
                        position: 'absolute',
                        bottom: 16,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        color: '#fff',
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        padding: '4px 12px',
                        borderRadius: '16px',
                        fontSize: '14px',
                    }}>
                        {currentIndex + 1} / {images.length}
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ImageGallery;