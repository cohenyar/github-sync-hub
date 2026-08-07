import { Link, NavLink } from 'react-router-dom'
import { he } from '../i18n'
import heroArt from '../assets/landing-hero.webp'
import styles from './LandingPage.module.css'

/**
 * Landing page — cinematic AI-learning-world hero.
 *
 * Visual redesign only: routing, links, testids and Hebrew copy are all
 * preserved. The `landingTagline` string and the `landing-enter-world-link`
 * testid remain so the existing route tests keep passing.
 */
// Phase 3A.1: trimmed to the routes that render real content — see
// PageShell.tsx's matching trim for the same reasoning.
const NAV_LINKS = [
  { to: '/', label: 'ראשי', end: true },
  { to: '/dashboard', label: 'לוח בקרה' },
  { to: '/world', label: 'העולם התלת־ממדי' },
]

const PILLS = [
  { icon: '🧮', label: 'מתמטיקה' },
  { icon: '🔤', label: 'אנגלית' },
  { icon: '🏙️', label: 'עולם תלת־ממדי' },
] as const

const FEATURES = [
  { icon: '🧮', title: 'מתמטיקה ואנגלית', text: 'שיעורים אינטראקטיביים בחשבון ובאוצר מילים, בעברית מהתחלה ועד הסוף.', tone: 'blue' },
  { icon: '🏙️', title: 'עולם תלת־ממדי', text: 'לומדים בתוך עיר חיה — עם בניינים, שבילים ודמויות לפגוש בדרך.', tone: 'green' },
  { icon: '🗣️', title: 'שיחה עם מורים', text: 'כל מקצוע מיוצג על ידי דמות מורה שמסבירה ומכוונת לשיעור.', tone: 'fire' },
  { icon: '💾', title: 'התקדמות נשמרת', text: 'סיימתם שיעור? אפשר לשמור, לחזור בכל עת ולתרגל שוב.', tone: 'ai' },
] as const

const STATS = [
  { icon: '➗', value: 'מתמטיקה', label: 'תרגול חשבון ופתרון בעיות', tone: 'blue' },
  { icon: '🔤', value: 'אנגלית', label: 'אוצר מילים מעברית לאנגלית', tone: 'pink' },
  { icon: '🏙️', value: 'עולם תלת־ממדי', label: 'למידה בסביבה חיה ואינטראקטיבית', tone: 'cyan' },
  { icon: '💾', value: 'התקדמות נשמרת', label: 'סיימו שיעור וחזרו לתרגל בכל עת', tone: 'gold' },
] as const

export function LandingPage() {
  return (
    <div className={styles.page}>
      <div className={styles.starfield} aria-hidden />

      <header className={styles.navWrap}>
        <div className={styles.navBar}>
          <Link to="/" className={styles.brand} aria-label="Meridian">
            <span className={styles.brandMark}>M</span>
            <span className={styles.brandName}>Meridian</span>
          </Link>
          <nav className={styles.navLinks} aria-label="ניווט ראשי">
            {NAV_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  isActive ? `${styles.navLink} ${styles.navActive}` : styles.navLink
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.copy}>
          <h1 className={styles.title}>
            <span className={styles.titleAccent}>Meridian</span>
          </h1>
          <p className={styles.subtitle}>לומדים מתמטיקה ואנגלית בעברית, בתוך עולם תלת־ממדי אינטראקטיבי.</p>
          <p className={styles.tagline}>{he.landingTagline}</p>

          <div className={styles.pillRow} aria-label="יתרונות מרכזיים">
            {PILLS.map((p) => (
              <span key={p.label} className={styles.pill}>
                <span aria-hidden>{p.icon}</span>
                {p.label}
              </span>
            ))}
          </div>

          <div className={styles.ctaRow}>
            <Link
              to="/world"
              className={styles.ctaPrimary}
              data-testid="landing-enter-world-link"
            >
              <span className={styles.ctaIcon} aria-hidden>🚀</span>
              <span>{he.landingEnterCta ?? 'התחל את המסע'}</span>
              <span className={styles.ctaArrow} aria-hidden>←</span>
            </Link>
          </div>
        </div>

        <div className={styles.artwork}>
          <img src={heroArt} alt="Meridian world" width={1280} height={1024} fetchPriority="high" decoding="async" />
          <div className={styles.artworkGlow} aria-hidden />
        </div>
      </section>

      <section className={styles.features} aria-label="יתרונות">
        {FEATURES.map((f) => (
          <article key={f.title} className={styles.featureCard} data-tone={f.tone}>
            <div className={styles.featureIcon} aria-hidden>{f.icon}</div>
            <div className={styles.featureBody}>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureText}>{f.text}</p>
            </div>
          </article>
        ))}
      </section>

      <section className={styles.statsBar} aria-label="סטטיסטיקות פלטפורמה">
        {STATS.map((s) => (
          <div key={s.label} className={styles.stat} data-tone={s.tone}>
            <div className={styles.statIcon} aria-hidden>{s.icon}</div>
            <div>
              <div className={styles.statValue}>{s.value}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
