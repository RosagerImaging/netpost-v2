/**
 * API Key Form Component
 *
 * Handles API key authentication for marketplaces that don't use OAuth
 */

'use client';

import { useState } from 'react';
import { EyeIcon, EyeSlashIcon, KeyIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useStoreApiKeyCredentials } from '@/lib/hooks/useMarketplaceConnections';
import { getMarketplaceDisplayInfo, getMarketplaceConfig } from '@/lib/marketplaces';
import type { MarketplaceType } from '@netpost/shared-types';
import type { MarketplaceConnectionSafe, ApiKeyCredentials } from '@netpost/shared-types';

interface ApiKeyFormProps {
  marketplace: MarketplaceType;
  onSuccess: (connection: MarketplaceConnectionSafe) => void;
  onError: (error: string) => void;
}

interface FormData {
  api_key: string;
  api_secret: string;
  client_id: string;
  client_secret: string;
  environment: 'sandbox' | 'production';
  [key: string]: string;
}

export function ApiKeyForm({ marketplace, onSuccess, onError }: ApiKeyFormProps) {
  const [formData, setFormData] = useState<FormData>({
    api_key: '',
    api_secret: '',
    client_id: '',
    client_secret: '',
    environment: 'sandbox',
  });
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [isValidating, setIsValidating] = useState(false);

  const marketplaceInfo = getMarketplaceDisplayInfo(marketplace);
  const marketplaceConfig = getMarketplaceConfig(marketplace);

  const storeCredentials = useStoreApiKeyCredentials();

  const toggleShowSecret = (field: string) => {
    setShowSecrets(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.api_key.trim()) {
      errors.push('API Key is required');
    }

    // Marketplace-specific validations
    if (marketplace === 'ebay') {
      if (!formData.client_id.trim()) {
        errors.push('Client ID is required for eBay');
      }
      if (!formData.client_secret.trim()) {
        errors.push('Client Secret is required for eBay');
      }
    }

    if (marketplace === 'amazon') {
      if (!formData.client_secret.trim()) {
        errors.push('Secret Key is required for Amazon');
      }
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      onError(validationErrors.join(', '));
      return;
    }

    setIsValidating(true);

    try {
      // Prepare credentials based on marketplace
      const credentials: ApiKeyCredentials = {
        api_key: formData.api_key.trim(),
      };

      if (formData.api_secret.trim()) {
        credentials.api_secret = formData.api_secret.trim();
      }

      if (formData.client_id.trim()) {
        credentials.client_id = formData.client_id.trim();
      }

      if (formData.client_secret.trim()) {
        credentials.client_secret = formData.client_secret.trim();
      }

      // Prepare metadata
      const metadata = {
        environment: formData.environment,
      };

      const result = await storeCredentials.mutateAsync({
        marketplace,
        credentials,
        metadata,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to store credentials');
      }

      onSuccess(result.data);
    } catch (error) {
      console.error('API key validation error:', error);
      onError(error instanceof Error ? error.message : 'Failed to validate credentials');
    } finally {
      setIsValidating(false);
    }
  };

  const getFieldInstructions = () => {
    const instructions: Partial<Record<MarketplaceType, Record<string, string>>> = {
      ebay: {
        client_id: 'Your eBay Application ID (Client ID) from the Developer Dashboard',
        client_secret: 'Your eBay Application Secret (Client Secret) from the Developer Dashboard',
        api_key: 'Your eBay API Key for production use',
      },
      amazon: {
        api_key: 'Your Amazon MWS Access Key ID',
        client_secret: 'Your Amazon MWS Secret Access Key',
      },
      etsy: {
        api_key: 'Your Etsy API Key from the Developer Console',
      },
      // Add more marketplace-specific instructions as needed
    };

    return instructions[marketplace] || {};
  };;

  const fieldInstructions = getFieldInstructions();

  return (
    <div className="space-y-6">
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
          <p className="text-sm text-gray-500">API Key Authentication</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="rounded-lg bg-blue-50 p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">
          <KeyIcon className="h-4 w-4 inline mr-1" />
          How to Get Your API Keys
        </h4>
        <div className="text-sm text-blue-700 space-y-2">
          {marketplace === 'ebay' && (
            <ol className="list-decimal list-inside space-y-1">
              <li>Go to the eBay Developer Program website</li>
              <li>Create or sign in to your developer account</li>
              <li>Create a new application in your dashboard</li>
              <li>Copy your Client ID and Client Secret</li>
              <li>Generate production API keys if needed</li>
            </ol>
          )}
          {marketplace === 'amazon' && (
            <ol className="list-decimal list-inside space-y-1">
              <li>Sign in to Amazon Seller Central</li>
              <li>Go to Settings → User Permissions</li>
              <li>Generate MWS API credentials</li>
              <li>Copy your Access Key ID and Secret Access Key</li>
            </ol>
          )}
          {marketplace === 'etsy' && (
            <ol className="list-decimal list-inside space-y-1">
              <li>Visit the Etsy Developer Portal</li>
              <li>Create a new app</li>
              <li>Copy your API Key from the app dashboard</li>
            </ol>
          )}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Environment Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Environment
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleInputChange('environment', 'sandbox')}
              className={`p-3 text-left border rounded-md ${
                formData.environment === 'sandbox'
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="font-medium">Sandbox</div>
              <div className="text-sm text-gray-500">For testing</div>
            </button>
            <button
              type="button"
              onClick={() => handleInputChange('environment', 'production')}
              className={`p-3 text-left border rounded-md ${
                formData.environment === 'production'
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="font-medium">Production</div>
              <div className="text-sm text-gray-500">Live marketplace</div>
            </button>
          </div>
        </div>

        {/* Client ID (if required) */}
        {(marketplace === 'ebay' || marketplace === 'amazon') && (
          <div>
            <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 mb-1">
              {marketplace === 'ebay' ? 'Client ID' : 'Access Key ID'}
              <span className="text-red-500 ml-1">*</span>
            </label>
            {fieldInstructions.client_id && (
              <p className="text-xs text-gray-500 mb-2">{fieldInstructions.client_id}</p>
            )}
            <input
              type="text"
              id="client_id"
              value={formData.client_id}
              onChange={(e) => handleInputChange('client_id', e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              placeholder={marketplace === 'ebay' ? 'Enter your eBay Client ID' : 'Enter your Access Key ID'}
            />
          </div>
        )}

        {/* Client Secret (if required) */}
        {(marketplace === 'ebay' || marketplace === 'amazon') && (
          <div>
            <label htmlFor="client_secret" className="block text-sm font-medium text-gray-700 mb-1">
              {marketplace === 'ebay' ? 'Client Secret' : 'Secret Access Key'}
              <span className="text-red-500 ml-1">*</span>
            </label>
            {fieldInstructions.client_secret && (
              <p className="text-xs text-gray-500 mb-2">{fieldInstructions.client_secret}</p>
            )}
            <div className="relative">
              <input
                type={showSecrets.client_secret ? 'text' : 'password'}
                id="client_secret"
                value={formData.client_secret}
                onChange={(e) => handleInputChange('client_secret', e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder={marketplace === 'ebay' ? 'Enter your eBay Client Secret' : 'Enter your Secret Access Key'}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={() => toggleShowSecret('client_secret')}
              >
                {showSecrets.client_secret ? (
                  <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                ) : (
                  <EyeIcon className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* API Key */}
        <div>
          <label htmlFor="api_key" className="block text-sm font-medium text-gray-700 mb-1">
            API Key
            <span className="text-red-500 ml-1">*</span>
          </label>
          {fieldInstructions.api_key && (
            <p className="text-xs text-gray-500 mb-2">{fieldInstructions.api_key}</p>
          )}
          <div className="relative">
            <input
              type={showSecrets.api_key ? 'text' : 'password'}
              id="api_key"
              value={formData.api_key}
              onChange={(e) => handleInputChange('api_key', e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              placeholder="Enter your API key"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3"
              onClick={() => toggleShowSecret('api_key')}
            >
              {showSecrets.api_key ? (
                <EyeSlashIcon className="h-4 w-4 text-gray-400" />
              ) : (
                <EyeIcon className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* API Secret (if applicable) */}
        {marketplace !== 'etsy' && (
          <div>
            <label htmlFor="api_secret" className="block text-sm font-medium text-gray-700 mb-1">
              API Secret
            </label>
            <div className="relative">
              <input
                type={showSecrets.api_secret ? 'text' : 'password'}
                id="api_secret"
                value={formData.api_secret}
                onChange={(e) => handleInputChange('api_secret', e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Enter your API secret (if required)"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={() => toggleShowSecret('api_secret')}
              >
                {showSecrets.api_secret ? (
                  <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                ) : (
                  <EyeIcon className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isValidating}
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isValidating ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Validating credentials...
              </>
            ) : (
              <>
                <ShieldCheckIcon className="h-5 w-5 mr-2" />
                Validate & Connect
              </>
            )}
          </button>
        </div>
      </form>

      {/* Security Notice */}
      <div className="rounded-md bg-green-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              🔒 Your API Keys are Secure
            </h3>
            <div className="mt-2 text-sm text-green-700">
              <p>
                Your API keys are encrypted and stored securely. We only use them to perform actions
                you authorize. You can revoke access at any time by regenerating your keys in
                your {marketplaceInfo.name} developer dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}