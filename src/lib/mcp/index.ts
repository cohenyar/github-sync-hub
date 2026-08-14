import { auth, defineMcp } from '@lovable.dev/mcp-js'
import createCourseTool from './tools/create-course'
import getMyProfileTool from './tools/get-my-profile'
import listCoursesTool from './tools/list-courses'
import listLessonsTool from './tools/list-lessons'
import listMissionsTool from './tools/list-missions'

// The OAuth issuer must be the direct Supabase host, built from the project
// ref that Vite inlines at build time (never from SUPABASE_URL, which may be
// a proxy host). Keep this module import-safe: no env reads at runtime.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? 'project-ref-unset'

export default defineMcp({
  name: 'github-sync-hub',
  title: 'GitHub Sync Hub',
  version: '0.1.0',
  instructions:
    'Tools for the Meridian learning platform. Read the signed-in player profile, browse courses, lessons and missions, and create courses (admin only). All player-facing content is in Hebrew.',
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: 'authenticated',
  }),
  tools: [getMyProfileTool, listCoursesTool, listLessonsTool, listMissionsTool, createCourseTool],
})
