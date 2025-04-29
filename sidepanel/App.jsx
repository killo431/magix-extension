import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // Import the Supabase client

function App() {
  const [session, setSession] = useState(null); // Use Supabase session
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Keep loading state

  // Check for existing session on component mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      console.log("Initial session:", session);
    });

    // Listen for auth changes (sign in, sign out)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        console.log("Auth state changed:", _event, session);
        setIsLoading(false); // Stop loading on auth change
        setError(null); // Clear errors on auth change
      }
    );

    // Cleanup listener on component unmount
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    console.log("Attempting Google sign-in via launchWebAuthFlow...");

    try {
      // 1. Get manifest details
      const manifest = chrome.runtime.getManifest();
      if (!manifest.oauth2?.client_id || !manifest.oauth2?.scopes) {
        throw new Error("OAuth2 configuration missing in manifest.json");
      }

      // 2. Construct the Google Auth URL
      const authUrl = new URL('https://accounts.google.com/o/oauth2/auth');
      const redirectUri = `https://${chrome.runtime.id}.chromiumapp.org`; // Standard redirect for Chrome extensions

      authUrl.searchParams.set('client_id', manifest.oauth2.client_id);
      authUrl.searchParams.set('response_type', 'id_token'); // Request ID token
      authUrl.searchParams.set('access_type', 'offline'); // Optional: for refresh token if needed later
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('scope', manifest.oauth2.scopes.join(' '));
      // Optional: Add nonce and state for extra security if desired

      console.log("Auth URL:", authUrl.href);

      // 3. Launch the web auth flow
      chrome.identity.launchWebAuthFlow(
        {
          url: authUrl.href,
          interactive: true,
        },
        async (redirectedTo) => {
          if (chrome.runtime.lastError || !redirectedTo) {
            console.error("launchWebAuthFlow error:", chrome.runtime.lastError?.message);
            setError(`Sign-in failed: ${chrome.runtime.lastError?.message || 'User cancelled or flow failed.'}`);
            setIsLoading(false);
            return;
          }

          console.log("Redirected URL:", redirectedTo);

          // 4. Extract the ID token from the redirected URL hash
          try {
            const redirectedUrl = new URL(redirectedTo);
            const params = new URLSearchParams(redirectedUrl.hash.substring(1)); // Remove leading '#'
            const idToken = params.get('id_token');

            if (!idToken) {
              console.error("ID token not found in redirect URL hash:", redirectedUrl.hash);
              setError("Sign-in failed: ID token not found in response.");
              setIsLoading(false);
              return;
            }

            console.log("Extracted ID Token (first 10 chars):", idToken.substring(0, 10));

            // 5. Sign in to Supabase with the ID token
            const { data, error: supabaseError } = await supabase.auth.signInWithIdToken({
              provider: 'google',
              token: idToken,
              // nonce: 'OPTIONAL_NONCE_IF_USED' // Include nonce if you added it to the auth URL
            });

            if (supabaseError) {
              console.error("Supabase signInWithIdToken error:", supabaseError);
              setError(`Sign-in failed: ${supabaseError.message}`);
              setIsLoading(false);
            } else {
              console.log("Supabase sign-in successful:", data);
              // onAuthStateChange listener should handle setting the session
              // No need to call setIsLoading(false) here, onAuthStateChange does it
            }
          } catch (parseError) {
            console.error("Error parsing redirect URL or signing in:", parseError);
            setError(`Sign-in failed: ${parseError.message}`);
            setIsLoading(false);
          }
        }
      );
    } catch (error) {
      console.error("Error constructing auth URL or getting manifest:", error.message);
      setError(`Sign-in failed: ${error.message}`);
      setIsLoading(false);
    }
  };


  const handleSignOut = async () => {
    setError(null);
    setIsLoading(true);
    console.log("Attempting Supabase sign-out...");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Session will be set to null by the onAuthStateChange listener
    } catch (error) {
      console.error("Error during sign-out:", error.message);
      setError(`Sign-out failed: ${error.message}`);
      setIsLoading(false);
    }
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '10px' }}>
      <h1>Magix</h1>
      <div style={{ flexGrow: 1, border: '1px solid #ccc', marginBottom: '10px', padding: '5px', overflowY: 'auto' }}>
        {/* Chat messages will go here */}
        <p>Chat interface placeholder.</p>
        {session && <p>Welcome, {session.user.email}!</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input type="text" placeholder="Describe your change..." style={{ flexGrow: 1, padding: '8px' }} disabled={!session} />
        <button style={{ padding: '8px 15px', backgroundColor: 'black', color: 'white', border: 'none', cursor: 'pointer' }} disabled={!session}>Send</button>
      </div>
      {/* Auth Buttons */}
      {!session ? (
         <button
           onClick={handleSignIn}
           disabled={isLoading}
           style={{ marginTop: '10px', padding: '10px', backgroundColor: 'black', color: 'white', border: 'none', cursor: 'pointer' }}
         >
           {isLoading ? 'Signing In...' : 'Sign in with Google'}
         </button>
       ) : (
         <button
           onClick={handleSignOut}
           disabled={isLoading}
           style={{ marginTop: '10px', padding: '10px', backgroundColor: 'grey', color: 'white', border: 'none', cursor: 'pointer' }}
          >
           {isLoading ? 'Signing Out...' : 'Sign Out'}
         </button>
       )}
    </div>
  );
}

export default App;
