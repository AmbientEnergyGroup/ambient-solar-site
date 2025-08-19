"use client";

import React, { useState, useEffect } from 'react';
import { X, User, MapPin, Calendar, Clock } from 'lucide-react';
import { getClosersByRegion } from '../lib/firebase/firebaseUtils';
import { UserData } from '../lib/firebase/firebaseUtils';

interface Set {
  id: string;
  customerName: string;
  address: string;
  phoneNumber: string;
  appointmentDate: string;
  appointmentTime: string;
  isSpanishSpeaker: boolean;
  notes: string;
  createdAt: string;
  status?: "active" | "inactive" | "not_closed";
  closerId?: string;
  closerName?: string;
  utilityBill?: string;
  userId?: string;
}

interface CloserAssignmentModalProps {
  isVisible: boolean;
  onClose: () => void;
  set: Set | null;
  onAssignCloser: (setId: string, closerId: string, closerName: string) => void;
  userRegion?: 'Region A' | 'Region B' | 'Region C' | 'Region D';
}

export default function CloserAssignmentModal({
  isVisible,
  onClose,
  set,
  onAssignCloser,
  userRegion
}: CloserAssignmentModalProps) {
  const [closers, setClosers] = useState<UserData[]>([]);
  const [selectedCloser, setSelectedCloser] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Load closers for the region when modal opens
  useEffect(() => {
    if (isVisible && userRegion) {
      loadClosers();
    }
  }, [isVisible, userRegion]);

  const loadClosers = async () => {
    if (!userRegion) return;
    
    setLoading(true);
    setError('');
    
    try {
      const regionClosers = await getClosersByRegion(userRegion);
      setClosers(regionClosers);
      
      if (regionClosers.length === 0) {
        setError('No closers found in your region. Please contact your manager.');
        
        // Add some test data for development/testing
        if (process.env.NODE_ENV === 'development') {
          console.log('Adding test closers for development');
          setClosers([
            {
              id: 'test-closer-1',
              displayName: 'Test Closer 1',
              email: 'closer1@test.com',
              phoneNumber: '(555) 123-4567',
              role: 'closer',
              region: userRegion,
              active: true,
              dealCount: 0,
              totalCommission: 0,
              recentProjects: [],
              commissionPayments: [],
              createdAt: new Date().toISOString(),
              settings: {
                notifications: true,
                theme: 'auto',
                language: 'en'
              }
            },
            {
              id: 'test-closer-2',
              displayName: 'Test Closer 2',
              email: 'closer2@test.com',
              phoneNumber: '(555) 987-6543',
              role: 'closer',
              region: userRegion,
              active: true,
              dealCount: 0,
              totalCommission: 0,
              recentProjects: [],
              commissionPayments: [],
              createdAt: new Date().toISOString(),
              settings: {
                notifications: true,
                theme: 'auto',
                language: 'en'
              }
            }
          ]);
          setError('');
        }
      }
    } catch (err) {
      console.error('Error loading closers:', err);
      setError('Failed to load closers. Please try again.');
      
      // Add test data for development if Firebase fails
      if (process.env.NODE_ENV === 'development') {
        console.log('Adding test closers due to Firebase error');
        setClosers([
          {
            id: 'test-closer-1',
            displayName: 'Test Closer 1',
            email: 'closer1@test.com',
            phoneNumber: '(555) 123-4567',
            role: 'closer',
            region: userRegion,
            active: true,
            dealCount: 0,
            totalCommission: 0,
            recentProjects: [],
            commissionPayments: [],
            createdAt: new Date().toISOString(),
            settings: {
              notifications: true,
              theme: 'auto',
              language: 'en'
            }
          },
          {
            id: 'test-closer-2',
            displayName: 'Test Closer 2',
            email: 'closer2@test.com',
            phoneNumber: '(555) 987-6543',
            role: 'closer',
            region: userRegion,
            active: true,
            dealCount: 0,
            totalCommission: 0,
            recentProjects: [],
            commissionPayments: [],
            createdAt: new Date().toISOString(),
            settings: {
              notifications: true,
              theme: 'auto',
              language: 'en'
            }
          }
        ]);
        setError('');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCloser = () => {
    if (!selectedCloser || !set) return;
    
    const selectedCloserData = closers.find(c => c.id === selectedCloser);
    if (!selectedCloserData) return;
    
    onAssignCloser(set.id, selectedCloserData.id, selectedCloserData.displayName);
    onClose();
  };

  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const minute = parseInt(minutes, 10);
      
      let period = 'AM';
      let formattedHour = hour;
      
      if (hour >= 12) {
        period = 'PM';
        formattedHour = hour === 12 ? 12 : hour - 12;
      }
      if (formattedHour === 0) {
        formattedHour = 12;
      }
      
      return `${formattedHour}:${minute.toString().padStart(2, '0')} ${period}`;
    } catch (error) {
      return timeString;
    }
  };

  if (!isVisible || !set) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-75 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Assign Closer</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-4">
          {/* Set Details */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
              <User className="h-4 w-4 mr-2" />
              {set.customerName}
            </h3>
            
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                {set.address}
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {new Date(set.appointmentDate).toLocaleDateString()}
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                {formatTime(set.appointmentTime)}
              </div>
            </div>
            
            {set.isSpanishSpeaker && (
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  Spanish Speaker
                </span>
              </div>
            )}
          </div>

          {/* Closer Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Closer
            </label>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading closers...</span>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            ) : closers.length === 0 ? (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  No closers available in your region.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {closers.map((closer) => (
                  <label
                    key={closer.id}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedCloser === closer.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <input
                      type="radio"
                      name="closer"
                      value={closer.id}
                      checked={selectedCloser === closer.id}
                      onChange={(e) => setSelectedCloser(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {closer.displayName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {closer.email}
                      </div>
                      {closer.phoneNumber && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {closer.phoneNumber}
                        </div>
                      )}
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedCloser === closer.id
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {selectedCloser === closer.id && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAssignCloser}
              disabled={!selectedCloser || loading}
              className={`px-4 py-2 rounded-md text-white transition-colors ${
                selectedCloser && !loading
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Assign Closer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 