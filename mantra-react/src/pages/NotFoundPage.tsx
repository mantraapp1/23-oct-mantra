import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';

export default function NotFoundPage() {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-20">
            {/* Large 404 */}
            <div className="text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-sky-500 to-indigo-600 mb-4">
                404
            </div>

            {/* Message */}
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-2 text-center">
                Page Not Found
            </h1>
            <p className="text-[var(--foreground-secondary)] max-w-md text-center mb-8">
                The page you're looking for doesn't exist or has been moved.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
                <Link
                    to="/"
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-sky-500 text-white rounded-xl font-semibold hover:bg-sky-600 transition-colors shadow-md shadow-sky-500/20"
                >
                    <Home className="w-5 h-5" />
                    Go Home
                </Link>
                <Link
                    to="/search"
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--background-secondary)] text-[var(--foreground)] rounded-xl font-semibold hover:bg-[var(--border)] transition-colors"
                >
                    <Search className="w-5 h-5" />
                    Search Novels
                </Link>
            </div>
        </div>
    );
}
