"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/contexts/AuthContext';
import { getAllUsers, updateUserRole, updateUserActive } from '../lib/firebase/firebaseUtils';
import { UserData } from '../lib/firebase/firebaseUtils';

interface AdminManagerProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function AdminManager({ isVisible, onClose }: AdminManagerProps) {
  const { user, userData } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Check if current user is the support admin
  const isSupportAdmin = user?.email === 'support@ambientenergygroup.com';

  useEffect(() => {
    if (isVisible && isSupportAdmin) {
      loadUsers();
    }
  }, [isVisible, isSupportAdmin]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'setter' | 'closer' | 'manager' | 'region_admin' | 'office_admin' | 'owner_admin') => {
    try {
      await updateUserRole(userId, newRole);
      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const handleActiveToggle = async (userId: string, isActive: boolean) => {
    try {
      await updateUserActive(userId, isActive);
      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, active: isActive } : u));
    } catch (error) {
      console.error('Error updating user active status:', error);
    }
  };

  const filteredUsers = users.filter(user => 
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isVisible) return null;

  if (!isSupportAdmin) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              Only the support administrator can access this feature.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Admin User Management</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
          </div>
          <p className="text-gray-600 mt-2">Manage user roles and permissions</p>
        </div>

        <div className="p-6">
          {/* Search Bar */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search users by name, email, or role..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 border-b border-gray-200 font-semibold">User</th>
                  <th className="text-left p-3 border-b border-gray-200 font-semibold">Email</th>
                  <th className="text-left p-3 border-b border-gray-200 font-semibold">Role</th>
                  <th className="text-left p-3 border-b border-gray-200 font-semibold">Region</th>
                  <th className="text-left p-3 border-b border-gray-200 font-semibold">Team</th>
                  <th className="text-left p-3 border-b border-gray-200 font-semibold">Status</th>
                  <th className="text-left p-3 border-b border-gray-200 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center p-6">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading users...</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3">
                        <div>
                          <div className="font-medium text-gray-900">{user.displayName}</div>
                          <div className="text-sm text-gray-500">ID: {user.id}</div>
                        </div>
                      </td>
                      <td className="p-3 text-gray-700">{user.email}</td>
                      <td className="p-3">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                          className="p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                          disabled={user.email === 'support@ambientenergygroup.com'}
                        >
                          <option value="setter">Setter</option>
                          <option value="closer">Closer</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                          <option value="region_admin">Region Admin</option>
                          <option value="office_admin">Office Admin</option>
                          <option value="owner_admin">Owner Admin</option>
                        </select>
                      </td>
                      <td className="p-3 text-gray-700">{user.region || 'Not set'}</td>
                      <td className="p-3 text-gray-700">{user.team || 'Not set'}</td>
                      <td className="p-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={user.active}
                            onChange={(e) => handleActiveToggle(user.id, e.target.checked)}
                            className="mr-2"
                            disabled={user.email === 'support@ambientenergygroup.com'}
                          />
                          <span className={user.active ? 'text-green-600' : 'text-red-600'}>
                            {user.active ? 'Active' : 'Inactive'}
                          </span>
                        </label>
                      </td>
                      <td className="p-3">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            View Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* User Count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </div>

        {/* User Details Modal */}
        {selectedUser && (
          <div className="fixed inset-0 z-60 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900">User Details</h3>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Display Name</label>
                    <p className="text-gray-900">{selectedUser.displayName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <p className="text-gray-900 capitalize">{selectedUser.role}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <p className={`${selectedUser.active ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedUser.active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Member Since</label>
                    <p className="text-gray-900">
                      {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Deal Count</label>
                    <p className="text-gray-900">{selectedUser.dealCount}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Commission</label>
                    <p className="text-gray-900">${selectedUser.totalCommission.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 