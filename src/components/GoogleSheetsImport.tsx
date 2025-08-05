"use client";

import { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '@/lib/hooks/useTheme';

interface GoogleSheetsImportProps {
  onImport: (projects: any[]) => void;
  userId: string;
}

export default function GoogleSheetsImport({ onImport, userId }: GoogleSheetsImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewData, setPreviewData] = useState<any>(null);
  const [showCredentials, setShowCredentials] = useState(false);
  
  const { darkMode } = useTheme();
  
  const [formData, setFormData] = useState({
    spreadsheetId: '',
    range: 'A:Z',
    clientEmail: '',
    privateKey: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTestConnection = async () => {
    if (!formData.spreadsheetId || !formData.clientEmail || !formData.privateKey) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/google-sheets/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spreadsheetId: formData.spreadsheetId,
          clientEmail: formData.clientEmail,
          privateKey: formData.privateKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to test connection');
      }

      setSuccess(`Connection successful! Spreadsheet: ${data.spreadsheetTitle}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to test connection');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!formData.spreadsheetId || !formData.clientEmail || !formData.privateKey) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/google-sheets/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spreadsheetId: formData.spreadsheetId,
          range: formData.range,
          userId,
          clientEmail: formData.clientEmail,
          privateKey: formData.privateKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to preview data');
      }

      setPreviewData(data);
      setSuccess(`Found ${data.totalRows} rows, ${data.importedCount} valid projects`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to preview data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!previewData) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Import the projects
      onImport(previewData.projects);
      setSuccess(`Successfully imported ${previewData.importedCount} projects!`);
      
      // Close modal after a short delay
      setTimeout(() => {
        setIsOpen(false);
        setPreviewData(null);
        setFormData({
          spreadsheetId: '',
          range: 'A:Z',
          clientEmail: '',
          privateKey: '',
        });
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import projects');
    } finally {
      setIsLoading(false);
    }
  };

  const getSpreadsheetIdFromUrl = (url: string) => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : '';
  };

  const handleUrlPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const url = e.currentTarget.value;
    const spreadsheetId = getSpreadsheetIdFromUrl(url);
    if (spreadsheetId) {
      setFormData(prev => ({ ...prev, spreadsheetId }));
    }
  };

  return (
    <>
      {/* Import Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
          darkMode 
            ? 'bg-amber-500 hover:bg-amber-600 text-white' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        Import from Google Sheets
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto`}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <FileSpreadsheet className={`h-6 w-6 mr-3 ${darkMode ? 'text-amber-500' : 'text-blue-500'}`} />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Import from Google Sheets
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Instructions */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Setup Instructions:
                </h3>
                <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>1. Create a Google Cloud Project and enable Google Sheets API</li>
                  <li>2. Create a Service Account and download the JSON key</li>
                  <li>3. Share your Google Sheet with the service account email</li>
                  <li>4. Enter the credentials and spreadsheet details below</li>
                </ol>
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    <strong>Important:</strong> When copying the private key from your JSON file, make sure to include the entire key including the <code>-----BEGIN PRIVATE KEY-----</code> and <code>-----END PRIVATE KEY-----</code> markers.
                  </p>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {/* Spreadsheet URL/ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Google Sheets URL or ID
                  </label>
                  <input
                    type="text"
                    name="spreadsheetId"
                    value={formData.spreadsheetId}
                    onChange={handleInputChange}
                    onPaste={handleUrlPaste}
                    placeholder="https://docs.google.com/spreadsheets/d/... or spreadsheet ID"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data Range (e.g., A:Z, A1:Z100)
                  </label>
                  <input
                    type="text"
                    name="range"
                    value={formData.range}
                    onChange={handleInputChange}
                    placeholder="A:Z"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Service Account Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Service Account Email
                  </label>
                  <input
                    type="email"
                    name="clientEmail"
                    value={formData.clientEmail}
                    onChange={handleInputChange}
                    placeholder="your-service-account@project.iam.gserviceaccount.com"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Private Key */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Private Key
                  </label>
                  <div className="relative">
                    <textarea
                      name="privateKey"
                      value={formData.privateKey}
                      onChange={handleInputChange}
                      placeholder="-----BEGIN PRIVATE KEY-----..."
                      rows={6}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCredentials(!showCredentials)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showCredentials ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Copy the entire private key from your JSON file, including the BEGIN and END markers
                  </p>
                </div>

                {/* Error/Success Messages */}
                {error && (
                  <div className="flex items-center p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                    <span className="text-red-700 dark:text-red-300">{error}</span>
                  </div>
                )}

                {success && (
                  <div className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-green-700 dark:text-green-300">{success}</span>
                  </div>
                )}

                {/* Preview Data */}
                {previewData && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                      Preview ({previewData.importedCount} valid projects)
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            {previewData.headers?.slice(0, 5).map((header: string, index: number) => (
                              <th key={index} className="text-left py-2 px-2 text-gray-600 dark:text-gray-400">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.sampleData?.slice(0, 3).map((row: any[], rowIndex: number) => (
                            <tr key={rowIndex} className="border-b border-gray-100 dark:border-gray-800">
                              {row.slice(0, 5).map((cell: string, cellIndex: number) => (
                                <td key={cellIndex} className="py-2 px-2 text-gray-700 dark:text-gray-300">
                                  {cell || '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  
                  {!previewData ? (
                    <>
                      <button
                        onClick={handleTestConnection}
                        disabled={isLoading}
                        className={`px-4 py-2 rounded-lg font-medium ${
                          isLoading
                            ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                            : darkMode
                              ? 'bg-gray-500 hover:bg-gray-600 text-white'
                              : 'bg-gray-500 hover:bg-gray-600 text-white'
                        }`}
                      >
                        {isLoading ? 'Testing...' : 'Test Connection'}
                      </button>
                      <button
                        onClick={handlePreview}
                        disabled={isLoading}
                        className={`px-4 py-2 rounded-lg font-medium ${
                          isLoading
                            ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                            : darkMode
                              ? 'bg-amber-500 hover:bg-amber-600 text-white'
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                      >
                        {isLoading ? 'Loading...' : 'Preview Data'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleImport}
                      disabled={isLoading}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        isLoading
                          ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                          : darkMode
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      {isLoading ? 'Importing...' : 'Import Projects'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 