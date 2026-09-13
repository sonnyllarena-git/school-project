import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import AccountView from '../../components/AccountView';
import { useAuth } from '../../lib/AuthContext';
import { api } from '../../lib/api';

export default function StudentAccount() {
  const { session } = useAuth();
  const [account, setAccount] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.myAccount(session.token).then(setAccount).catch(err => setError(err.message));
  }, [session]);

  return (
    <Layout title="My Account">
      {error && <div className="error-banner">{error}</div>}
      <AccountView account={account} />
    </Layout>
  );
}
