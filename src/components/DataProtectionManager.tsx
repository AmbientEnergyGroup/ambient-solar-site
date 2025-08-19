"use client";

import React, { useState } from 'react';
import { useAuth } from '../lib/contexts/AuthContext';

interface DataProtectionManagerProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function DataProtectionManager({ isVisible, onClose }: DataProtectionManagerProps) {
  const { user, userData, backupAllData, migrateAllUsers } = useAuth();
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const isOwnerAdmin = user?.email === 'support@ambientenergygroup.com';
  const isOfficeAdmin = userData?.role === 'office_admin';
  const canAccess = isOwnerAdmin || isOfficeAdmin;

  const handleCreateBackup = async () => {
    setLoading(true);
    setStatus('Creating backup...');
    try {
      await backupAllData();
      setStatus('Backup created successfully!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setStatus('Error creating backup');
      console.error('Error creating backup:', error);
      setTimeout(() => setStatus(''), 3000);
    }
    setLoading(false);
  };

  const handleMigrateUsers = async () => {
    setLoading(true);
    setStatus('Migrating user data...');
    try {
      await migrateAllUsers();
      setStatus('User data migration completed!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setStatus('Error migrating user data');
      console.error('Error migrating user data:', error);
      setTimeout(() => setStatus(''), 3000);
    }
    setLoading(false);
  };

  if (!isVisible || !canAccess) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Data Protection Manager</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">System Backup</h3>
            <p className="text-sm text-blue-700 mb-3">
              Create a complete backup of all user data, projects, and customer sets.
            </p>
            <button
              onClick={handleCreateBackup}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              Create Backup
            </button>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Data Migration</h3>
            <p className="text-sm text-green-700 mb-3">
              Migrate all user data to ensure compatibility with latest schema updates.
            </p>
            <button
              onClick={handleMigrateUsers}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              Migrate Users
            </button>
          </div>

          {status && (
            <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
              <p className="text-sm text-yellow-800">{status}</p>
            </div>
          )}

          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h3 className="font-semibold text-red-800 mb-2">⚠️ Data Protection Active</h3>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• Automatic backups before all data updates</li>
              <li>• Real-time data validation</li>
              <li>• No data loss during system updates</li>
              <li>• Complete audit trail of all changes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 