/**
 * Create Cross-Listing Page
 *
 * Main page for creating cross-platform listings
 */

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { ItemSelection } from './components/ItemSelection';
import { MarketplaceSelection } from './components/MarketplaceSelection';
import { ListingForm } from './components/ListingForm';
import { ListingPreview } from './components/ListingPreview';
import { SubmissionSuccess } from './components/SubmissionSuccess';
import { useCrossListingForm } from '@/lib/hooks/useCrossListing';
import { CrossListingService } from '@/lib/services/cross-listing-service';
import type { InventoryItemRecord } from '@netpost/shared-types';
import type { MarketplaceType } from '@netpost/shared-types';

type CrossListingStep = 'item_selection' | 'marketplace_selection' | 'listing_form' | 'preview' | 'success';

export default function CreateCrossListingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<CrossListingStep>('item_selection');
  const [selectedItem, setSelectedItem] = useState<InventoryItemRecord | null>(null);
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  const {
    formData,
    updateFormData,
    updateBaseListing,
    updateMarketplaceCustomization,
    addMarketplace,
    removeMarketplace,
    resetForm,
    validation,
    isValid,
  } = useCrossListingForm();

  // Handle pre-selected item from URL params
  useEffect(() => {
    const itemId = searchParams.get('item_id');
    if (itemId && !selectedItem) {
      // This would fetch the item by ID in a real implementation
      // For now, we'll let the user select from the item selection component
    }
  }, [searchParams, selectedItem]);

  const steps = [
    { id: 'item_selection', name: 'Select Item', description: 'Choose item to list' },
    { id: 'marketplace_selection', name: 'Choose Marketplaces', description: 'Pick where to list' },
    { id: 'listing_form', name: 'Create Listing', description: 'Set up your listing' },
    { id: 'preview', name: 'Review & Submit', description: 'Preview before publishing' },
  ];

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep);
  };

  const handleNext = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id as CrossListingStep);
    }
  };

  const handleBack = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id as CrossListingStep);
    }
  };

  const handleItemSelect = (item: InventoryItemRecord) => {
    setSelectedItem(item);

    // Generate default form data from selected item
    const defaultData = CrossListingService.generateDefaultFormData(item, []);
    updateFormData(defaultData);

    setCurrentStep('marketplace_selection');
  };

  const handleMarketplaceSelect = (marketplaces: MarketplaceType[]) => {
    updateFormData({ marketplaces });
    setCurrentStep('listing_form');
  };

  const handleFormComplete = () => {
    setCurrentStep('preview');
  };

  const handleSubmit = async (submissionData: any) => {
    setSubmissionResult(submissionData);
    setCurrentStep('success');
  };

  const handleStartOver = () => {
    setCurrentStep('item_selection');
    setSelectedItem(null);
    setSubmissionResult(null);
    resetForm();
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'item_selection':
        return !!selectedItem;
      case 'marketplace_selection':
        return formData.marketplaces.length > 0;
      case 'listing_form':
        return isValid;
      case 'preview':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-1" />
                Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Cross-Listing</h1>
                <p className="mt-1 text-sm text-gray-500">
                  List your item across multiple marketplaces simultaneously
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        {currentStep !== 'success' && (
          <div className="py-6">
            <nav aria-label="Progress">
              <ol className="flex items-center">
                {steps.map((step, stepIdx) => {
                  const isCurrentStep = step.id === currentStep;
                  const isCompletedStep = getCurrentStepIndex() > stepIdx;
                  const isUpcomingStep = getCurrentStepIndex() < stepIdx;

                  return (
                    <li
                      key={step.id}
                      className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}
                    >
                      {/* Step Connector */}
                      {stepIdx !== steps.length - 1 && (
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                          <div
                            className={`h-0.5 w-full ${
                              isCompletedStep ? 'bg-indigo-600' : 'bg-gray-200'
                            }`}
                          />
                        </div>
                      )}

                      {/* Step Circle */}
                      <div className="relative flex h-8 w-8 items-center justify-center">
                        {isCompletedStep ? (
                          <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
                            <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        ) : isCurrentStep ? (
                          <div className="h-8 w-8 rounded-full border-2 border-indigo-600 bg-white">
                            <span className="h-full w-full rounded-full bg-indigo-600 flex items-center justify-center">
                              <span className="text-xs font-medium text-white">{stepIdx + 1}</span>
                            </span>
                          </div>
                        ) : (
                          <div className="h-8 w-8 rounded-full border-2 border-gray-300 bg-white">
                            <span className="h-full w-full rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-500">{stepIdx + 1}</span>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Step Label */}
                      <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-24 sm:w-32">
                        <div className="text-center">
                          <div
                            className={`text-xs font-medium ${
                              isCurrentStep
                                ? 'text-indigo-600'
                                : isCompletedStep
                                ? 'text-gray-900'
                                : 'text-gray-500'
                            }`}
                          >
                            {step.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{step.description}</div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </nav>
          </div>
        )}

        {/* Step Content */}
        <div className="py-6">
          <div className="bg-white shadow-sm rounded-lg">
            {currentStep === 'item_selection' && (
              <ItemSelection onItemSelect={handleItemSelect} selectedItem={selectedItem} />
            )}

            {currentStep === 'marketplace_selection' && (
              <MarketplaceSelection
                selectedMarketplaces={formData.marketplaces}
                onMarketplaceSelect={handleMarketplaceSelect}
                selectedItem={selectedItem}
              />
            )}

            {currentStep === 'listing_form' && (
              <ListingForm
                formData={formData}
                selectedItem={selectedItem}
                onUpdateBaseListing={updateBaseListing}
                onUpdateMarketplaceCustomization={updateMarketplaceCustomization}
                onUpdateFormData={updateFormData}
                validation={validation}
                onComplete={handleFormComplete}
              />
            )}

            {currentStep === 'preview' && (
              <ListingPreview
                formData={formData}
                selectedItem={selectedItem}
                onSubmit={handleSubmit}
                onEdit={() => setCurrentStep('listing_form')}
              />
            )}

            {currentStep === 'success' && (
              <SubmissionSuccess
                result={submissionResult}
                selectedItem={selectedItem}
                onStartOver={handleStartOver}
                onViewListings={() => router.push('/dashboard/listings')}
              />
            )}
          </div>
        </div>

        {/* Navigation */}
        {currentStep !== 'success' && currentStep !== 'preview' && (
          <div className="py-6">
            <div className="flex justify-between">
              <button
                type="button"
                onClick={handleBack}
                disabled={getCurrentStepIndex() === 0}
                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {getCurrentStepIndex() === steps.length - 1 ? 'Review' : 'Continue'}
                <ArrowRightIcon className="h-4 w-4 ml-2" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}