/**
 * Cached Novel Service
 * Wraps novelService with caching to prevent duplicate API requests
 */

import novelService from './novelService';
import { ApiRequestManager } from '../utils/apiRequestManager';
import { NovelWithAuthor } from '../types/supabase';

// Cache TTL constants
const CACHE_TTL = {
    NOVEL: 5 * 60 * 1000, // 5 minutes
    NOVEL_LIST: 3 * 60 * 1000, // 3 minutes
    USER_VOTE: 2 * 60 * 1000, // 2 minutes
};

/**
 * Novel Service with built-in caching
 * Prevents duplicate API requests and improves performance
 */
export const CachedNovelService = {
    /**
     * Get novel by ID with caching
     */
    async getNovel(novelId: string): Promise<NovelWithAuthor | null> {
        return ApiRequestManager.fetch(
            `novel:${novelId}`,
            async () => novelService.getNovel(novelId),
            { cacheTtl: CACHE_TTL.NOVEL }
        );
    },

    /**
     * Get trending novels with caching
     */
    async getTrendingNovels(limit: number = 10, language?: string): Promise<NovelWithAuthor[]> {
        const key = `home:trending:${language || 'all'}:${limit}`;
        return ApiRequestManager.fetch(
            key,
            async () => novelService.getTrendingNovels(limit, language),
            { cacheTtl: CACHE_TTL.NOVEL_LIST }
        );
    },

    /**
     * Get popular novels with caching
     */
    async getPopularNovels(limit: number = 10, language?: string): Promise<NovelWithAuthor[]> {
        const key = `home:popular:${language || 'all'}:${limit}`;
        return ApiRequestManager.fetch(
            key,
            async () => novelService.getPopularNovels(limit, language),
            { cacheTtl: CACHE_TTL.NOVEL_LIST }
        );
    },

    /**
     * Get new arrivals with caching
     */
    async getNewArrivals(limit: number = 10, language?: string): Promise<NovelWithAuthor[]> {
        const key = `home:new:${language || 'all'}:${limit}`;
        return ApiRequestManager.fetch(
            key,
            async () => novelService.getNewArrivals(limit, language),
            { cacheTtl: CACHE_TTL.NOVEL_LIST }
        );
    },

    /**
     * Get editor's picks with caching
     */
    async getEditorsPicks(limit: number = 10, language?: string): Promise<NovelWithAuthor[]> {
        const key = `home:picks:${language || 'all'}:${limit}`;
        return ApiRequestManager.fetch(
            key,
            async () => novelService.getEditorsPicks(limit, language),
            { cacheTtl: CACHE_TTL.NOVEL_LIST }
        );
    },

    /**
     * Check if user has voted for a novel with caching
     */
    async hasVoted(userId: string | null | undefined, novelId: string): Promise<boolean> {
        if (!userId) return false;

        const key = `vote:${userId}:${novelId}`;
        return ApiRequestManager.fetch(
            key,
            async () => novelService.hasVoted(userId, novelId),
            { cacheTtl: CACHE_TTL.USER_VOTE }
        );
    },

    /**
     * Vote for a novel (invalidates cache)
     */
    async voteNovel(userId: string, novelId: string) {
        const result = await novelService.voteNovel(userId, novelId);
        if (result.success) {
            // Invalidate relevant caches
            await ApiRequestManager.invalidate(`vote:${userId}:${novelId}`);
            await ApiRequestManager.invalidate(`novel:${novelId}`);
        }
        return result;
    },

    /**
     * Unvote a novel (invalidates cache)
     */
    async unvoteNovel(userId: string, novelId: string) {
        const result = await novelService.unvoteNovel(userId, novelId);
        if (result.success) {
            // Invalidate relevant caches
            await ApiRequestManager.invalidate(`vote:${userId}:${novelId}`);
            await ApiRequestManager.invalidate(`novel:${novelId}`);
        }
        return result;
    },

    /**
     * Invalidate all caches for a novel
     */
    async invalidateNovel(novelId: string): Promise<void> {
        await ApiRequestManager.invalidate(`novel:${novelId}`);
    },

    /**
     * Invalidate home screen caches
     */
    async invalidateHome(): Promise<void> {
        await ApiRequestManager.invalidate('home:');
    },

    /**
     * Prefetch novels for a likely navigation
     */
    async prefetchNovel(novelId: string): Promise<void> {
        await ApiRequestManager.prefetch(
            `novel:${novelId}`,
            async () => novelService.getNovel(novelId),
            { cacheTtl: CACHE_TTL.NOVEL }
        );
    },
};

export default CachedNovelService;
