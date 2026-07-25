// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { he } from '../../../i18n'
import { WebglErrorBoundary } from './WebglErrorBoundary'

function Bomb(): never {
  throw new Error('simulated WebGL context creation failure')
}

describe('WebglErrorBoundary', () => {
  it('renders children normally when nothing throws', () => {
    render(
      <WebglErrorBoundary>
        <div data-testid="child">fine</div>
      </WebglErrorBoundary>,
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('renders a readable Hebrew fallback instead of crashing when a child throws', () => {
    render(
      <WebglErrorBoundary>
        <Bomb />
      </WebglErrorBoundary>,
    )
    expect(screen.getByTestId('world-scene-error-fallback')).toHaveTextContent(he.worldSceneErrorMessage)
  })
})
