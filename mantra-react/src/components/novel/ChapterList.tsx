import { Link } from 'react-router-dom';
import { Lock, ChevronRight, FileText } from 'lucide-react';

interface Chapter {
    id: string;
    chapter_number: number;
    title: string;
    created_at: string;
    is_locked?: boolean;
    views?: number;
}

interface ChapterListProps {
    chapters: Chapter[];
    novelId: string;
}

export default function ChapterList({ chapters, novelId }: ChapterListProps) {
    return (
        <div className="space-y-2">
            {chapters.map((chapter) => (
                <Link
                    key={chapter.id}
                    to={`/novel/${novelId}/chapter/${chapter.id}`}
                    className={`flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:shadow-sm transition cursor-pointer group ${chapter.is_locked ? 'opacity-70' : ''}`}
                >
                    <div className="h-10 w-10 rounded-lg bg-sky-500 text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-sm shadow-sky-200 dark:shadow-none">
                        {chapter.chapter_number}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors text-foreground">
                            {chapter.title}
                        </div>
                        <div className="text-[11px] text-foreground-secondary">
                            {/* Mocking views for parity if not available */}
                            {chapter.views ? `${chapter.views} views` : '0 views'} · {new Date(chapter.created_at).toLocaleDateString()}
                        </div>
                    </div>

                    {chapter.is_locked ? (
                        <Lock className="w-4 h-4 text-foreground-secondary" />
                    ) : (
                        <ChevronRight className="w-4 h-4 text-foreground-secondary" />
                    )}
                </Link>
            ))}

            {chapters.length === 0 && (
                <div className="p-12 text-center text-foreground-secondary">
                    <div className="flex justify-center mb-3">
                        <FileText className="w-10 h-10 text-foreground-secondary opacity-50" />
                    </div>
                    <p>No chapters available yet.</p>
                </div>
            )}
        </div>
    );
}
