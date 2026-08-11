import { defineTool } from '@lovable.dev/mcp-js'
import { z } from 'zod'
import { supabaseForUser } from '../supabase'

export default defineTool({
  name: 'list_courses',
  title: 'List courses',
  description: 'List Meridian courses visible to the signed-in user, ordered by display order.',
  inputSchema: {
    status: z.enum(['active', 'draft']).optional().describe('Filter by course status. Drafts are admin-only.'),
    limit: z.number().int().min(1).max(100).default(50).describe('Maximum number of courses to return.'),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: 'text', text: 'Not authenticated' }], isError: true }
    }
    const supabase = supabaseForUser(ctx)
    let query = supabase
      .from('courses')
      .select('id, title, description, subject, status, display_order')
      .order('display_order', { ascending: true })
      .limit(limit ?? 50)
    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) return { content: [{ type: 'text', text: error.message }], isError: true }

    return {
      content: [{ type: 'text', text: JSON.stringify(data ?? []) }],
      structuredContent: { courses: data ?? [] },
    }
  },
})
