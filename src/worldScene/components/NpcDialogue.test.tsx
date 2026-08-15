// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { he } from '../../i18n'
import type { NpcConfig } from '../../npcs'
import type { NpcDialogueContext } from '../logic/npcDialogueState'
import { NpcDialogue } from './NpcDialogue'

const devrin: NpcConfig = {
  id: 'north-warden',
  name: 'Devrin Kass',
  districtId: 'north',
  role: 'District Warden',
  description: "Keeps watch over North district's loyalty to Meridian.",
}

const mera: NpcConfig = {
  id: 'archivist-mera',
  name: 'Mera Solt',
  districtId: 'core',
  role: 'Archivist',
  description: 'Tends the Records Core, waiting for its signal to steady.',
}

function context(overrides: Partial<NpcDialogueContext> = {}): NpcDialogueContext {
  return {
    missionContentStatusByMissionId: { 'first-contact': 'available' },
    activeMissionId: 'first-contact',
    hasAttemptedActiveMission: false,
    districtStatusByDistrictId: { core: 'unstable' },
    ...overrides,
  }
}

describe('NpcDialogue', () => {
  it("renders the NPC's name and a Hebrew greeting", () => {
    render(<NpcDialogue npc={mera} context={context()} onClose={vi.fn()} />)

    expect(screen.getByText('Mera Solt')).toBeInTheDocument()
  })

  // Playtest fix pass (issue 2) — Mera's dialogue now explicitly explains
  // that the Hub is open (not locked), why the signal being unstable
  // matters (it can't locate residents), and the one concrete next step —
  // this used to be a single flat line that never said any of that, and
  // never named an action at all.
  it("explains, in Mera's own dialogue, that the Hub is open but its signal can't locate residents, and names the concrete next step", () => {
    render(<NpcDialogue npc={mera} context={context()} onClose={vi.fn()} />)

    const missionContext = screen.getByTestId('npc-dialogue-mission-context')
    expect(missionContext).toHaveTextContent('פתוח')
    expect(missionContext).not.toHaveTextContent('נעול')
    expect(missionContext).toHaveTextContent('ליבת האיתור')
  })

  it('drops Mera\'s mission-context line once the Hub is stable/thriving (the phase is authored per-status, not always shown)', () => {
    render(<NpcDialogue npc={mera} context={context({ districtStatusByDistrictId: { core: 'thriving' } })} onClose={vi.fn()} />)

    expect(screen.queryByTestId('npc-dialogue-mission-context')).not.toBeInTheDocument()
  })

  it('shows a mission-context line when the linked mission is available and unattempted', () => {
    render(<NpcDialogue npc={devrin} context={context()} onClose={vi.fn()} />)

    expect(screen.getByTestId('npc-dialogue-mission-context')).toBeInTheDocument()
  })

  it('drops the mission-context line and changes the greeting once the mission is completed', () => {
    render(
      <NpcDialogue
        npc={devrin}
        context={context({ missionContentStatusByMissionId: { 'first-contact': 'completed' } })}
        onClose={vi.fn()}
      />,
    )

    expect(screen.queryByTestId('npc-dialogue-mission-context')).not.toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    render(<NpcDialogue npc={devrin} context={context()} onClose={onClose} />)

    fireEvent.click(screen.getByTestId('npc-dialogue-close-button'))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('exposes the NPC id as a data attribute for stable selection', () => {
    render(<NpcDialogue npc={devrin} context={context()} onClose={vi.fn()} />)
    expect(screen.getByTestId('npc-dialogue')).toHaveAttribute('data-npc-id', 'north-warden')
  })

  it('gives the close button an accessible name beyond just its visible text', () => {
    render(<NpcDialogue npc={devrin} context={context()} onClose={vi.fn()} />)
    expect(screen.getByTestId('npc-dialogue-close-button')).toHaveAttribute('aria-label', he.dialogueCloseButton)
  })

  it('marks the dialog as a modal and labels it via the NPC name heading', () => {
    render(<NpcDialogue npc={devrin} context={context()} onClose={vi.fn()} />)

    const dialog = screen.getByTestId('npc-dialogue')
    expect(dialog).toHaveAttribute('aria-modal', 'true')

    const labelledBy = dialog.getAttribute('aria-labelledby')
    expect(labelledBy).toBeTruthy()
    const heading = document.getElementById(labelledBy!)
    expect(heading).toHaveTextContent('Devrin Kass')
    expect(heading?.tagName).toBe('H3')
  })

  it('calls onOpen exactly once when the dialogue mounts', () => {
    const onOpen = vi.fn()
    const { rerender } = render(<NpcDialogue npc={devrin} context={context()} onOpen={onOpen} onClose={vi.fn()} />)
    expect(onOpen).toHaveBeenCalledTimes(1)

    rerender(<NpcDialogue npc={devrin} context={context({ activeMissionId: 'district-ties' })} onOpen={onOpen} onClose={vi.fn()} />)
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('renders fine without an onOpen callback', () => {
    expect(() => render(<NpcDialogue npc={devrin} context={context()} onClose={vi.fn()} />)).not.toThrow()
  })
})

describe('NpcDialogue — conversation identity (presentation pass)', () => {
  it('shows a player identity swatch even when playerAvatarId is omitted (falls back to the default preset)', () => {
    render(<NpcDialogue npc={devrin} context={context()} onClose={vi.fn()} />)
    expect(screen.getByTestId('npc-dialogue-player-swatch')).toBeInTheDocument()
  })

  it('reflects the chosen avatar preset colors on the player swatch', () => {
    render(<NpcDialogue npc={devrin} context={context()} onClose={vi.fn()} playerAvatarId="azure" />)
    const swatch = screen.getByTestId('npc-dialogue-player-swatch')
    // jsdom normalizes custom-property values on the style attribute string, not via getPropertyValue reliably — check the raw attribute instead.
    expect(swatch.getAttribute('style')).toContain('#3d9dff')
  })

  it('gives the same NPC the same identity color across renders (stable, not random)', () => {
    const { unmount } = render(<NpcDialogue npc={mera} context={context()} onClose={vi.fn()} />)
    const firstStyle = screen.getByTestId('npc-dialogue-npc-swatch').getAttribute('style')
    unmount()

    render(<NpcDialogue npc={mera} context={context()} onClose={vi.fn()} />)
    const secondStyle = screen.getByTestId('npc-dialogue-npc-swatch').getAttribute('style')
    expect(firstStyle).toBe(secondStyle)
  })

  it('gives different NPCs a different identity color (no accidental collision for this cast)', () => {
    const { unmount } = render(<NpcDialogue npc={devrin} context={context()} onClose={vi.fn()} />)
    const devrinSwatchStyle = screen.getByTestId('npc-dialogue-npc-swatch').getAttribute('style')
    unmount()

    render(<NpcDialogue npc={mera} context={context()} onClose={vi.fn()} />)
    const meraSwatchStyle = screen.getByTestId('npc-dialogue-npc-swatch').getAttribute('style')

    expect(devrinSwatchStyle).not.toBe(meraSwatchStyle)
  })
})

describe('NpcDialogue — familiarity tier (Meridian 1.3)', () => {
  it('shows no badge and no bonus line when no tier is given', () => {
    render(<NpcDialogue npc={mera} context={context()} onClose={vi.fn()} />)
    expect(screen.queryByTestId('npc-familiarity-badge')).not.toBeInTheDocument()
    expect(screen.queryByTestId('npc-dialogue-friend-bonus')).not.toBeInTheDocument()
  })

  it('shows the tier badge once a tier is given', () => {
    render(<NpcDialogue npc={mera} context={context()} onClose={vi.fn()} familiarityTier="acquaintance" />)
    expect(screen.getByTestId('npc-familiarity-badge')).toBeInTheDocument()
  })

  it("shows an NPC's friend-tier bonus line only at the friend tier", () => {
    const { rerender } = render(
      <NpcDialogue npc={mera} context={context()} onClose={vi.fn()} familiarityTier="trusted" />,
    )
    expect(screen.queryByTestId('npc-dialogue-friend-bonus')).not.toBeInTheDocument()

    rerender(<NpcDialogue npc={mera} context={context()} onClose={vi.fn()} familiarityTier="friend" />)
    expect(screen.getByTestId('npc-dialogue-friend-bonus')).toBeInTheDocument()
  })

  it('shows no bonus line at the friend tier for an NPC with no authored line yet', () => {
    render(<NpcDialogue npc={devrin} context={context()} onClose={vi.fn()} familiarityTier="friend" />)
    expect(screen.queryByTestId('npc-dialogue-friend-bonus')).not.toBeInTheDocument()
  })
})

describe('NpcDialogue — Escape to close (Batch 3A.3)', () => {
  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    render(<NpcDialogue npc={devrin} context={context()} onClose={onClose} />)

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose for an unrelated key', () => {
    const onClose = vi.fn()
    render(<NpcDialogue npc={devrin} context={context()} onClose={onClose} />)

    fireEvent.keyDown(window, { key: 'a' })

    expect(onClose).not.toHaveBeenCalled()
  })

  it('removes its Escape listener on unmount', () => {
    const onClose = vi.fn()
    const { unmount } = render(<NpcDialogue npc={devrin} context={context()} onClose={onClose} />)
    unmount()

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(onClose).not.toHaveBeenCalled()
  })
})

describe('NpcDialogue — Start Lesson handoff (Batch 3A.3)', () => {
  const mathTeacher: NpcConfig = {
    id: 'math-teacher',
    name: 'Nadav Stern',
    districtId: 'core',
    role: 'Mathematics Teacher',
    description: '',
  }

  it('shows a Start Lesson button for an NPC with a linked lesson, and resolves the correct namespaced id', () => {
    const onStartLesson = vi.fn()
    render(<NpcDialogue npc={mathTeacher} context={context()} onClose={vi.fn()} onStartLesson={onStartLesson} />)

    fireEvent.click(screen.getByTestId('npc-dialogue-start-lesson-button'))

    expect(onStartLesson).toHaveBeenCalledTimes(1)
    expect(onStartLesson).toHaveBeenCalledWith('lesson:math-001')
  })

  it('never calls onClose as a side effect of Start Lesson — that decision belongs to the caller', () => {
    const onClose = vi.fn()
    render(<NpcDialogue npc={mathTeacher} context={context()} onClose={onClose} onStartLesson={vi.fn()} />)

    fireEvent.click(screen.getByTestId('npc-dialogue-start-lesson-button'))

    expect(onClose).not.toHaveBeenCalled()
  })

  it('renders no Start Lesson button for an NPC with no linked lesson', () => {
    render(<NpcDialogue npc={devrin} context={context()} onClose={vi.fn()} onStartLesson={vi.fn()} />)
    expect(screen.queryByTestId('npc-dialogue-start-lesson-button')).not.toBeInTheDocument()
  })

  it('renders no Start Lesson button when onStartLesson is not provided, even for a linked NPC', () => {
    render(<NpcDialogue npc={mathTeacher} context={context()} onClose={vi.fn()} />)
    expect(screen.queryByTestId('npc-dialogue-start-lesson-button')).not.toBeInTheDocument()
  })
})

describe('NpcDialogue — replay action label (Batch 3A.5)', () => {
  const mathTeacher: NpcConfig = {
    id: 'math-teacher',
    name: 'נדב שטרן',
    districtId: 'core',
    role: 'Mathematics Teacher',
    description: '',
  }

  it('shows the normal start action when the linked lesson has not been completed', () => {
    render(
      <NpcDialogue npc={mathTeacher} context={context({ completedLessonIds: [] })} onClose={vi.fn()} onStartLesson={vi.fn()} />,
    )
    expect(screen.getByTestId('npc-dialogue-start-lesson-button')).toHaveTextContent('התחל/התחילי שיעור')
  })

  it('shows the normal start action when completedLessonIds is entirely absent from the context', () => {
    render(<NpcDialogue npc={mathTeacher} context={context()} onClose={vi.fn()} onStartLesson={vi.fn()} />)
    expect(screen.getByTestId('npc-dialogue-start-lesson-button')).toHaveTextContent('התחל/התחילי שיעור')
  })

  it('shows "תרגל שוב" once the linked lesson is already completed', () => {
    render(
      <NpcDialogue
        npc={mathTeacher}
        context={context({ completedLessonIds: ['lesson:math-001'] })}
        onClose={vi.fn()}
        onStartLesson={vi.fn()}
      />,
    )
    expect(screen.getByTestId('npc-dialogue-start-lesson-button')).toHaveTextContent('תרגל/י שוב')
  })

  it('still resolves and calls onStartLesson with the same namespaced id when replaying', () => {
    const onStartLesson = vi.fn()
    render(
      <NpcDialogue
        npc={mathTeacher}
        context={context({ completedLessonIds: ['lesson:math-001'] })}
        onClose={vi.fn()}
        onStartLesson={onStartLesson}
      />,
    )
    fireEvent.click(screen.getByTestId('npc-dialogue-start-lesson-button'))
    expect(onStartLesson).toHaveBeenCalledWith('lesson:math-001')
  })

  it('keeps the normal start action for a completed lesson id that belongs to a different NPC', () => {
    render(
      <NpcDialogue
        npc={mathTeacher}
        context={context({ completedLessonIds: ['lesson:english-001'] })}
        onClose={vi.fn()}
        onStartLesson={vi.fn()}
      />,
    )
    expect(screen.getByTestId('npc-dialogue-start-lesson-button')).toHaveTextContent('התחל/התחילי שיעור')
  })
})
