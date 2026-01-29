export const GENRES = [
  'Horror',
  'Fantasy',
  'Adventure',
  'Mystery',
  'Literary',
  'Dystopian',
  'Romance',
  'Sci-Fi',
  'Thriller',
  'Detective',
  'Urban',
  'Action',
  'ACG',
  'Games',
  'LGBT+',
  'War',
  'Realistic',
  'History',
  'Cherads',
  'General',
  'Teen',
  'Devotional',
  'Poetry'
] as const;

export type Genre = typeof GENRES[number];

export const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Chinese',
  'Japanese',
  'Korean',
  'Russian',
  'Arabic',
  'Hindi',
  'Portuguese',
  'Italian',
  'Dutch',
  'Swedish',
  'Turkish',
  'Polish',
  'Vietnamese',
  'Thai',
  'Indonesian',
  'Malay',
  'Other'
] as const;

export type Language = typeof LANGUAGES[number];

export const NOVEL_STATUSES = [
  'ongoing',
  'completed'
] as const;

export type NovelStatus = typeof NOVEL_STATUSES[number];