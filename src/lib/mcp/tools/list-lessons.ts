import { defineTool } from '@lovable.dev/mcp-js'
import { z } from 'zod'
import { supabaseForUser } from '../supabase'

export default defineTool({
  name: 'list_lessons',
  title: 'List lessons',
  description: 'List the lessons of one Meridian course, ordered by display order.',
  inputSchema: {
    course_id: z.string().uuid().describe('The course whose lessons should be listed.'),
    status: z.enum(['active', 'draft']).optional().describe('Filter by lesson status. Drafts are admin-only.'),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ course_id, status }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: 'text', text: 'Not authenticated' }], isError: true }
    }
    const supabase = supabaseForUser(ctx)
    let query = supabase
      .from('lessons')
      .select('id, course_id, title, content, status, display_order')
      .eq('course_id', course_id)
      .order('display_order', { ascending: true })
    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) return { content: [{ type: 'text', text: error.message }], isError: true }

    return {
      content: [{ type: 'text', text: JSON.stringify(data ?? []) }],
      structuredContent: { lessons: data ?? [] },
    }
  },
})
