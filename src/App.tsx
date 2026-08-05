import * as Sentry from '@sentry/react'
import { BrowserRouter, Route, Routes, useSearchParams } from 'react-router-dom'
import { AuthProvider, ProtectedAdminRoute } from './auth'
import { AppErrorFallback } from './errorReporting/AppErrorFallback'
import GameApp from './GameApp'
import {
  AdminPage,
  AuthPage,
  CourseDetail,
  Courses,
  Dashboard,
  LandingPage,
  NotFound,
  Profile,
  Progress,
  ResetPasswordPage,
  Tutor,
} from './pages'
import { DesignSystemPage } from './pages/DesignSystemPage'

/**
 * Batch 3A.2: the only place that reads the Dashboard's `?path=` query
 * param. GameApp itself never calls useSearchParams — many existing tests
 * render <GameApp /> directly with no Router wrapper at all, and this
 * keeps that working unchanged. Real /world navigation always goes through
 * this wrapper, which is inside the Router by construction.
 */
function WorldRoute() {
  const [searchParams] = useSearchParams()
  return <GameApp initialLearningPathId={searchParams.get('path')} />
}

/**
 * The route table itself, separated from the BrowserRouter wrapper below so
 * tests can mount it inside a MemoryRouter instead (real browser history
 * doesn't exist under jsdom). The real game (GameApp) mounts at /world via
 * the thin WorldRoute wrapper above — GameApp's own rendering is otherwise
 * unwrapped and unchanged. Every other route is a minimal placeholder
 * shell; each gets its own real design in a later phase.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/world" element={<WorldRoute />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="/courses/:courseId" element={<CourseDetail />} />
      <Route path="/tutor" element={<Tutor />} />
      <Route path="/progress" element={<Progress />} />
      <Route path="/profile" element={<Profile />} />
      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute>
            <AdminPage />
          </ProtectedAdminRoute>
        }
      />
      {/* Dev-only QA route — not linked from any user-facing nav, and (as of
          the Meridian 1.0 UI audit) not present at all in a production
          build, since it still pitches retired AI-mentor messaging and its
          own nav pattern was never adopted. Falls through to NotFound in
          production, exactly like a URL that never existed. */}
      {import.meta.env.DEV && <Route path="/dev/design-system" element={<DesignSystemPage />} />}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

/**
 * Routing foundation only. App.tsx is the top-level composition boundary —
 * it hosts the router, the auth session provider, and (Game Feel pass) a
 * whole-app Sentry error boundary, and nothing else. AuthProvider sits
 * inside BrowserRouter (ProtectedAdminRoute needs react-router-dom's
 * <Navigate>) but outside AppRoutes, so every route shares the one auth
 * session. Sentry.ErrorBoundary wraps everything else — it degrades safely
 * (still catches and shows the fallback locally) even when Sentry.init was
 * never called, i.e. in dev/test or with no DSN configured (see
 * errorReporting/sentryClient.ts). Distinct from and not a replacement for
 * WorldScene3D's own WebglErrorBoundary, which handles WebGL context loss
 * specifically, one level deeper.
 */
function App() {
  return (
    <Sentry.ErrorBoundary fallback={<AppErrorFallback />}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  )
}

export default App
