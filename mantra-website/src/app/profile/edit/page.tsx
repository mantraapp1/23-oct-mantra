'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getProfilePicture } from '@/lib/defaultImages';
import { Dropdown } from '@/components/ui/Dropdown';

const GENRES = ['Fantasy', 'Romance', 'Sci-Fi', 'Mystery', 'Thriller', 'Adventure', 'Horror', 'Comedy', 'Drama', 'Action', 'Slice of Life', 'Historical'];
const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 'Portuguese', 'Hindi', 'Other'];
const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];

export default function EditProfilePage() {
    const router = useRouter();
    const supabase = createClient();

    const [displayName, setDisplayName] = useState('');
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [gender, setGender] = useState('Prefer not to say');
    const [preferredLanguage, setPreferredLanguage] = useState('English');
    const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('username, display_name, bio, gender, preferred_language, favorite_genres, avatar_url')
            .eq('id', user.id)
            .single();

        if (profile) {
            setUsername(profile.username || '');
            setDisplayName(profile.display_name || '');
            setBio(profile.bio || '');
            setGender(profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1).replace(/_/g, ' ') : 'Prefer not to say');
            setPreferredLanguage(profile.preferred_language || 'English');
            setFavoriteGenres(profile.favorite_genres || []);
            setAvatarUrl(profile.avatar_url || null);
        }
        setIsLoading(false);
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleGenreToggle = (genre: string) => {
        if (favoriteGenres.includes(genre)) {
            setFavoriteGenres(favoriteGenres.filter(g => g !== genre));
        } else if (favoriteGenres.length < 5) {
            setFavoriteGenres([...favoriteGenres, genre]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (!username.trim()) {
            setError('Username is required');
            return;
        }

        setIsSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Upload avatar if changed
            let newAvatarUrl = avatarUrl;
            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `${user.id}/avatar.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(fileName, avatarFile, { upsert: true });

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(fileName);
                    newAvatarUrl = publicUrl;
                }
            }

            // Convert gender to database format
            const genderValue = gender.toLowerCase().replace(/ /g, '_');

            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    username: username.trim(),
                    display_name: displayName.trim() || null,
                    bio: bio.trim() || null,
                    gender: genderValue,
                    preferred_language: preferredLanguage,
                    favorite_genres: favoriteGenres,
                    avatar_url: newAvatarUrl,
                })
                .eq('id', user.id);

            if (updateError) throw updateError;

            setSuccess(true);
            setTimeout(() => router.push('/profile'), 1500);
        } catch (err: any) {
            setError(err.message || 'Failed to update profile');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Use getProfilePicture for consistent avatar display
    const currentDisplayName = displayName || username || 'User';
    const currentAvatarUrl = avatarPreview || getProfilePicture(avatarUrl, currentDisplayName);

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-lg mx-auto px-4 py-6 sm:py-8 font-inter text-slate-800">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <Link href="/profile" className="p-2 -ml-2 rounded-lg hover:bg-white transition-colors">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
                    </Link>
                    <h1 className="text-xl font-bold text-slate-900">Edit Profile</h1>
                </div>

                {/* Profile Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
                                Profile updated! Redirecting...
                            </div>
                        )}

                        {/* Profile Image */}
                        <div className="flex flex-col items-center mb-6">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-lg">
                                    <img src={currentAvatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                </div>
                                <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-sky-600 transition-colors">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">Tap to change photo</p>
                        </div>

                        {/* Display Name */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Display Name</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Your display name"
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                maxLength={50}
                            />
                        </div>

                        {/* Username */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username *</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="@username"
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                maxLength={30}
                            />
                        </div>

                        {/* Bio */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Bio</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="Tell us about yourself..."
                                rows={3}
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                                maxLength={250}
                            />
                            <p className="text-xs text-slate-400 mt-1 text-right">{bio.length}/250</p>
                        </div>

                        {/* Gender & Language Row */}
                        <div className="grid grid-cols-2 gap-3">
                            <Dropdown
                                label="Gender"
                                options={GENDERS}
                                value={gender}
                                onChange={setGender}
                                fullWidth
                            />
                            <Dropdown
                                label="Language"
                                options={LANGUAGES}
                                value={preferredLanguage}
                                onChange={setPreferredLanguage}
                                fullWidth
                            />
                        </div>

                        {/* Favorite Genres */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-semibold text-slate-700">Favorite Genres</label>
                                <span className="text-xs text-slate-500">{favoriteGenres.length}/5</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {GENRES.map(genre => (
                                    <button
                                        key={genre}
                                        type="button"
                                        onClick={() => handleGenreToggle(genre)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${favoriteGenres.includes(genre)
                                                ? 'bg-sky-500 text-white'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        {genre}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 bg-sky-500 text-white rounded-xl font-semibold text-sm hover:bg-sky-600 transition-colors disabled:opacity-50 shadow-sm"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
