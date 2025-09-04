"use client";

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface AddRepModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (formData: AddRepFormData) => void;
  currentUserEmail?: string;
}

export interface AddRepFormData {
  firstName: string;
  lastName: string;
  repEmail: string;
  phoneNumber: string;
  payType: 'rookie' | 'vet' | 'pro';
  salesRole: 'setter' | 'closer' | 'admin';
  office: string;
  region: string;
  managerRole: 'rep' | 'manager' | 'admin';
}

export default function AddRepModal({ isVisible, onClose, onSubmit, currentUserEmail }: AddRepModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<AddRepFormData>({
    firstName: '',
    lastName: '',
    repEmail: '',
    phoneNumber: '',
    payType: 'rookie',
    salesRole: 'setter',
    office: 'Fresno',
    region: 'Region A',
    managerRole: 'rep'
  });

  // Update form data when currentUserEmail changes to ensure proper defaults
  useEffect(() => {
    if (currentUserEmail !== 'support@ambientenergygroup.com') {
      // If not support user, ensure admin roles are not selected
      setFormData(prev => ({
        ...prev,
        salesRole: prev.salesRole === 'admin' ? 'setter' : prev.salesRole,
        managerRole: prev.managerRole === 'admin' ? 'rep' : prev.managerRole
      }));
    }
  }, [currentUserEmail]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextStep = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetForm = () => {
    setCurrentStep(0);
    setFormData({
      firstName: '',
      lastName: '',
      repEmail: '',
      phoneNumber: '',
      payType: 'rookie',
      salesRole: 'setter',
      office: 'Fresno',
      region: 'Region A',
      managerRole: 'rep'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Combine firstName and lastName for repName
      const formDataWithRepName = {
        ...formData,
        repName: `${formData.firstName} ${formData.lastName}`.trim()
      };
      await onSubmit(formDataWithRepName);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error adding rep:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Rep</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Step {currentStep + 1} of 3</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4">
          <div className="flex items-center">
            {[0, 1, 2].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                }`}>
                  {step + 1}
                </div>
                {step < 2 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step < currentStep ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Step 1: Personal Information */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-black dark:text-white"
                    placeholder="First Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-black dark:text-white"
                    placeholder="Last Name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.repEmail}
                  onChange={(e) => setFormData({ ...formData, repEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-black dark:text-white"
                  placeholder="email@example.com"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  An invite link will be sent to this email address
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-black dark:text-white"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          )}

          {/* Step 2: Role & Position */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Role & Position</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sales Role *
                  </label>
                  <select
                    value={formData.salesRole}
                    onChange={(e) => setFormData({ ...formData, salesRole: e.target.value as 'setter' | 'closer' | 'admin' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-black dark:text-white"
                  >
                    <option value="setter">Setter</option>
                    <option value="closer">Closer</option>
                    {currentUserEmail === 'support@ambientenergygroup.com' && (
                      <option value="admin">Admin</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Pay Type *
                  </label>
                  <select
                    value={formData.payType}
                    onChange={(e) => setFormData({ ...formData, payType: e.target.value as 'rookie' | 'vet' | 'pro' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-black dark:text-white"
                  >
                    <option value="rookie">Rookie</option>
                    <option value="vet">Vet</option>
                    <option value="pro">Pro</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Manager Role *
                </label>
                <select
                  value={formData.managerRole}
                  onChange={(e) => setFormData({ ...formData, managerRole: e.target.value as 'rep' | 'manager' | 'admin' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-black dark:text-white"
                >
                  <option value="rep">Rep</option>
                  <option value="manager">Manager</option>
                  {currentUserEmail === 'support@ambientenergygroup.com' && (
                    <option value="admin">Admin</option>
                  )}
                </select>
                {currentUserEmail !== 'support@ambientenergygroup.com' && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Admin role can only be assigned by support@ambientenergygroup.com
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Location & Assignment */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Location & Assignment</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Office *
                  </label>
                  <select
                    value={formData.office}
                    onChange={(e) => setFormData({ ...formData, office: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-black dark:text-white"
                  >
                    <option value="Fresno">Fresno</option>
                    <option value="Lancaster">Lancaster</option>
                    <option value="Bakersfield">Bakersfield</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Region *
                  </label>
                  <select
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-black dark:text-white"
                  >
                    <option value="Region A">Region A</option>
                    <option value="Region B">Region B</option>
                    <option value="Region C">Region C</option>
                    <option value="Region D">Region D</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex justify-between mt-6">
            <div>
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </button>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              {currentStep < 2 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Adding Rep...' : 'Add Rep'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}