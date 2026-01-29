import React from 'react';
import type { Novel } from '../types';
import { Eye } from 'lucide-react';

interface NovelCardProps {
  novel: Novel;
  showViews?: boolean;
}

export default function NovelCard({ novel, showViews = true }: NovelCardProps) {
  return (
    <div className="group">
      <div className="w-full transition-transform duration-200 group-hover:scale-105">
        {novel.novel_coverpage ? (
          <img
            src={novel.novel_coverpage}
            alt={novel.title}
            className="w-full aspect-[2/3] object-cover rounded-lg shadow-md"
            loading="lazy"
          />
        ) : (
          <div className="w-full aspect-[2/3] bg-gradient-to-br from-orange-400 to-pink-500 rounded-lg shadow-md flex flex-col justify-center items-center p-4 text-white">
            <h3 className="text-base font-bold text-center mb-2 line-clamp-3">{novel.title}</h3>
            <p className="text-sm opacity-90 text-center">by {novel.author}</p>
          </div>
        )}
        <div className="mt-2">
          <h3 className="text-sm font-semibold text-gray-800 group-hover:text-orange-500 truncate">
            {novel.title}
          </h3>
          <p className="text-xs text-gray-600 truncate">by {novel.author}</p>
          {showViews && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
              <Eye className="h-3 w-3" />
              <span>{novel.views}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}