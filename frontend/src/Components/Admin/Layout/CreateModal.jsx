import React, { forwardRef } from 'react';
import '../../../Styles/Modal.css';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import { Paper, Button } from '@mui/material';
import { FaArrowAltCircleRight, FaArrowAltCircleLeft } from "react-icons/fa";

const CreateModal = forwardRef(({
    setOpenModal, 
    modalData: { title, content, fields }, 
    handleSubmit, 
    imagesPreview, 
    setImagesPreview
}, ref) => {

    const closeModals = () => {
        setImagesPreview([]);
        setOpenModal(false);
    };

    return (
        <div
            ref={ref}  
            className='modal-background'
            onClick={closeModals}
            style={{ 
                zIndex: 999,
                position: 'fixed',
                top: 0,
                left: '300px',
                right: 0,
                bottom: 0,
                width: 'calc(100% - 300px)'
            }}
        >
            <div
                className="modal-container"
                onClick={(e) => e.stopPropagation()}
                style={{ 
                    zIndex: 999,
                    position: 'relative'
                }}
            >
                <h2>Create New {title}</h2>
                <p>Fill out the following fields to create a new {content}</p>
                <div className="main-area">
                    <form className="crud-form" onSubmit={handleSubmit}>
                        {fields.map((field, index) => (
                            field.col ? (
                                <div key={index} className="input-group-col">
                                    <div className="col">
                                        <TextField
                                            id={`outlined-${field.name}`}
                                            label={field.label}
                                            variant="outlined"
                                            type={field.type}
                                            name={field.name}
                                            placeholder={field.placeholder}
                                            value={field.value}
                                            onChange={field.onChange}
                                            required={field.required}
                                            fullWidth
                                        />
                                    </div>
                                    <div className="col" key={field.name2}>
                                        <TextField
                                            id={`outlined-${field.name2}`}
                                            label={field.label2}
                                            variant="outlined"
                                            type={field.type2}
                                            name={field.name2}
                                            placeholder={field.placeholder2}
                                            value={field.value2}
                                            onChange={field.onChange2}
                                            required={field.required2}
                                            fullWidth
                                        />
                                    </div>
                                </div>
                            ) : field.type === 'custom' ? (
                                // Handle custom components
                                <div key={field.name} className="input-group">
                                    {field.customComponent}
                                </div>
                            ) : field.type === 'select' ? (
                                // Handle select dropdowns for Category and Team
                                <div key={field.name} className="input-group">
                                    <FormControl fullWidth variant="outlined" required={field.required}>
                                        <InputLabel id={`${field.name}-label`}>{field.label}</InputLabel>
                                        <Select
                                            labelId={`${field.name}-label`}
                                            id={`select-${field.name}`}
                                            value={field.value}
                                            onChange={field.onChange}
                                            label={field.label}
                                            name={field.name}
                                        >
                                            <MenuItem value="">
                                                <em>Select {field.label}</em>
                                            </MenuItem>
                                            {field.options && field.options.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </div>
                            ) : field.type === 'text' || field.type === 'number' || field.type === 'textarea' ? (
                                <div key={field.name} className="input-group">
                                    <TextField
                                        id={`outlined-${field.name}`}
                                        label={field.label}
                                        variant="outlined"
                                        type={field.type}
                                        name={field.name}
                                        placeholder={field.placeholder}
                                        value={field.value}
                                        onChange={field.onChange}
                                        required={field.required}
                                        className={field.className}
                                        fullWidth
                                        multiline={field.type === 'textarea'}
                                        rows={field.type === 'textarea' ? 4 : 1}
                                    />
                                </div>
                            ) : field.type === 'file' ? (
                                <div key={field.name} className="input-group">
                                    <label>{field.label}</label>
                                    <input
                                        type={field.type}
                                        name={field.name}
                                        onChange={field.onChange}
                                        className={field.className}
                                        multiple
                                        accept="image/*"
                                    />
                                </div>
                            ) : null
                        ))}
                        <div className="form-control">
                            <span className='secondary-button' onClick={closeModals}>Cancel</span>
                            <button className='prime-button' type="submit">Submit</button>
                        </div>
                    </form>

                    <div className="carousel-container">
                        {imagesPreview && imagesPreview.length > 0 ? (
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
                                showStatus={false}
                            >
                                {imagesPreview.map((img, idx) => (
                                    <div className="carousel-img__container" key={idx}>
                                        <div className="img-container">
                                            <img src={img} alt={`Preview ${idx + 1}`} className="mt-3 mr-2" width="55" height="52" />
                                        </div>
                                    </div>
                                ))}
                            </Carousel>
                        ) : (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                <p>No images selected</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

CreateModal.displayName = 'CreateModal';

export default CreateModal;