import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import '../../../Styles/Modal.css';
import TextField from '@mui/material/TextField';
import FormHelperText from '@mui/material/FormHelperText';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import { FaArrowAltCircleRight, FaArrowAltCircleLeft } from "react-icons/fa";

const EditModal = React.forwardRef(({
    setOpenModal,
    modalData: { title, content, fields },
    handleUpdate,
    formState,
    imagesPreview,
    setImagesPreview,
    validationSchema
}, ref) => {

    const {
        control,
        handleSubmit,
        formState: { errors },
        setValue,
        reset,
        watch
    } = useForm({
        resolver: validationSchema ? yupResolver(validationSchema) : undefined,
        context: { isEditMode: true },
        mode: 'onChange',
        defaultValues: {
            name: '',
            price: '',
            description: '',
            category: '',
            team: '',
            stock: '',
            images: null
        }
    });

    const watchedValues = watch();

    useEffect(() => {
        console.log('EditModal - formState changed:', formState);
        console.log('EditModal - Has _id:', formState._id);

        if (formState && formState._id) {
            const formValues = {
                name: formState.name || '',
                price: formState.price || '',
                description: formState.description || '',
                category: formState.category || '',
                team: formState.team || '',
                stock: formState.stock || '',
                images: null
            };

            console.log('EditModal - Resetting form with values:', formValues);

            reset(formValues);
        }
    }, [formState, reset]);

    useEffect(() => {
        console.log('EditModal - Current form values:', watchedValues);
    }, [watchedValues]);

    const closeModals = () => {
        reset();
        setImagesPreview([]);
        setOpenModal(false);
    };

    const onSubmit = async (data) => {
        try {
            console.log('EditModal - Form submitted with data:', data);

            // Build submission data with all required fields
            const submissionData = {
                name: data.name,
                price: data.price,
                description: data.description,
                category: data.category,
                team: data.team,
                stock: data.stock
            };

            // Only process and include images if new ones were uploaded
            if (data.images && data.images.length > 0) {
                console.log('EditModal - Processing new images:', data.images.length);

                const imagePromises = Array.from(data.images).map(file => {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    });
                });

                submissionData.images = await Promise.all(imagePromises);
                console.log('EditModal - Converted images to base64');
            }
            // If no new images uploaded, don't include images field at all
            // This tells the backend to keep existing images

            console.log('EditModal - Calling handleUpdate with:', submissionData);
            await handleUpdate(submissionData);
        } catch (error) {
            console.error('EditModal - Form submission error:', error);
            alert('Error updating product: ' + error.message);
        }
    };

    const handleFileChange = (e, onChange) => {
        const files = e.target.files;

        if (!files || files.length === 0) {
            onChange(null);
            return;
        }

        console.log('EditModal - Files selected:', files.length);

        // Update react-hook-form
        onChange(files);

        // Update preview
        const newPreviews = [];
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = () => {
                newPreviews.push(reader.result);
                if (newPreviews.length === files.length) {
                    console.log('EditModal - Setting new previews:', newPreviews.length);
                    setImagesPreview(newPreviews);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    return (
        <div
            ref={ref}
            className='modal-background'
            onClick={closeModals}
        >
            <div
                className="modal-container"
                onClick={(e) => e.stopPropagation()}
            >
                <h2>Edit {title}</h2>
                <p>Fill out the following fields to update this {content}</p>
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
                                                    id="outlined-basic"
                                                    label={field.label}
                                                    variant="outlined"
                                                    type={field.type}
                                                    placeholder={field.placeholder}
                                                    value={value || ''}
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
                                                    type={field.type2}
                                                    placeholder={field.placeholder2}
                                                    value={value || ''}
                                                    onChange={onChange}
                                                    error={!!errors[field.name2]}
                                                    helperText={errors[field.name2]?.message}
                                                    className={field.className2}
                                                    fullWidth
                                                />
                                            )}
                                        />
                                    </div>
                                </div>
                            ) :
                                field.type === 'text' || field.type === 'textarea' ||
                                    field.type === 'password' || field.type === 'email' ? (
                                    <div key={field.name} className="input-group">
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
                                                    value={value || ''}
                                                    onChange={onChange}
                                                    error={!!errors[field.name]}
                                                    helperText={errors[field.name]?.message}
                                                    className={field.className}
                                                    fullWidth
                                                    multiline={field.type === 'textarea'}
                                                    rows={field.type === 'textarea' ? 4 : 1}
                                                />
                                            )}
                                        />
                                    </div>
                                ) : field.type === 'number' ? (
                                    <div key={field.name} className="input-group">
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
                                                    value={value || ''}
                                                    onChange={onChange}
                                                    error={!!errors[field.name]}
                                                    helperText={errors[field.name]?.message}
                                                    className={field.className}
                                                    fullWidth
                                                    inputProps={{
                                                        min: field.min !== undefined ? field.min : undefined,
                                                        max: field.max !== undefined ? field.max : undefined,
                                                        step: field.step || "1"
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
                                                        multiple={field.multiple}
                                                        accept="image/*"
                                                    />
                                                    {errors[field.name] && (
                                                        <FormHelperText error>
                                                            {errors[field.name]?.message}
                                                        </FormHelperText>
                                                    )}
                                                    <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
                                                        {imagesPreview && imagesPreview.length > 0
                                                            ? `Currently showing ${imagesPreview.length} image(s). Upload new images only if you want to replace them. Leave empty to keep existing images.`
                                                            : 'No images to preview. Upload images if you want to add them (optional).'
                                                        }
                                                    </small>
                                                </>
                                            )}
                                        />
                                    </div>
                                ) : field.type === 'select' ? (
                                    <div key={field.name} className="input-group">
                                        <label>{field.label}</label>
                                        <Controller
                                            name={field.name}
                                            control={control}
                                            render={({ field: { onChange, value } }) => (
                                                <>
                                                    <select
                                                        placeholder={field.placeholder}
                                                        value={value || ''}
                                                        onChange={onChange}
                                                        className={field.className}
                                                    >
                                                        <option value="">Choose an option</option>
                                                        {field.options && field.options.map((option, idx) => (
                                                            <option key={idx} value={option.value}>
                                                                {option.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {errors[field.name] && (
                                                        <FormHelperText error>
                                                            {errors[field.name]?.message}
                                                        </FormHelperText>
                                                    )}
                                                </>
                                            )}
                                        />
                                    </div>
                                ) : (
                                    <div key={index}></div>
                                )
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
                                                src={typeof img === 'string' ? img : (img.url || img)}
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

export default EditModal;