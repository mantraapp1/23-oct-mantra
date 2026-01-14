/**
 * Date Utilities Tests
 * Tests for centralized date and number formatting functions
 */

import { formatTimeAgo, formatNumber, parseFormattedNumber, formatDate, formatDuration } from '../utils/dateUtils';

describe('formatTimeAgo', () => {
    // Helper to create dates relative to now
    const getDateMinsAgo = (mins: number) => new Date(Date.now() - mins * 60000).toISOString();
    const getDateHoursAgo = (hours: number) => new Date(Date.now() - hours * 3600000).toISOString();
    const getDateDaysAgo = (days: number) => new Date(Date.now() - days * 86400000).toISOString();

    test('should return "Just now" for dates less than 1 minute ago', () => {
        const now = new Date().toISOString();
        expect(formatTimeAgo(now)).toBe('Just now');
    });

    test('should return minutes for dates less than 1 hour ago', () => {
        expect(formatTimeAgo(getDateMinsAgo(5))).toBe('5m ago');
        expect(formatTimeAgo(getDateMinsAgo(30))).toBe('30m ago');
        expect(formatTimeAgo(getDateMinsAgo(59))).toBe('59m ago');
    });

    test('should return hours for dates less than 24 hours ago', () => {
        expect(formatTimeAgo(getDateHoursAgo(1))).toBe('1h ago');
        expect(formatTimeAgo(getDateHoursAgo(12))).toBe('12h ago');
        expect(formatTimeAgo(getDateHoursAgo(23))).toBe('23h ago');
    });

    test('should return days for dates less than 7 days ago', () => {
        expect(formatTimeAgo(getDateDaysAgo(1))).toBe('1d ago');
        expect(formatTimeAgo(getDateDaysAgo(3))).toBe('3d ago');
        expect(formatTimeAgo(getDateDaysAgo(6))).toBe('6d ago');
    });

    test('should return weeks for dates less than 4 weeks ago', () => {
        expect(formatTimeAgo(getDateDaysAgo(7))).toBe('1w ago');
        expect(formatTimeAgo(getDateDaysAgo(14))).toBe('2w ago');
        expect(formatTimeAgo(getDateDaysAgo(21))).toBe('3w ago');
    });

    test('should return months for dates less than 12 months ago', () => {
        expect(formatTimeAgo(getDateDaysAgo(30))).toBe('1mo ago');
        expect(formatTimeAgo(getDateDaysAgo(90))).toBe('3mo ago');
        expect(formatTimeAgo(getDateDaysAgo(180))).toBe('6mo ago');
    });

    test('should return years for dates 12+ months ago', () => {
        expect(formatTimeAgo(getDateDaysAgo(365))).toBe('1y ago');
        expect(formatTimeAgo(getDateDaysAgo(730))).toBe('2y ago');
    });

    test('should handle invalid dates gracefully', () => {
        expect(formatTimeAgo('')).toBe('Unknown');
        expect(formatTimeAgo('invalid-date')).toBe('Unknown');
    });

    test('should handle future dates gracefully', () => {
        const futureDate = new Date(Date.now() + 60000).toISOString();
        expect(formatTimeAgo(futureDate)).toBe('Just now');
    });
});

describe('formatNumber', () => {
    test('should return number as-is for values under 1000', () => {
        expect(formatNumber(0)).toBe('0');
        expect(formatNumber(1)).toBe('1');
        expect(formatNumber(999)).toBe('999');
    });

    test('should format thousands with k suffix', () => {
        expect(formatNumber(1000)).toBe('1.0k');
        expect(formatNumber(1234)).toBe('1.2k');
        expect(formatNumber(12345)).toBe('12.3k');
        expect(formatNumber(999999)).toBe('1000.0k');
    });

    test('should format millions with M suffix', () => {
        expect(formatNumber(1000000)).toBe('1.0M');
        expect(formatNumber(1234567)).toBe('1.2M');
        expect(formatNumber(12345678)).toBe('12.3M');
    });

    test('should format billions with B suffix', () => {
        expect(formatNumber(1000000000)).toBe('1.0B');
        expect(formatNumber(1234567890)).toBe('1.2B');
    });

    test('should handle invalid numbers gracefully', () => {
        expect(formatNumber(NaN)).toBe('0');
        expect(formatNumber(-1)).toBe('0');
    });
});

describe('parseFormattedNumber', () => {
    test('should parse regular numbers', () => {
        expect(parseFormattedNumber('123')).toBe(123);
        expect(parseFormattedNumber('999')).toBe(999);
    });

    test('should parse k suffix', () => {
        expect(parseFormattedNumber('1.2k')).toBe(1200);
        expect(parseFormattedNumber('10k')).toBe(10000);
        expect(parseFormattedNumber('1.5K')).toBe(1500);
    });

    test('should parse M suffix', () => {
        expect(parseFormattedNumber('1.5M')).toBe(1500000);
        expect(parseFormattedNumber('10m')).toBe(10000000);
    });

    test('should parse B suffix', () => {
        expect(parseFormattedNumber('1.2B')).toBe(1200000000);
        expect(parseFormattedNumber('2b')).toBe(2000000000);
    });

    test('should handle invalid input gracefully', () => {
        expect(parseFormattedNumber('')).toBe(0);
        expect(parseFormattedNumber('invalid')).toBe(0);
    });
});

describe('formatDate', () => {
    const testDate = '2024-06-15T10:30:00Z';

    test('should format short dates correctly', () => {
        const result = formatDate(testDate, 'short');
        expect(result).toContain('Jun');
        expect(result).toContain('15');
    });

    test('should format long dates correctly', () => {
        const result = formatDate(testDate, 'long');
        expect(result).toContain('June');
        expect(result).toContain('2024');
    });

    test('should format full dates correctly', () => {
        const result = formatDate(testDate, 'full');
        expect(result).toContain('June');
        expect(result).toContain('2024');
    });

    test('should handle invalid dates gracefully', () => {
        expect(formatDate('')).toBe('Unknown');
        expect(formatDate('invalid-date')).toBe('Unknown');
    });
});

describe('formatDuration', () => {
    test('should return "Completed" for zero or negative duration', () => {
        expect(formatDuration(0)).toBe('Completed');
        expect(formatDuration(-1000)).toBe('Completed');
    });

    test('should format seconds correctly', () => {
        expect(formatDuration(5000)).toBe('5s');
        expect(formatDuration(45000)).toBe('45s');
    });

    test('should format minutes and seconds correctly', () => {
        expect(formatDuration(65000)).toBe('1m 5s');
        expect(formatDuration(3599000)).toBe('59m 59s');
    });

    test('should format hours and minutes correctly', () => {
        expect(formatDuration(3600000)).toBe('1h 0m');
        expect(formatDuration(5400000)).toBe('1h 30m');
    });
});
