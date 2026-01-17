'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Dropdown } from '@/components/ui/Dropdown';

const GENRES = ['Fantasy', 'Sci-Fi', 'Romance', 'Thriller', 'Mystery', 'Horror', 'Adventure', 'Slice of Life'];
const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const LANGUAGES = ['All', 'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 'Portuguese', 'Hindi'];

export default function OnboardingPage() {
    const router = useRouter();
    const supabase = createClient();

    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [gender, setGender] = useState('');
    const [age, setAge] = useState('');
    const [language, setLanguage] = useState('All');
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const toggleGenre = (genre: string) => {
        if (selectedGenres.includes(genre)) {
            setSelectedGenres(selectedGenres.filter(g => g !== genre));
        } else if (selectedGenres.length < 3) {
            setSelectedGenres([...selectedGenres, genre]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};

        if (!name.trim()) newErrors.name = 'Name is required';
        if (!username.trim()) newErrors.username = 'Username is required';
        else if (username.length < 3) newErrors.username = 'Username must be at least 3 characters';
        if (!gender) newErrors.gender = 'Gender is required';
        if (!age) newErrors.age = 'Age is required';
        else if (parseInt(age) < 13) newErrors.age = 'You must be at least 13 years old';
        if (!language) newErrors.language = 'Language is required';
        if (selectedGenres.length === 0) newErrors.genres = 'Please select at least one genre';

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        setIsSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            await supabase
                .from('profiles')
                .update({
                    display_name: name.trim(),
                    username: username.trim(),
                    bio: bio.trim() || null,
                    age: parseInt(age),
                    gender: gender.toLowerCase().replace(/ /g, '_'),
                    preferred_language: language,
                    favorite_genres: selectedGenres,
                    onboarding_completed: true,
                })
                .eq('id', user.id);

            router.push('/');
        } catch (error) {
            console.error('Error updating profile:', error);
            router.push('/');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12 font-inter">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-semibold text-slate-900">Set up your profile</h1>
                    <p className="text-sm text-slate-500 mt-1">Tell us a bit about you</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Profile Photo + Name/Username Row */}
                    <div className="flex items-start gap-4">
                        {/* Photo */}
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-sky-500 rounded-full flex items-center justify-center shadow-sm">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                            </div>
                        </div>

                        {/* Name & Username */}
                        <div className="flex-1 flex gap-3">
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-slate-500 mb-1">Name <span className="text-slate-400">*</span></label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your name"
                                    className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${errors.name ? 'border-rose-500' : 'border-slate-200'}`}
                                />
                                {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-slate-500 mb-1">Username <span className="text-slate-400">*</span></label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="@username"
                                    className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${errors.username ? 'border-rose-500' : 'border-slate-200'}`}
                                />
                                {errors.username && <p className="text-xs text-rose-500 mt-1">{errors.username}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Bio</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell us a little about yourself..."
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                        />
                    </div>

                    {/* Gender, Age, Language Row */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <Dropdown
                                label="Gender *"
                                options={GENDERS}
                                value={gender || 'Select'}
                                onChange={setGender}
                                fullWidth
                            />
                            {errors.gender && <p className="text-xs text-rose-500 mt-1">{errors.gender}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Age <span className="text-slate-400">*</span></label>
                            <input
                                type="number"
                                value={age}
                                onChange={(e) => setAge(e.target.value)}
                                placeholder="18"
                                className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${errors.age ? 'border-rose-500' : 'border-slate-200'}`}
                            />
                            {errors.age && <p className="text-xs text-rose-500 mt-1">{errors.age}</p>}
                        </div>
                        <div>
                            <Dropdown
                                label="Language *"
                                options={LANGUAGES}
                                value={language}
                                onChange={setLanguage}
                                fullWidth
                            />
                            {errors.language && <p className="text-xs text-rose-500 mt-1">{errors.language}</p>}
                        </div>
                    </div>

                    {/* Favorite Genres */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-base font-semibold text-slate-900">Favorite genres</span>
                            <span className="text-xs text-slate-500">Pick up to {selectedGenres.length}/3</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {GENRES.map(genre => (
                                <button
                                    key={genre}
                                    type="button"
                                    onClick={() => toggleGenre(genre)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedGenres.includes(genre)
                                            ? 'bg-sky-500 text-white border-sky-500'
                                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    {genre}
                                </button>
                            ))}
                        </div>
                        {errors.genres && <p className="text-xs text-rose-500 mt-2">{errors.genres}</p>}
                    </div>

                    {/* Continue Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-2.5 bg-sky-500 text-white rounded-xl font-semibold text-sm hover:bg-sky-600 transition-colors disabled:opacity-50 shadow-sm"
                    >
                        {isSubmitting ? 'Setting up...' : 'Continue'}
                    </button>
                </form>
            </div>
        </div>
    );
}
