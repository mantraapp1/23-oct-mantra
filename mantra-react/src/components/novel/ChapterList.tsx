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
                    className={`flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:shadow-sm transition cursor-pointer group ${chapter.is_locked ? 'opacity-70' : ''}`}
                >
                    <div className="h-9 w-9 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center text-xs font-semibold shrink-0">
                        {chapter.chapter_number}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate group-hover:text-sky-600 transition-colors">
                            {chapter.title}
                        </div>
                        <div className="text-[11px] text-slate-500">
                            {/* Mocking views for parity if not available */}
                            {chapter.views ? `${chapter.views} views` : '0 views'} · {new Date(chapter.created_at).toLocaleDateString()}
                        </div>
                    </div>

                    {chapter.is_locked ? (
                        <Lock className="w-4 h-4 text-slate-400" />
                    ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                </Link>
            ))}

            {chapters.length === 0 && (
                <div className="p-12 text-center text-slate-500">
                    <div className="flex justify-center mb-3">
                        <FileText className="w-10 h-10 text-slate-300" />
                    </div>
                    <p>No chapters available yet.</p>
                </div>
            )}
        </div>
    );
}
