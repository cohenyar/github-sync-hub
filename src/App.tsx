import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes, useSearchParams } from 'react-router-dom'
import { AuthProvider, ProtectedAdminRoute } from './auth'
import { AppLoading } from './pages/AppLoading'
import { LandingPage } from './pages/LandingPage'
import { NotFound } from './pages/NotFound'

/**
 * Startup performance: only the landing page (the first thing anyone sees)
 * and the tiny NotFound page are in the initial bundle. Everything heavy —
 * the 3D world + SQL engine (GameApp), the admin surface, and the secondary
 * platform pages — is code-split, so first paint no longer waits on a
 * ~1.5 MB single bundle. Routing and behavior are otherwise unchanged.
 */
const GameApp = lazy(() => import('./GameApp'))
const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })))
const AuthPage = lazy(() => import('./pages/AuthPage').then((m) => ({ default: m.AuthPage })))
const ResetPasswordPage = lazy(() =>
  import('./pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })),
)
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const Courses = lazy(() => import('./pages/Courses').then((m) => ({ default: m.Courses })))
const CourseDetail = lazy(() => import('./pages/CourseDetail').then((m) => ({ default: m.CourseDetail })))
const Tutor = lazy(() => import('./pages/Tutor').then((m) => ({ default: m.Tutor })))
const Progress = lazy(() => import('./pages/Progress').then((m) => ({ default: m.Progress })))
const Profile = lazy(() => import('./pages/Profile').then((m) => ({ default: m.Profile })))
const DesignSystemPage = lazy(() =>
  import('./pages/DesignSystemPage').then((m) => ({ default: m.DesignSystemPage })),
)

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
    <Suspense fallback={<AppLoading />}>
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
    </Suspense>
  )
}


/**
 * Routing foundation only. App.tsx is the top-level composition boundary —
 * it hosts the router and the auth session provider, and nothing else.
 * AuthProvider sits inside BrowserRouter (ProtectedAdminRoute needs
 * react-router-dom's <Navigate>) but outside AppRoutes, so every route
 * shares the one auth session.
 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
