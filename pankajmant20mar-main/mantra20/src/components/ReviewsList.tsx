import React from 'react';
import { format } from 'date-fns';
import { Star } from 'lucide-react';

interface Review {
  review_id: string;
  content: string;
  rating: number;
  created_at: string;
  Users: {
    username: string;
    profile_picture: string | null;
  };
}

interface ReviewsListProps {
  reviews: Review[];
}

export default function ReviewsList({ reviews }: ReviewsListProps) {
  return (
    <div className="space-y-6">
      {reviews.map(review => (
        <div key={review.review_id} className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            {review.Users.profile_picture ? (
              <img
                src={review.Users.profile_picture}
                alt={review.Users.username}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <span className="text-orange-500 font-semibold">
                  {review.Users.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="font-medium">{review.Users.username}</p>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            <span className="ml-auto text-sm text-gray-500">
              {format(new Date(review.created_at), 'MMM d, yyyy')}
            </span>
          </div>
          <p className="text-gray-700">{review.content}</p>
        </div>
      ))}
    </div>
  );
}