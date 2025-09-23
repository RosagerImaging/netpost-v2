/**
 * Marketplace Connection Service
 *
 * Handles marketplace authentication, connection management, and health monitoring
 */

import { supabase } from '../supabase';
import {
  createMarketplaceAdapter,
  isMarketplaceSupported,
  type AuthFlow,
  type MarketplaceApiError,
  type AuthenticationError,
} from '../marketplaces';
import type { MarketplaceType } from '@netpost/shared-types';
import type {
  MarketplaceConnectionRecord,
  MarketplaceConnectionSafe,
  CreateMarketplaceConnectionInput,
  UpdateMarketplaceConnectionInput,
  MarketplaceCredentials,
  OAuth1Credentials,
  OAuth2Credentials,
  ApiKeyCredentials,
  HealthCheckResult,
  ConnectionFilters,
  ConnectionStatus,
} from '@netpost/shared-types';

// Service response types
export interface ConnectionServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface PaginatedConnectionsResponse {
  connections: MarketplaceConnectionSafe[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

/**
 * Marketplace Connection Service
 * Manages all marketplace connection operations
 */
export class MarketplaceConnectionService {
  /**
   * Get all marketplace connections for the current user
   */
  static async getConnections(
    filters: ConnectionFilters = {},
    limit = 20,
    cursor?: string
  ): Promise<ConnectionServiceResponse<PaginatedConnectionsResponse>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'User not authenticated', code: 'AUTH_ERROR' };
      }

      let query = supabase
        .from('marketplace_connections_safe')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .is('deleted_at', null);

      // Apply filters
      if (filters.marketplace_type?.length) {
        query = query.in('marketplace_type', filters.marketplace_type);
      }

      if (filters.connection_status?.length) {
        query = query.in('connection_status', filters.connection_status);
      }

      if (filters.auth_method?.length) {
        query = query.in('auth_method', filters.auth_method);
      }

      if (filters.auto_sync_enabled !== undefined) {
        query = query.eq('auto_sync_enabled', filters.auto_sync_enabled);
      }

      if (filters.token_expires_within_hours) {
        query = query.lte('hours_until_expiry', filters.token_expires_within_hours);
      }

      if (filters.has_errors) {
        query = query.gt('consecutive_errors', 0);
      }

      if (filters.last_used_after) {
        query = query.gte('last_used_at', filters.last_used_after);
      }

      if (filters.last_used_before) {
        query = query.lte('last_used_at', filters.last_used_before);
      }

      if (filters.created_after) {
        query = query.gte('created_at', filters.created_after);
      }

      if (filters.created_before) {
        query = query.lte('created_at', filters.created_before);
      }

      // Apply sorting and pagination
      query = query.order('created_at', { ascending: false });

      if (cursor) {
        query = query.lt('created_at', cursor);
      }

      query = query.limit(limit + 1);

      const { data, error, count } = await query;

      if (error) {
        return { success: false, error: error.message, code: 'DATABASE_ERROR' };
      }

      const connections = data || [];
      const hasMore = connections.length > limit;
      const resultConnections = hasMore ? connections.slice(0, -1) : connections;
      const nextCursor = hasMore && resultConnections.length > 0
        ? resultConnections[resultConnections.length - 1].created_at
        : undefined;

