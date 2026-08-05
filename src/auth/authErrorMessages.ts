import type { AuthError } from '@supabase/supabase-js'
import { he } from '../i18n'

/**
 * Translates a Supabase auth error into a ready-to-display Hebrew message,
 * switching on Supabase's own stable error codes rather than matching its
 * (English, subject to change) message text. Anything unrecognized falls
 * back to a generic, still-readable message rather than raw Supabase text.
 */
export function translateAuthError(error: AuthError): string {
  switch (error.code) {
    case 'invalid_credentials':
      return he.authErrorInvalidCredentials
    case 'user_already_exists':
      return he.authErrorUserExists
    case 'email_not_confirmed':
      return he.authErrorEmailNotConfirmed
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return he.authErrorRateLimited
    case 'weak_password':
      return he.authErrorWeakPassword
    default:
      return he.authErrorGeneric
  }
}
