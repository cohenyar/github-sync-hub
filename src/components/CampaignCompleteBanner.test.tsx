// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CampaignCompleteBanner } from './CampaignCompleteBanner'

describe('CampaignCompleteBanner', () => {
  it('renders a distinct completion heading', () => {
    render(<CampaignCompleteBanner totalMissions={4} />)
    expect(screen.getByRole('status', { name: 'Campaign Complete' })).toBeInTheDocument()
    expect(screen.getByText('Campaign Complete')).toBeInTheDocument()
  })

  it('mentions the real mission count', () => {
    render(<CampaignCompleteBanner totalMissions={4} />)
    expect(screen.getByText(/All 4 missions are done/)).toBeInTheDocument()
  })
})
