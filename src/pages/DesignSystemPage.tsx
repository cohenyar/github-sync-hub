import { AppShell, type AppShellNavItem } from '../platform/shell/AppShell'
import { Badge, Button, Card, Pill } from '../platform/ui'

/**
 * Hidden QA route (/dev/design-system). Not linked from any user-facing
 * navigation — reachable only by typing the URL — so it never leaks into
 * production surfaces while still giving Phase 0 something visible to
 * verify against in Playwright / manual screenshots.
 */
const NAV: AppShellNavItem[] = [
  { to: '/', label: 'בית', icon: '⌂' },
  { to: '/dashboard', label: 'לוח', icon: '◆' },
  { to: '/courses', label: 'קורסים', icon: '❦' },
  { to: '/world', label: 'עולם', icon: '◉' },
  { to: '/tutor', label: 'מנטור', icon: '✧' },
  { to: '/profile', label: 'פרופיל', icon: '☺' },
]

export function DesignSystemPage() {
  return (
    <AppShell
      navItems={NAV}
      actions={
        <Button variant="ai" size="sm" leadingIcon={<span>✦</span>}>
          שאל את המנטור
        </Button>
      }
    >
      <header style={{ marginBlockEnd: 'var(--ds-space-10)' }}>
        <Pill tone="ai">מערכת עיצוב · שלב 0</Pill>
        <h1
          style={{
            fontSize: 'var(--ds-text-4xl)',
            letterSpacing: 'var(--ds-tracking-tighter)',
            lineHeight: 'var(--ds-leading-tight)',
            margin: 'var(--ds-space-4) 0 var(--ds-space-3)',
            color: 'var(--ds-text-strong)',
          }}
        >
          שפה חזותית עבור מרידיאן
        </h1>
        <p style={{ color: 'var(--ds-text-muted)', maxInlineSize: 640 }}>
          יסודות בלבד: טוקנים, טיפוגרפיה, פרימיטיבים, וקליפה ראשית. אין שינויים במסכי משתמש
          קיימים ולא במשחק שרץ ב־/world.
        </p>
      </header>

      <section
        style={{
          display: 'grid',
          gap: 'var(--ds-space-6)',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          marginBlockEnd: 'var(--ds-space-10)',
        }}
      >
        <Card>
          <h2
            style={{
              margin: 0,
              fontSize: 'var(--ds-text-lg)',
              color: 'var(--ds-text-strong)',
            }}
          >
            כרטיס בסיס
          </h2>
          <p style={{ color: 'var(--ds-text-muted)', marginBlockStart: 'var(--ds-space-2)' }}>
            משטח זכוכית עם גבול עדין וטשטוש רקע.
          </p>
        </Card>
        <Card tone="accent">
          <Badge>מודגש</Badge>
          <h2
            style={{
              margin: 'var(--ds-space-3) 0 0',
              fontSize: 'var(--ds-text-lg)',
              color: 'var(--ds-text-strong)',
            }}
          >
            כרטיס אקסנט
          </h2>
        </Card>
        <Card tone="ai">
          <Badge tone="ai">AI</Badge>
          <h2
            style={{
              margin: 'var(--ds-space-3) 0 0',
              fontSize: 'var(--ds-text-lg)',
              color: 'var(--ds-text-strong)',
            }}
          >
            תובנת מנטור
          </h2>
          <p style={{ color: 'var(--ds-text-muted)', marginBlockStart: 'var(--ds-space-2)' }}>
            צבע ייעודי לתכנים שמופקים על ידי מנוע ה־AI.
          </p>
        </Card>
      </section>

      <section
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--ds-space-3)',
          marginBlockEnd: 'var(--ds-space-10)',
        }}
      >
        <Button variant="primary">התחל עכשיו</Button>
        <Button variant="ai" leadingIcon={<span>✦</span>}>
          שאל את המנטור
        </Button>
        <Button variant="secondary">משני</Button>
        <Button variant="ghost">רפאים</Button>
        <Button variant="primary" size="lg">
          גדול
        </Button>
        <Button variant="secondary" size="sm">
          קטן
        </Button>
        <Button variant="secondary" disabled>
          מושבת
        </Button>
      </section>

      <section
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--ds-space-2)',
          marginBlockEnd: 'var(--ds-space-10)',
        }}
      >
        <Badge>ניטרלי</Badge>
        <Badge tone="success">הושלם</Badge>
        <Badge tone="warning">בהמתנה</Badge>
        <Badge tone="danger">חסום</Badge>
        <Badge tone="ai">AI</Badge>
        <Pill>תווית</Pill>
        <Pill tone="ai">מנטור פעיל</Pill>
      </section>

      <section>
        <h2
          style={{
            fontSize: 'var(--ds-text-2xl)',
            color: 'var(--ds-text-strong)',
            letterSpacing: 'var(--ds-tracking-tight)',
            margin: '0 0 var(--ds-space-4)',
          }}
        >
          טיפוגרפיה
        </h2>
        <div style={{ display: 'grid', gap: 'var(--ds-space-3)' }}>
          <span style={{ fontSize: 'var(--ds-text-5xl)', color: 'var(--ds-text-strong)', lineHeight: 1.1, letterSpacing: 'var(--ds-tracking-tighter)' }}>
            כותרת ראשית — Display 5xl
          </span>
          <span style={{ fontSize: 'var(--ds-text-3xl)', color: 'var(--ds-text-strong)' }}>
            כותרת משנה — 3xl
          </span>
          <span style={{ fontSize: 'var(--ds-text-lg)' }}>גוף טקסט — 18 פיקסלים</span>
          <span style={{ fontSize: 'var(--ds-text-sm)', color: 'var(--ds-text-muted)' }}>
            טקסט משני — 14 פיקסלים
          </span>
          <code style={{ fontFamily: 'var(--ds-font-mono)', color: 'var(--ds-accent-strong)' }}>
            SELECT * FROM courses WHERE tutor = 'AI';
          </code>
        </div>
      </section>
    </AppShell>
  )
}

export default DesignSystemPage
