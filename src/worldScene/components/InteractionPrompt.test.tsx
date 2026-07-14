// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { InteractionPrompt, type DestinationPromptInfo } from './InteractionPrompt'

const AVAILABLE: DestinationPromptInfo = { name: 'רובע הסוחרים', status: 'available', progress: { completed: 1, total: 3 } }
const LOCKED: DestinationPromptInfo = { name: 'רובע היציבות', status: 'locked', progress: { completed: 0, total: 1 } }
const COMPLETED: DestinationPromptInfo = { name: 'מוקד הרשומות', status: 'completed', progress: { completed: 1, total: 1 } }

describe('InteractionPrompt', () => {
  it('renders nothing when there is no nearby interactable', () => {
    render(<InteractionPrompt interactable={null} destinationInfoById={{}} />)
    expect(screen.queryByTestId('interaction-prompt')).not.toBeInTheDocument()
  })

  it('shows the plain talk prompt for an NPC, ignoring destinationInfoById entirely', () => {
    render(
      <InteractionPrompt
        interactable={{ id: 'north-warden', kind: 'npc', position: { x: 0, z: 0 } }}
        destinationInfoById={{}}
      />,
    )
    expect(screen.getByTestId('interaction-prompt')).toHaveTextContent('לחץ לשיחה')
  })

  it('names the destination and shows its progress when available', () => {
    render(
      <InteractionPrompt
        interactable={{ id: 'east', kind: 'district', position: { x: 0, z: 0 } }}
        destinationInfoById={{ east: AVAILABLE }}
      />,
    )
    const prompt = screen.getByTestId('interaction-prompt')
    expect(prompt).toHaveTextContent('רובע הסוחרים')
    expect(prompt).toHaveTextContent('1/3')
    expect(prompt).toHaveAttribute('data-locked', 'false')
  })

  it('shows a distinct locked variant, and never the progress fraction, for a locked destination', () => {
    render(
      <InteractionPrompt
        interactable={{ id: 'south', kind: 'district', position: { x: 0, z: 0 } }}
        destinationInfoById={{ south: LOCKED }}
      />,
    )
    const prompt = screen.getByTestId('interaction-prompt')
    expect(prompt).toHaveTextContent('רובע היציבות')
    expect(prompt).toHaveTextContent('נעול')
    expect(prompt).toHaveAttribute('data-locked', 'true')
  })

  it('still shows progress for a fully completed destination', () => {
    render(
      <InteractionPrompt
        interactable={{ id: 'core', kind: 'district', position: { x: 0, z: 0 } }}
        destinationInfoById={{ core: COMPLETED }}
      />,
    )
    expect(screen.getByTestId('interaction-prompt')).toHaveTextContent('1/1')
  })

  it('falls back to the generic enter prompt for a district id with no known destination', () => {
    render(
      <InteractionPrompt
        interactable={{ id: 'mystery', kind: 'district', position: { x: 0, z: 0 } }}
        destinationInfoById={{}}
      />,
    )
    expect(screen.getByTestId('interaction-prompt')).toHaveTextContent('לחץ לכניסה')
  })
})
