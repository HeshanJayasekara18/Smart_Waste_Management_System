import { WasteFormValidator } from '../../validators/wasteFormValidator';

describe('WasteFormValidator', () => {
  const validForm = {
    submitterName: 'John Doe',
    submitterEmail: 'john@example.com',
    category: 'plastic',
    quantity: 5,
    pickupDate: new Date(Date.now() + 24*60*60*1000).toISOString(),
    collectionAddress: {
      street: '123 Main St',
      city: 'Colombo',
      state: 'WE',
      postalCode: '12345'
    }
  };

  test('valid form passes', () => {
    const res = WasteFormValidator.validate(validForm);
    expect(res.isValid).toBe(true);
    expect(res.errors).toEqual({});
  });

  test('invalid email and required fields', () => {
    const res = WasteFormValidator.validate({ ...validForm, submitterEmail: 'bad', category: '', quantity: 0 });
    expect(res.isValid).toBe(false);
    expect(res.errors.submitterEmail).toBeTruthy();
    expect(res.errors.category).toBeTruthy();
    expect(res.errors.quantity).toBeTruthy();
  });

  test('address validation catches errors', () => {
    const res = WasteFormValidator.validate({
      ...validForm,
      collectionAddress: { street: '', city: '', state: '', postalCode: '!' }
    });
    expect(res.isValid).toBe(false);
    expect(res.errors.address).toBeTruthy();
    expect(Object.keys(res.errors.address).length).toBeGreaterThan(0);
  });
});
