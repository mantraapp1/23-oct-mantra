import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import AuthGuard from './components/auth/AuthGuard';
import './App.css';

// ============================================
// Lazy loaded pages for code splitting
// Critical pages (HomePage) loaded immediately
// Less frequently used pages loaded on demand
// ============================================

// Primary pages - loaded on first navigation
const HomePage = lazy(() => import('./pages/HomePage'));
const NovelPage = lazy(() => import('./pages/NovelPage'));
const ChapterPage = lazy(() => import('./pages/ChapterPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));

// Auth pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const EmailVerificationPage = lazy(() => import('./pages/EmailVerificationPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const UpdatePasswordPage = lazy(() => import('./pages/UpdatePasswordPage'));

// User pages - loaded on demand
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const RankingPage = lazy(() => import('./pages/RankingPage'));
const LibraryPage = lazy(() => import('./pages/LibraryPage'));
const UserPublicProfilePage = lazy(() => import('./pages/UserPublicProfilePage'));
const FollowersListPage = lazy(() => import('./pages/FollowersListPage'));
const FollowingListPage = lazy(() => import('./pages/FollowingListPage'));
const AuthorDashboardPage = lazy(() => import('./pages/AuthorDashboardPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AccountSettingsPage = lazy(() => import('./pages/AccountSettingsPage'));
const EditProfilePage = lazy(() => import('./pages/EditProfilePage'));
const FaqPage = lazy(() => import('./pages/FaqPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const ReportPage = lazy(() => import('./pages/ReportPage'));

// Wallet pages - loaded on demand
const WalletPage = lazy(() => import('./pages/WalletPage'));
const WalletHistoryPage = lazy(() => import('./pages/WalletHistoryPage'));
const WalletWithdrawPage = lazy(() => import('./pages/WalletWithdrawPage'));


// Authoring pages
const CreateNovelPage = lazy(() => import('./pages/CreateNovelPage'));
const EditNovelPage = lazy(() => import('./pages/EditNovelPage'));
const NovelManagePage = lazy(() => import('./pages/NovelManagePage'));
const CreateChapterPage = lazy(() => import('./pages/CreateChapterPage'));
const EditChapterPage = lazy(() => import('./pages/EditChapterPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const SeeAllPage = lazy(() => import('./pages/SeeAllPage'));

// Legal & Policy pages
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const CookiePolicyPage = lazy(() => import('./pages/CookiePolicyPage'));
const ContentPolicyPage = lazy(() => import('./pages/ContentPolicyPage'));
const DMCAPage = lazy(() => import('./pages/DMCAPage'));
const CreatorMonetizationPage = lazy(() => import('./pages/CreatorMonetizationPage'));
const RefundPolicyPage = lazy(() => import('./pages/RefundPolicyPage'));
const ModerationPolicyPage = lazy(() => import('./pages/ModerationPolicyPage'));
const ChildSafetyPage = lazy(() => import('./pages/ChildSafetyPage'));
const GrievanceRedressalPage = lazy(() => import('./pages/GrievanceRedressalPage'));
const RiskDisclosurePage = lazy(() => import('./pages/RiskDisclosurePage'));
const AcceptableUsePage = lazy(() => import('./pages/AcceptableUsePage'));
const DataRetentionPage = lazy(() => import('./pages/DataRetentionPage'));

// 404 Page
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// ============================================
// Route Loading Fallback
// ============================================
function RouteLoadingFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ============================================
// App Component with Lazy Routes
// ============================================
function App() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/novel/:id" element={<NovelPage />} />
          <Route path="/novel/:novelId/chapter/:chapterId" element={<ChapterPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/profile" element={<AuthGuard><ProfilePage /></AuthGuard>} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/library" element={<AuthGuard><LibraryPage /></AuthGuard>} />
          <Route path="/dashboard" element={<AuthGuard><AuthorDashboardPage /></AuthGuard>} />
          <Route path="/notifications" element={<AuthGuard><NotificationsPage /></AuthGuard>} />
          <Route path="/settings" element={<AuthGuard><SettingsPage /></AuthGuard>} />
          <Route path="/settings/account" element={<AuthGuard><AccountSettingsPage /></AuthGuard>} />
          <Route path="/profile/edit" element={<AuthGuard><EditProfilePage /></AuthGuard>} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/report" element={<AuthGuard><ReportPage /></AuthGuard>} />
          <Route path="/user/:id" element={<UserPublicProfilePage />} />
          <Route path="/user/:id/followers" element={<FollowersListPage />} />
          <Route path="/user/:id/following" element={<FollowingListPage />} />
          <Route path="/wallet" element={<AuthGuard><WalletPage /></AuthGuard>} />
          <Route path="/wallet/history" element={<AuthGuard><WalletHistoryPage /></AuthGuard>} />
          <Route path="/wallet/withdraw" element={<AuthGuard><WalletWithdrawPage /></AuthGuard>} />


          {/* Authoring Routes */}
          <Route path="/novel/create" element={<AuthGuard><CreateNovelPage /></AuthGuard>} />
          <Route path="/novel/edit/:id" element={<AuthGuard><EditNovelPage /></AuthGuard>} />
          <Route path="/novel/manage/:id" element={<AuthGuard><NovelManagePage /></AuthGuard>} />
          <Route path="/novel/:novelId/create-chapter" element={<AuthGuard><CreateChapterPage /></AuthGuard>} />
          <Route path="/novel/:novelId/chapter/:chapterId/edit" element={<AuthGuard><EditChapterPage /></AuthGuard>} />
          <Route path="/onboarding" element={<OnboardingPage />} />

          {/* Discovery Routes */}
          <Route path="/see-all/:type" element={<SeeAllPage />} />

          {/* Legal & Policy Routes */}
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/cookies" element={<CookiePolicyPage />} />
          <Route path="/content-policy" element={<ContentPolicyPage />} />
          <Route path="/dmca" element={<DMCAPage />} />
          <Route path="/creator-monetization" element={<CreatorMonetizationPage />} />
          <Route path="/refund-policy" element={<RefundPolicyPage />} />
          <Route path="/moderation-policy" element={<ModerationPolicyPage />} />
          <Route path="/child-safety" element={<ChildSafetyPage />} />
          <Route path="/grievance-redressal" element={<GrievanceRedressalPage />} />
          <Route path="/risk-disclosure" element={<RiskDisclosurePage />} />
          <Route path="/acceptable-use" element={<AcceptableUsePage />} />
          <Route path="/data-retention" element={<DataRetentionPage />} />
        </Route>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-email" element={<EmailVerificationPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/update-password" element={<UpdatePasswordPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;
