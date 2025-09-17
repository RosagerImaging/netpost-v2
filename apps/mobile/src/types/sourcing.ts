export interface SourcingItem {
  id: string;
  title: string;
  description?: string;
  location: string;
  photo_url?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface CreateSourcingItemRequest {
  title: string;
  description?: string;
  location: string;
  photo_uri?: string;
}

export interface SourcingItemFormData {
  title: string;
  description: string;
  location: string;
}

export interface SourcingItemValidationErrors {
  title?: string;
  description?: string;
  location?: string;
}