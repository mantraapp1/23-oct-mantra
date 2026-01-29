import React from 'react';
import { Link } from 'react-router-dom';
import { Novel } from '../types';
import { Eye } from 'lucide-react';

interface SearchResultsProps {
  results: Novel[];
  onResultClick: () => void;
}

export default function SearchResults({ results, onResultClick }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No results found
      </div>
    );
  }

  return (
    <div className="max-h-96 overflow-y-auto">
      {results.map(novel => (
        <Link
          key={novel.novel_id}
          to={`/novel/${novel.novel_id}`}
          onClick={onResultClick}
          className="block p-4 hover:bg-gray-50 border-b last:border-b-0"
        >
          <div className="flex gap-3">
            {novel.novel_coverpage ? (
              <img
                src={novel.novel_coverpage}
                alt={novel.title}
                className="w-12 h-12 object-cover rounded"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-500 rounded" />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 truncate">{novel.title}</h4>
              <p className="text-sm text-gray-600">by {novel.author}</p>
              <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                <Eye className="h-4 w-4" />
                <span>{novel.views}</span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}