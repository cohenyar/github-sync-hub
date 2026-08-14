import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../integrations/supabase/client'
import styles from './OAuthConsent.module.css'

type OAuthNamespace = {
  getAuthorizationDetails: (id: string) => Promise<{ data?: any; error?: { message: string } | null }>
  approveAuthorization: (id: string) => Promise<{ data?: any; error?: { message: string } | null }>
  denyAuthorization: (id: string) => Promise<{ data?: any; error?: { message: string } | null }>
}

/** The `supabase.auth.oauth` namespace is beta and not in the shipped types. */
function oauthApi(): OAuthNamespace {
  return (supabase.auth as unknown as { oauth: OAuthNamespace }).oauth
}

/**
 * Routed at /.lovable/oauth/consent — where Supabase (the OAuth 2.1
 * authorization server) sends the user to approve or deny an MCP client
 * such as Claude or ChatGPT connecting to this app as them.
 */
export default function OAuthConsent() {
  const [params] = useSearchParams()
  const authorizationId = params.get('authorization_id') ?? ''
  const [details, setDetails] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    void (async () => {
      if (!authorizationId) {
        setError('חסר מזהה בקשת הרשאה (authorization_id)')
        return
      }
      const { data: sess } = await supabase.auth.getSession()
      if (!sess.session) {
        const next = window.location.pathname + window.location.search
        window.location.href = '/auth?next=' + encodeURIComponent(next)
        return
      }
      const { data, error: detailsError } = await oauthApi().getAuthorizationDetails(authorizationId)
      if (!active) return
      if (detailsError) {
        setError(detailsError.message)
        return
      }
      const immediate = data?.redirect_url ?? data?.redirect_to
      if (immediate && !data?.client) {
        window.location.href = immediate
        return
      }
      setDetails(data)
    })()
    return () => {
      active = false
    }
  }, [authorizationId])

  async function decide(approve: boolean) {
    setBusy(true)
    const api = oauthApi()
    const { data, error: decisionError } = approve
      ? await api.approveAuthorization(authorizationId)
      : await api.denyAuthorization(authorizationId)
    if (decisionError) {
      setBusy(false)
      setError(decisionError.message)
      return
    }
    const target = data?.redirect_url ?? data?.redirect_to
    if (!target) {
      setBusy(false)
      setError('שרת ההרשאות לא החזיר כתובת חזרה')
      return
    }
    window.location.href = target
  }

  const clientName = details?.client?.name ?? 'אפליקציה חיצונית'

  return (
    <main className={styles.page} dir="rtl" lang="he">
      <section className={styles.card}>
        {error ? (
          <>
            <h1 className={styles.title}>לא ניתן לטעון את בקשת ההרשאה</h1>
            <p className={styles.body}>{error}</p>
          </>
        ) : !details ? (
          <p className={styles.body}>טוען…</p>
        ) : (
          <>
            <h1 className={styles.title}>חיבור {clientName} לחשבון שלך</h1>
            <p className={styles.body}>
              אישור יאפשר ל{clientName} לגשת לנתוני Meridian שלך ולפעול בשמך, בהתאם להרשאות החשבון.
            </p>
            <div className={styles.actions}>
              <button type="button" className={styles.approve} disabled={busy} onClick={() => void decide(true)}>
                אישור
              </button>
              <button type="button" className={styles.deny} disabled={busy} onClick={() => void decide(false)}>
                דחייה
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  )
}
