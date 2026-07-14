import styles from './CampaignCompleteBanner.module.css'

export interface CampaignCompleteBannerProps {
  totalMissions: number
}

/** A one-time visual beat for finishing the whole campaign, distinct from an ordinary mission completing. */
export function CampaignCompleteBanner({ totalMissions }: CampaignCompleteBannerProps) {
  return (
    <section className={styles.banner} role="status" aria-label="Campaign Complete" data-testid="campaign-complete-banner">
      <h2 className={styles.title}>Campaign Complete</h2>
      <p className={styles.body}>
        All {totalMissions} missions are done. Every district answers the Records Core, and Meridian is whole.
      </p>
    </section>
  )
}
