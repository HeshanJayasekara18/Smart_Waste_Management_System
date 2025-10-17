export const WASTE_TYPES = {
  RECYCLABLE: 'recyclable',
  SPECIAL: 'special'
};

export const WASTE_CATEGORIES = {
  RECYCLABLE: [
    { value: 'plastic', label: 'Plastic' },
    { value: 'paper', label: 'Paper' },
    { value: 'glass', label: 'Glass' },
    { value: 'metal', label: 'Metal' }
  ],
  SPECIAL: [
    { value: 'bulky', label: 'Bulky Items' },
    { value: 'e-waste', label: 'E-Waste (Electronics)' },
    { value: 'other', label: 'Other Special Waste' }
  ]
};



export const UNITS = {
  KG: 'kg',
  ITEMS: 'items',
  LITERS: 'liters',
  CUBIC_METERS: 'cubic meters'
};

export const INITIAL_FORM_STATE = {
  submitterName: "",
  submitterEmail: "",
  wasteType: WASTE_TYPES.RECYCLABLE,
  category: "",
  quantity: "",
  unit: UNITS.KG,
  pickupDate: "",
  location: "",
  collectionAddress: {
    street: "",
    city: "",
    state: "",
    postalCode: "",
    landmark: ""
  },
  paymentRequired: false,
  paymentAmount: 0
};