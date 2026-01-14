/**
 * E2E Test - Critical User Flows
 * Tests for the most important user journeys
 */

describe('Critical User Flows', () => {
    beforeAll(async () => {
        await device.launchApp();
    });

    beforeEach(async () => {
        await device.reloadReactNative();
    });

    describe('Home Screen', () => {
        it('should display home screen after splash', async () => {
            await expect(element(by.id('home-screen'))).toBeVisible();
        });

        it('should display novel sections', async () => {
            await expect(element(by.id('section-trending'))).toBeVisible();
            await expect(element(by.id('section-popular'))).toBeVisible();
        });

        it('should navigate to novel detail when clicking a novel', async () => {
            await element(by.id('novel-card-0')).tap();
            await expect(element(by.id('novel-detail-screen'))).toBeVisible();
        });
    });

    describe('Novel Detail', () => {
        beforeEach(async () => {
            await element(by.id('novel-card-0')).tap();
        });

        it('should display novel information', async () => {
            await expect(element(by.id('novel-title'))).toBeVisible();
            await expect(element(by.id('novel-author'))).toBeVisible();
            await expect(element(by.id('novel-description'))).toBeVisible();
        });

        it('should switch between tabs', async () => {
            await element(by.id('tab-chapters')).tap();
            await expect(element(by.id('chapters-list'))).toBeVisible();

            await element(by.id('tab-about')).tap();
            await expect(element(by.id('about-section'))).toBeVisible();
        });

        it('should navigate to chapter when clicking read button', async () => {
            await element(by.id('read-button')).tap();
            await expect(element(by.id('chapter-screen'))).toBeVisible();
        });
    });

    describe('Chapter Reading', () => {
        beforeEach(async () => {
            await element(by.id('novel-card-0')).tap();
            await element(by.id('read-button')).tap();
        });

        it('should display chapter content', async () => {
            await expect(element(by.id('chapter-content'))).toBeVisible();
        });

        it('should navigate to next chapter', async () => {
            await element(by.id('next-chapter-button')).tap();
            // Should show next chapter or unlock prompt
        });
    });

    describe('Search', () => {
        it('should navigate to search screen', async () => {
            await element(by.id('search-button')).tap();
            await expect(element(by.id('search-screen'))).toBeVisible();
        });

        it('should show results when searching', async () => {
            await element(by.id('search-button')).tap();
            await element(by.id('search-input')).typeText('fantasy');
            await element(by.id('search-submit')).tap();
            await expect(element(by.id('search-results'))).toBeVisible();
        });
    });

    describe('Authentication', () => {
        it('should show login screen when accessing library while logged out', async () => {
            await element(by.id('tab-library')).tap();
            // Should redirect to login or show login prompt
        });

        it('should allow login with valid credentials', async () => {
            await element(by.id('tab-profile')).tap();
            await element(by.id('login-button')).tap();
            await element(by.id('email-input')).typeText('test@example.com');
            await element(by.id('password-input')).typeText('password123');
            await element(by.id('submit-login')).tap();
            // Should show logged in state or error
        });
    });

    describe('Offline Support', () => {
        it('should show offline banner when disconnected', async () => {
            await device.setURLBlacklist(['.*']);
            await expect(element(by.id('offline-banner'))).toBeVisible();
            await device.setURLBlacklist([]);
        });
    });

    describe('Navigation', () => {
        it('should navigate between all tabs', async () => {
            await element(by.id('tab-home')).tap();
            await expect(element(by.id('home-screen'))).toBeVisible();

            await element(by.id('tab-ranking')).tap();
            await expect(element(by.id('ranking-screen'))).toBeVisible();

            await element(by.id('tab-library')).tap();
            // Library screen or login

            await element(by.id('tab-profile')).tap();
            // Profile screen or login
        });
    });
});
