import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient'; // Import the Supabase client
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Switch from '@mui/material/Switch';
import AccountCircleIcon from '@mui/icons-material/AccountCircle'; // Profile icon
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'; // Submit icon
import Paper from '@mui/material/Paper'; // For message bubbles
import CircularProgress from '@mui/material/CircularProgress'; // Simple loading indicator

function App() {
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // For auth loading
  const [inputValue, setInputValue] = useState('');
  const [isChatView, setIsChatView] = useState(false); // Toggle between home and chat
  const [messages, setMessages] = useState([]); // Array to hold chat messages
  const chatEndRef = useRef(null); // Ref to scroll to bottom

  // --- Authentication Handling ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      console.log("Initial session:", session);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        console.log("Auth state changed:", _event, session);
        setIsLoading(false);
        setError(null);
        if (!session) {
          setIsChatView(false);
          setMessages([]);
        }
      }
    );
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // --- Scroll to bottom effect ---
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    console.log("Attempting Google sign-in via launchWebAuthFlow...");
    try {
      const manifest = chrome.runtime.getManifest();
      if (!manifest.oauth2?.client_id || !manifest.oauth2?.scopes) {
        throw new Error("OAuth2 configuration missing in manifest.json");
      }
      const authUrl = new URL('https://accounts.google.com/o/oauth2/auth');
      const redirectUri = `https://${chrome.runtime.id}.chromiumapp.org`;
      authUrl.searchParams.set('client_id', manifest.oauth2.client_id);
      authUrl.searchParams.set('response_type', 'id_token');
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('scope', manifest.oauth2.scopes.join(' '));
      chrome.identity.launchWebAuthFlow(
        { url: authUrl.href, interactive: true },
        async (redirectedTo) => {
          if (chrome.runtime.lastError || !redirectedTo) {
            setError(`Sign-in failed: ${chrome.runtime.lastError?.message || 'User cancelled or flow failed.'}`);
            setIsLoading(false); return;
          }
          try {
            const redirectedUrl = new URL(redirectedTo);
            const params = new URLSearchParams(redirectedUrl.hash.substring(1));
            const idToken = params.get('id_token');
            if (!idToken) {
              setError("Sign-in failed: ID token not found in response.");
              setIsLoading(false); return;
            }
            const { error: supabaseError } = await supabase.auth.signInWithIdToken({
              provider: 'google', token: idToken,
            });
            if (supabaseError) throw supabaseError;
          } catch (parseError) {
            setError(`Sign-in failed: ${parseError.message}`);
            setIsLoading(false);
          }
        }
      );
    } catch (error) {
      setError(`Sign-in failed: ${error.message}`);
      setIsLoading(false);
    }
  };

  // --- Input Handling ---
  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleSubmit = () => {
    if (isLoading) return;
    const messageText = inputValue.trim();
    if (!messageText) return;

    console.log("Submitted:", messageText);

    if (!session) {
      console.log("User not authenticated, triggering sign-in...");
      handleSignIn();
    } else {
      console.log("User authenticated, adding dummy messages...");
      const newUserMessage = { id: Date.now(), sender: 'user', text: messageText };
      const magixResponse = { id: Date.now() + 1, sender: 'magix', text: `Sure, let me try to modify: "${messageText.substring(0, 30)}..."` };
      const magixIndicator = { id: Date.now() + 2, sender: 'magix', status: 'processing' };

      setMessages(prev => [...prev, newUserMessage, magixResponse, magixIndicator]);
      setIsChatView(true);
      setInputValue('');
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  // --- Dummy Recent Data ---
  const recentItems = [
    { id: 1, text: 'Hide the promotions tab in gmail', active: true },
    { id: 2, text: 'Hide the promotions tab in gmail', active: false },
    { id: 3, text: 'Hide the promotions tab in gmail', active: true },
  ];

  // --- Render Functions ---

  // Input area for the HOME screen (multi-line)
  const renderHomeInputArea = () => (
    <Box sx={{
      display: 'flex', flexDirection: 'column', p: 1, borderRadius: 3,
      bgcolor: 'grey.100', border: '1px solid #e0e0e0', position: 'relative',
      mb: 2, minHeight: 'calc(1.5em * 4 + 16px)',
    }}>
      <TextField
        fullWidth multiline minRows={2} maxRows={3} variant="standard"
        placeholder="Ask Magix..." value={inputValue} onChange={handleInputChange} onKeyDown={handleKeyDown}
        InputProps={{ disableUnderline: true, sx: { fontSize: '0.9rem' } }}
        sx={{ flexGrow: 1, '& .MuiInputBase-root': { py: 0.5 }, mb: 4 }}
      />
      <IconButton
        onClick={handleSubmit} disabled={isLoading || !inputValue.trim()}
        sx={{
          position: 'absolute', bottom: 8, right: 8, bgcolor: 'common.black', color: 'common.white',
          width: 28, height: 28, '&:hover': { bgcolor: 'grey.800' },
          '&.Mui-disabled': { backgroundColor: 'grey.300', color: 'grey.500' }
        }}
      >
        <ArrowUpwardIcon sx={{ fontSize: '1rem' }} />
      </IconButton>
    </Box>
  );

  // Input area for the CHAT screen (single-line)
  const renderChatInputArea = () => (
    <Box sx={{
      display: 'flex', flexDirection: 'row', alignItems: 'center', // Changed to row
      p: 1, borderRadius: 3, bgcolor: 'grey.100', border: '1px solid #e0e0e0',
      mt: 'auto' // Push to bottom
    }}>
      <TextField
        fullWidth
        multiline={false} // Single line
        variant="standard"
        placeholder="Ask Magix..."
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown} // Keep Enter key submission
        InputProps={{ disableUnderline: true, sx: { fontSize: '0.9rem' } }}
        sx={{ mr: 1, '& .MuiInputBase-root': { py: 1 } }} // Adjusted padding/margin
      />
      <IconButton
        onClick={handleSubmit}
        disabled={isLoading || !inputValue.trim()}
        sx={{
          // No longer absolute position
          bgcolor: 'common.black', color: 'common.white',
          width: 28, height: 28,
          '&:hover': { bgcolor: 'grey.800' },
          '&.Mui-disabled': { backgroundColor: 'grey.300', color: 'grey.500' }
        }}
      >
        <ArrowUpwardIcon sx={{ fontSize: '1rem' }} />
      </IconButton>
    </Box>
  );

  const renderHomeScreen = () => (
    <>
      <Typography variant="h6" component="h1" sx={{ textAlign: 'center', mb: 2, fontSize: '1.05rem', fontWeight: 600 }}>
        Modify any website 🪄
      </Typography>
      {renderHomeInputArea()} {/* Use home input */}
      {session && (
        <Box sx={{ flexGrow: 1, overflowY: 'auto', mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'text.secondary' }}>
            Recent:
          </Typography>
          <List dense sx={{ pt: 0 }}>
            {recentItems.map((item) => (
              <ListItem key={item.id} secondaryAction={ <Switch edge="end" checked={item.active} inputProps={{ 'aria-labelledby': `switch-list-label-${item.id}` }} sx={{ transform: 'scale(0.75)', '& .MuiSwitch-switchBase.Mui-checked': { color: 'green', '&:hover': { backgroundColor: 'rgba(0, 128, 0, 0.08)' }, }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: 'green', }, }} /> } sx={{ border: '1px solid #e0e0e0', borderRadius: 2, mb: 1, py: 0.5 }} >
                <ListItemText id={`switch-list-label-${item.id}`} primary={item.text} primaryTypographyProps={{ sx: { fontSize: '0.9rem' } }} />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </>
  );

  const renderChatScreen = () => (
    <>
      {/* Chat Message Area - Ensure it grows and scrolls */}
      {/* Added pt: 4 to account for absolutely positioned icon */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', mb: 2, display: 'flex', flexDirection: 'column', gap: 1, pt: 4 }}>
        {messages.map((msg) => (
          <Box key={msg.id} sx={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
            {msg.status === 'processing' ? (
              <Paper elevation={0} sx={{ p: 1, borderRadius: 2, bgcolor: 'grey.200', display: 'flex', alignItems: 'center', gap: 1 }}>
                 <CircularProgress size={16} sx={{ color: 'grey.500' }}/>
                 <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', fontSize: '0.9rem' }}>
                   Doing magix...
                 </Typography>
              </Paper>
            ) : (
              <Paper elevation={1} sx={{ p: 1.5, borderRadius: 2, bgcolor: msg.sender === 'user' ? 'grey.300' : 'grey.100' }}>
                 {/* Added wordBreak */}
                <Typography variant="body2" sx={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {msg.text}
                </Typography>
              </Paper>
            )}
          </Box>
        ))}
        <div ref={chatEndRef} />
      </Box>
      {renderChatInputArea()} {/* Use chat input */}
    </>
  );

  return (
    // Main container - Ensure flex column and full height
    <Box sx={{
      display: 'flex', flexDirection: 'column', height: '100vh', // Use vh for full viewport height
      p: 2, // Keep padding
      bgcolor: 'background.paper',
      justifyContent: !isChatView && !session ? 'center' : 'flex-start'
    }}>
      {session && (
        <AccountCircleIcon sx={{ color: 'grey.600', position: 'absolute', top: 16, left: 16, fontSize: '1.25rem' }} />
      )}

      {isChatView ? renderChatScreen() : renderHomeScreen()}

      {error && (
        <Typography color="error" sx={{ mt: 2, textAlign: 'center' }}>
          Error: {error}
        </Typography>
      )}

      {/* Sign Out Button (Only on Home Screen) */}
      {session && !isChatView && (
         <button
           onClick={() => supabase.auth.signOut()}
           disabled={isLoading}
           style={{ marginTop: '10px', padding: '10px', backgroundColor: 'grey', color: 'white', border: 'none', cursor: 'pointer', alignSelf: 'center' }}
          >
           {isLoading ? 'Signing Out...' : 'Sign Out'}
         </button>
       )}
    </Box>
  );
}

export default App;
