"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/contexts/AuthContext';
import { 
  getUsersByRegion, 
  getUsersByTeam, 
  getProjectsByRegion, 
  getProjectsByTeam,
  getCustomerSetsByRegion,
  getCustomerSetsByTeam,
  updateUserData
} from '../lib/firebase/firebaseUtils';
import { UserData, Project, CustomerSet } from '../lib/firebase/firebaseUtils';

interface RegionTeamManagerProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function RegionTeamManager({ isVisible, onClose }: RegionTeamManagerProps) {
  const { user, userData } = useAuth();
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [regionUsers, setRegionUsers] = useState<UserData[]>([]);
  const [teamUsers, setTeamUsers] = useState<UserData[]>([]);
  const [regionProjects, setRegionProjects] = useState<Project[]>([]);
  const [teamProjects, setTeamProjects] = useState<Project[]>([]);
  const [regionCustomerSets, setRegionCustomerSets] = useState<CustomerSet[]>([]);
  const [teamCustomerSets, setTeamCustomerSets] = useState<CustomerSet[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'region' | 'team'>('region');

  const isOwnerAdmin = user?.email === 'support@ambientenergygroup.com';
  const isOfficeAdmin = userData?.role === 'office_admin';
  const isRegionAdmin = userData?.role === 'region_admin';
  const canAccess = isOwnerAdmin || isOfficeAdmin || isRegionAdmin;

  const regions = ['Region A', 'Region B', 'Region C', 'Region D'];
  
  // Get teams based on selected region
  const getTeamsForRegion = (region: string) => {
    if (region === 'Region A' || region === 'Region C') {
      return ['Team A', 'Team B'];
    } else if (region === 'Region B' || region === 'Region D') {
      return ['Team C', 'Team D'];
    }
    return ['Team A', 'Team B']; // Default fallback
  };

  useEffect(() => {
    if (selectedRegion && canAccess) {
      loadRegionData(selectedRegion);
    }
  }, [selectedRegion, canAccess]);

  useEffect(() => {
    if (selectedTeam && canAccess) {
      loadTeamData(selectedTeam);
    }
  }, [selectedTeam, canAccess]);

  const loadRegionData = async (region: string) => {
    setLoading(true);
    try {
      const [users, projects, customerSets] = await Promise.all([
        getUsersByRegion(region),
        getProjectsByRegion(region),
        getCustomerSetsByRegion(region)
      ]);
      setRegionUsers(users);
      setRegionProjects(projects);
      setRegionCustomerSets(customerSets);
    } catch (error) {
      console.error('Error loading region data:', error);
    }
    setLoading(false);
  };

  const loadTeamData = async (team: string) => {
    setLoading(true);
    try {
      const [users, projects, customerSets] = await Promise.all([
        getUsersByTeam(team),
        getProjectsByTeam(team),
        getCustomerSetsByTeam(team)
      ]);
      setTeamUsers(users);
      setTeamProjects(projects);
      setTeamCustomerSets(customerSets);
    } catch (error) {
      console.error('Error loading team data:', error);
    }
    setLoading(false);
  };

  const handleUserRoleUpdate = async (userId: string, newRole: string) => {
    try {
      await updateUserData(userId, { role: newRole as any });
      // Reload data
      if (activeTab === 'region' && selectedRegion) {
        loadRegionData(selectedRegion);
      } else if (activeTab === 'team' && selectedTeam) {
        loadTeamData(selectedTeam);
      }
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  if (!isVisible || !canAccess) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Region & Team Management</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('region')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'region' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Region Management
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'team' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Team Management
          </button>
        </div>

        {activeTab === 'region' ? (
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Region
              </label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select a region...</option>
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            {selectedRegion && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Users */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Users ({regionUsers.length})</h3>
                  {loading ? (
                    <div className="text-center py-4">Loading...</div>
                  ) : (
                    <div className="space-y-2">
                      {regionUsers.map(user => (
                        <div key={user.id} className="bg-white p-3 rounded border">
                          <div className="font-medium">{user.displayName}</div>
                          <div className="text-sm text-gray-600">{user.email}</div>
                          <div className="text-xs text-gray-500">Role: {user.role}</div>
                          <div className="text-xs text-gray-500">Team: {user.team}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Projects */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Projects ({regionProjects.length})</h3>
                  {loading ? (
                    <div className="text-center py-4">Loading...</div>
                  ) : (
                    <div className="space-y-2">
                      {regionProjects.map(project => (
                        <div key={project.id} className="bg-white p-3 rounded border">
                          <div className="font-medium">{project.customerName}</div>
                          <div className="text-sm text-gray-600">${project.paymentAmount.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">Status: {project.status}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Customer Sets */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Customer Sets ({regionCustomerSets.length})</h3>
                  {loading ? (
                    <div className="text-center py-4">Loading...</div>
                  ) : (
                    <div className="space-y-2">
                      {regionCustomerSets.map(set => (
                        <div key={set.id} className="bg-white p-3 rounded border">
                          <div className="font-medium">{set.customerName}</div>
                          <div className="text-sm text-gray-600">{1} customers</div>
                          <div className="text-xs text-gray-500">Created: {new Date(set.createdAt).toLocaleDateString()}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Team
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select a team...</option>
                {getTeamsForRegion(selectedRegion).map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>

            {selectedTeam && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Users */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Users ({teamUsers.length})</h3>
                  {loading ? (
                    <div className="text-center py-4">Loading...</div>
                  ) : (
                    <div className="space-y-2">
                      {teamUsers.map(user => (
                        <div key={user.id} className="bg-white p-3 rounded border">
                          <div className="font-medium">{user.displayName}</div>
                          <div className="text-sm text-gray-600">{user.email}</div>
                          <div className="text-xs text-gray-500">Role: {user.role}</div>
                          <div className="text-xs text-gray-500">Region: {user.region}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Projects */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Projects ({teamProjects.length})</h3>
                  {loading ? (
                    <div className="text-center py-4">Loading...</div>
                  ) : (
                    <div className="space-y-2">
                      {teamProjects.map(project => (
                        <div key={project.id} className="bg-white p-3 rounded border">
                          <div className="font-medium">{project.customerName}</div>
                          <div className="text-sm text-gray-600">${project.paymentAmount.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">Status: {project.status}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Customer Sets */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Customer Sets ({teamCustomerSets.length})</h3>
                  {loading ? (
                    <div className="text-center py-4">Loading...</div>
                  ) : (
                    <div className="space-y-2">
                      {teamCustomerSets.map(set => (
                        <div key={set.id} className="bg-white p-3 rounded border">
                          <div className="font-medium">{set.customerName}</div>
                          <div className="text-sm text-gray-600">{1} customers</div>
                          <div className="text-xs text-gray-500">Created: {new Date(set.createdAt).toLocaleDateString()}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 