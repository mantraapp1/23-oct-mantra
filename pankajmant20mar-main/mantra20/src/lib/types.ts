export interface Novel {
  novel_id: string;  // Changed from id to novel_id to match database
  title: string;
  author: string;
  genre: string[];
  leading_character: 'male' | 'female';
  story: string;
  novel_coverpage: string | null;
  upload_by: string;
  views: number;
  created_at: string;
}

export interface Chapter {
  chapter_id: string;  // Changed from id to chapter_id
  novel_id: string;
  title: string;
  content: string;
  chapter_number: number;
  status: string;
  created_at?: string;
  updated_at?: string;
  views: number; // Required field with default value of 0
}