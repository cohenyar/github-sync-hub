import { useUsers } from '../../cms'
import { he } from '../../i18n'
import styles from './components/adminCrud.module.css'

export function AdminUsers() {
  const { state } = useUsers()

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>{he.adminNavUsers}</h1>
      </div>

      <p className={styles.breadcrumb}>{he.adminUsersProgressNote}</p>

      {state.status === 'loading' && <div className={styles.loadingState}>{he.adminLoadingMessage}</div>}
      {state.status === 'error' && <div className={styles.errorState}>{state.message}</div>}
      {state.status === 'ready' && state.items.length === 0 && <div className={styles.emptyState}>{he.adminEmptyUsers}</div>}

      {state.status === 'ready' && state.items.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{he.adminUsersColumnName}</th>
                <th>{he.adminUsersColumnEmail}</th>
                <th>{he.adminUsersColumnRole}</th>
                <th>{he.adminUsersColumnJoined}</th>
              </tr>
            </thead>
            <tbody>
              {state.items.map((user) => (
                <tr key={user.id}>
                  <td className={styles.titleCell}>{user.displayName ?? '—'}</td>
                  <td>{user.email ?? '—'}</td>
                  <td>{user.role === 'admin' ? he.adminRoleAdmin : he.adminRoleStudent}</td>
                  <td>{new Date(user.joinedAt).toLocaleDateString('he-IL')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
