
export const genreColorOverrides: Record<string, string> = {
    romance: '#E11D48',
    action: '#EA580C',
    fantasy: '#7C3AED',
    mystery: '#4C1D95',
    horror: '#9F1239',
    adventure: '#0EA5E9',
    comedy: '#F97316',
    drama: '#DB2777',
    sci_fi: '#6366F1',
    tragedy: '#B91C1C',
    thriller: '#9333EA',
    romance_comedy: '#EC4899',
    slice_of_life: '#F59E0B',
    historical: '#D97706',
    martial_arts: '#2563EB',
    system: '#A855F7',
};

export const normalizeGenreKey = (genre: string) => genre.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

const generateSolidColor = (genre: string, attempt: number = 0) => {
    let hash = 0;
    for (let i = 0; i < genre.length; i++) {
        hash = (hash << 5) - hash + genre.charCodeAt(i);
        hash |= 0;
    }

    let hue = (Math.abs(hash) + attempt * 47) % 360;

    const isGreenHue = (value: number) => value >= 80 && value <= 150;
    let guard = 0;
    while (isGreenHue(hue) && guard < 12) {
        hue = (hue + 137) % 360;
        guard += 1;
    }

    const saturation = 74;
    const lightness = 44;

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

export const getGenreBadgeColor = (genre: string, usedColors?: Set<string>): string => {
    const normalized = normalizeGenreKey(genre);
    let color = genreColorOverrides[normalized];

    if (!color) {
        let attempt = 0;
        // If usedColors is provided, we try to be unique. If not, we just generate deterministically.
        const mockSet = new Set<string>();
        const set = usedColors || mockSet;

        do {
            color = generateSolidColor(genre, attempt);
            attempt += 1;
        } while (set.has(color) && attempt < 12);
    }

    if (usedColors && color && usedColors.has(color)) {
        let attempt = 0;
        let fallback = color;
        while (usedColors.has(fallback) && attempt < 12) {
            fallback = generateSolidColor(`${genre}-${attempt}`, attempt + 5);
            attempt += 1;
        }
        color = fallback;
    }

    if (usedColors) {
        usedColors.add(color);
    }
    return color;
};
