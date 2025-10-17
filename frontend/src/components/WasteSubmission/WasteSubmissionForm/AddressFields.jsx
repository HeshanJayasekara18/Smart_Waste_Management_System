import { FormInput } from './FormInput';
import { FiMapPin, FiMap, FiNavigation, FiHome } from 'react-icons/fi';

export function AddressFields({ address, onChange, errors = {} }) {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 bg-gradient-to-r from-amber-600 to-amber-500">
        <h3 className="text-lg leading-6 font-medium text-white flex items-center">
          <FiMapPin className="mr-2" /> Collection Address
        </h3>
      </div>
      
      <div className="border-t border-gray-200 px-4 py-5 sm:p-6 space-y-4">
        <FormInput
          required
          value={address.street}
          onChange={e => onChange('street', e.target.value)}
          placeholder="Street Address *"
          error={errors.street}
          icon={<FiHome className="h-5 w-5 text-gray-400" />}
        />
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormInput
            required
            value={address.city}
            onChange={e => onChange('city', e.target.value)}
            placeholder="City *"
            error={errors.city}
            icon={<FiMap className="h-5 w-5 text-gray-400" />}
          />
          <FormInput
            required
            value={address.state}
            onChange={e => onChange('state', e.target.value)}
            placeholder="State *"
            error={errors.state}
            icon={<FiMap className="h-5 w-5 text-gray-400" />}
          />
          <FormInput
            required
            value={address.postalCode}
            onChange={e => onChange('postalCode', e.target.value)}
            placeholder="Postal Code *"
            error={errors.postalCode}
            icon={<FiMap className="h-5 w-5 text-gray-400" />}
          />
        </div>
        
        <FormInput
          value={address.landmark}
          onChange={e => onChange('landmark', e.target.value)}
          placeholder="Landmark (optional)"
          icon={<FiNavigation className="h-5 w-5 text-gray-400" />}
        />
        
        <div className="mt-2 text-sm text-gray-500">
          * Required fields
        </div>
      </div>
    </div>
  );
}