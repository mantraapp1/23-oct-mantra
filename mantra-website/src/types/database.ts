export interface Interaction {
    id: string;
    user_id: string;
    novel_id: string;
    interaction_type: 'VIEW' | 'LIKE' | 'BOOKMARK' | 'SHARE';
    created_at: string;
}

export interface Novel {
    id: string;
    title: string;
    description: string;
    cover_image_url: string | null;
    author_id: string;
    status: 'ONGOING' | 'COMPLETED' | 'HIATUS';
    category: string;
    created_at: string;
    updated_at: string;
    view_count: number;
    like_count: number;
    tags: string[];
    is_published: boolean;
    author?: Profile;
    chapters?: Chapter[];
}

export interface Chapter {
    id: string;
    novel_id: string;
    title: string;
    content: string;
    chapter_number: number;
    created_at: string;
    published_at: string | null;
    is_published: boolean;
    coins_required: number;
    view_count: number;
    like_count: number;
}

export interface Profile {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    website: string | null;
    bio: string | null;
    created_at: string;
    updated_at: string;
}

export interface User {
    id: string;
    email: string;
    profile?: Profile;
}
