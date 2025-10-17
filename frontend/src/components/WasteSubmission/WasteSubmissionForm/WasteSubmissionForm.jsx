import  { useMemo } from "react";
import WasteSubmissionService from "../../../services/WasteSubmissionService";
import { useNotification } from "../../../contexts/NotificationContext";
import { useWasteSubmissionForm } from "../../../hooks/useWasteSubmission";
import { WASTE_TYPES, UNITS, WASTE_CATEGORIES } from "../../../constants/wasteFormConstants";
import { FormInput } from "./FormInput";
import { FormSelect } from "./FormSelect";
import { AddressFields } from "./AddressFields";
import { FiUser, FiMail, FiTrash2, FiTruck,  FiCalendar, FiRefreshCw } from "react-icons/fi";
import WasteOverview from "./WasteOverview";


export default function WasteSubmissionForm() {

const WASTE_TYPE_OPTIONS = Object.entries(WASTE_TYPES).map(([key, value]) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1)
}));

const UNIT_OPTIONS = Object.entries(UNITS).map(([key, value]) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1)
}));

  const notify = useNotification();
  const {
    form,
    errors,
    loading,
    setLoading,
    updateField,
    updateAddressField,
    resetForm,
    validateForm
  } = useWasteSubmissionForm();



  // Get category options based on selected waste type
  const categoryOptions = useMemo(() => {
    const categories = form.wasteType === WASTE_TYPES.RECYCLABLE 
      ? WASTE_CATEGORIES.RECYCLABLE 
      : WASTE_CATEGORIES.SPECIAL;
    
    return [
      { value: '', label: 'Select a category' },
      ...categories
    ];
  }, [form.wasteType]);

  // Handle waste type change - reset category when waste type changes
  const handleWasteTypeChange = (newWasteType) => {
    updateField("wasteType", newWasteType);
    updateField("category", ""); // Reset category when waste type changes
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      notify.push({ 
        title: "Validation Error", 
        message: "Please fix the errors in the form" 
      });
      return;
    }

    setLoading(true);
    
    try {
      const created = await WasteSubmissionService.create(form);
      const submissionId = created.data?.submissionId || created.submissionId || created._id;
      
      notify.push({ 
        title: "Success", 
        message: `Submission created with ID: ${submissionId}` 
      });
      
      resetForm();
    } catch (err) {
      notify.push({ 
        title: "Error", 
        message: err.message || "Failed to create submission" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
    <div className="min-h-screen bg-gray-300 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Waste Collection Request
          </h1>
          <p className="mt-3 text-xl text-gray-500">
            Fill out the form to schedule a waste collection
          </p>
        </div>

        <form 
          onSubmit={handleSubmit}
          className="space-y-8"
        >
          {/* Personal Information Card */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 bg-gradient-to-r from-blue-600 to-blue-500">
              <h3 className="text-lg leading-6 font-medium text-white flex items-center">
                <FiUser className="mr-2" /> Personal Information
              </h3>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <FormInput
                  label="Full Name"
                  required
                  value={form.submitterName}
                  onChange={e => updateField("submitterName", e.target.value)}
                  placeholder="John Doe"
                  error={errors.submitterName}
                  icon={<FiUser className="h-5 w-5 text-gray-400" />}
                />
                <FormInput
                  label="Email Address"
                  type="email"
                  required
                  value={form.submitterEmail}
                  onChange={e => updateField("submitterEmail", e.target.value)}
                  placeholder="john@example.com"
                  error={errors.submitterEmail}
                  icon={<FiMail className="h-5 w-5 text-gray-400" />}
                />
              </div>
            </div>
          </div>

          {/* Waste Information Card */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 bg-gradient-to-r from-green-600 to-green-500">
              <h3 className="text-lg leading-6 font-medium text-white flex items-center">
                <FiTruck className="mr-2" /> Waste Details
              </h3>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <FormSelect
                  label="Waste Type"
                  required
                  value={form.wasteType}
                  onChange={e => handleWasteTypeChange(e.target.value)}
                  options={WASTE_TYPE_OPTIONS}
                  error={errors.wasteType}
                />
                <FormSelect
                  label="Category"
                  required
                  value={form.category}
                  onChange={e => updateField("category", e.target.value)}
                  options={categoryOptions}
                  error={errors.category}
                />
              </div>

              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3">
                <FormInput
                  label="Quantity"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={form.quantity}
                  onChange={e => updateField("quantity", e.target.value)}
                  placeholder="0.00"
                  error={errors.quantity}
                />
                <FormSelect
                  label="Unit of Measurement"
                  value={form.unit}
                  onChange={e => updateField("unit", e.target.value)}
                  options={UNIT_OPTIONS}
                />
                <FormInput
                  label="Preferred Pickup Date"
                  type="date"
                  value={form.pickupDate}
                  onChange={e => updateField("pickupDate", e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  icon={<FiCalendar className="h-5 w-5 text-gray-400" />}
                />
              </div>
            </div>
          </div>

          {/* Address Section */}
          <AddressFields
            address={form.collectionAddress}
            onChange={updateAddressField}
            errors={errors.address || {}}
          />

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              type="button"
              onClick={resetForm}
              disabled={loading}
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FiTrash2 className="mr-2 h-4 w-4" />
              Clear Form
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <FiRefreshCw className="animate-spin mr-2 h-4 w-4" />
                  Processing...
                </>
              ) : (
                <>
                  <FiTruck className="mr-2 h-4 w-4" />
                  Schedule Collection
                </>
              )}
            </button>
          </div>
        </form>
        
      </div>
      
    </div>
    <WasteOverview/>
    </div>
    
  );
}