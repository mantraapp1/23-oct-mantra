import { Link } from 'react-router-dom';
import { ChevronRight, FileText, BookOpen, Lock, Clock } from 'lucide-react';

interface Chapter {
    id: string;
    chapter_number: number;
    title: string;
    created_at: string;
    views?: number;
}

interface ChapterListProps {
    chapters: Chapter[];
    novelId: string;
    currentChapterNumber?: number;
    unlocks?: Record<string, any>;
}

const FREE_CHAPTERS = 7;

export default function ChapterList({ chapters, novelId, currentChapterNumber, unlocks = {} }: ChapterListProps) {
    // Reorder: put current chapter at top if exists
    const orderedChapters = currentChapterNumber
        ? [
            ...chapters.filter(c => c.chapter_number === currentChapterNumber),
            ...chapters.filter(c => c.chapter_number !== currentChapterNumber)
        ]
        : chapters;

    return (
        <div className="space-y-2">
            {orderedChapters.map((chapter) => {
                const isReading = chapter.chapter_number === currentChapterNumber;

                let isLocked = false;
                let isUnlocking = false;

                if (chapter.chapter_number > FREE_CHAPTERS) {
                    const unlock = unlocks[chapter.id];
                    if (!unlock) {
                        isLocked = true;
                    } else {
                        const expirationTime = new Date(unlock.expirationTimestamp || 0);
                        if (new Date() >= expirationTime || unlock.isExpired) {
                            isLocked = true;
                        } else if (unlock.unlockTimestamp) {
                            const unlockTime = new Date(unlock.unlockTimestamp);
                            if (new Date() < unlockTime) {
                                isLocked = true;
                                isUnlocking = true;
                            }
                        }
                    }
                }

                return (
                    <Link
                        key={chapter.id}
                        to={`/novel/${novelId}/chapter/${chapter.id}`}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer group ${isReading
                            ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 shadow-sm'
                            : 'border-border bg-card hover:shadow-sm'
                            }`}
                    >
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 shadow-sm ${isReading
                            ? 'bg-sky-500 text-white shadow-sky-200 dark:shadow-none'
                            : 'bg-sky-500 text-white shadow-sky-200 dark:shadow-none'
                            }`}>
                            {chapter.chapter_number}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <div className={`text-sm font-semibold truncate transition-colors ${isReading
                                    ? 'text-sky-600 dark:text-sky-400'
                                    : 'group-hover:text-sky-600 dark:group-hover:text-sky-400 text-foreground'
                                    }`}>
                                    {chapter.title}
                                </div>
                                {isReading && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500 text-white text-[10px] font-bold uppercase shrink-0">
                                        <BookOpen className="w-3 h-3" />
                                        Reading
                                    </span>
                                )}
                                {isLocked && !isUnlocking && (
                                    <span className="flex items-center justify-center bg-background-secondary rounded-full p-1 border border-border">
                                        <Lock className="w-3.5 h-3.5 text-foreground-secondary" />
                                    </span>
                                )}
                                {isUnlocking && (
                                    <span className="flex items-center justify-center bg-sky-100 dark:bg-sky-900/30 rounded-full p-1 border border-sky-200 dark:border-sky-800">
                                        <Clock className="w-3.5 h-3.5 text-sky-500" />
                                    </span>
                                )}
                            </div>
                            <div className="text-[11px] text-foreground-secondary">
                                {chapter.views ? `${chapter.views} views` : '0 views'} · {new Date(chapter.created_at).toLocaleDateString()}
                            </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-foreground-secondary" />
                    </Link>
                );
            })}

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
