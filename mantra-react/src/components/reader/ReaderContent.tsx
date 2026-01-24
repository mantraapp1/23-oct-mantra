import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Settings, Menu, Share2, Flag, BookOpen, User } from 'lucide-react';
import ChapterComments from '@/components/novel/ChapterComments';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface ReaderContentProps {
    chapter: any;
    novel: { id: string; title: string; author_id?: string; author?: { id: string; username: string; display_name?: string } } | null;
    prevChapter: any;
    nextChapter: any;
    novelId: string;
    currentUser: SupabaseUser | null;
}

export default function ReaderContent({ chapter, novel, prevChapter, nextChapter, novelId, currentUser }: ReaderContentProps) {
    const [showSettings, setShowSettings] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    // Settings State
    const [fontSize, setFontSize] = useState(18);
    const [lineHeight, setLineHeight] = useState(1.8);
    const [fontFamily, setFontFamily] = useState<'sans' | 'serif' | 'mono'>('serif');
    const [theme, setTheme] = useState<'light' | 'sepia' | 'dark'>('light');

    // Persist settings
    useEffect(() => {
        const saved = localStorage.getItem('reader-settings');
        if (saved) {
            const settings = JSON.parse(saved);
            setFontStyles(settings);
        }
    }, []);

    const setFontStyles = (settings: any) => {
        if (settings.fontSize) setFontSize(settings.fontSize);
        if (settings.lineHeight) setLineHeight(settings.lineHeight);
        if (settings.fontFamily) setFontFamily(settings.fontFamily);
        if (settings.theme) setTheme(settings.theme);
    };

    const updateSetting = (key: string, value: any) => {
        const newSettings = {
            fontSize, lineHeight, fontFamily, theme,
            [key]: value
        };

        if (key === 'fontSize') setFontSize(value);
        if (key === 'lineHeight') setLineHeight(value);
        if (key === 'fontFamily') setFontFamily(value);
        if (key === 'theme') setTheme(value);

        localStorage.setItem('reader-settings', JSON.stringify(newSettings));
    };

    // Derived Styles
    const getThemeStyles = () => {
        switch (theme) {
            case 'sepia': return 'bg-[#f6f1d1] text-[#5b4636]';
            case 'dark': return 'bg-[#1a1a1a] text-[#d1d5db]';
            default: return 'bg-white text-slate-900';
        }
    };

    const getFontClass = () => {
        switch (fontFamily) {
            case 'sans': return 'font-sans';
            case 'mono': return 'font-mono';
            default: return 'font-serif';
        }
    };

    return (
        <div className={`min-h-screen transition-colors duration-300 ${getThemeStyles()} ${getFontClass()}`}>

            {/* Top Navigation */}
            <div className={`fixed top-0 left-0 right-0 h-16 z-40 flex items-center justify-between px-4 transition-all duration-300 ${theme === 'dark' ? 'bg-[#1a1a1a]/95 border-b border-gray-800' :
                theme === 'sepia' ? 'bg-[#f6f1d1]/95 border-b border-[#e6dec1]' :
                    'bg-white/95 border-b border-slate-100'
                } backdrop-blur-sm`}>

                <div className="flex items-center gap-3">
                    <Link to={`/novel/${novelId}`} className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-black/5 text-slate-600'
                        }`}>
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                    <div className="flex flex-col">
                        <span className={`text-xs font-medium opacity-60 line-clamp-1 max-w-[120px] md:max-w-xs`}>{novel?.title || 'Novel'}</span>
                        <span className="text-sm font-bold line-clamp-1 max-w-[150px] md:max-w-md">Chapter {chapter.chapter_number}: {chapter.title}</span>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-2 rounded-full transition-colors ${showSettings ? (theme === 'dark' ? 'bg-gray-800' : 'bg-black/5') : ''
                            } ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-black/5 text-slate-600'}`}
                    >
                        <Settings className="w-5 h-5" />
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-black/5 text-slate-600'
                                }`}
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        {/* Dropdown Menu */}
                        {showMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                                <div className={`absolute right-0 top-full mt-2 w-48 rounded-xl shadow-xl border py-2 z-50 origin-top-right animate-in fade-in zoom-in-95 duration-200 ${theme === 'dark' ? 'bg-[#1a1a1a] border-gray-700' :
                                    theme === 'sepia' ? 'bg-[#f6f1d1] border-[#e6dec1]' :
                                        'bg-white border-slate-100'
                                    }`}>
                                    <Link to={`/novel/${novelId}`} className={`flex items-center gap-3 px-4 py-2.5 text-sm ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-800' : theme === 'sepia' ? 'text-[#5b4636] hover:bg-[#e6dec1]' : 'text-slate-700 hover:bg-slate-50'}`}>
                                        <BookOpen className="w-4 h-4" /> View Novel
                                    </Link>
                                    {novel?.author?.id && (
                                        <Link to={`/user/${novel.author.id}`} className={`flex items-center gap-3 px-4 py-2.5 text-sm ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-800' : theme === 'sepia' ? 'text-[#5b4636] hover:bg-[#e6dec1]' : 'text-slate-700 hover:bg-slate-50'}`}>
                                            <User className="w-4 h-4" /> View Author
                                        </Link>
                                    )}
                                    <button className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-800' : theme === 'sepia' ? 'text-[#5b4636] hover:bg-[#e6dec1]' : 'text-slate-700 hover:bg-slate-50'}`}>
                                        <Share2 className="w-4 h-4" /> Share
                                    </button>
                                    <div className={`my-1 border-t ${theme === 'dark' ? 'border-gray-700' : theme === 'sepia' ? 'border-[#e6dec1]' : 'border-slate-100'}`} />
                                    <button className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50/50 text-sm text-red-600 text-left">
                                        <Flag className="w-4 h-4" /> Report
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
                <div className={`fixed top-16 right-0 left-0 md:left-auto md:right-4 md:w-80 p-5 shadow-xl border-b md:border md:rounded-xl z-30 animate-in slide-in-from-top-4 duration-300 ${theme === 'dark' ? 'bg-[#1a1a1a] border-gray-800' :
                    theme === 'sepia' ? 'bg-[#f6f1d1] border-[#e6dec1]' :
                        'bg-white border-slate-100'
                    }`}>
                    {/* Theme */}
                    <div className="mb-6">
                        <label className="text-xs font-bold uppercase tracking-wider opacity-50 mb-3 block">Theme</label>
                        <div className="flex gap-3 bg-black/5 p-1 rounded-lg">
                            {(['light', 'sepia', 'dark'] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => updateSetting('theme', t)}
                                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${theme === t ? 'shadow-sm scale-[1.02]' : 'opacity-60 hover:opacity-100'
                                        } ${t === 'light' ? 'bg-white text-slate-900 border border-slate-200' :
                                            t === 'sepia' ? 'bg-[#f6f1d1] text-[#5b4636] border border-[#e6dec1]' :
                                                'bg-[#1a1a1a] text-white border border-gray-700'
                                        }`}
                                >
                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Font Family */}
                    <div className="mb-6">
                        <label className="text-xs font-bold uppercase tracking-wider opacity-50 mb-3 block">Typeface</label>
                        <div className="flex gap-2">
                            {[
                                { id: 'sans', name: 'Inter', class: 'font-sans' },
                                { id: 'serif', name: 'Serif', class: 'font-serif' },
                                { id: 'mono', name: 'Mono', class: 'font-mono' },
                            ].map((f) => (
                                <button
                                    key={f.id}
                                    onClick={() => updateSetting('fontFamily', f.id)}
                                    className={`flex-1 py-2 border rounded-lg text-sm transition-all ${f.class} ${fontFamily === f.id
                                        ? (theme === 'dark' ? 'bg-white text-black border-white' : 'bg-slate-900 text-white border-slate-900')
                                        : (theme === 'dark' ? 'border-gray-700 hover:border-gray-500' : 'border-slate-200 hover:border-slate-300')
                                        }`}
                                >
                                    {f.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Font Size */}
                    <div>
                        <div className="flex justify-between mb-3">
                            <label className="text-xs font-bold uppercase tracking-wider opacity-50">Size</label>
                            <span className="text-xs font-mono">{fontSize}px</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => updateSetting('fontSize', Math.max(12, fontSize - 1))}
                                className={`w-8 h-8 flex items-center justify-center rounded-full border transition-colors ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-800' : 'border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                <span className="text-xs">A</span>
                            </button>
                            <input
                                type="range"
                                min="12"
                                max="32"
                                value={fontSize}
                                onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
                                className="flex-1 accent-sky-500"
                            />
                            <button
                                onClick={() => updateSetting('fontSize', Math.min(32, fontSize + 1))}
                                className={`w-8 h-8 flex items-center justify-center rounded-full border transition-colors ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-800' : 'border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                <span className="text-lg">A</span>
                            </button>
                        </div>
                    </div>

                    {/* Line Spacing */}
                    <div className="mt-6">
                        <label className="text-xs font-bold uppercase tracking-wider opacity-50 mb-3 block">Line Spacing</label>
                        <div className="flex gap-2">
                            {[
                                { value: 1.4, label: 'Tight' },
                                { value: 1.6, label: 'Normal' },
                                { value: 1.8, label: 'Relaxed' },
                                { value: 2.0, label: 'Wide' },
                            ].map((ls) => (
                                <button
                                    key={ls.value}
                                    onClick={() => updateSetting('lineHeight', ls.value)}
                                    className={`flex-1 py-2 border rounded-lg text-xs font-medium transition-all ${lineHeight === ls.value
                                        ? (theme === 'dark' ? 'bg-white text-black border-white' : 'bg-slate-900 text-white border-slate-900')
                                        : (theme === 'dark' ? 'border-gray-700 hover:border-gray-500' : 'border-slate-200 hover:border-slate-300')
                                        }`}
                                >
                                    {ls.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Reading Area */}
            <main className="max-w-[800px] mx-auto pt-24 pb-32 px-5 md:px-8">
                <div
                    className="prose max-w-none transition-all duration-300"
                    style={{
                        fontSize: `${fontSize}px`,
                        lineHeight: lineHeight,
                        color: 'inherit'
                    }}
                >
                    <div className="whitespace-pre-wrap">
                        {chapter.content}
                    </div>
                </div>

                {/* Chapter Navigation - Below chapter, above comments */}
                <div className={`flex items-center gap-4 mt-12 py-6 border-t border-b ${theme === 'dark' ? 'border-gray-800' : theme === 'sepia' ? 'border-[#e6dec1]' : 'border-slate-200'}`}>
                    {prevChapter ? (
                        <Link
                            to={`/novel/${novelId}/chapter/${prevChapter.id}`}
                            className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-medium transition-colors ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-white' :
                                theme === 'sepia' ? 'bg-[#e6dec1] hover:bg-[#dcd3b5] text-[#5b4636]' :
                                    'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                        >
                            <ChevronLeft className="w-4 h-4" /> Previous
                        </Link>
                    ) : (
                        <button disabled className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-medium opacity-50 cursor-not-allowed ${theme === 'dark' ? 'bg-gray-800' : 'bg-slate-100'
                            }`}>
                            <ChevronLeft className="w-4 h-4" /> Previous
                        </button>
                    )}

                    <div className="text-sm font-medium opacity-50 hidden sm:block">
                        Chapter {chapter.chapter_number}
                    </div>

                    {nextChapter ? (
                        <Link
                            to={`/novel/${novelId}/chapter/${nextChapter.id}`}
                            className="flex-1 py-3 px-4 bg-sky-500 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-sky-600 font-medium transition-colors shadow-sm"
                        >
                            Next <ChevronRight className="w-4 h-4" />
                        </Link>
                    ) : (
                        <button disabled className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-medium opacity-50 cursor-not-allowed ${theme === 'dark' ? 'bg-gray-800' : 'bg-slate-100'
                            }`}>
                            Next <ChevronRight className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Comments Section */}
                <div className="mt-8">
                    <ChapterComments chapterId={chapter.id} currentUser={currentUser} theme={theme} />
                </div>
            </main>
        </div>
    );
}
