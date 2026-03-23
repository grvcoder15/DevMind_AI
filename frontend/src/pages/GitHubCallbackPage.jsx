import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Spinner from '../components/Spinner';

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export default function GitHubCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const errorParam = params.get('error');

      if (errorParam) {
        setError(`GitHub OAuth error: ${errorParam}`);
        setTimeout(() => navigate('/'), 3000);
        return;
      }

      if (!code) {
        setError('No authorization code received');
        setTimeout(() => navigate('/'), 3000);
        return;
      }

      try {
        // Exchange code for access token
        const response = await fetch(`${API_BASE}/github/oauth/callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.detail || 'Failed to authenticate with GitHub');
        }

        const data = await response.json();
        
        // Store access token in localStorage
        localStorage.setItem('github_token', data.access_token);
        localStorage.setItem('github_user', JSON.stringify(data.user));

        // Redirect to home page
        navigate('/', { state: { githubAuth: 'success' } });
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err.message);
        setTimeout(() => navigate('/'), 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-md p-8 rounded-xl border border-white/20 text-center">
        {error ? (
          <div>
            <div className="text-red-400 text-xl mb-4">❌ {error}</div>
            <p className="text-gray-300">Redirecting to home...</p>
          </div>
        ) : (
          <div>
            <Spinner size="lg" />
            <p className="text-gray-300 mt-4">Authenticating with GitHub...</p>
          </div>
        )}
      </div>
    </div>
  );
}
