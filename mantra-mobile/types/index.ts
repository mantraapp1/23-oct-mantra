// TypeScript interfaces for all data models

// Export all database types from central location
export * from './database';

// Legacy types (kept for backward compatibility during migration)
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
  memberSince: string;
  isAuthor: boolean;
  earnings?: number;
}

export interface Novel {
  id: string;
  title: string;
  author: User;
  coverImage: string;
  genres: string[];
  tags: string[];
  description: string;
  chapterList: Chapter[];
  chapterCount: number;
  reviews: Review[];
  rating: number;
  viewCount: number;
  votes: number;
  hasUserVoted: boolean;
  status: 'ongoing' | 'completed' | 'hiatus';
  reports: Report[];
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: string;
  novelId: string;
  chapterNumber: number;
  title: string;
  content: string;
  wordCount: number;
  publishedAt: string;
  isLocked: boolean;
  unlockPrice?: number;
  comments: Comment[];
  reports: Report[];
  adsShown: number;
  views: number;
}

export interface Review {
  id: string;
  novelId: string;
  user: User;
  rating: number;
  content: string;
  likes: number;
  dislikes: number;
  hasUserLiked: boolean;
  hasUserDisliked: boolean;
  createdAt: string;
  updatedAt: string;
  reports: Report[];
}

export interface Comment {
  id: string;
  chapterId: string;
  user: User;
  content: string;
  likes: number;
  dislikes: number;
  hasUserLiked: boolean;
  hasUserDisliked: boolean;
  replies: Comment[];
  createdAt: string;
  updatedAt: string;
  reports: Report[];
}

export interface Report {
  id: string;
  reporterId: string;
  targetType: 'novel' | 'chapter' | 'review' | 'comment';
  targetId: string;
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
}

export interface UserNovelProgress {
  userId: string;
  novelId: string;
  lockedChapters: string[];
  unlockedChapters: string[];
  readChapters: string[];
  lastReadChapter?: string;
  lastReadAt?: string;
  isSaved: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'earning' | 'withdrawal' | 'unlock_chapter';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'new_chapter' | 'new_review' | 'new_follower' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  relatedId?: string;
  createdAt: string;
}

export interface SearchHistory {
  id: string;
  userId: string;
  query: string;
  searchedAt: string;
}

// Navigation types
export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  SignUp: undefined;
  PasswordReset: undefined;
  EmailVerification: { email: string };
  Onboarding: undefined;
  Main: undefined;
  NovelDetail: { novelId: string };
  Chapter: { chapterId: string; novelId: string };
  SearchResult: { query: string };
  Genre: { genre: string };
  SeeAll: { sectionTitle: string; sectionType: string };
  TagsSection: { tag: string };
  EditorsChoice: undefined;
  RecentSearch: undefined;
  AuthorDashboard: undefined;
  NovelManage: { novelId: string };
  ChapterManage: { novelId: string; chapterId: string };
  CreateNovel: undefined;
  EditNovel: { novelId: string };
  CreateChapter: { novelId: string };
  EditChapter: { chapterId: string };
  EditProfile: undefined;
  OtherUserProfile: { userId: string };
  FollowList: { userId: string; tab: 'following' | 'followers' };
  Notification: undefined;
  Settings: undefined;
  AccountSettings: undefined;
  Wallet: undefined;
  TopUp: undefined;
  Withdrawal: undefined;
  TransactionHistory: undefined;
  Faq: undefined;
  ContactUs: undefined;
  Report: { targetType: string; targetId: string };
};

export type BottomTabParamList = {
  Home: undefined;
  Ranking: undefined;
  Library: undefined;
  Profile: undefined;
};

// Component prop types
export interface NovelCardProps {
  novel: {
    id: string;
    title: string;
    coverImage: string;
    genre?: string;
    rating?: number;
    author?: string;
  };
  size: 'small' | 'medium' | 'large';
  onPress: () => void;
}

export interface FormInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  numberOfLines?: number;
}

export interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export interface ToastConfig {
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  message: string;
  duration?: number;
}
