import { useState } from 'react';
import { User, RotateCcw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { adminApi } from '../../lib/api';

export function ProfilePage() {
  const { profile } = useAuth();
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleReset = async () => {
    setIsResetting(true);
    setResetMessage(null);

    try {
      const response = await adminApi.reset();

      if (response.error) {
        setResetMessage(`Error: ${response.error}`);
      } else {
        // Reload immediately to show fresh data
        window.location.reload();
      }
    } catch (error) {
      setResetMessage('Failed to reset database');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <User className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-semibold">
            {profile?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{profile?.username}</h2>
            <p className="text-gray-500">{profile?.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={profile?.username || ''}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={profile?.email || ''}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
            <input
              type="text"
              value={
                profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : ''
              }
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-4">
          <RotateCcw className="w-6 h-6 text-orange-600" />
          <h2 className="text-xl font-semibold text-gray-900">Database Reset</h2>
        </div>
        <p className="text-gray-600 mb-4">
          Reset the database to its initial state with sample projects and tasks.
        </p>
        <button
          onClick={handleReset}
          disabled={isResetting}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="reset-database-button"
        >
          <RotateCcw className={`w-5 h-5 ${isResetting ? 'animate-spin' : ''}`} />
          {isResetting ? 'Resetting...' : 'Reset Database'}
        </button>
        {resetMessage && (
          <div
            className={`mt-4 p-3 rounded-lg ${
              resetMessage.startsWith('Error')
                ? 'bg-red-50 text-red-800 border border-red-200'
                : 'bg-green-50 text-green-800 border border-green-200'
            }`}
            data-testid="reset-message"
          >
            {resetMessage}
          </div>
        )}
      </div>
    </div>
  );
}
