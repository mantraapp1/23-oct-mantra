import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import profileService from '@/services/profileService';
import { getUserDisplayName } from '@/lib/utils/profileUtils';
import UserAvatar from '@/components/common/UserAvatar';

const GENDER_OPTIONS = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Non-binary' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const LANGUAGE_ENTRIES = [
    { label: 'English', code: 'en' },
    { label: 'Spanish', code: 'es' },
    { label: 'French', code: 'fr' },
    { label: 'German', code: 'de' },
    { label: 'Chinese', code: 'zh' },
    { label: 'Japanese', code: 'ja' },
    { label: 'Korean', code: 'ko' },
    { label: 'Portuguese', code: 'pt' },
    { label: 'Russian', code: 'ru' },
    { label: 'Arabic', code: 'ar' },
];

const LANGUAGE_OPTIONS = LANGUAGE_ENTRIES.map(item => item.label);

const LANGUAGE_LABEL_LOOKUP = LANGUAGE_ENTRIES.reduce<Record<string, string>>((acc, entry) => {
    acc[entry.code.toLowerCase()] = entry.label;
    acc[entry.label.toLowerCase()] = entry.label;
    return acc;
}, {});

const LANGUAGE_CODE_LOOKUP = LANGUAGE_ENTRIES.reduce<Record<string, string>>((acc, entry) => {
    acc[entry.label.toLowerCase()] = entry.code;
    acc[entry.code.toLowerCase()] = entry.code;
    return acc;
}, {});

const GENRE_OPTIONS = ['Fantasy', 'Romance', 'Sci-Fi', 'Mystery', 'Thriller', 'Horror', 'Adventure', 'Drama', 'Comedy', 'Historical', 'Urban', 'Martial Arts'];

const MAX_GENRES = 3;

const normalizeGenres = (raw: unknown): string[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) {
        return raw.filter(Boolean).map(item => String(item));
    }

    if (typeof raw === 'string') {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                return parsed.filter(Boolean).map(item => String(item));
            }
        } catch {
            // fall back to comma separated parsing
            return raw
                .split(',')
                .map(part => part.trim())
                .filter(Boolean);
        }
    }

    return [];
};

const normalizeLanguageLabel = (raw?: string | null): string => {
    if (!raw) return 'English';
    const key = raw.toLowerCase();
    return LANGUAGE_LABEL_LOOKUP[key] || raw;
};

const toLanguageCode = (label: string): string => {
    const key = label.toLowerCase();
    return LANGUAGE_CODE_LOOKUP[key] || label;
};

