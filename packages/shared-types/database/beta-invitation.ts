/**
 * Beta Invitation Database Types
 *
 * Types and interfaces for the beta_invitations table
 * Used for managing beta user invitations and access control
 */

/**
 * Beta invitation status enum
 */
export type BetaInvitationStatus = 'active' | 'expired' | 'used' | 'disabled';

/**
 * Database record type for beta_invitations table
 */
export interface BetaInvitationRecord {
  id: string;
  invitation_code: string;
  invited_email: string | null;
  invited_by: string;
  max_uses: number;
  uses_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Input type for creating a new beta invitation
 */
export interface CreateBetaInvitationInput {
  invitation_code: string;
  invited_email?: string | null;
  invited_by: string;
  max_uses?: number;
  expires_at?: string | null;
}

/**
 * Input type for updating an existing beta invitation
 */
export interface UpdateBetaInvitationInput {
  invitation_code?: string;
  invited_email?: string | null;
  invited_by?: string;
  max_uses?: number;
  uses_count?: number;
  is_active?: boolean;
  expires_at?: string | null;
}

/**
 * Enhanced beta invitation type with computed properties
 */
export interface BetaInvitationEnhanced extends BetaInvitationRecord {
  // Computed properties
  remaining_uses: number;
  is_expired: boolean;
  is_available: boolean;

  // Related data (populated when needed)
  invited_user?: {
    id: string;
    email: string;
    full_name: string | null;
  } | null;

  inviting_user?: {
    id: string;
    email: string;
    full_name: string | null;
  } | null;
}

/**
 * Public beta invitation type (safe for client-side usage)
 */
export interface BetaInvitationPublic {
  id: string;
  invitation_code: string;
  max_uses: number;
  uses_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

/**
 * Beta invitation usage tracking record
 */
export interface BetaInvitationUsage {
  id: string;
  invitation_id: string;
  user_id: string;
  used_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

/**
 * Input type for tracking beta invitation usage
 */
export interface CreateBetaInvitationUsageInput {
  invitation_id: string;
  user_id: string;
  ip_address?: string | null;
  user_agent?: string | null;
}

/**
 * Type for beta invitation validation result
 */
export interface BetaInvitationValidationResult {
  valid: boolean;
  invitation: BetaInvitationRecord | null;
  error_code?: 'not_found' | 'expired' | 'disabled' | 'max_uses_reached' | 'already_used_by_user';
  error_message?: string;
}

/**
 * Beta invitation statistics
 */
export interface BetaInvitationStats {
  total_invitations: number;
  active_invitations: number;
  expired_invitations: number;
  used_invitations: number;
  total_uses: number;
  average_uses_per_invitation: number;
  conversion_rate: number; // percentage of invitations that were used
}

/**
 * Query options for beta invitations
 */
export interface BetaInvitationQueryOptions {
  status?: BetaInvitationStatus;
  invited_by?: string;
  created_after?: string;
  created_before?: string;
  expires_after?: string;
  expires_before?: string;
  include_expired?: boolean;
  include_usage_data?: boolean;
}