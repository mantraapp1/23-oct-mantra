// ============================================
// Novel Types
// ============================================

export interface Novel {
    id: string;
    title: string;
    description: string | null;
    cover_image_url: string | null;
    author_id: string;
    status: 'ongoing' | 'completed' | 'hiatus' | 'ONGOING' | 'COMPLETED' | 'HIATUS';
    genres: string[];
    tags: string[];
    language: string;
    is_mature: boolean;
    is_published: boolean;
    is_featured: boolean;
    is_editors_pick: boolean;
    total_chapters: number;
    total_views: number;
    total_votes: number;
    average_rating: number;
    total_reviews: number;
    created_at: string;
    updated_at: string;
    author?: Profile;
}

export interface NovelWithAuthor extends Novel {
    author: Profile;
}

// ============================================
// Chapter Types
// ============================================

export interface Chapter {
    id: string;
    novel_id: string;
    title: string;
    content: string;
    chapter_number: number;
    coins_required: number;
    views: number;
    likes: number;
    is_published: boolean;
    published_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface ChapterListItem {
    id: string;
    title: string;
    chapter_number: number;
    created_at: string;
    views: number;
}

// ============================================
// Profile Types
// ============================================

export interface Profile {
    id: string;
    username: string;
    display_name: string | null;
    profile_picture_url: string | null;
    bio: string | null;
    website: string | null;
    created_at: string;
    updated_at: string;
}

export interface PublicProfile extends Profile {
    novels_count?: number;
    followers_count?: number;
    following_count?: number;
}

// ============================================
// User Types
// ============================================

export interface User {
    id: string;
    email: string;
    profile?: Profile;
}

// ============================================
// Review Types
// ============================================

export interface Review {
    id: string;
    novel_id: string;
    user_id: string;
    rating: number;
    review_text: string;
    likes: number;
    dislikes: number;
    created_at: string;
    updated_at: string;
    user?: Pick<Profile, 'id' | 'username' | 'display_name' | 'profile_picture_url'>;
}

export interface ReviewWithUser extends Review {
    user: Pick<Profile, 'id' | 'username' | 'display_name' | 'profile_picture_url'>;
}

// ============================================
// Comment Types
// ============================================

export interface Comment {
    id: string;
    chapter_id: string;
    user_id: string;
    comment_text: string;
    parent_comment_id: string | null;
    likes: number;
    dislikes: number;
    reply_count: number;
    created_at: string;
    updated_at: string;
    user?: Pick<Profile, 'id' | 'username' | 'display_name' | 'profile_picture_url'>;
    user_has_liked?: boolean;
    user_has_disliked?: boolean;
}

export interface CommentWithUser extends Comment {
    user: Pick<Profile, 'id' | 'username' | 'display_name' | 'profile_picture_url'>;
}

// ============================================
// Wallet Types
// ============================================

export interface Wallet {
    id: string;
    user_id: string;
    balance: number;
    total_earned: number;
    total_withdrawn: number;
    stellar_address: string | null;
    created_at: string;
    updated_at: string;
}

export interface Transaction {
    id: string;
    user_id: string;
    type: 'earning' | 'withdrawal' | 'purchase' | 'tip';
    amount: number;
    status: 'pending' | 'successful' | 'failed';
    description: string | null;
    reference_id: string | null;
    created_at: string;
}

// ============================================
// Interaction Types
// ============================================

export interface Interaction {
    id: string;
    user_id: string;
    novel_id: string;
    interaction_type: 'VIEW' | 'LIKE' | 'BOOKMARK' | 'SHARE';
    created_at: string;
}

// ============================================
// Library Types
// ============================================

export interface LibraryItem {
    id: string;
    user_id: string;
    novel_id: string;
    last_read_chapter_id: string | null;
    reading_progress: number;
    created_at: string;
    updated_at: string;
    novel?: Novel;
}

// ============================================
// Pagination Types
// ============================================

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}
