import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
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

// User pages - loaded on demand
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const RankingPage = lazy(() => import('./pages/RankingPage'));
const LibraryPage = lazy(() => import('./pages/LibraryPage'));
const UserPublicProfilePage = lazy(() => import('./pages/UserPublicProfilePage'));
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
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/dashboard" element={<AuthorDashboardPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/account" element={<AccountSettingsPage />} />
          <Route path="/profile/edit" element={<EditProfilePage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/user/:id" element={<UserPublicProfilePage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/wallet/history" element={<WalletHistoryPage />} />
          <Route path="/wallet/withdraw" element={<WalletWithdrawPage />} />


          {/* Authoring Routes */}
          <Route path="/novel/create" element={<CreateNovelPage />} />
          <Route path="/novel/edit/:id" element={<EditNovelPage />} />
          <Route path="/novel/manage/:id" element={<NovelManagePage />} />
          <Route path="/novel/:novelId/create-chapter" element={<CreateChapterPage />} />
          <Route path="/novel/:novelId/chapter/:chapterId/edit" element={<EditChapterPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />

          {/* Discovery Routes */}
          <Route path="/see-all/:type" element={<SeeAllPage />} />
        </Route>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;
