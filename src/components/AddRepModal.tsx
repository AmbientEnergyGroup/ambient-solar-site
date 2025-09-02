"use client";

import { useState, useEffect } from 'react';
import { X, Mail, User, Building, MapPin } from 'lucide-react';

interface AddRepModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (formData: AddRepFormData) => void;
  currentUserEmail?: string;
}

export interface AddRepFormData {
  repName: string;
  repEmail: string;
  phoneNumber: string;
  payType: 'rookie' | 'vet' | 'pro';
  salesRole: 'setter' | 'closer' | 'admin';
  office: string;
  region: string;
  managerRole: 'rep' | 'manager' | 'admin';
}

export default function AddRepModal({ isVisible, onClose, onSubmit, currentUserEmail }: AddRepModalProps) {
  const [formData, setFormData] = useState<AddRepFormData>({
    repName: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
      // Reset form
      setFormData({
        repName: '',
        repEmail: '',
        phoneNumber: '',
        payType: 'rookie',
        salesRole: 'setter',
        office: 'Fresno',
        region: 'Region A',
        managerRole: 'rep'
      });
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
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add New Rep</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Rep Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 inline mr-2" />
              Rep Name *
            </label>
            <input
              type="text"
              required
              value={formData.repName}
              onChange={(e) => setFormData({ ...formData, repName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="Full Name"
            />
          </div>

          {/* Rep Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="h-4 w-4 inline mr-2" />
              Rep Email *
            </label>
            <input
              type="email"
              required
              value={formData.repEmail}
              onChange={(e) => setFormData({ ...formData, repEmail: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="rep@example.com"
            />
            <p className="text-xs text-gray-500 mt-1">
              An invite link will be sent to this email address
            </p>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              required
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="(555) 123-4567"
            />
          </div>

          {/* Pay Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pay Type *
            </label>
            <select
              required
              value={formData.payType}
              onChange={(e) => setFormData({ ...formData, payType: e.target.value as 'rookie' | 'vet' | 'pro' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="rookie">Rookie</option>
              <option value="vet">Vet</option>
              <option value="pro">Pro</option>
            </select>
          </div>

          {/* Sales Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sales Role *
            </label>
            <select
              required
              value={formData.salesRole}
              onChange={(e) => setFormData({ ...formData, salesRole: e.target.value as 'setter' | 'closer' | 'admin' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="setter">Setter</option>
              <option value="closer">Closer</option>
              {currentUserEmail === 'support@ambientenergygroup.com' && (
                <option value="admin">Admin</option>
              )}
            </select>
            {currentUserEmail !== 'support@ambientenergygroup.com' && (
              <p className="text-xs text-gray-500 mt-1">
                Admin role can only be assigned by support@ambientenergygroup.com
              </p>
            )}
          </div>

          {/* Office */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building className="h-4 w-4 inline mr-2" />
              Office *
            </label>
            <select
              required
              value={formData.office}
              onChange={(e) => setFormData({ ...formData, office: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="Fresno">Fresno</option>
              <option value="Lancaster">Lancaster</option>
              <option value="Bakersfield">Bakersfield</option>
            </select>
          </div>

          {/* Region */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="h-4 w-4 inline mr-2" />
              Region *
            </label>
            <select
              required
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="Region A">Region A</option>
              <option value="Region B">Region B</option>
              <option value="Region C">Region C</option>
              <option value="Region D">Region D</option>
            </select>
          </div>

          {/* Manager Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Manager Role *
            </label>
            <select
              required
              value={formData.managerRole}
              onChange={(e) => setFormData({ ...formData, managerRole: e.target.value as 'rep' | 'manager' | 'admin' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="rep">Rep</option>
              <option value="manager">Manager</option>
              {currentUserEmail === 'support@ambientenergygroup.com' && (
                <option value="admin">Admin</option>
              )}
            </select>
            {currentUserEmail !== 'support@ambientenergygroup.com' && (
              <p className="text-xs text-gray-500 mt-1">
                Admin role can only be assigned by support@ambientenergygroup.com
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Adding...' : 'Add Rep'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
