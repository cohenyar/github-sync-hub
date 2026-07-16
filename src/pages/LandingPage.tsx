import { Link, NavLink } from 'react-router-dom'
import { he } from '../i18n'
import heroArt from '../assets/landing-hero.jpg'
import styles from './LandingPage.module.css'

/**
 * Landing page — cinematic AI-learning-world hero.
 *
 * Visual redesign only: routing, links, testids and Hebrew copy are all
 * preserved. The `landingTagline` string and the `landing-enter-world-link`
 * testid remain so the existing route tests keep passing.
 */
const NAV_LINKS = [
  { to: '/', label: 'ראשי', end: true },
  { to: '/dashboard', label: 'לוח בקרה' },
  { to: '/world', label: 'העולם התלת־ממדי' },
  { to: '/tutor', label: 'מדריך AI' },
  { to: '/courses', label: 'קורסים' },
]

const PILLS = [
  { icon: '✨', label: 'AI Tutor' },
  { icon: '🎮', label: 'Gamified Learning' },
  { icon: '🏆', label: 'Achievements' },
] as const

const FEATURES = [
  { icon: '📘', title: 'קורסים', text: 'מגוון קורסים אינטראקטיביים עם AI ולמידה חכמה', tone: 'blue' },
  { icon: '🛡️', title: 'מערכת שלבים', text: 'עלות שלבים, צבור XP ותפתח יכולות חדשות', tone: 'green' },
  { icon: '🔥', title: 'רצף יומי', text: 'שמור על רצף, קבל בונוסים והרגל למידה חזק', tone: 'fire' },
  { icon: '🤖', title: 'מנטור AI', text: 'מורה AI אישי שמלווה אותך בכל שלב במסע', tone: 'ai' },
] as const

const STATS = [
  { icon: '📖', value: '120+', label: 'שיעורים אינטראקטיביים', tone: 'blue' },
  { icon: '🎯', value: '45', label: 'אתגרי AI', tone: 'pink' },
  { icon: '🌐', value: '10', label: 'עולמות למידה', tone: 'cyan' },
  { icon: '👑', value: '500+', label: 'הישגים ופרסים', tone: 'gold' },
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
          <p className={styles.subtitle}>
            הדרך החדשה ללמוד במצעות <span className={styles.inlineAi}>AI</span>, משימות, אתגרים ועולמות אינטראקטיביים.
          </p>
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
          <img src={heroArt} alt="Meridian world" width={1280} height={1024} />
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
