import { Navigate, Route, Routes } from 'react-router-dom'
import {
  AdminCourses,
  AdminDashboard,
  AdminLayout,
  AdminLegacyTools,
  AdminLessons,
  AdminMissions,
  AdminUsers,
} from './admin'

/**
 * Reachable only via ProtectedAdminRoute (App.tsx, mounted at /admin/*).
 * AdminLayout provides the sidebar/topbar chrome; everything else here is a
 * nested page. The old single-purpose AdminPage (which rendered only the
 * legacy in-memory AdminPanel) is now one tab among several — see
 * admin/AdminLegacyTools.tsx — rather than deleted.
 */
export function AdminPage() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        {/* Absolute targets, deliberately — a relative "dashboard" resolves
            against the *matched* path, and for the splat route below that's
            the splat's own match (e.g. "/admin/does-not-exist"), not "/admin".
            That sent the redirect to ".../does-not-exist/dashboard", which
            still doesn't match a named route, so it fell through to the
            splat again and appended another "dashboard" segment forever —
            a real infinite-redirect loop, not just a test artifact. */}
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="courses" element={<AdminCourses />} />
        <Route path="courses/:courseId/lessons" element={<AdminLessons />} />
        <Route path="courses/:courseId/lessons/:lessonId/missions" element={<AdminMissions />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="legacy" element={<AdminLegacyTools />} />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
