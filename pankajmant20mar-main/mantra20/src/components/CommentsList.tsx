import React from 'react';
import { format } from 'date-fns';

interface Comment {
  comment_id: string;
  content: string;
  created_at: string;
  Users: {
    username: string;
    profile_picture: string | null;
  };
}

interface CommentsListProps {
  comments: Comment[];
}

export default function CommentsList({ comments }: CommentsListProps) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No comments yet. Be the first to comment!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map(comment => (
        <div key={comment.comment_id} className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            {comment.Users.profile_picture ? (
              <img
                src={comment.Users.profile_picture}
                alt={comment.Users.username}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                <span className="text-orange-500 font-semibold">
                  {comment.Users.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="font-medium">{comment.Users.username}</p>
              <p className="text-sm text-gray-500">
                {format(new Date(comment.created_at), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          <p className="text-gray-700 whitespace-pre-line">{comment.content}</p>
        </div>
      ))}
    </div>
  );
}