export default function EditProfilePage() {
    const navigate = useNavigate();
    const { profile, refreshProfile } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [displayName, setDisplayName] = useState('');
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [gender, setGender] = useState('');
    const [age, setAge] = useState('');
    const [language, setLanguage] = useState('English');
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        refreshProfile();
    }, [refreshProfile]);

    useEffect(() => {
        if (profile) {
            setDisplayName(profile.display_name || '');
            setUsername(profile.username || '');
            setBio(profile.bio || '');
            setGender(profile.gender || '');
            setAge(profile.age?.toString() || '');
            setLanguage(normalizeLanguageLabel(profile.preferred_language));
            setSelectedGenres(normalizeGenres(profile.favorite_genres));
        }
    }, [profile]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('Image must be less than 5MB');
                return;
            }
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const toggleGenre = (genre: string) => {
        if (selectedGenres.includes(genre)) {
            setSelectedGenres(selectedGenres.filter(g => g !== genre));
        } else if (selectedGenres.length < MAX_GENRES) {
            setSelectedGenres([...selectedGenres, genre]);
        }
    };

    const handleSave = async () => {
        if (!profile?.id) return;

        // Validation
        if (!displayName.trim()) {
            setError('Display name is required');
            return;
        }

        if (age && (parseInt(age) < 13 || parseInt(age) > 120)) {
            setError('Age must be between 13 and 120');
            return;
        }

        setError('');
        setSaving(true);

        try {
            let profilePictureUrl = profile.profile_picture_url;

            // Upload new profile picture if selected
            if (selectedFile) {
                const fileExt = selectedFile.name.split('.').pop();
                const filePath = `${profile.id}/avatar.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('profile-pictures')
                    .upload(filePath, selectedFile, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('profile-pictures')
                    .getPublicUrl(filePath);

                profilePictureUrl = publicUrl;
            }

            // Update profile
            await profileService.updateProfile(profile.id, {
                display_name: displayName.trim() || undefined,
                username: username.trim() || undefined,
                bio: bio.trim() || undefined,
                gender: (gender as 'male' | 'female' | 'other' | 'prefer_not_to_say') || undefined,
                age: age ? parseInt(age) : undefined,
                preferred_language: toLanguageCode(language),
                favorite_genres: selectedGenres,
                profile_picture_url: profilePictureUrl || undefined,
            });

            await refreshProfile();
            navigate('/profile');
        } catch (err: any) {
            setError(err.message || 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const currentDisplayName = getUserDisplayName(profile);

    return (
        <div className="min-h-screen bg-background font-inter text-foreground">
            {/* Header */}
            <div className="sticky top-0 z-50 border-b border-border bg-background">
                <div className="relative h-14 sm:h-16">
                    <button
                        onClick={() => navigate('/profile')}
                        className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 p-2 rounded-full bg-card/60 hover:bg-card transition-colors shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>

                    <div className="flex h-full items-center justify-center">
                        <div className="text-base md:text-lg font-semibold text-foreground">Edit Profile</div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 px-4 py-2 md:px-6 md:py-2.5 rounded-full bg-sky-500 text-white text-sm font-semibold disabled:opacity-50 hover:bg-sky-600 transition-colors shadow-lg shadow-sky-500/30"
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24">
                {/* Two column layout on desktop */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Profile Picture */}
                    <div className="lg:col-span-1">
                        <div className="flex flex-col items-center sticky top-24">
                            <div className="relative mb-4">
                                {previewUrl ? (
                                    <img
                                        src={previewUrl}
                                        alt="Profile Preview"
                                        className="h-32 w-32 md:h-40 md:w-40 rounded-full object-cover border-2 border-border"
                                    />
                                ) : (
                                    <UserAvatar
                                        uri={profile?.profile_picture_url}
                                        name={currentDisplayName}
                                        size={160}
                                        showBorder
                                        borderColorClass="border-border"
                                    />
                                )}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-2 right-2 h-10 w-10 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-lg hover:bg-sky-600 transition-colors"
                                >
                                    <Camera className="w-5 h-5" />
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </div>
                            <p className="text-sm text-foreground-secondary text-center">
                                Click the camera to change your photo
                            </p>
                        </div>
                    </div>

                    {/* Right Column - Form Fields */}
                    <div className="lg:col-span-2 space-y-5">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-foreground-secondary mb-2">Name</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full rounded-xl border border-border px-4 py-3 text-sm md:text-base outline-none focus:ring-2 focus:ring-sky-500 bg-card text-foreground"
                                placeholder="Your Name"
                            />
                        </div>

                        {/* Username */}
                        <div>
                            <label className="block text-sm font-medium text-foreground-secondary mb-2">Username</label>
                            <input
                                type="text"
                                value={username.startsWith('@') ? username : `@${username}`}
                                onChange={(e) => setUsername(e.target.value.replace(/^@/, '').replace(/[^a-zA-Z0-9_]/g, ''))}
                                className="w-full rounded-xl border border-border px-4 py-3 text-sm md:text-base outline-none focus:ring-2 focus:ring-sky-500 bg-card text-foreground"
                                placeholder="@username"
                            />
                        </div>

                        {/* Bio */}
                        <div>
                            <label className="block text-sm font-medium text-foreground-secondary mb-2">Bio</label>
                            <textarea
                                rows={4}
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="w-full rounded-xl border border-border px-4 py-3 text-sm md:text-base outline-none focus:ring-2 focus:ring-sky-500 bg-card text-foreground resize-none"
                                placeholder="Tell us about yourself..."
                            />
                        </div>

                        {/* Gender, Age, Language Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground-secondary mb-2">Gender</label>
                                <select
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                    className="w-full rounded-xl border border-border px-4 py-3 text-sm md:text-base outline-none focus:ring-2 focus:ring-sky-500 bg-card text-foreground"
                                >
                                    <option value="">Select</option>
                                    {GENDER_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground-secondary mb-2">Age</label>
                                <input
                                    type="number"
                                    value={age}
                                    onChange={(e) => setAge(e.target.value)}
                                    className="w-full rounded-xl border border-border px-4 py-3 text-sm md:text-base outline-none focus:ring-2 focus:ring-sky-500 bg-card text-foreground"
                                    placeholder="25"
                                    min="13"
                                    max="120"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground-secondary mb-2">Language</label>
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="w-full rounded-xl border border-border px-4 py-3 text-sm md:text-base outline-none focus:ring-2 focus:ring-sky-500 bg-card text-foreground"
                                >
                                    {LANGUAGE_OPTIONS.map(lang => (
                                        <option key={lang} value={lang}>{lang}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Favorite Genres */}
                        <div>
                            <label className="block text-sm font-medium text-foreground-secondary mb-1">Favorite Genres</label>
                            <p className="text-xs text-foreground-secondary mb-3">Select up to 3 favorite genres</p>
                            <div className="flex flex-wrap gap-2">
                                {GENRE_OPTIONS.map(genre => (
                                    <button
                                        key={genre}
                                        type="button"
                                        onClick={() => toggleGenre(genre)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${selectedGenres.includes(genre)
                                            ? 'bg-sky-500 border-sky-500 text-white'
                                            : 'bg-card border-border text-foreground-secondary hover:border-sky-300 dark:hover:border-sky-700'
                                            }`}
                                    >
                                        {selectedGenres.includes(genre) && <Check className="w-4 h-4 inline mr-1" />}
                                        {genre}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="text-sm text-red-500 text-center p-3 bg-red-50 dark:bg-red-900/30 rounded-xl">
                                {error}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
