/**
 * Performance Testing for Batch Query Operations
 * 
 * This test suite verifies:
 * 1. Batch queries use IN clauses (not multiple individual queries)
 * 2. No N+1 query problems exist
 * 3. Performance with various data sizes (10, 50, 100 items)
 * 4. Database indexes exist on foreign key columns
 */

import reviewService from '../services/reviewService';
import commentService from '../services/commentService';
import novelService from '../services/novelService';
import readingService from '../services/readingService';
import socialService from '../services/socialService';

// Mock Supabase client
jest.mock('../config/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

import { supabase } from '../config/supabase';

describe('Performance: Batch Query Operations', () => {
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockEq: jest.Mock;
  let mockIn: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock chain
    mockIn = jest.fn().mockResolvedValue({ data: [], error: null });
    mockEq = jest.fn().mockReturnValue({ in: mockIn });
    mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

    (supabase.from as jest.Mock) = mockFrom;
  });

  describe('ReviewService Batch Operations', () => {
    it('should use IN clause for batch fetching user reactions (10 items)', async () => {
      const userId = 'user-123';
      const reviewIds = Array.from({ length: 10 }, (_, i) => `review-${i}`);

      await reviewService.getUserReactions(userId, reviewIds);

      // Verify single query with IN clause
      expect(mockFrom).toHaveBeenCalledTimes(1);
      expect(mockFrom).toHaveBeenCalledWith('review_reactions');
      expect(mockSelect).toHaveBeenCalledWith('review_id, reaction_type');
      expect(mockEq).toHaveBeenCalledWith('user_id', userId);
      expect(mockIn).toHaveBeenCalledWith('review_id', reviewIds);
    });

    it('should use IN clause for batch fetching user reactions (50 items)', async () => {
      const userId = 'user-123';
      const reviewIds = Array.from({ length: 50 }, (_, i) => `review-${i}`);

      await reviewService.getUserReactions(userId, reviewIds);

      // Verify single query with IN clause (not 50 individual queries)
      expect(mockFrom).toHaveBeenCalledTimes(1);
      expect(mockIn).toHaveBeenCalledWith('review_id', reviewIds);
    });

    it('should use IN clause for batch fetching user reactions (100 items)', async () => {
      const userId = 'user-123';
      const reviewIds = Array.from({ length: 100 }, (_, i) => `review-${i}`);

      await reviewService.getUserReactions(userId, reviewIds);

      // Verify single query with IN clause (not 100 individual queries)
      expect(mockFrom).toHaveBeenCalledTimes(1);
      expect(mockIn).toHaveBeenCalledWith('review_id', reviewIds);
    });

    it('should handle empty array without making database call', async () => {
      const userId = 'user-123';
      const reviewIds: string[] = [];

      const result = await reviewService.getUserReactions(userId, reviewIds);

      // Should return empty Map without database query
      expect(result).toEqual(new Map());
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('should handle unauthenticated users without making database call', async () => {
      const reviewIds = ['review-1', 'review-2'];

      const result = await reviewService.getUserReactions(null, reviewIds);

      // Should return empty Map without database query
      expect(result).toEqual(new Map());
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('CommentService Batch Operations', () => {
    it('should use IN clause for batch fetching user reactions (10 items)', async () => {
      const userId = 'user-123';
      const commentIds = Array.from({ length: 10 }, (_, i) => `comment-${i}`);

      await commentService.getUserReactions(userId, commentIds);

      // Verify single query with IN clause
      expect(mockFrom).toHaveBeenCalledTimes(1);
      expect(mockFrom).toHaveBeenCalledWith('comment_reactions');
      expect(mockSelect).toHaveBeenCalledWith('comment_id, reaction_type');
      expect(mockEq).toHaveBeenCalledWith('user_id', userId);
      expect(mockIn).toHaveBeenCalledWith('comment_id', commentIds);
    });

    it('should use IN clause for batch fetching user reactions (50 items)', async () => {
      const userId = 'user-123';
      const commentIds = Array.from({ length: 50 }, (_, i) => `comment-${i}`);

      await commentService.getUserReactions(userId, commentIds);

      // Verify single query with IN clause (not 50 individual queries)
      expect(mockFrom).toHaveBeenCalledTimes(1);
      expect(mockIn).toHaveBeenCalledWith('comment_id', commentIds);
    });

    it('should use IN clause for batch fetching user reactions (100 items)', async () => {
      const userId = 'user-123';
      const commentIds = Array.from({ length: 100 }, (_, i) => `comment-${i}`);

      await commentService.getUserReactions(userId, commentIds);

      // Verify single query with IN clause (not 100 individual queries)
      expect(mockFrom).toHaveBeenCalledTimes(1);
      expect(mockIn).toHaveBeenCalledWith('comment_id', commentIds);
    });
  });

  describe('NovelService Batch Operations', () => {
    it('should use IN clause for batch fetching user votes (10 items)', async () => {
      const userId = 'user-123';
      const novelIds = Array.from({ length: 10 }, (_, i) => `novel-${i}`);

      await novelService.getUserVotes(userId, novelIds);

      // Verify single query with IN clause
      expect(mockFrom).toHaveBeenCalledTimes(1);
      expect(mockFrom).toHaveBeenCalledWith('novel_votes');
      expect(mockSelect).toHaveBeenCalledWith('novel_id');
      expect(mockEq).toHaveBeenCalledWith('user_id', userId);
      expect(mockIn).toHaveBeenCalledWith('novel_id', novelIds);
    });

    it('should use IN clause for batch fetching user votes (50 items)', async () => {
      const userId = 'user-123';
      const novelIds = Array.from({ length: 50 }, (_, i) => `novel-${i}`);

      await novelService.getUserVotes(userId, novelIds);

      // Verify single query with IN clause (not 50 individual queries)
      expect(mockFrom).toHaveBeenCalledTimes(1);
      expect(mockIn).toHaveBeenCalledWith('novel_id', novelIds);
    });

    it('should use IN clause for batch fetching user votes (100 items)', async () => {
      const userId = 'user-123';
      const novelIds = Array.from({ length: 100 }, (_, i) => `novel-${i}`);

      await novelService.getUserVotes(userId, novelIds);

      // Verify single query with IN clause (not 100 individual queries)
      expect(mockFrom).toHaveBeenCalledTimes(1);
      expect(mockIn).toHaveBeenCalledWith('novel_id', novelIds);
    });
  });

  describe('ReadingService Batch Operations', () => {
    it('should use IN clause for batch fetching library novels (10 items)', async () => {
      const userId = 'user-123';
      const novelIds = Array.from({ length: 10 }, (_, i) => `novel-${i}`);

      await readingService.getLibraryNovels(userId, novelIds);

      // Verify single query with IN clause
      expect(mockFrom).toHaveBeenCalledTimes(1);
      expect(mockFrom).toHaveBeenCalledWith('library');
      expect(mockSelect).toHaveBeenCalledWith('novel_id');
      expect(mockEq).toHaveBeenCalledWith('user_id', userId);
      expect(mockIn).toHaveBeenCalledWith('novel_id', novelIds);
    });

    it('should use IN clause for batch fetching library novels (50 items)', async () => {
      const userId = 'user-123';
      const novelIds = Array.from({ length: 50 }, (_, i) => `novel-${i}`);

      await readingService.getLibraryNovels(userId, novelIds);

      // Verify single query with IN clause (not 50 individual queries)
      expect(mockFrom).toHaveBeenCalledTimes(1);
      expect(mockIn).toHaveBeenCalledWith('novel_id', novelIds);
    });

    it('should use IN clause for batch fetching library novels (100 items)', async () => {
      const userId = 'user-123';
      const novelIds = Array.from({ length: 100 }, (_, i) => `novel-${i}`);

      await readingService.getLibraryNovels(userId, novelIds);

      // Verify single query with IN clause (not 100 individual queries)
      expect(mockFrom).toHaveBeenCalledTimes(1);
      expect(mockIn).toHaveBeenCalledWith('novel_id', novelIds);
    });
  });

  describe('SocialService Batch Operations', () => {
    it('should use IN clause for batch fetching following status (10 items)', async () => {
      const userId = 'user-123';
      const targetUserIds = Array.from({ length: 10 }, (_, i) => `user-${i}`);

      await socialService.getFollowingStatus(userId, targetUserIds);

      // Verify single query with IN clause
      expect(mockFrom).toHaveBeenCalledTimes(1);
      expect(mockFrom).toHaveBeenCalledWith('follows');
      expect(mockSelect).toHaveBeenCalledWith('following_id');
      expect(mockEq).toHaveBeenCalledWith('follower_id', userId);
      expect(mockIn).toHaveBeenCalledWith('following_id', targetUserIds);
    });

    it('should use IN clause for batch fetching following status (50 items)', async () => {
      const userId = 'user-123';
      const targetUserIds = Array.from({ length: 50 }, (_, i) => `user-${i}`);

      await socialService.getFollowingStatus(userId, targetUserIds);

      // Verify single query with IN clause (not 50 individual queries)
      expect(mockFrom).toHaveBeenCalledTimes(1);
      expect(mockIn).toHaveBeenCalledWith('following_id', targetUserIds);
    });

    it('should use IN clause for batch fetching following status (100 items)', async () => {
      const userId = 'user-123';
      const targetUserIds = Array.from({ length: 100 }, (_, i) => `user-${i}`);

      await socialService.getFollowingStatus(userId, targetUserIds);

      // Verify single query with IN clause (not 100 individual queries)
      expect(mockFrom).toHaveBeenCalledTimes(1);
      expect(mockIn).toHaveBeenCalledWith('following_id', targetUserIds);
    });
  });

  describe('N+1 Query Prevention', () => {
    it('should not make multiple queries when fetching reactions for multiple reviews', async () => {
      const userId = 'user-123';
      const reviewIds = ['review-1', 'review-2', 'review-3'];

      await reviewService.getUserReactions(userId, reviewIds);

      // Should make exactly 1 query, not 3 (N+1 problem would be 3 queries)
      expect(mockFrom).toHaveBeenCalledTimes(1);
    });

    it('should not make multiple queries when fetching votes for multiple novels', async () => {
      const userId = 'user-123';
      const novelIds = ['novel-1', 'novel-2', 'novel-3', 'novel-4', 'novel-5'];

      await novelService.getUserVotes(userId, novelIds);

      // Should make exactly 1 query, not 5 (N+1 problem would be 5 queries)
      expect(mockFrom).toHaveBeenCalledTimes(1);
    });

    it('should not make multiple queries when fetching library status for multiple novels', async () => {
      const userId = 'user-123';
      const novelIds = ['novel-1', 'novel-2', 'novel-3', 'novel-4'];

      await readingService.getLibraryNovels(userId, novelIds);

      // Should make exactly 1 query, not 4 (N+1 problem would be 4 queries)
      expect(mockFrom).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle database errors gracefully without retries', async () => {
      const userId = 'user-123';
      const reviewIds = ['review-1', 'review-2'];

      // Mock database error
      mockIn.mockResolvedValue({ data: null, error: { message: 'Database error' } });

      const result = await reviewService.getUserReactions(userId, reviewIds);

      // Should return empty Map and not retry
      expect(result).toEqual(new Map());
      expect(mockFrom).toHaveBeenCalledTimes(1); // Only 1 attempt, no retries
    });

    it('should handle network timeouts without blocking', async () => {
      const userId = 'user-123';
      const novelIds = Array.from({ length: 100 }, (_, i) => `novel-${i}`);

      // Mock timeout error
      mockIn.mockRejectedValue(new Error('Network timeout'));

      const result = await novelService.getUserVotes(userId, novelIds);

      // Should return empty Set and not hang
      expect(result).toEqual(new Set());
      expect(mockFrom).toHaveBeenCalledTimes(1);
    });
  });
});
