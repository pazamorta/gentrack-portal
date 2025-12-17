
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export const OAuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [details, setDetails] = useState('');
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    
    if (!code) {
      setStatus('error');
      setDetails('No authorization code found in URL.');
      return;
    }

    const exchangeCode = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        // Need to match exactly the URI sent in the authorize step (or default)
        // We'll trust the default on server or send current URL origin + path
        const redirectUri = window.location.origin + window.location.pathname;

        const response = await fetch(`${apiUrl}/api/auth/exchange`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
             code,
             redirect_uri: redirectUri 
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          if (data.refresh_token) {
             setRefreshToken(data.refresh_token);
          }
          // Redirect after 3 seconds or let user stay
          // setTimeout(() => navigate('/'), 3000);
        } else {
          setStatus('error');
          setDetails(data.error_description || data.error || 'Unknown error');
        }
      } catch (e: any) {
        setStatus('error');
        setDetails(e.message);
      }
    };

    exchangeCode();
  }, [searchParams]);

  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        navigate('/');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

  return (
    <div className="min-h-screen pt-24 px-4 container mx-auto text-white">
      <div className="max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-xl p-8 backdrop-blur-sm">
        <h1 className="text-2xl font-bold mb-4">Salesforce Authentication</h1>
        
        {status === 'processing' && (
            <div className="flex items-center gap-4">
                <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                <p>Completing authentication...</p>
            </div>
        )}

        {status === 'success' && (
            <div className="space-y-4">
                <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-green-200">
                    <h3 className="font-bold flex items-center gap-2">
                        <span>✅</span> Connection Successful!
                    </h3>
                    <p>Your Salesforce account has been linked successfully.</p>
                </div>
                
                <p className="text-gray-400">Redirecting you back to the application...</p>

                <button 
                    onClick={() => navigate('/')}
                    className="bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                    Return Immediately
                </button>
            </div>
        )}

        {status === 'error' && (
            <div className="space-y-4">
                <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200">
                    <h3 className="font-bold flex items-center gap-2">
                        <span>❌</span> Authentication Failed
                    </h3>
                    <p>{details}</p>
                </div>
                 <button 
                    onClick={() => navigate('/')}
                    className="border border-white/20 text-white px-6 py-2 rounded-lg font-medium hover:bg-white/10 transition-colors"
                >
                    Back to Home
                </button>
            </div>
        )}
      </div>
    </div>
  );
};
