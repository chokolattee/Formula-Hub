import * as yup from 'yup';

// Product validation schema
export const productSchema = yup.object().shape({
  name: yup
    .string()
    .required('Product name is required')
    .min(3, 'Product name must be at least 3 characters')
    .max(100, 'Product name must not exceed 100 characters')
    .trim(),
  
  price: yup
    .number()
    .required('Price is required')
    .positive('Price must be a positive number')
    .min(0.01, 'Price must be at least ₱0.01')
    .max(1000000, 'Price cannot exceed ₱1,000,000')
    .typeError('Price must be a valid number'),
  
  description: yup
    .string()
    .required('Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must not exceed 1000 characters')
    .trim(),
  
  category: yup
    .string()
    .required('Category is required'),
  
  team: yup
    .string()
    .required('Team is required'),
  
  stock: yup
    .number()
    .required('Stock quantity is required')
    .integer('Stock must be a whole number')
    .min(0, 'Stock cannot be negative')
    .max(10000, 'Stock cannot exceed 10,000 units')
    .typeError('Stock must be a valid number'),
  
  images: yup
    .mixed()
    .test('fileRequired', 'At least one image is required', function(value) {
      // For create mode
      if (this.options.context?.isEditMode) {
        return true;
      }
      return value && value.length > 0;
    })
    .test('fileSize', 'Each image must be less than 5MB', function(value) {
      if (!value || value.length === 0) return true;
      return Array.from(value).every(file => file.size <= 5242880); // 5MB
    })
    .test('fileType', 'Only image files are allowed', function(value) {
      if (!value || value.length === 0) return true;
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      return Array.from(value).every(file => validTypes.includes(file.type));
    })
});

// Edit product validation schema 
export const productEditSchema = yup.object().shape({
  name: yup
    .string()
    .required('Product name is required')
    .min(3, 'Product name must be at least 3 characters')
    .max(100, 'Product name must not exceed 100 characters')
    .trim(),
  
  price: yup
    .number()
    .required('Price is required')
    .positive('Price must be a positive number')
    .min(0.01, 'Price must be at least ₱0.01')
    .max(1000000, 'Price cannot exceed ₱1,000,000')
    .typeError('Price must be a valid number'),
  
  description: yup
    .string()
    .required('Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must not exceed 1000 characters')
    .trim(),
  
  category: yup
    .string()
    .required('Category is required'),
  
  team: yup
    .string()
    .required('Team is required'),
  
  stock: yup
    .number()
    .required('Stock quantity is required')
    .integer('Stock must be a whole number')
    .min(0, 'Stock cannot be negative')
    .max(10000, 'Stock cannot exceed 10,000 units')
    .typeError('Stock must be a valid number'),
  
  images: yup
    .mixed()
    .nullable() // Allow null values
    .notRequired() // Make it optional
    .test('fileSize', 'Each image must be less than 5MB', function(value) {
      if (!value || value.length === 0) return true;
      return Array.from(value).every(file => file.size <= 5242880);
    })
    .test('fileType', 'Only image files are allowed', function(value) {
      if (!value || value.length === 0) return true;
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      return Array.from(value).every(file => validTypes.includes(file.type));
    })
});

export const teamSchema = yup.object().shape({
  name: yup
    .string()
    .required('Team name is required')
    .min(2, 'Team name must be at least 2 characters')
    .max(50, 'Team name must not exceed 50 characters')
    .trim(),
  
  description: yup
    .string()
    .required('Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must not exceed 500 characters')
    .trim(),
  
  images: yup
    .mixed()
    .test('fileRequired', 'At least one image is required', function(value) {
      if (this.options.context?.isEditMode) {
        return true;
      }
      return value && value.length > 0;
    })
    .test('fileSize', 'Each image must be less than 5MB', function(value) {
      if (!value || value.length === 0) return true;
      return Array.from(value).every(file => file.size <= 5242880);
    })
    .test('fileType', 'Only image files are allowed (JPEG, PNG, GIF, WebP)', function(value) {
      if (!value || value.length === 0) return true;
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      return Array.from(value).every(file => validTypes.includes(file.type));
    })
});

// Team validation schema for EDIT mode
export const teamEditSchema = yup.object().shape({
  name: yup
    .string()
    .required('Team name is required')
    .min(2, 'Team name must be at least 2 characters')
    .max(50, 'Team name must not exceed 50 characters')
    .trim(),
  
  description: yup
    .string()
    .required('Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must not exceed 500 characters')
    .trim(),
  
  images: yup
    .mixed()
    .nullable() // Allow null values
    .notRequired() // Make it optional
    .test('fileSize', 'Each image must be less than 5MB', function(value) {
      if (!value || value.length === 0) return true;
      return Array.from(value).every(file => file.size <= 5242880);
    })
    .test('fileType', 'Only image files are allowed (JPEG, PNG, GIF, WebP)', function(value) {
      if (!value || value.length === 0) return true;
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      return Array.from(value).every(file => validTypes.includes(file.type));
    })
});

export const categorySchema = yup.object().shape({
  name: yup
    .string()
    .required('Category name is required')
    .min(2, 'Category name must be at least 2 characters')
    .max(100, 'Category name must not exceed 100 characters'),
  description: yup
    .string()
    .required('Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must not exceed 500 characters'),
  images: yup
    .mixed()
    .test('fileSize', 'Each image must be less than 5MB', function(value) {
      if (!value || value.length === 0) return true; // Optional for create
      return Array.from(value).every(file => file.size <= 5 * 1024 * 1024);
    })
    .test('fileType', 'Only image files are allowed', function(value) {
      if (!value || value.length === 0) return true;
      return Array.from(value).every(file => 
        file.type.startsWith('image/')
      );
    })
});

// Category Edit Schema
export const categoryEditSchema = yup.object().shape({
  name: yup
    .string()
    .required('Category name is required')
    .min(2, 'Category name must be at least 2 characters')
    .max(100, 'Category name must not exceed 100 characters'),
  description: yup
    .string()
    .required('Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must not exceed 500 characters'),
  images: yup
    .mixed()
    .nullable() // Allow null values
    .notRequired() // Make it optional
    .test('fileSize', 'Each image must be less than 5MB', function(value) {
      if (!value || value.length === 0) return true; // Optional for edit
      return Array.from(value).every(file => file.size <= 5 * 1024 * 1024);
    })
    .test('fileType', 'Only image files are allowed', function(value) {
      if (!value || value.length === 0) return true;
      return Array.from(value).every(file => 
        file.type.startsWith('image/')
      );
    })
});