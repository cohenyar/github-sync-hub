import { BrowserRouter, Route, Routes } from 'react-router-dom'
import GameApp from './GameApp'
import { CourseDetail, Courses, Dashboard, LandingPage, NotFound, Profile, Progress, Tutor } from './pages'

/**
 * The route table itself, separated from the BrowserRouter wrapper below so
 * tests can mount it inside a MemoryRouter instead (real browser history
 * doesn't exist under jsdom). The real game (GameApp, moved here verbatim
 * from what used to be this file's entire content) mounts at /world
 * completely unwrapped, so its behavior stays byte-for-byte unchanged.
 * Every other route is a minimal placeholder shell; each gets its own real
 * design in a later phase.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/world" element={<GameApp />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="/courses/:courseId" element={<CourseDetail />} />
      <Route path="/tutor" element={<Tutor />} />
      <Route path="/progress" element={<Progress />} />
      <Route path="/profile" element={<Profile />} />
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
