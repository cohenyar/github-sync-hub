import { AdminPanel } from '../admin'
import '../App.css'

/**
 * Reachable only via ProtectedAdminRoute (App.tsx). AdminPanel itself is
 * unchanged from the in-game toggle it replaces — an English-only
 * builder/debug surface, pinned to LTR regardless of the document's own
 * RTL default. It contains no sensitive secrets or trusted authorization
 * logic of its own: it's a client-side CRUD tool over local content
 * registries, and its real access control is the route guard plus (for any
 * future remote data) Supabase RLS — never this component.
 */
export function AdminPage() {
  return (
    <div id="app-root">
      <section className="adminSection" dir="ltr" lang="en">
        <AdminPanel />
      </section>
    </div>
  )
}
