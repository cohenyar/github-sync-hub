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
  { to: '/', label: he.navLandingLabel, end: true },
  { to: '/dashboard', label: he.navDashboardLabel },
  { to: '/world', label: he.navWorldLabel },
  { to: '/courses', label: he.navCoursesLabel },
  { to: '/tutor', label: he.navTutorLabel },
  { to: '/progress', label: he.navProgressLabel },
  { to: '/profile', label: he.navProfileLabel },
]

const FEATURES = [
  { icon: '🌐', title: 'עולם תלת־ממדי', text: 'לומדים SQL בעולם אינטראקטיבי חי', tone: 'default' },
  { icon: '🤖', title: 'מורה AI אישי', text: 'עזרה מיידית, הסברים ודרכים מותאמות', tone: 'ai' },
  { icon: '🏆', title: 'תגמולים', text: 'השג תגים, עלה רמות וקבל XP', tone: 'warn' },
  { icon: '📈', title: 'מעקב התקדמות', text: 'ניתוח התקדמות חכם והמלצות מותאמות', tone: 'success' },
] as const

const STATS = [
  { icon: '🔥', value: '7', label: 'רצף לימוד', tone: 'fire' },
  { icon: '🎯', value: '24', label: 'משימות הושלמו', tone: 'target' },
  { icon: '⭐', value: '1,248', label: 'XP נצבר', tone: 'xp' },
  { icon: '👑', value: '5', label: 'רמה נוכחית', tone: 'rank' },
] as const

export function LandingPage() {
  return (
    <div className={styles.page}>
      <div className={styles.starfield} aria-hidden />

      <header className={styles.nav}>
        <Link to="/" className={styles.brand} aria-label="Meridian">
          <span className={styles.brandMark}>M</span>
          <span>Meridian</span>
        </Link>
        <nav className={styles.navLinks} aria-label={he.navLandingLabel}>
          {NAV_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => (isActive ? styles.navActive : undefined)}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ width: 32 }} aria-hidden />
      </header>

      <section className={styles.hero}>
        <div className={styles.artwork}>
          <img src={heroArt} alt="Meridian world" width={1280} height={1280} />
          <div className={styles.artworkGlow} aria-hidden />
          <div className={styles.questCard} role="status" aria-label="משימה פעילה">
            <div className={styles.questHead}>
              <span className={styles.questBadge}>⚡</span>
              <span>משימה פעילה</span>
            </div>
            <div className={styles.questTitle}>מציאת לקוחות VIP</div>
            <div className={styles.codePreview}>
              <span className={styles.kw}>SELECT</span> * <span className={styles.kw}>FROM</span> customers{'\n'}
              <span className={styles.kw}>WHERE</span> total_spent &gt; <span className={styles.str}>1000</span>
            </div>
            <div className={styles.progressRow}>
              <div className={styles.progressBar}><div className={styles.progressFill} /></div>
              <span>60%</span>
            </div>
          </div>
        </div>

        <div className={styles.copy}>
          <span className={styles.eyebrow}>
            <span className={styles.eyeDot} />
            פלטפורמת למידה מבוססת AI
          </span>
          <h1 className={styles.title}>
            <span className={styles.titleAccent}>Meridian</span>
          </h1>
          <p className={styles.subtitle}>
            לומדים SQL בעולם חי של <span className={styles.titleAccent}>AI</span>
          </p>
          <p className={styles.desc}>{he.landingTagline}, משימות אמיתיות ומורה AI אישי שילווה אותך בכל שלב בדרך לשליטה ב־SQL.</p>

          <div className={styles.ctaRow}>
            <Link
              to="/world"
              className={styles.ctaPrimary}
              data-testid="landing-enter-world-link"
            >
              <span aria-hidden>⚔️</span>
              {he.landingEnterCta}
            </Link>
            <Link to="/world" className={styles.ctaSecondary}>
              <span aria-hidden>👁</span>
              צפה בעולם
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.features} aria-label="יתרונות">
        {FEATURES.map((f) => (
          <article key={f.title} className={styles.featureCard} data-tone={f.tone}>
            <div className={styles.featureIcon} aria-hidden>{f.icon}</div>
            <h3 className={styles.featureTitle}>{f.title}</h3>
            <p className={styles.featureText}>{f.text}</p>
          </article>
        ))}
      </section>

      <section className={styles.bottomRow}>
        <div className={styles.statsBar} aria-label="סטטיסטיקות שחקן">
          {STATS.map((s) => (
            <div key={s.label} className={styles.stat} data-tone={s.tone}>
              <div className={styles.statIcon} aria-hidden>{s.icon}</div>
              <div>
                <div className={styles.statValue}>{s.value}</div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <aside className={styles.companion} aria-label="Odin AI">
          <div className={styles.avatar}>
            <span className={styles.avatarEyes} aria-hidden>◉ ◉</span>
            <span className={styles.online} aria-hidden />
          </div>
          <div className={styles.companionText}>
            <div className={styles.companionName}>
              Odin AI
              <span className={styles.companionTag}>ONLINE</span>
            </div>
            <p className={styles.companionMsg}>ברוך בבא, בר! אני כאן כדי לעזור לך להפוך למאסטר SQL בעולם שלנו.</p>
          </div>
        </aside>
      </section>
    </div>
  )
}
