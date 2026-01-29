import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { updateReadingProgress } from '../lib/api/reading-progress';
import CommentSection from '../components/CommentSection';
import CommentsList from '../components/CommentsList';
import { toast } from 'react-hot-toast';

interface Chapter {
  chapter_id: string;
  novel_id: string;
  title: string;
  content: string;
  chapter_number: number;
  views: number;
}

interface Comment {
  comment_id: string;
  chapter_id: string;
  user_id: string;
  content: string;
  created_at: string;
  Users: {
    username: string;
    profile_picture: string | null;
  };
}

export default function Chapter() {
  const { novelId, chapterId } = useParams();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [nextChapter, setNextChapter] = useState<Chapter | null>(null);
  const [prevChapter, setPrevChapter] = useState<Chapter | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewCounted, setViewCounted] = useState(false);

  useEffect(() => {
    if (!novelId || !chapterId) return;
    fetchChapterData();
  }, [novelId, chapterId]);

  const fetchChapterData = async () => {
    try {
      setLoading(true);

      // Fetch current chapter
      const { data: chapterData, error: chapterError } = await supabase
        .from('Chapters')
        .select('*')
        .eq('chapter_id', chapterId)
        .single();

      if (chapterError) throw chapterError;
      setChapter(chapterData);

      // Fetch adjacent chapters
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('Chapters')
        .select('*')
        .eq('novel_id', novelId)
        .order('chapter_number', { ascending: true });

      if (chaptersError) throw chaptersError;

      const currentIndex = chaptersData.findIndex(c => c.chapter_id === chapterId);
      if (currentIndex > 0) {
        setPrevChapter(chaptersData[currentIndex - 1]);
      }
      if (currentIndex < chaptersData.length - 1) {
        setNextChapter(chaptersData[currentIndex + 1]);
      }

      // Fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('Comments')
        .select(`
          *,
          Users (
            username,
            profile_picture
          )
        `)
        .eq('chapter_id', chapterId)
        .order('created_at', { ascending: false });

      if (!commentsError) {
        setComments(commentsData);
      }

      // Update reading progress if logged in
      if (userProfile) {
        try {
          await updateReadingProgress(userProfile.user_id, novelId, chapterId);
        } catch (error) {
          console.error('Error updating reading progress:', error);
        }
      }

      // Increment view count
      if (!viewCounted) {
        try {
          const { error: viewError } = await supabase.rpc('increment_chapter_views', {
            chapter_uuid: chapterId
          });
          if (!viewError) {
            setViewCounted(true);
          }
        } catch (error) {
          console.error('Error incrementing chapter views:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching chapter data:', error);
      toast.error('Failed to load chapter');
    } finally {
      setLoading(false);
    }
  };

  const handleCommentAdded = () => {
    fetchChapterData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-center text-gray-600">Chapter not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <div className="sticky top-0 bg-white border-b shadow-sm z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            to={`/novel/${novelId}`}
            className="flex items-center gap-2 text-gray-600 hover:text-orange-500"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Back to Novel</span>
          </Link>
          
          <div className="flex items-center gap-4">
            {prevChapter && (
              <button
                onClick={() => navigate(`/novel/${novelId}/chapter/${prevChapter.chapter_id}`)}
                className="flex items-center gap-1 text-gray-600 hover:text-orange-500"
              >
                <ChevronLeft className="h-5 w-5" />
                <span className="hidden sm:inline">Previous</span>
              </button>
            )}
            
            {nextChapter && (
              <button
                onClick={() => navigate(`/novel/${novelId}/chapter/${nextChapter.chapter_id}`)}
                className="flex items-center gap-1 text-gray-600 hover:text-orange-500"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chapter Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          Chapter {chapter.chapter_number}: {chapter.title}
        </h1>
        
        <div className="mt-8 prose prose-lg max-w-none">
          {chapter.content.split('\n').map((paragraph, index) => (
            <p key={index} className="mb-4 text-gray-800 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Chapter Navigation */}
        <div className="flex justify-between items-center mt-8 py-4 border-t">
          {prevChapter ? (
            <Link
              to={`/novel/${novelId}/chapter/${prevChapter.chapter_id}`}
              className="flex items-center gap-2 text-gray-600 hover:text-orange-500"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Previous Chapter</span>
            </Link>
          ) : (
            <div />
          )}
          
          {nextChapter ? (
            <Link
              to={`/novel/${novelId}/chapter/${nextChapter.chapter_id}`}
              className="flex items-center gap-2 text-gray-600 hover:text-orange-500"
            >
              <span>Next Chapter</span>
              <ChevronRight className="h-5 w-5" />
            </Link>
          ) : (
            <div />
          )}
        </div>

        {/* Comments Section */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <CommentSection 
            chapterId={chapterId!}
            onCommentAdded={handleCommentAdded}
          />
        </div>

        <div className="mt-8">
          <h3 className="text-xl font-bold mb-6">Comments</h3>
          <CommentsList comments={comments} />
        </div>
      </div>
    </div>
  );
}