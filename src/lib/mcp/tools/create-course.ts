import { defineTool } from '@lovable.dev/mcp-js'
import { z } from 'zod'
import { supabaseForUser } from '../supabase'

export default defineTool({
  name: 'create_course',
  title: 'Create course',
  description: 'Create a new Meridian course. Requires an admin account; other users are rejected by the database.',
  inputSchema: {
    title: z.string().trim().min(1).describe('Course title, in Hebrew for player-facing content.'),
    subject: z.string().trim().min(1).describe('Subject area, e.g. history, math, english.'),
    description: z.string().trim().optional().describe('Short course description.'),
    status: z.enum(['draft', 'active']).default('draft').describe('Publish state. Defaults to draft.'),
    display_order: z.number().int().min(0).default(0).describe('Ordering position in course lists.'),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ title, subject, description, status, display_order }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: 'text', text: 'Not authenticated' }], isError: true }
    }
    const supabase = supabaseForUser(ctx)
    const { data, error } = await supabase
      .from('courses')
      .insert({ title, subject, description, status: status ?? 'draft', display_order: display_order ?? 0 })
      .select('id, title, subject, description, status, display_order')

    if (error) return { content: [{ type: 'text', text: error.message }], isError: true }

    return {
      content: [{ type: 'text', text: JSON.stringify(data?.[0] ?? null) }],
      structuredContent: { course: data?.[0] ?? null },
    }
  },
})
