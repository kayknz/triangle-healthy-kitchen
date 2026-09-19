import { useState, useEffect } from 'react';
import SubscriberAuth from '../components/auth/SubscriberAuth';
import ProviderAuth from '../components/auth/ProviderAuth';
import { type UserRole } from '../lib/auth';

export default function LoginPage() {
  const [authType, setAuthType] = useState<'subscriber' | 'provider'>('subscriber');

  useEffect(() => {
    const handleHash = () => {
      setAuthType(window.location.hash === '#provider' ? 'provider' : 'subscriber');
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleSuccess = (role?: UserRole, dual?: boolean) => {
    // If they have dual access, send them to home to trigger the selector
    if (dual) {
      window.location.replace('/');
      return;
    }
    const target = role === 'owner' ? '/dashboard' : role === 'rider' ? '/rider' : '/account';
    window.location.replace(target);
  };

  if (authType === 'provider') {
    return (
      <ProviderAuth
        onBack={() => window.location.hash = ''}
        onSuccess={(role, dual) => handleSuccess(role, dual)}
      />
    );
  }

  return (
    <SubscriberAuth
      onBack={() => window.location.href = '/'}
      onSuccess={(dual) => handleSuccess(undefined, dual)}
    />
  );
}
