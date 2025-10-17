import { useState} from 'react';
import { INITIAL_FORM_STATE } from '../constants/wasteFormConstants';
import { WasteFormValidator } from '../validators/wasteFormValidator';


export function useWasteSubmissionForm() {
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);


  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const updateAddressField = (field, value) => {
    setForm(prev => ({
      ...prev,
      collectionAddress: {
        ...prev.collectionAddress,
        [field]: value
      }
    }));
    
    // Clear address error for this field
    if (errors.address && errors.address[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors.address) {
          const newAddressErrors = { ...newErrors.address };
          delete newAddressErrors[field];
          if (Object.keys(newAddressErrors).length === 0) {
            delete newErrors.address;
          } else {
            newErrors.address = newAddressErrors;
          }
        }
        return newErrors;
      });
    }
  };

  const resetForm = () => {
    setForm(INITIAL_FORM_STATE);
    setErrors({});
  };

  const validateForm = () => {
    const validation = WasteFormValidator.validate(form);
    setErrors(validation.errors);
    return validation.isValid;
  };

  return {
    form,
    errors,
    loading,
    setLoading,
    updateField,
    updateAddressField,
    resetForm,
    validateForm
  };
}