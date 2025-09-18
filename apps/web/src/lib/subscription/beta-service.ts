/**
 * Beta User Management Service
 * Handles beta user invitations, onboarding, and feedback collection
 */

import { supabaseAdmin } from '../../../../api/database/supabase';

export interface BetaInvitation {
  id: string;
  invitationCode: string;
  invitedEmail?: string;
  invitedBy?: string;
  maxUses: number;
  usesCount: number;
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
}

export class BetaService {
  /**
   * Create a beta invitation
   */
  static async createBetaInvitation(params: {
    invitedBy: string;
    invitedEmail?: string;
    maxUses?: number;
    expiresAt?: Date;
  }): Promise<BetaInvitation> {
    const invitationCode = this.generateInvitationCode();

    const { data, error } = await supabaseAdmin
      .from('beta_invitations')
      .insert({
        invitation_code: invitationCode,
        invited_email: params.invitedEmail,
        invited_by: params.invitedBy,
        max_uses: params.maxUses || 1,
        expires_at: params.expiresAt?.toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create beta invitation: ${error.message}`);
    }

    console.log(`✅ Created beta invitation: ${invitationCode}`);
    return this.mapBetaInvitationData(data);
  }

  /**
   * Validate and use a beta invitation
   */
  static async useBetaInvitation(invitationCode: string, userId: string): Promise<boolean> {
    const { data: invitation, error } = await supabaseAdmin
      .from('beta_invitations')
      .select()
      .eq('invitation_code', invitationCode)
      .eq('is_active', true)
      .single();

    if (error || !invitation) {
      return false;
    }

    // Check if invitation is expired
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      return false;
    }

    // Check if invitation has remaining uses
    if (invitation.uses_count >= invitation.max_uses) {
      return false;
    }

    // Update invitation usage
    const { error: updateError } = await supabaseAdmin
      .from('beta_invitations')
      .update({
        uses_count: invitation.uses_count + 1,
        is_active: invitation.uses_count + 1 < invitation.max_uses,
      })
      .eq('id', invitation.id);

    if (updateError) {
      throw new Error(`Failed to update beta invitation: ${updateError.message}`);
    }

    console.log(`✅ Used beta invitation: ${invitationCode} for user ${userId}`);
    return true;
  }

  /**
   * Generate a unique invitation code
   */
  private static generateInvitationCode(): string {
    return 'BETA-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }

  /**
   * Map database data to TypeScript interface
   */
  private static mapBetaInvitationData(data: any): BetaInvitation {
    return {
      id: data.id,
      invitationCode: data.invitation_code,
      invitedEmail: data.invited_email,
      invitedBy: data.invited_by,
      maxUses: data.max_uses,
      usesCount: data.uses_count,
      isActive: data.is_active,
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
      createdAt: new Date(data.created_at),
    };
  }
}

export default BetaService;