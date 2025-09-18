/**
 * Connection Setup Component
 *
 * Main component for setting up marketplace connections
 * Handles both OAuth and API key authentication flows
 */

'use client';

import { useState } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { MarketplaceSelector } from './MarketplaceSelector';
import { OAuthFlow } from './OAuthFlow';
import { ApiKeyForm } from './ApiKeyForm';
import { ConnectionSuccess } from './ConnectionSuccess';
import { getMarketplaceConfig, getMarketplaceDisplayInfo } from '@/lib/marketplaces';
import type { MarketplaceType } from '@netpost/shared-types/database/listing';
import type { MarketplaceConnectionSafe } from '@netpost/shared-types/database/marketplace-connection';

interface ConnectionSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (connection: MarketplaceConnectionSafe) => void;
  preselectedMarketplace?: MarketplaceType;
}

type SetupStep = 'marketplace' | 'auth' | 'success';

export function ConnectionSetup({
  isOpen,
  onClose,
  onSuccess,
  preselectedMarketplace,
}: ConnectionSetupProps) {
  const [currentStep, setCurrentStep] = useState<SetupStep>('marketplace');
  const [selectedMarketplace, setSelectedMarketplace] = useState<MarketplaceType | null>(
    preselectedMarketplace || null
  );
  const [completedConnection, setCompletedConnection] = useState<MarketplaceConnectionSafe | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMarketplaceSelect = (marketplace: MarketplaceType) => {
    setSelectedMarketplace(marketplace);
    setCurrentStep('auth');
    setError(null);
  };

  const handleAuthSuccess = (connection: MarketplaceConnectionSafe) => {
    setCompletedConnection(connection);
    setCurrentStep('success');
    onSuccess?.(connection);
  };

  const handleAuthError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleClose = () => {
    setCurrentStep('marketplace');
    setSelectedMarketplace(preselectedMarketplace || null);
    setCompletedConnection(null);
    setError(null);
    onClose();
  };

  const handleStartOver = () => {
    setCurrentStep('marketplace');
    setSelectedMarketplace(null);
    setCompletedConnection(null);
    setError(null);
  };

  const marketplaceConfig = selectedMarketplace ? getMarketplaceConfig(selectedMarketplace) : null;
  const marketplaceInfo = selectedMarketplace ? getMarketplaceDisplayInfo(selectedMarketplace) : null;

  return (
    <Transition appear show={isOpen}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <TransitionChild
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <DialogTitle as="h3" className="text-lg font-medium text-gray-900">
                      {currentStep === 'marketplace' && 'Connect Marketplace'}
                      {currentStep === 'auth' && `Connect ${marketplaceInfo?.name}`}
                      {currentStep === 'success' && 'Connection Successful'}
                    </DialogTitle>
                    {currentStep === 'auth' && selectedMarketplace && (
                      <p className="mt-1 text-sm text-gray-500">
                        {marketplaceInfo?.description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={handleClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                {/* Progress Indicator */}
                <div className="mb-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          currentStep !== 'marketplace'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-indigo-600 text-white'
                        }`}
                      >
                        {currentStep !== 'marketplace' ? (
                          <CheckCircleIcon className="h-5 w-5" />
                        ) : (
                          <span className="text-sm font-medium">1</span>
                        )}
                      </div>
                      <span className="ml-2 text-sm font-medium text-gray-900">Choose Marketplace</span>
                    </div>

                    <div className="flex-1 mx-4">
                      <div className="h-0.5 bg-gray-200">
                        <div
                          className={`h-full bg-indigo-600 transition-all duration-300 ${
                            currentStep === 'marketplace' ? 'w-0' : 'w-full'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          currentStep === 'success'
                            ? 'bg-indigo-600 text-white'
                            : currentStep === 'auth'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {currentStep === 'success' ? (
                          <CheckCircleIcon className="h-5 w-5" />
                        ) : (
                          <span className="text-sm font-medium">2</span>
                        )}
                      </div>
                      <span className="ml-2 text-sm font-medium text-gray-900">Connect Account</span>
                    </div>
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="mb-6 rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Connection Error</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>{error}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step Content */}
                <div className="min-h-[400px]">
                  {currentStep === 'marketplace' && (
                    <MarketplaceSelector
                      onSelect={handleMarketplaceSelect}
                      preselected={preselectedMarketplace}
                    />
                  )}

                  {currentStep === 'auth' && selectedMarketplace && marketplaceConfig && (
                    <div>
                      {marketplaceConfig.auth_method === 'oauth2' ? (
                        <OAuthFlow
                          marketplace={selectedMarketplace}
                          onSuccess={handleAuthSuccess}
                          onError={handleAuthError}
                        />
                      ) : (
                        <ApiKeyForm
                          marketplace={selectedMarketplace}
                          onSuccess={handleAuthSuccess}
                          onError={handleAuthError}
                        />
                      )}
                    </div>
                  )}

                  {currentStep === 'success' && completedConnection && (
                    <ConnectionSuccess
                      connection={completedConnection}
                      onStartOver={handleStartOver}
                      onClose={handleClose}
                    />
                  )}
                </div>

                {/* Footer Actions */}
                {currentStep === 'auth' && (
                  <div className="mt-6 flex justify-between">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      onClick={() => setCurrentStep('marketplace')}
                    >
                      Back
                    </button>
                  </div>
                )}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}