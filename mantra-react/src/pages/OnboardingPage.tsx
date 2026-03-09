import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const GENRES = [
    'Fantasy', 'Sci-Fi', 'Romance', 'Thriller',
    'Mystery', 'Horror', 'Adventure', 'Slice of Life',
    'Historical', 'Action', 'Drama', 'Comedy'
];

const GENDER_OPTIONS = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Non-binary', value: 'other' },
    { label: 'Prefer not to say', value: 'prefer_not_to_say' },
];
const LANGUAGE_OPTIONS = ['English', 'Spanish', 'French', 'Hindi', 'Chinese', 'Japanese', 'Korean', 'German'];

export default function OnboardingPage() {
    const { user, profile, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        name: '',
        username: '',
        gender: '',
        age: '',
        language: 'English',
        bio: '' // Added bio field
    });

    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [profileFile, setProfileFile] = useState<File | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [usernameStatus, setUsernameStatus] = useState<'available' | 'taken' | 'checking' | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const maxGenres = 3; // Or strict 3? "Pick up to 3" usually means <= 3.

    // Prefill data on mount
    useEffect(() => {
        if (user) {
            // If we have a profile loaded in context, use it
            if (profile) {
                setForm({
                    name: profile.display_name || user.user_metadata?.full_name || '',
                    username: profile.username || '',
                    gender: profile.gender || '',
                    age: profile.age?.toString() || '',
                    language: profile.preferred_language || 'English',
                    bio: profile.bio || ''
                });
                if (profile.favorite_genres) {
                    setSelectedGenres(profile.favorite_genres);
                }
                if (profile.profile_picture_url) {
                    setProfileImage(profile.profile_picture_url);
                }
                setIsLoadingData(false);
            } else {
                // Determine username from email if not set
                const suggestedName = user.user_metadata?.full_name || '';
                const emailUsername = user.email?.split('@')[0] || '';

                setForm(prev => ({
                    ...prev,
                    name: suggestedName,
                    username: prev.username || emailUsername
                }));
                setIsLoadingData(false);
            }
        }
    }, [user, profile]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        // Input masking for Age (no negatives)
        if (name === 'age') {
            if (parseInt(value) < 0) return;
        }

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
            // Use maybeSingle() to avoid 406/400 errors if not found
            const { data, error } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', value)
                .neq('id', user?.id || '')
                .maybeSingle();

            if (error) {
                // Assume available on error to not block, but log it
                setUsernameStatus('available');
                return;
            }

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
            if (isNaN(age) || age < 13) {
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
            let profilePictureUrl = profileImage;

            // Upload profile image if provided (and it's a new file)
            if (profileFile) {
                const fileExt = profileFile.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}.${fileExt}`;

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
            // Use 'preferred_language' instead of 'language'
            const { error } = await supabase
                .from('profiles')
                .update({
                    display_name: form.name,
                    username: form.username,
                    gender: form.gender,
                    age: parseInt(form.age),
                    preferred_language: form.language, // UPDATED: Map to correct column
                    bio: form.bio, // ADDED
                    favorite_genres: selectedGenres,
                    profile_picture_url: profilePictureUrl,
                    onboarding_completed: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;

            // Force refresh profile in context immediately
            await refreshProfile();

            toast.success('Profile setup complete!');

            // Navigate to home page
            navigate('/', { replace: true });
        } catch (error: any) {
            setErrors(prev => ({
                ...prev,
                form: error.message || 'Failed to save profile. Please try again.'
            }));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

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

                        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                            {/* Photo Upload & Name/Username Row */}
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                                {/* Profile Photo */}
                                <div className="relative">
                                    {profileImage ? (
                                        <img
                                            src={profileImage}
                                            alt="Profile"
                                            className="h-32 w-32 rounded-full object-cover border-2 border-border shadow-sm"
                                        />
                                    ) : (
                                        <div className="h-32 w-32 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-border flex items-center justify-center">
                                            <ImageIcon className="w-12 h-12 text-slate-400" />
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute bottom-1 right-1 h-10 w-10 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-lg hover:bg-sky-600 transition-colors z-10"
                                    >
                                        <Camera className="w-5 h-5" />
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handlePhotoUpload}
                                    />
                                </div>

                                {/* Name & Username */}
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                    <div>
                                        <label className="block text-xs font-medium text-foreground-secondary mb-1.5">
                                            Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            name="name"
                                            value={form.name}
                                            onChange={handleInputChange}
                                            className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-sky-500 bg-card transition-shadow"
                                            placeholder="Your name"
                                        />
                                        {errors.name && (
                                            <div className="text-red-500 text-xs mt-1.5 font-medium">{errors.name}</div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-foreground-secondary mb-1.5">
                                            Username <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                name="username"
                                                value={form.username}
                                                onChange={handleUsernameChange} // Now uses ChangeEvent<HTMLInputElement>
                                                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-foreground outline-none focus:ring-2 bg-card transition-shadow ${errors.username ? 'border-red-300 focus:ring-red-200' :
                                                    usernameStatus === 'available' ? 'border-emerald-300 focus:ring-emerald-200' :
                                                        'border-border focus:ring-sky-500'
                                                    }`}
                                                placeholder="@username"
                                            />
                                            {usernameStatus === 'checking' && (
                                                <div className="absolute right-3 top-2.5">
                                                    <div className="h-4 w-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                        {errors.username && (
                                            <div className="text-red-500 text-xs mt-1.5 font-medium">{errors.username}</div>
                                        )}
                                        {usernameStatus === 'available' && !errors.username && (
                                            <div className="text-emerald-600 text-xs mt-1.5 font-medium">Username available</div>
                                        )}
                                        {usernameStatus === 'taken' && (
                                            <div className="text-red-500 text-xs mt-1.5 font-medium">Username already taken</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Bio Field (ADDED) */}
                            <div>
                                <label className="block text-xs font-medium text-foreground-secondary mb-1.5">
                                    Bio
                                </label>
                                <textarea
                                    name="bio"
                                    value={form.bio}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-sky-500 bg-card transition-shadow resize-none"
                                    placeholder="Tell us a little about yourself..."
                                />
                            </div>

                            {/* Gender, Age, Language Row */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-foreground-secondary mb-1.5">
                                        Gender <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="gender"
                                        value={form.gender}
                                        onChange={handleInputChange}
                                        className="w-full rounded-xl border border-border px-4 py-3 text-sm md:text-base outline-none focus:ring-2 focus:ring-sky-500 bg-card text-foreground"
                                    >
                                        <option value="" disabled>Select Gender</option>
                                        {GENDER_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    {errors.gender && (
                                        <div className="text-red-500 text-xs mt-1.5 font-medium">{errors.gender}</div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-foreground-secondary mb-1.5">
                                        Age <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        name="age"
                                        type="number"
                                        min="13"
                                        max="120"
                                        value={form.age}
                                        onChange={handleInputChange}
                                        className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-sky-500 bg-card"
                                        placeholder="18"
                                    />
                                    {errors.age && (
                                        <div className="text-red-500 text-xs mt-1.5 font-medium">{errors.age}</div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-foreground-secondary mb-1.5">
                                        Language <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="language"
                                        value={form.language}
                                        onChange={handleInputChange}
                                        className="w-full rounded-xl border border-border px-4 py-3 text-sm md:text-base outline-none focus:ring-2 focus:ring-sky-500 bg-card text-foreground"
                                    >
                                        <option value="" disabled>Select Language</option>
                                        {LANGUAGE_OPTIONS.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                    {errors.language && (
                                        <div className="text-red-500 text-xs mt-1.5 font-medium">{errors.language}</div>
                                    )}
                                </div>
                            </div>

                            {/* Favorite Genres */}
                            <div className="pt-2">
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-base font-semibold tracking-tight text-foreground">Favorite genres</h2>
                                    <div className="text-xs text-foreground-secondary font-medium">
                                        Select {selectedGenres.length}/3
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2.5">
                                    {GENRES.map(genre => (
                                        <button
                                            key={genre}
                                            type="button"
                                            onClick={() => toggleGenre(genre)}
                                            className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${selectedGenres.includes(genre)
                                                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                                                : 'bg-card border border-border text-foreground-secondary hover:border-sky-300 hover:text-foreground'
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
                                    <div className="text-red-500 text-xs mt-2 font-medium">{errors.genres}</div>
                                )}
                            </div>

                            {/* Form Error */}
                            {errors.form && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-medium text-center">
                                    {errors.form}
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full rounded-xl bg-sky-500 text-white text-sm font-semibold py-3 active:scale-95 shadow-lg shadow-sky-500/25 hover:bg-sky-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none mt-4"
                            >
                                {isSubmitting ? 'Creating Profile...' : 'Complete Setup'}
                            </button>
                        </form>
                    </div>
                </section>
            </div>
        </div>
    );
}
