// Mock Supabase before importing anything
jest.mock('../supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
    storage: {
      from: jest.fn(),
    },
    channel: jest.fn(),
  },
}));

import { SourcingService } from '../sourcingService';

describe('SourcingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createItem', () => {
    it('should throw error when user is not authenticated', async () => {
      const { supabase } = require('../supabase');
      supabase.auth.getUser.mockResolvedValue({ data: { user: null } });

      await expect(
        SourcingService.createItem({
          title: 'Test Item',
          location: 'Test Location',
        })
      ).rejects.toThrow('User not authenticated');
    });

    it('should create item when user is authenticated', async () => {
      const { supabase } = require('../supabase');
      const mockUser = { id: 'user-123' };
      const mockItem = {
        id: 'item-123',
        title: 'Test Item',
        location: 'Test Location',
        user_id: 'user-123',
      };

      supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockItem, error: null }),
        }),
      });

      supabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const result = await SourcingService.createItem({
        title: 'Test Item',
        location: 'Test Location',
      });

      expect(result).toEqual(mockItem);
      expect(supabase.from).toHaveBeenCalledWith('sourcing_items');
    });
  });

  describe('getUserItems', () => {
    it('should fetch user items successfully', async () => {
      const { supabase } = require('../supabase');
      const mockUser = { id: 'user-123' };
      const mockItems = [
        { id: 'item-1', title: 'Item 1', user_id: 'user-123' },
        { id: 'item-2', title: 'Item 2', user_id: 'user-123' },
      ];

      supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockItems, error: null }),
        }),
      });

      supabase.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await SourcingService.getUserItems();

      expect(result).toEqual(mockItems);
      expect(supabase.from).toHaveBeenCalledWith('sourcing_items');
    });
  });
});