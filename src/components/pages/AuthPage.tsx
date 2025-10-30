import { useState } from 'react';
import { LoginForm } from '../auth/LoginForm';
import { SignupForm } from '../auth/SignupForm';

interface AuthPageProps {
  onAuthSuccess: () => void;
}

export function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">SingleFlow</h1>
          <p className="text-gray-600">Collaborative Project Management</p>
        </div>

        {mode === 'login' ? (
          <LoginForm onSuccess={onAuthSuccess} onSwitchToSignup={() => setMode('signup')} />
        ) : (
          <SignupForm onSuccess={onAuthSuccess} onSwitchToLogin={() => setMode('login')} />
        )}
      </div>
    </div>
  );
}
