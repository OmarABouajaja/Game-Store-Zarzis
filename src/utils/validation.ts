
/**
 * Validation utilities for common input fields
 */

export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
    // Tunisian phone number validation
    // Accepts: 
    // - 8 digits (e.g., 22333444)
    // - Spaces (e.g., 22 333 444)
    // - +216 prefix

    const cleanPhone = phone.replace(/\s/g, '').replace('+216', '');
    const phoneRegex = /^[2459]\d{7}$/;
    return phoneRegex.test(cleanPhone);
};

export const isValidName = (name: string): boolean => {
    return name.trim().length >= 2;
};

export const sanitizeInput = (input: string): string => {
    // Basic sanitization to prevent simple script injection if displayed raw
    // Note: React escapes by default, but this is good for data processing
    return input.replace(/[<>]/g, '');
};
