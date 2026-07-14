export interface AdminMutationResult {
  success: boolean
  errors: string[]
}

export function toAdminMutationResult(mutate: () => void): AdminMutationResult {
  try {
    mutate()
    return { success: true, errors: [] }
  } catch (error) {
    return { success: false, errors: [error instanceof Error ? error.message : String(error)] }
  }
}
