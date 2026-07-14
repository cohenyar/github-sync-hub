export type AdminSectionStatus = 'Read-only foundation' | 'CRUD enabled'

export interface AdminSection {
  id: string
  title: string
  description: string
  itemCount: number
  status: AdminSectionStatus
}
