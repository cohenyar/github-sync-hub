import { Badge, Button, Card, Pill } from '../platform/ui'

/**
 * Development-only design system showcase. Not linked from anywhere in
 * the product; conditionally mounted at /dev/design-system only when
 * `import.meta.env.DEV` is true, so it is stripped from production builds.
 *
 * Wrapped in a `.dsScope` class that opts INTO the platform typography
 * (Rubik / Heebo). The rest of the app — and especially /world — keeps
 * its existing system font. This is the guarantee that adding platform
 * fonts to index.html does not visually change the game.
 */
export function DesignSystemPage() {
  return (
    <div
      className="dsScope"
      style={{
        minHeight: '100vh',
        background: 'var(--ds-grad-hero)',
        color: 'var(--ds-fg)',
        fontFamily: 'var(--ds-font-body)',
        padding: '32px 20px',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: 960, display: 'flex', flexDirection: 'column', gap: 32 }}>
        <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 12, letterSpacing: '0.14em', color: 'var(--ds-fg-subtle)' }}>
            DEV · DESIGN SYSTEM
          </span>
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--ds-font-display)',
              fontWeight: 700,
              fontSize: 44,
              letterSpacing: '-0.02em',
              color: 'var(--ds-fg)',
            }}
          >
            מרידיאן — מערכת עיצוב
          </h1>
          <p style={{ margin: 0, color: 'var(--ds-fg-muted)', maxWidth: 560 }}>
            הצגה של הפרימיטיבים הבסיסיים לשלב 0: כפתורים, כרטיסים, תגים וצ׳יפים. המסך הזה מיועד לפיתוח בלבד
            ולא מקושר מהאפליקציה.
          </p>
        </header>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SectionTitle>Buttons</SectionTitle>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <Button variant="primary">התחל ללמוד</Button>
            <Button variant="ghost">רקע שקוף</Button>
            <Button variant="glass">זכוכית</Button>
            <Button variant="danger">אפס התקדמות</Button>
            <Button variant="primary" disabled>
              נעול
            </Button>
          </div>
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SectionTitle>Badges &amp; Pills</SectionTitle>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <Badge>ניטרלי</Badge>
            <Badge tone="accent">חדש</Badge>
            <Badge tone="success">הושלם</Badge>
            <Badge tone="danger">נכשל</Badge>
            <Pill>SQL SELECT</Pill>
            <Pill>JOIN</Pill>
            <Pill>אגרגציות</Pill>
          </div>
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SectionTitle>Cards</SectionTitle>
          <div
            style={{
              display: 'grid',
              gap: 16,
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            }}
          >
            <Card>
              <h3 style={{ margin: '0 0 8px', fontFamily: 'var(--ds-font-display)' }}>משימה נוכחית</h3>
              <p style={{ margin: 0, color: 'var(--ds-fg-muted)' }}>
                המשך את המשימה שלך והשלם את שאילתת ה־JOIN הראשונה שלך.
              </p>
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <Pill>קל</Pill>
                <Pill>~5 דק׳</Pill>
              </div>
            </Card>
            <Card>
              <h3 style={{ margin: '0 0 8px', fontFamily: 'var(--ds-font-display)' }}>המלצת AI</h3>
              <p style={{ margin: 0, color: 'var(--ds-fg-muted)' }}>
                אודין ממליץ לתרגל GROUP BY לפני המעבר לשלב הבא.
              </p>
              <div style={{ marginTop: 12 }}>
                <Button variant="ghost">קבל המלצה</Button>
              </div>
            </Card>
          </div>
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SectionTitle>Palette</SectionTitle>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(
              [
                ['bg', 'var(--ds-bg)'],
                ['surface', 'var(--ds-surface)'],
                ['surface-elev', 'var(--ds-surface-elev)'],
                ['accent', 'var(--ds-accent)'],
                ['accent-2', 'var(--ds-accent-2)'],
                ['success', 'var(--ds-success)'],
                ['danger', 'var(--ds-danger)'],
              ] as const
            ).map(([name, value]) => (
              <div
                key={name}
                style={{
                  width: 96,
                  padding: 8,
                  borderRadius: 12,
                  border: '1px solid var(--ds-border)',
                  background: 'var(--ds-surface)',
                  fontSize: 12,
                }}
              >
                <div style={{ height: 40, borderRadius: 8, background: value, marginBottom: 6 }} />
                <div style={{ color: 'var(--ds-fg-muted)' }}>{name}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        margin: 0,
        fontFamily: 'var(--ds-font-display)',
        fontWeight: 600,
        fontSize: 18,
        color: 'var(--ds-fg)',
      }}
    >
      {children}
    </h2>
  )
}