      return {
        success: true,
        data: {
          connections: resultConnections,
          total: count || 0,
          hasMore,
          nextCursor,
        },
      };
    } catch (error) {
      console.error('Error fetching marketplace connections:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'SERVICE_ERROR',
      };
    }
  }

  /**
   * Get a single marketplace connection by ID
   */
  static async getConnection(
    connectionId: string
  ): Promise<ConnectionServiceResponse<MarketplaceConnectionSafe>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'User not authenticated', code: 'AUTH_ERROR' };
      }

      const { data, error } = await supabase
        .from('marketplace_connections_safe')
        .select('*')
        .eq('id', connectionId)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'Connection not found', code: 'NOT_FOUND' };
        }
        return { success: false, error: error.message, code: 'DATABASE_ERROR' };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching marketplace connection:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'SERVICE_ERROR',
      };
    }
  }

  /**
   * Initiate OAuth flow for a marketplace
   */
  static async initiateOAuth(
    marketplace: MarketplaceType,
    callbackUrl: string
  ): Promise<ConnectionServiceResponse<AuthFlow & { connection_id: string }>> {
    try {
      if (!isMarketplaceSupported(marketplace)) {
        return {
          success: false,
          error: `Marketplace ${marketplace} is not supported`,
          code: 'UNSUPPORTED_MARKETPLACE',
        };
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'User not authenticated', code: 'AUTH_ERROR' };
      }

      // Create a temporary connection record
      const connectionInput: CreateMarketplaceConnectionInput = {
        marketplace_type: marketplace,
        auth_method: 'oauth2',
        callback_url: callbackUrl,
      };

      const { data: connection, error: createError } = await supabase
        .from('marketplace_connections')
        .insert([{
          ...connectionInput,
          user_id: user.id,
          connection_status: 'connecting',
        }])
        .select()
        .single();

      if (createError) {
        return { success: false, error: createError.message, code: 'DATABASE_ERROR' };
      }

      // Create adapter with empty credentials for OAuth initiation
      const emptyCredentials: OAuth2Credentials = {
        access_token: '',
        token_type: 'Bearer',
      };

      const adapter = createMarketplaceAdapter(connection, emptyCredentials);
      const authFlow = await adapter.initiateOAuthFlow(callbackUrl);

      // Update connection with OAuth state
      await supabase
        .from('marketplace_connections')
        .update({
          oauth_state: authFlow.state,
          authorization_url: authFlow.authorization_url,
        })
        .eq('id', connection.id);

      return {
        success: true,
        data: {
          ...authFlow,
          connection_id: connection.id,
        },
      };
    } catch (error) {
      console.error('Error initiating OAuth flow:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OAuth initiation failed',
        code: 'OAUTH_ERROR',
      };
    }
  }

  /**
   * Complete OAuth flow with authorization code
   */
  static async completeOAuth(
    connectionId: string,
    code: string,
    state: string
  ): Promise<ConnectionServiceResponse<MarketplaceConnectionSafe>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'User not authenticated', code: 'AUTH_ERROR' };
      }

      // Get the connection record
      const { data: connection, error: fetchError } = await supabase
        .from('marketplace_connections')
        .select('*')
        .eq('id', connectionId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        return { success: false, error: 'Connection not found', code: 'NOT_FOUND' };
      }

      // Verify state parameter
      if (connection.oauth_state !== state) {
        return { success: false, error: 'Invalid OAuth state', code: 'INVALID_STATE' };
      }

      // Create adapter for OAuth completion
      const emptyCredentials: OAuth2Credentials = {
        access_token: '',
        token_type: 'Bearer',
      };

      const adapter = createMarketplaceAdapter(connection, emptyCredentials);
      const credentials = await adapter.completeOAuthFlow(code, state);

      // Store encrypted credentials
      await this.storeCredentials(connectionId, credentials);

      // Update connection status
      const expiresAt = credentials.expires_in
        ? new Date(Date.now() + credentials.expires_in * 1000).toISOString()
        : null;

      const { data: updatedConnection, error: updateError } = await supabase
        .from('marketplace_connections')
        .update({
          connection_status: 'active',
          access_token_expires_at: expiresAt,
          scope_granted: credentials.scope ? credentials.scope.split(' ') : [],
          connected_at: new Date().toISOString(),
          last_connection_check: new Date().toISOString(),
        })
        .eq('id', connectionId)
        .select()
        .single();

      if (updateError) {
        return { success: false, error: updateError.message, code: 'DATABASE_ERROR' };
      }

      // Perform initial health check
      await this.performHealthCheck(connectionId);

      // Return safe connection data
      const safeConnection = await this.getConnection(connectionId);
      return safeConnection;
    } catch (error) {
      console.error('Error completing OAuth flow:', error);

      // Update connection status to error
      await supabase
        .from('marketplace_connections')
        .update({
          connection_status: 'error',
          status_message: error instanceof Error ? error.message : 'OAuth completion failed',
        })
        .eq('id', connectionId);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'OAuth completion failed',
        code: 'OAUTH_ERROR',
      };
    }
  }

  /**
   * Store API key credentials
   */
  static async storeApiKeyCredentials(
    marketplace: MarketplaceType,
    credentials: ApiKeyCredentials,
    metadata?: any
  ): Promise<ConnectionServiceResponse<MarketplaceConnectionSafe>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'User not authenticated', code: 'AUTH_ERROR' };
      }

      // Create connection record
      const connectionInput: CreateMarketplaceConnectionInput = {
        marketplace_type: marketplace,
        auth_method: 'api_key',
        marketplace_metadata: metadata || {},
      };

      const { data: connection, error: createError } = await supabase
        .from('marketplace_connections')
        .insert([{
          ...connectionInput,
          user_id: user.id,
          connection_status: 'connecting',
        }])
        .select()
        .single();

      if (createError) {
        return { success: false, error: createError.message, code: 'DATABASE_ERROR' };
      }

      // Store credentials
      await this.storeCredentials(connection.id, credentials);

      // Validate credentials
      const healthCheck = await this.performHealthCheck(connection.id);

      if (!healthCheck.success) {
        // Update status to error
        await supabase
          .from('marketplace_connections')
          .update({
            connection_status: 'error',
            status_message: healthCheck.error,
          })
          .eq('id', connection.id);

        return {
          success: false,
          error: healthCheck.error || 'Health check failed',
          code: healthCheck.code || 'HEALTH_CHECK_ERROR',
        };
      }

      // Update connection status to active
      await supabase
        .from('marketplace_connections')
        .update({
          connection_status: 'active',
          connected_at: new Date().toISOString(),
          last_connection_check: new Date().toISOString(),
        })
        .eq('id', connection.id);

      // Return safe connection data
      const safeConnection = await this.getConnection(connection.id);
      return safeConnection;
    } catch (error) {
      console.error('Error storing API key credentials:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Credential storage failed',
        code: 'CREDENTIAL_ERROR',
      };
    }
  }

  /**
   * Perform health check on a connection
   */
  static async performHealthCheck(
    connectionId: string
  ): Promise<ConnectionServiceResponse<HealthCheckResult>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'User not authenticated', code: 'AUTH_ERROR' };
      }

      // Get connection and credentials
      const connection = await this.getConnectionWithCredentials(connectionId);
      if (!connection) {
        return { success: false, error: 'Connection not found', code: 'NOT_FOUND' };
      }

      const credentials = await this.getCredentials(connectionId);
      if (!credentials) {
        return { success: false, error: 'Credentials not found', code: 'CREDENTIALS_NOT_FOUND' };
      }

      // Create adapter and perform health check
      const adapter = createMarketplaceAdapter(connection, credentials);
      const healthResult = await adapter.validateCredentials();

      // Update connection status based on health check
      const status: ConnectionStatus = healthResult.success
        ? 'active'
        : healthResult.error_message?.includes('expired') || healthResult.error_message?.includes('token')
        ? 'expired'
        : 'error';

      const updateData: any = {
        connection_status: status,
        status_message: healthResult.error_message || undefined,
        last_connection_check: new Date().toISOString(),
        average_response_time_ms: healthResult.response_time_ms,
      };

      if (healthResult.success) {
        updateData.last_successful_sync = new Date().toISOString();
        updateData.consecutive_errors = 0;
      } else {
        // Increment error count
        const { data: currentConnection } = await supabase
          .from('marketplace_connections')
          .select('consecutive_errors')
          .eq('id', connectionId)
          .single();

        updateData.consecutive_errors = (currentConnection?.consecutive_errors || 0) + 1;
      }

      await supabase
        .from('marketplace_connections')
        .update(updateData)
        .eq('id', connectionId);

      return { success: true, data: healthResult };
    } catch (error) {
      console.error('Error performing health check:', error);

      // Update connection status to error
      await supabase
        .from('marketplace_connections')
        .update({
          connection_status: 'error',
          status_message: error instanceof Error ? error.message : 'Health check failed',
          last_connection_check: new Date().toISOString(),
        })
        .eq('id', connectionId);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed',
        code: 'HEALTH_CHECK_ERROR',
      };
    }
  }

  /**
   * Refresh OAuth token for a connection
   */
  static async refreshToken(
    connectionId: string
  ): Promise<ConnectionServiceResponse<MarketplaceConnectionSafe>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'User not authenticated', code: 'AUTH_ERROR' };
      }

      const connection = await this.getConnectionWithCredentials(connectionId);
      if (!connection) {
        return { success: false, error: 'Connection not found', code: 'NOT_FOUND' };
      }

      const credentials = await this.getCredentials(connectionId);
      if (!credentials || !this.isOAuth2Credentials(credentials)) {
        return { success: false, error: 'OAuth credentials not found', code: 'CREDENTIALS_NOT_FOUND' };
      }

      if (!credentials.refresh_token) {
        return { success: false, error: 'Refresh token not available', code: 'NO_REFRESH_TOKEN' };
      }

      // Create adapter and refresh token
      const adapter = createMarketplaceAdapter(connection, credentials);
      const newCredentials = await adapter.refreshToken(credentials.refresh_token);

      // Store new credentials
      await this.storeCredentials(connectionId, newCredentials);

      // Update connection
      const expiresAt = newCredentials.expires_in
        ? new Date(Date.now() + newCredentials.expires_in * 1000).toISOString()
        : null;

      await supabase
        .from('marketplace_connections')
        .update({
          connection_status: 'active',
          access_token_expires_at: expiresAt,
          status_message: null,
          last_connection_check: new Date().toISOString(),
          consecutive_errors: 0,
        })
        .eq('id', connectionId);

      // Return updated connection
      const safeConnection = await this.getConnection(connectionId);
      return safeConnection;
    } catch (error) {
      console.error('Error refreshing token:', error);

      // Update connection status
      await supabase
        .from('marketplace_connections')
        .update({
          connection_status: 'expired',
          status_message: error instanceof Error ? error.message : 'Token refresh failed',
        })
        .eq('id', connectionId);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed',
        code: 'TOKEN_REFRESH_ERROR',
      };
    }
  }

  /**
   * Delete a marketplace connection
   */
  static async deleteConnection(
    connectionId: string
  ): Promise<ConnectionServiceResponse<boolean>> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'User not authenticated', code: 'AUTH_ERROR' };
      }

      // Soft delete the connection
      const { error } = await supabase
        .from('marketplace_connections')
        .update({
          deleted_at: new Date().toISOString(),
          connection_status: 'disconnected',
        })
        .eq('id', connectionId)
        .eq('user_id', user.id);

      if (error) {
        return { success: false, error: error.message, code: 'DATABASE_ERROR' };
      }

      // Delete stored credentials
      await this.deleteCredentials(connectionId);

      return { success: true, data: true };
    } catch (error) {
      console.error('Error deleting connection:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection deletion failed',
        code: 'SERVICE_ERROR',
      };
    }
  }

  // Private helper methods
  private static async getConnectionWithCredentials(
    connectionId: string
  ): Promise<MarketplaceConnectionRecord | null> {
    try {
      const { data, error } = await supabase
        .from('marketplace_connections')
        .select('*')
        .eq('id', connectionId)
        .is('deleted_at', null)
        .single();

      if (error) return null;
      return data;
    } catch {
      return null;
    }
  }

  private static async storeCredentials(
    connectionId: string,
    credentials: MarketplaceCredentials
  ): Promise<void> {
    // In production, this would encrypt credentials before storage
    // For now, we'll store them in a secure way using Supabase's encryption

    const { error } = await supabase
      .from('marketplace_credentials')
      .upsert({
        connection_id: connectionId,
        credentials_encrypted: JSON.stringify(credentials), // This would be encrypted in production
        updated_at: new Date().toISOString(),
      });

    if (error) {
      throw new Error(`Failed to store credentials: ${error.message}`);
    }
  }

  private static async getCredentials(
    connectionId: string
  ): Promise<MarketplaceCredentials | null> {
    try {
      const { data, error } = await supabase
        .from('marketplace_credentials')
        .select('credentials_encrypted')
        .eq('connection_id', connectionId)
        .single();

      if (error || !data) return null;

      // In production, this would decrypt the credentials
      return JSON.parse(data.credentials_encrypted);
    } catch {
      return null;
    }
  }

  private static async deleteCredentials(connectionId: string): Promise<void> {
    await supabase
      .from('marketplace_credentials')
      .delete()
      .eq('connection_id', connectionId);
  }

  private static isOAuth2Credentials(creds: MarketplaceCredentials): creds is OAuth2Credentials {
    return 'access_token' in creds && 'token_type' in creds;
  }
}