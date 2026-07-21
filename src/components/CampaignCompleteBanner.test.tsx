// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { he } from '../i18n'
import { CampaignCompleteBanner } from './CampaignCompleteBanner'

describe('CampaignCompleteBanner', () => {
  it('renders a distinct completion heading', () => {
    render(<CampaignCompleteBanner totalMissions={4} />)
    expect(screen.getByRole('status', { name: he.campaignCompleteTitle })).toBeInTheDocument()
    expect(screen.getByText(he.campaignCompleteTitle)).toBeInTheDocument()
  })

  it('mentions the real mission count', () => {
    render(<CampaignCompleteBanner totalMissions={4} />)
    expect(screen.getByText(/כל 4 המשימות הושלמו/)).toBeInTheDocument()
  })
})
