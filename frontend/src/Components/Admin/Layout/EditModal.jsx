import React from 'react'
import '../../../Styles/Modal.css'
import TextField from '@mui/material/TextField';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import { Paper, Button, colors } from '@mui/material'
import { FaArrowAltCircleRight } from "react-icons/fa";
import { FaArrowAltCircleLeft } from "react-icons/fa";

const EditModal = React.forwardRef(({ 
    setOpenModal, 
    modalData: { title, content, fields }, 
    handleUpdate, 
    formState, 
    imagesPreview, 
    setImagesPreview 
}, ref) => {
    const closeModals = () => {
        setOpenModal(false)
    }

    const handleFileChange = (e) => {
        const fileField = fields.find(f => f.type === 'file');
        if (fileField?.onChange) {
            fileField.onChange(e); 
        }
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
                className="modal-container"
                onClick={(e) => e.stopPropagation()}
            >
                <h2>Edit {title}</h2>
                <p>Fill out the following fields to update this {content}</p>
                <div className="main-area">
                    <form className="crud-form">
                        {fields.map((field, index) => (
                            field.col ? (
                                <div key={index} className="input-group-col">
                                    <div className="col">
                                        <label>{field.label}</label>
                                        <TextField 
                                            id="outlined-basic" 
                                            label={field.label} 
                                            variant="outlined"
                                            type={field.type}
                                            name={field.name}
                                            placeholder={field.placeholder}
                                            value={field.value}
                                            onChange={field.onChange}
                                            required={field.required}
                                        />
                                    </div>
                                    <div className="col" key={field.name2}>
                                        <label>{field.label2}</label>
                                        <input
                                            type={field.type2}
                                            name={field.name2}
                                            placeholder={field.placeholder2}
                                            value={field.value2}
                                            onChange={field.onChange2}
                                            required={field.required2}
                                            className={field.className2}
                                        />
                                    </div>
                                </div>
                            ) :
                            field.type === 'text' || field.type === 'textarea' || 
                            field.type === 'password' || field.type === 'email' || 
                            field.type === 'number' ? (
                                <div key={field.name} className="input-group">
                                    <TextField
                                        id="outlined-basic"
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
                                    />
                                </div>
                            ) : field.type === 'file' ? (
                                <div key={field.name} className="input-group">
                                    <label>{field.label}</label>
                                    <input
                                        type="file"
                                        name={field.name}
                                        onChange={handleFileChange}
                                        className={field.className}
                                        multiple={field.multiple}
                                        accept="image/*"
                                    />
                                    <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
                                        {imagesPreview && imagesPreview.length > 0 
                                            ? `Current: ${imagesPreview.length} image(s). Select new images to replace them.`
                                            : 'No images currently'
                                        }
                                    </small>
                                </div>
                            ) : field.type === 'select' ? (
                                <div key={field.name} className="input-group">
                                    <label>{field.label}</label>
                                    <select
                                        name={field.name}
                                        placeholder={field.placeholder}
                                        value={field.value}
                                        onChange={field.onChange}
                                        required={field.required}
                                        className={field.className}
                                    >
                                        <option value="null">Choose an option</option>
                                        {field.options === undefined ? (
                                            <option></option>
                                        ) : (
                                            field.options.map((option, index) => (
                                                <option key={index} value={option._id}>
                                                    {option[field.requestFor]}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>
                            ) : (
                                <div key={index}></div>
                            )
                        ))}

                        <div className="form-control">
                            <span className='secondary-button' onClick={() => { closeModals() }}>Cancel</span>
                            <span className='prime-button' onClick={() => { handleUpdate() }}>Submit</span>
                        </div>
                    </form>
                    <div className="carousel-container">
                        {imagesPreview && imagesPreview.length > 0 ? (
                            <Carousel
                                className='custom-carousel'
                                renderArrowNext={(onClickHandler, hasNext) =>
                                    hasNext && (
                                        <button
                                            type="button"
                                            onClick={onClickHandler}
                                            className="carousel-arrow carousel-arrow-next"
                                        >
                                            <FaArrowAltCircleRight style={{ color: 'var(--primary-color)' }} />
                                        </button>
                                    )
                                }
                                renderArrowPrev={(onClickHandler, hasPrev) =>
                                    hasPrev && (
                                        <button
                                            type="button"
                                            onClick={onClickHandler}
                                            className="carousel-arrow carousel-arrow-prev"
                                        >
                                            <FaArrowAltCircleLeft style={{ color: 'var(--primary-color)' }} />
                                        </button>
                                    )
                                }
                                showThumbs={false}
                                showStatus={true}
                            >
                                {imagesPreview.map((img, idx) => (
                                    <div className="carousel-img__container" key={idx}>
                                        <div className="img-container">
                                            <img 
                                                src={img} 
                                                alt={`Images Preview ${idx + 1}`} 
                                                style={{ maxHeight: '400px', objectFit: 'contain' }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </Carousel>
                        ) : (
                            <p style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                                No images to display
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
});

EditModal.displayName = 'EditModal';

export default EditModal