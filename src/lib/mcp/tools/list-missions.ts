import { defineTool } from '@lovable.dev/mcp-js'
import { z } from 'zod'
import { supabaseForUser } from '../supabase'

export default defineTool({
  name: 'list_missions',
  title: 'List missions',
  description: 'List the missions of one Meridian lesson, including objective, task and hints.',
  inputSchema: {
    lesson_id: z.string().uuid().describe('The lesson whose missions should be listed.'),
    status: z.enum(['active', 'draft']).optional().describe('Filter by mission status. Drafts are admin-only.'),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ lesson_id, status }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: 'text', text: 'Not authenticated' }], isError: true }
    }
    const supabase = supabaseForUser(ctx)
    let query = supabase
      .from('missions')
      .select(
        'id, lesson_id, title, objective, instructions, task, hint, guidance_level_1, guidance_level_2, guidance_level_3, status, display_order',
      )
      .eq('lesson_id', lesson_id)
      .order('display_order', { ascending: true })
    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) return { content: [{ type: 'text', text: error.message }], isError: true }

    return {
      content: [{ type: 'text', text: JSON.stringify(data ?? []) }],
      structuredContent: { missions: data ?? [] },
    }
  },
})
