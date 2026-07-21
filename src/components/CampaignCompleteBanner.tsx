import { he } from '../i18n'
import styles from './CampaignCompleteBanner.module.css'

export interface CampaignCompleteBannerProps {
  totalMissions: number
}

/** A one-time visual beat for finishing the whole campaign, distinct from an ordinary mission completing. */
export function CampaignCompleteBanner({ totalMissions }: CampaignCompleteBannerProps) {
  return (
    <section
      className={styles.banner}
      role="status"
      aria-label={he.campaignCompleteTitle}
      data-testid="campaign-complete-banner"
    >
      <h2 className={styles.title}>{he.campaignCompleteTitle}</h2>
      <p className={styles.body}>
        כל {totalMissions} המשימות הושלמו. כל מחוז עונה למוקד הרשומות, ומרידיאן שלמה.
      </p>
    </section>
  )
}
