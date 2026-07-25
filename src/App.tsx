import { BrowserRouter, Route, Routes, useSearchParams } from 'react-router-dom'
import GameApp from './GameApp'
import { CourseDetail, Courses, Dashboard, LandingPage, NotFound, Profile, Progress, Tutor } from './pages'
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
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/world" element={<WorldRoute />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="/courses/:courseId" element={<CourseDetail />} />
      <Route path="/tutor" element={<Tutor />} />
      <Route path="/progress" element={<Progress />} />
      <Route path="/profile" element={<Profile />} />
      {/* Hidden Phase 0 QA route — not linked from any user-facing nav. */}
      <Route path="/dev/design-system" element={<DesignSystemPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

/**
 * Routing foundation only. App.tsx is the top-level composition boundary —
 * it hosts the router and nothing else.
 */
function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
