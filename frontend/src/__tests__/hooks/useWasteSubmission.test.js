import { renderHook, act } from '@testing-library/react';
import { useWasteSubmissionForm } from '../../hooks/useWasteSubmission';

describe('useWasteSubmissionForm', () => {
  test('initializes with default form state', () => {
    const { result } = renderHook(() => useWasteSubmissionForm());
    
    expect(result.current.form).toEqual({
      wasteType: 'recyclable',
      category: '',
      quantity: '',
      unit: 'kg',
      pickupDate: '',
      location: '',
      collectionAddress: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        landmark: ''
      },
      paymentRequired: false,
      paymentAmount: 0,
      submitterName: '',
      submitterEmail: ''
    });
  });

  test('updates form field', () => {
    const { result } = renderHook(() => useWasteSubmissionForm());
    
    act(() => {
      result.current.updateField('wasteType', 'recyclable');
    });
    
    expect(result.current.form.wasteType).toBe('recyclable');
  });

  test('updates address field', () => {
    const { result } = renderHook(() => useWasteSubmissionForm());
    
    act(() => {
      result.current.updateAddressField('street', '123 Main St');
    });
    
    expect(result.current.form.collectionAddress.street).toBe('123 Main St');
  });

  test('resets form', () => {
    const { result } = renderHook(() => useWasteSubmissionForm());
    
    // First update some fields
    act(() => {
      result.current.updateField('wasteType', 'plastic');
      result.current.updateAddressField('street', '123 Main St');
    });
    
    // Then reset
    act(() => {
      result.current.resetForm();
    });
    
    // Should be back to defaults
    expect(result.current.form.wasteType).toBe('recyclable');
    expect(result.current.form.collectionAddress.street).toBe('');
  });

  test('validates form', () => {
    const { result } = renderHook(() => useWasteSubmissionForm());
    
    act(() => {
      const isValid = result.current.validateForm();
      expect(isValid).toBe(false); // Should be invalid with empty required fields
      expect(result.current.errors).toBeDefined();
    });
  });
});
