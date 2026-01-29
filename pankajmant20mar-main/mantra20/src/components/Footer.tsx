import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-orange-500" />
            <span className="ml-2 text-xl font-bold text-orange-500">Mantra Novels</span>
          </div>
          
          <nav className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
            <Link to="/about" className="hover:text-orange-500">About Us</Link>
            <Link to="/contact" className="hover:text-orange-500">Contact Us</Link>
            <Link to="/legal" className="hover:text-orange-500">Legal</Link>
            <Link to="/write" className="hover:text-orange-500">Become a Writer</Link>
          </nav>
          
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Mantra Novels. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}