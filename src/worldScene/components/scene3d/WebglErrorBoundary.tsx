import { Component, type ReactNode } from 'react'
import { he } from '../../../i18n'
import styles from './WebglErrorBoundary.module.css'

export interface WebglErrorBoundaryProps {
  children: ReactNode
}

interface WebglErrorBoundaryState {
  hasError: boolean
}

/**
 * Meridian UI stability pass: WebGL/context-creation failures inside
 * <Canvas> (e.g. a browser with WebGL disabled) previously threw straight
 * through React with no boundary, blanking the whole app. React error
 * boundaries must be class components — there is still no hook equivalent.
 * Scoped to just the 3D scene: everything else in GameApp (the classic
 * dashboard, Save/Load, Admin) keeps working even if this specific view
 * can't render.
 */
export class WebglErrorBoundary extends Component<WebglErrorBoundaryProps, WebglErrorBoundaryState> {
  state: WebglErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): WebglErrorBoundaryState {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.fallback} role="alert" data-testid="world-scene-error-fallback">
          {he.worldSceneErrorMessage}
        </div>
      )
    }
    return this.props.children
  }
}
