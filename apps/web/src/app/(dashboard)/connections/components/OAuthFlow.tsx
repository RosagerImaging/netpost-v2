/**
 * OAuth Flow Component
 *
 * Handles OAuth 2.0 authentication flow for marketplaces
 */

'use client';

import { useState, useEffect } from 'react';
import { ArrowTopRightOnSquareIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useInitiateOAuth, useCompleteOAuth } from '@/lib/hooks/useMarketplaceConnections';
import { getMarketplaceDisplayInfo } from '@/lib/marketplaces';
import type { MarketplaceType } from '@netpost/shared-types/database/listing';
import type { MarketplaceConnectionSafe } from '@netpost/shared-types/database/marketplace-connection';

interface OAuthFlowProps {
  marketplace: MarketplaceType;
  onSuccess: (connection: MarketplaceConnectionSafe) => void;
  onError: (error: string) => void;
}

type FlowStep = 'ready' | 'initiating' | 'redirecting' | 'completing' | 'completed';

export function OAuthFlow({ marketplace, onSuccess, onError }: OAuthFlowProps) {
  const [currentStep, setCurrentStep] = useState<FlowStep>('ready');
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);

  const marketplaceInfo = getMarketplaceDisplayInfo(marketplace);

  const initiateOAuth = useInitiateOAuth();
  const completeOAuth = useCompleteOAuth();

  // Listen for OAuth callback from popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'OAUTH_CALLBACK') {
        const { code, state, error } = event.data;

        if (error) {
          onError(`OAuth error: ${error}`);
          setCurrentStep('ready');
          return;
        }

        if (code && state && connectionId) {
          setCurrentStep('completing');
          handleCompleteOAuth(code, state);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [connectionId, onError]);

  const handleInitiateOAuth = async () => {
    setCurrentStep('initiating');

    const callbackUrl = `${window.location.origin}/auth/callback`;

    try {
      const result = await initiateOAuth.mutateAsync({
        marketplace,
        callbackUrl,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to initiate OAuth');
      }

      setConnectionId(result.data.connection_id);
      setAuthUrl(result.data.authorization_url);
      setCurrentStep('redirecting');
    } catch (error) {
      console.error('OAuth initiation error:', error);
      onError(error instanceof Error ? error.message : 'Failed to start authentication');
      setCurrentStep('ready');
    }
  };

  const handleOpenAuthWindow = () => {
    if (!authUrl) return;

    // Open OAuth URL in popup window
    const popup = window.open(
      authUrl,
      'oauth_popup',
      'width=600,height=700,scrollbars=yes,resizable=yes'
    );

    if (!popup) {
      onError('Unable to open authentication window. Please allow popups and try again.');
      return;
    }

    // Monitor popup for closure or completion
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        if (currentStep === 'redirecting') {
          onError('Authentication was cancelled');
          setCurrentStep('ready');
        }
      }
    }, 1000);
  };

  const handleCompleteOAuth = async (code: string, state: string) => {
    if (!connectionId) {
      onError('No connection ID available');
      return;
    }

    try {
      const result = await completeOAuth.mutateAsync({
        connectionId,
        code,
        state,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to complete OAuth');
      }

      setCurrentStep('completed');
      onSuccess(result.data);
    } catch (error) {
      console.error('OAuth completion error:', error);
      onError(error instanceof Error ? error.message : 'Failed to complete authentication');
      setCurrentStep('ready');
    }
  };

  const isLoading = ['initiating', 'completing'].includes(currentStep);

  return (
    <div className="space-y-6">
      {/* OAuth Flow Explanation */}
      <div className="rounded-lg bg-gray-50 p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          How OAuth Authentication Works
        </h4>
        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
          <li>Click "Connect Account" to start the authentication process</li>
          <li>You'll be redirected to {marketplaceInfo.name} to log in</li>
          <li>Grant NetPost permission to access your {marketplaceInfo.name} account</li>
          <li>You'll be redirected back to complete the connection</li>
        </ol>
      </div>

      {/* Marketplace Info */}
      <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
        <div
          className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: marketplaceInfo.color }}
        >
          {marketplaceInfo.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900">{marketplaceInfo.name}</h3>
          <p className="text-sm text-gray-500">{marketplaceInfo.description}</p>
        </div>
      </div>

      {/* Permissions Information */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-900">
          NetPost will request permission to:
        </h4>
        <ul className="text-sm text-gray-600 space-y-2">
          <li className="flex items-start">
            <span className="inline-block w-2 h-2 bg-indigo-400 rounded-full mt-2 mr-3 flex-shrink-0" />
            Create and manage listings on your behalf
          </li>
          <li className="flex items-start">
            <span className="inline-block w-2 h-2 bg-indigo-400 rounded-full mt-2 mr-3 flex-shrink-0" />
            Upload and manage photos for your listings
          </li>
          <li className="flex items-start">
            <span className="inline-block w-2 h-2 bg-indigo-400 rounded-full mt-2 mr-3 flex-shrink-0" />
            Monitor listing performance and analytics
          </li>
          <li className="flex items-start">
            <span className="inline-block w-2 h-2 bg-indigo-400 rounded-full mt-2 mr-3 flex-shrink-0" />
            Access basic account information (username, seller ratings)
          </li>
        </ul>
      </div>

      {/* Flow Steps */}
      <div className="space-y-4">
        {/* Step 1: Ready to Start */}
        {currentStep === 'ready' && (
          <div className="text-center">
            <button
              type="button"
              onClick={handleInitiateOAuth}
              disabled={isLoading}
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowTopRightOnSquareIcon className="h-5 w-5 mr-2" />
              Connect {marketplaceInfo.name} Account
            </button>
          </div>
        )}

        {/* Step 2: Initiating */}
        {currentStep === 'initiating' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center rounded-md bg-gray-100 px-6 py-3 text-base font-medium text-gray-700">
              <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
              Setting up authentication...
            </div>
          </div>
        )}

        {/* Step 3: Redirecting */}
        {currentStep === 'redirecting' && (
          <div className="space-y-4">
            <div className="text-center">
              <button
                type="button"
                onClick={handleOpenAuthWindow}
                className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <ArrowTopRightOnSquareIcon className="h-5 w-5 mr-2" />
                Open {marketplaceInfo.name} Login
              </button>
            </div>
            <div className="text-center text-sm text-gray-500">
              A popup window will open. If it doesn't appear, please check your browser's popup settings.
            </div>
          </div>
        )}

        {/* Step 4: Completing */}
        {currentStep === 'completing' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center rounded-md bg-gray-100 px-6 py-3 text-base font-medium text-gray-700">
              <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
              Completing connection...
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Verifying your credentials and setting up the connection
            </div>
          </div>
        )}
      </div>

      {/* Security Note */}
      <div className="rounded-md bg-blue-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              🔒 Your Security is Our Priority
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                We use industry-standard OAuth 2.0 authentication. Your {marketplaceInfo.name} password
                is never shared with NetPost. You can revoke access at any time from your {marketplaceInfo.name} account settings.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Troubleshooting */}
      <details className="group">
        <summary className="flex cursor-pointer items-center justify-between rounded-lg p-2 text-gray-900 hover:bg-gray-50">
          <h5 className="font-medium">Troubleshooting</h5>
          <svg
            className="h-5 w-5 shrink-0 transition duration-300 group-open:-rotate-180"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <div className="mt-2 space-y-2 text-sm text-gray-600">
          <p><strong>Popup blocked?</strong> Enable popups for this site and try again.</p>
          <p><strong>Authentication failed?</strong> Make sure you're logged into your {marketplaceInfo.name} account.</p>
          <p><strong>Connection timing out?</strong> Check your internet connection and try again.</p>
          <p><strong>Still having issues?</strong> Contact our support team for assistance.</p>
        </div>
      </details>
    </div>
  );
}