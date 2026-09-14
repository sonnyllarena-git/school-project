import { useSearchParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import AdminUserManagement from './AdminUserManagement';
import AdminImport from './AdminImport';
import AdminExport from './AdminExport';
import AdminAuditLog from './AdminAuditLog';

// Consolidates four infrequent, config-style admin tools that previously
// each had their own top-level sidebar entry — the sidebar was getting long
// with things nobody opens daily. Kept as one page with its own tab bar
// (query-param based, so a tab is directly linkable/bookmarkable) rather
// than four separate routes, to actually shrink the sidebar instead of just
// hiding the same fifteen destinations one level deeper.
const TABS = [
  { key: 'users', label: 'User Management', Component: AdminUserManagement },
  { key: 'import', label: 'Import Roster', Component: AdminImport },
  { key: 'export', label: 'Data Export', Component: AdminExport },
  { key: 'audit', label: 'Audit Log', Component: AdminAuditLog },
];

export default function AdminAdministration() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeKey = TABS.some(t => t.key === searchParams.get('tab')) ? searchParams.get('tab') : 'users';
  const Active = TABS.find(t => t.key === activeKey).Component;

  return (
    <Layout title="Administration">
      <div className="card" style={{ marginBottom: 20, padding: 8 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button
              key={t.key}
              className={activeKey === t.key ? '' : 'secondary'}
              onClick={() => setSearchParams({ tab: t.key })}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <Active />
    </Layout>
  );
}
