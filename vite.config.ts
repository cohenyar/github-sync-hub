/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { mcpPlugin } from '@lovable.dev/mcp-js/stacks/supabase/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), mcpPlugin()],

  test: {
    environment: 'node',
    setupFiles: ['src/test/setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
