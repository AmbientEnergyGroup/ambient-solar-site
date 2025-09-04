"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/contexts/AuthContext';
import { CheckCircle, Clock, AlertCircle, ExternalLink } from 'lucide-react';

interface AgreementStatus {
  envelopeId: string;
  status: 'sent' | 'delivered' | 'completed' | 'declined' | 'error';
  signedDate?: string;
  errorMessage?: string;
}

export default function RepAgreement() {
  const { user, userData } = useAuth();
  const [agreementStatus, setAgreementStatus] = useState<AgreementStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && userData) {
      checkAgreementStatus();
    }
  }, [user, userData]);

  const checkAgreementStatus = async () => {
    try {
      // In a real implementation, you'd check DocuSign API for envelope status
      // For now, we'll simulate checking if this is a new user
      const isNewUser = userData?.createdAt && 
        new Date(userData.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000; // Created within last 24 hours
      
      if (isNewUser) {
        setAgreementStatus({
          envelopeId: 'pending',
          status: 'sent'
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error checking agreement status:', error);
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'sent':
      case 'delivered':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'declined':
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Agreement signed and completed';
      case 'sent':
        return 'Agreement sent, awaiting signature';
      case 'delivered':
        return 'Agreement delivered, please check your email';
      case 'declined':
        return 'Agreement was declined';
      case 'error':
        return 'Error sending agreement';
      default:
        return 'Checking agreement status...';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'sent':
      case 'delivered':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'declined':
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          <span className="ml-3 text-gray-600">Loading agreement status...</span>
        </div>
      </div>
    );
  }

  if (!agreementStatus) {
    return null; // Don't show if no agreement status
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Rep Agreement</h2>
        <div className={`flex items-center px-3 py-1 rounded-full border ${getStatusColor(agreementStatus.status)}`}>
          {getStatusIcon(agreementStatus.status)}
          <span className="ml-2 text-sm font-medium">
            {getStatusMessage(agreementStatus.status)}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-gray-600">
          Your rep agreement has been sent to your email address. Please review and sign the document to complete your onboarding.
        </p>

        {agreementStatus.status === 'sent' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-blue-800 mb-1">Action Required</h3>
                <p className="text-sm text-blue-700">
                  Check your email for the DocuSign agreement. Click the link in the email to review and sign the document.
                </p>
              </div>
            </div>
          </div>
        )}

        {agreementStatus.status === 'completed' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-green-800 mb-1">Agreement Completed</h3>
                <p className="text-sm text-green-700">
                  Thank you! Your rep agreement has been signed and completed.
                  {agreementStatus.signedDate && (
                    <span className="block mt-1">
                      Signed on: {new Date(agreementStatus.signedDate).toLocaleDateString()}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {agreementStatus.status === 'declined' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-800 mb-1">Agreement Declined</h3>
                <p className="text-sm text-red-700">
                  The agreement was declined. Please contact your manager or support@ambientenergygroup.com for assistance.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Envelope ID: {agreementStatus.envelopeId}
          </div>
          <button
            onClick={() => window.open('https://demo.docusign.net', '_blank')}
            className="flex items-center text-sm text-cyan-600 hover:text-cyan-700 font-medium"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Open DocuSign
          </button>
        </div>
      </div>
    </div>
  );
}
