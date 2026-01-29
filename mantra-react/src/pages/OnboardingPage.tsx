import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

const GENRES = [
    'Fantasy', 'Sci-Fi', 'Romance', 'Thriller',
    'Mystery', 'Horror', 'Adventure', 'Slice of Life'
];

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const LANGUAGE_OPTIONS = ['English', 'Spanish', 'French', 'Hindi', 'Chinese'];

export default function OnboardingPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        name: '',
        username: '',
        gender: '',
        age: '',
        language: 'English'
    });

    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [profileFile, setProfileFile] = useState<File | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [usernameStatus, setUsernameStatus] = useState<'available' | 'taken' | 'checking' | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const maxGenres = 3;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));

        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleUsernameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
        setForm(prev => ({ ...prev, username: value }));

        if (errors.username) {
            setErrors(prev => ({ ...prev, username: '' }));
        }

        if (!value || value.length < 3) {
            setUsernameStatus(null);
            return;
        }

        // Check username format
        if (!/^[a-z0-9_]+$/.test(value)) {
            setUsernameStatus(null);
            return;
        }

        setUsernameStatus('checking');

        // Debounce the check
        const timeout = setTimeout(async () => {
            const { data } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', value)
                .neq('id', user?.id || '')
                .single();

            setUsernameStatus(data ? 'taken' : 'available');
        }, 500);

        return () => clearTimeout(timeout);
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB');
            return;
        }

        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            setProfileImage(ev.target?.result as string);
            setProfileFile(file);
        };
        reader.readAsDataURL(file);
    };

    const toggleGenre = (genre: string) => {
        if (selectedGenres.includes(genre)) {
            setSelectedGenres(prev => prev.filter(g => g !== genre));
        } else if (selectedGenres.length < maxGenres) {
            setSelectedGenres(prev => [...prev, genre]);
        }

        if (errors.genres) {
            setErrors(prev => ({ ...prev, genres: '' }));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!form.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!form.username.trim()) {
            newErrors.username = 'Username is required';
        } else if (form.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        } else if (usernameStatus === 'taken') {
            newErrors.username = 'Username already taken';
        }

        if (!form.gender) {
            newErrors.gender = 'Gender is required';
        }

        if (!form.age) {
            newErrors.age = 'Age is required';
        } else {
            const age = parseInt(form.age);
            if (age < 13) {
                newErrors.age = 'You must be at least 13 years old';
            } else if (age > 120) {
                newErrors.age = 'Please enter a valid age';
            }
        }

        if (!form.language) {
            newErrors.language = 'Language is required';
        }

        if (selectedGenres.length === 0) {
            newErrors.genres = 'Please select at least one genre';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm() || !user) return;

        setIsSubmitting(true);

        try {
            let profilePictureUrl = null;

            // Upload profile image if provided
            if (profileFile) {
                const fileExt = profileFile.name.split('.').pop();
                const fileName = `${user.id}/profile.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('profile-pictures')
                    .upload(fileName, profileFile, { upsert: true });

                if (!uploadError) {
                    const { data: urlData } = supabase.storage
                        .from('profile-pictures')
                        .getPublicUrl(fileName);

                    profilePictureUrl = urlData.publicUrl;
                }
            }

            // Update profile
            const { error } = await supabase
                .from('profiles')
                .update({
                    display_name: form.name,
                    username: form.username,
                    gender: form.gender,
                    age: parseInt(form.age),
                    language: form.language,
                    favorite_genres: selectedGenres,
                    profile_picture_url: profilePictureUrl,
                    onboarding_completed: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;

            // Navigate to home page
            navigate('/', { replace: true });
        } catch (error) {
            console.error('Error saving profile:', error);
            setErrors(prev => ({ ...prev, form: 'Failed to save profile. Please try again.' }));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background font-inter">
            <div className="max-w-md md:max-w-2xl mx-auto">
                <section className="min-h-screen">
                    <div className="px-5 md:px-8 pt-14 pb-24">
                        {/* Header */}
                        <div className="mb-6">
                            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Set up your profile</h1>
                            <p className="text-foreground-secondary text-sm mt-1">Tell us a bit about you</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                            {/* Photo Upload & Name/Username Row */}
                            <div className="flex items-center gap-4">
                                {/* Profile Photo */}
                                <div className="relative">
                                    {profileImage ? (
                                        <img
                                            src={profileImage}
                                            alt="Profile"
                                            className="h-16 w-16 rounded-full object-cover border border-slate-200"
                                        />
                                    ) : (
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="h-16 w-16 rounded-full bg-background-secondary border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-sky-500 hover:bg-sky-500/10 transition-colors"
                                        >
                                            <ImageIcon className="w-6 h-6 text-foreground-secondary" />
                                            <span className="text-xs text-foreground-secondary mt-1">Upload</span>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handlePhotoUpload}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-sky-500 text-white flex items-center justify-center shadow"
                                    >
                                        <Camera className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Name & Username */}
                                <div className="flex-1 grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-foreground-secondary mb-1">
                                            Name <span className="text-foreground-secondary">*</span>
                                        </label>
                                        <input
                                            name="name"
                                            value={form.name}
                                            onChange={handleInputChange}
                                            className="w-full rounded-xl border border-border px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-sky-500 bg-card"
                                            placeholder="Your name"
                                        />
                                        {errors.name && (
                                            <div className="text-red-500 text-xs mt-1">{errors.name}</div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs text-foreground-secondary mb-1">
                                            Username <span className="text-foreground-secondary">*</span>
                                        </label>
                                        <input
                                            name="username"
                                            value={form.username}
                                            onChange={handleUsernameChange}
                                            className="w-full rounded-xl border border-border px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-sky-500 bg-card"
                                            placeholder="@username"
                                        />
                                        {errors.username && (
                                            <div className="text-red-500 text-xs mt-1">{errors.username}</div>
                                        )}
                                        {usernameStatus === 'available' && !errors.username && (
                                            <div className="text-emerald-500 text-xs mt-1">Username available ✓</div>
                                        )}
                                        {usernameStatus === 'checking' && (
                                            <div className="text-slate-400 text-xs mt-1">Checking...</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Gender, Age, Language Row */}
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs text-foreground-secondary mb-1">
                                        Gender <span className="text-foreground-secondary">*</span>
                                    </label>
                                    <select
                                        name="gender"
                                        value={form.gender}
                                        onChange={handleInputChange}
                                        className="w-full rounded-xl border border-border px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-sky-500 bg-card"
                                    >
                                        <option value="">Select</option>
                                        {GENDER_OPTIONS.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                    {errors.gender && (
                                        <div className="text-red-500 text-xs mt-1">{errors.gender}</div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs text-foreground-secondary mb-1">
                                        Age <span className="text-foreground-secondary">*</span>
                                    </label>
                                    <input
                                        name="age"
                                        type="number"
                                        value={form.age}
                                        onChange={handleInputChange}
                                        className="w-full rounded-xl border border-border px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-sky-500 bg-card"
                                        placeholder="18"
                                    />
                                    {errors.age && (
                                        <div className="text-red-500 text-xs mt-1">{errors.age}</div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs text-foreground-secondary mb-1">
                                        Language <span className="text-foreground-secondary">*</span>
                                    </label>
                                    <select
                                        name="language"
                                        value={form.language}
                                        onChange={handleInputChange}
                                        className="w-full rounded-xl border border-border px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-sky-500 bg-card"
                                    >
                                        <option value="">Select</option>
                                        {LANGUAGE_OPTIONS.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                    {errors.language && (
                                        <div className="text-red-500 text-xs mt-1">{errors.language}</div>
                                    )}
                                </div>
                            </div>

                            {/* Favorite Genres */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-base font-semibold tracking-tight text-foreground">Favorite genres</h2>
                                    <div className="text-xs text-foreground-secondary">
                                        Pick up to <span>{selectedGenres.length}</span>/3
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {GENRES.map(genre => (
                                        <button
                                            key={genre}
                                            type="button"
                                            onClick={() => toggleGenre(genre)}
                                            className={`px-3 py-1.5 rounded-full border text-xs transition-all ${selectedGenres.includes(genre)
                                                ? 'bg-sky-500 text-white border-sky-500'
                                                : 'border-border text-foreground-secondary hover:border-sky-300 dark:hover:border-sky-600'
                                                } ${selectedGenres.length >= maxGenres && !selectedGenres.includes(genre)
                                                    ? 'opacity-50 cursor-not-allowed'
                                                    : ''
                                                }`}
                                            disabled={selectedGenres.length >= maxGenres && !selectedGenres.includes(genre)}
                                        >
                                            {genre}
                                        </button>
                                    ))}
                                </div>
                                {errors.genres && (
                                    <div className="text-red-500 text-xs mt-2">{errors.genres}</div>
                                )}
                            </div>

                            {/* Form Error */}
                            {errors.form && (
                                <div className="text-red-500 text-xs text-center">{errors.form}</div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full rounded-xl bg-sky-500 text-white text-sm font-semibold py-2.5 active:scale-95 shadow-sm hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Saving...' : 'Continue'}
                            </button>
                        </form>
                    </div>
                </section>
            </div>
        </div>
    );
}
