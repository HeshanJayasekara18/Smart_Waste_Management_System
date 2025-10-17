export class WasteFormValidator {
  static validate(form) {
    const errors = {};

    // Personal information validation
    if (!form.submitterName?.trim()) {
      errors.submitterName = "Name is required";
    } else if (form.submitterName.trim().length < 2) {
      errors.submitterName = "Name must be at least 2 characters";
    }

    if (!this.isValidEmail(form.submitterEmail)) {
      errors.submitterEmail = "Valid email is required";
    }

    // Waste information validation
    if (!form.category?.trim()) {
      errors.category = "Category is required";
    }

    if (!form.quantity || form.quantity <= 0) {
      errors.quantity = "Quantity must be greater than 0";
    }

    // Address validation
    const addressErrors = this.validateAddress(form.collectionAddress);
    if (Object.keys(addressErrors).length > 0) {
      errors.address = addressErrors;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  static validateAddress(address) {
    const errors = {};

    if (!address.street?.trim()) {
      errors.street = "Street address is required";
    } else if (address.street.trim().length < 5) {
      errors.street = "Street address must be at least 5 characters";
    }

    if (!address.city?.trim()) {
      errors.city = "City is required";
    } else if (address.city.trim().length < 2) {
      errors.city = "City name must be at least 2 characters";
    }

    if (!address.state?.trim()) {
      errors.state = "State is required";
    } else if (address.state.trim().length < 2) {
      errors.state = "State must be at least 2 characters";
    }

    if (!address.postalCode?.trim()) {
      errors.postalCode = "Postal code is required";
    } else if (!this.isValidPostalCode(address.postalCode)) {
      errors.postalCode = "Invalid postal code format";
    }

    return errors;
  }

  static isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  static isValidPostalCode(postalCode) {
    // Supports various formats: 12345, 12345-6789, or other international formats
    return /^[A-Za-z0-9\s\-]{3,10}$/.test(postalCode);
  }
}