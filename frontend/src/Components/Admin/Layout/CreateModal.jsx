import React, { forwardRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import '../../../Styles/Modal.css';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import FormHelperText from '@mui/material/FormHelperText';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import { FaArrowAltCircleRight, FaArrowAltCircleLeft } from "react-icons/fa";

const CreateModal = forwardRef(({
    setOpenModal, 
    modalData: { title, content, fields }, 
    handleSubmit: onSubmitHandler, 
    imagesPreview, 
    setImagesPreview,
    validationSchema
}, ref) => {

    const {
        control,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        reset
    } = useForm({
        resolver: yupResolver(validationSchema),
        defaultValues: fields.reduce((acc, field) => {
            if (field.col) {
                acc[field.name] = field.value || '';
                acc[field.name2] = field.value2 || '';
            } else {
                acc[field.name] = field.value || (field.type === 'file' ? [] : '');
            }
            return acc;
        }, {})
    });

    const closeModals = () => {
        setImagesPreview([]);
        reset();
        setOpenModal(false);
    };

    const onSubmit = async (data) => {
        try {
            await onSubmitHandler(data);
        } catch (error) {
            console.error('Form submission error:', error);
        }
    };

    const handleFileChange = (e, onChange) => {
        const files = Array.from(e.target.files);
        
        if (files.length === 0) return;
        
        setImagesPreview([]);
        const newPreviews = [];

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = () => {
                if (reader.readyState === 2) {
                    newPreviews.push(reader.result);
                    if (newPreviews.length === files.length) {
                        setImagesPreview(newPreviews);
                    }
                }
            };
            reader.readAsDataURL(file);
        });

        onChange(files);
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
                    <form className="crud-form" onSubmit={handleSubmit(onSubmit)}>
                        {fields.map((field, index) => (
                            field.col ? (
                                <div key={index} className="input-group-col">
                                    <div className="col">
                                        <Controller
                                            name={field.name}
                                            control={control}
                                            render={({ field: { onChange, value } }) => (
                                                <TextField
                                                    id={`outlined-${field.name}`}
                                                    label={field.label}
                                                    variant="outlined"
                                                    type={field.type}
                                                    placeholder={field.placeholder}
                                                    value={value}
                                                    onChange={onChange}
                                                    error={!!errors[field.name]}
                                                    helperText={errors[field.name]?.message}
                                                    fullWidth
                                                />
                                            )}
                                        />
                                    </div>
                                    <div className="col" key={field.name2}>
                                        <Controller
                                            name={field.name2}
                                            control={control}
                                            render={({ field: { onChange, value } }) => (
                                                <TextField
                                                    id={`outlined-${field.name2}`}
                                                    label={field.label2}
                                                    variant="outlined"
                                                    type={field.type2}
                                                    placeholder={field.placeholder2}
                                                    value={value}
                                                    onChange={onChange}
                                                    error={!!errors[field.name2]}
                                                    helperText={errors[field.name2]?.message}
                                                    fullWidth
                                                />
                                            )}
                                        />
                                    </div>
                                </div>
                            ) : field.type === 'custom' ? (
                                <div key={field.name} className="input-group">
                                    {field.customComponent}
                                </div>
                            ) : field.type === 'select' ? (
                                <div key={field.name} className="input-group">
                                    <Controller
                                        name={field.name}
                                        control={control}
                                        render={({ field: { onChange, value } }) => (
                                            <FormControl 
                                                fullWidth 
                                                variant="outlined" 
                                                error={!!errors[field.name]}
                                            >
                                                <InputLabel id={`${field.name}-label`}>
                                                    {field.label}
                                                </InputLabel>
                                                <Select
                                                    labelId={`${field.name}-label`}
                                                    id={`select-${field.name}`}
                                                    value={value}
                                                    onChange={onChange}
                                                    label={field.label}
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
                                                {errors[field.name] && (
                                                    <FormHelperText>
                                                        {errors[field.name]?.message}
                                                    </FormHelperText>
                                                )}
                                            </FormControl>
                                        )}
                                    />
                                </div>
                            ) : field.type === 'text' || field.type === 'number' || field.type === 'textarea' ? (
                                <div key={field.name} className="input-group">
                                    <Controller
                                        name={field.name}
                                        control={control}
                                        render={({ field: { onChange, value } }) => (
                                            <TextField
                                                id={`outlined-${field.name}`}
                                                label={field.label}
                                                variant="outlined"
                                                type={field.type === 'textarea' ? 'text' : field.type}
                                                placeholder={field.placeholder}
                                                value={value}
                                                onChange={onChange}
                                                error={!!errors[field.name]}
                                                helperText={errors[field.name]?.message}
                                                className={field.className}
                                                fullWidth
                                                multiline={field.type === 'textarea'}
                                                rows={field.type === 'textarea' ? 4 : 1}
                                                inputProps={{
                                                    min: field.min,
                                                    max: field.max,
                                                    step: field.step
                                                }}
                                            />
                                        )}
                                    />
                                </div>
                            ) : field.type === 'file' ? (
                                <div key={field.name} className="input-group">
                                    <label>{field.label}</label>
                                    <Controller
                                        name={field.name}
                                        control={control}
                                        render={({ field: { onChange, value, ...rest } }) => (
                                            <>
                                                <input
                                                    type="file"
                                                    onChange={(e) => handleFileChange(e, onChange)}
                                                    className={field.className}
                                                    multiple
                                                    accept="image/*"
                                                />
                                                {errors[field.name] && (
                                                    <FormHelperText error>
                                                        {errors[field.name]?.message}
                                                    </FormHelperText>
                                                )}
                                            </>
                                        )}
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