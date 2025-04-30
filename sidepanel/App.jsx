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
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Popover from '@mui/material/Popover'; // For account dialog
// Removed duplicate List import
import ListItemButton from '@mui/material/ListItemButton'; // Clickable list items
// Removed duplicate ListItemText import

function App() {
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // For auth loading
  const [inputValue, setInputValue] = useState('');
  const [isChatView, setIsChatView] = useState(false);
  const [messages, setMessages] = useState([]);
  const chatContainerRef = useRef(null); // Ref for the scrollable chat container
  const chatEndRef = useRef(null);
  const [accountMenuAnchorEl, setAccountMenuAnchorEl] = useState(null); // State for account popover

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

  // --- Scroll to bottom effect (Simplified & Corrected) ---
  useEffect(() => {
    // Scroll to the end whenever messages change
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Account Menu Handlers ---
   const handleAccountMenuOpen = (event) => {
    setAccountMenuAnchorEl(event.currentTarget);
  };
  const handleAccountMenuClose = () => {
    setAccountMenuAnchorEl(null);
  };
  const openAccountMenu = Boolean(accountMenuAnchorEl);
  const accountMenuId = openAccountMenu ? 'account-popover' : undefined;

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
    // Add horizontal and bottom padding to this container
    <Box sx={{
      display: 'flex', flexDirection: 'row', alignItems: 'center',
      p: 1,
      px: 2,
      pb: 2,
      borderRadius: 0, // Removed border radius
      bgcolor: 'grey.100',
      border: '1px solid #e0e0e0',
      mt: 'auto'
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
    // Add padding here since it's removed from the main container
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
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
    </Box> // Close padding Box for home screen
  );

  const renderChatScreen = () => (
     // This Box now needs to manage the full height flex layout for chat
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Fixed Header */}
      <Box sx={{
        position: 'sticky', // Make header sticky
        top: 0,             // Stick to the top
        zIndex: 1,          // Ensure it's above scrolling content
        bgcolor: 'background.paper', // Give it a background
        p: 1,               // Add some padding
        mb: 1,              // Margin below header
        display: 'flex',
         justifyContent: 'space-between',
         alignItems: 'center'
      }}>
         {/* Clickable Profile Icon */}
         <IconButton onClick={handleAccountMenuOpen} size="small">
            <AccountCircleIcon sx={{ color: 'grey.600', fontSize: '1.25rem' }} />
         </IconButton>
         {/* Placeholder Toggle Switch */}
         <Switch
            size="small"
            checked={true} // Dummy checked state for styling
            // onChange={handleSomeToggle} // Add handler later
            inputProps={{ 'aria-label': 'dummy toggle' }}
            // Apply green styling like in recent list
            sx={{
              transform: 'scale(0.75)',
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: 'green',
                '&:hover': { backgroundColor: 'rgba(0, 128, 0, 0.08)' },
              },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                backgroundColor: 'green',
              },
            }}
         />
      </Box>
       {/* Account Popover/Dialog */}
       <Popover
          id={accountMenuId}
          open={openAccountMenu}
          anchorEl={accountMenuAnchorEl}
          onClose={handleAccountMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left'}}
          // Added borderRadius to paper slotProps
          slotProps={{ paper: { sx: { width: '200px', mt: 1, borderRadius: 2 } } }}
        >
          <List dense>
            <ListItem>
              <ListItemText primary="Monthly messages:" secondary="0/10" />
            </ListItem>
            {/* Updated onClick for Go to dashboard */}
            <ListItemButton onClick={() => { setIsChatView(false); handleAccountMenuClose(); }}>
              <ListItemText primary="Go to dashboard" />
            </ListItemButton>
            <ListItemButton onClick={() => { console.log('Account Settings clicked'); handleAccountMenuClose(); }}>
              <ListItemText primary="Account settings" />
            </ListItemButton>
          </List>
        </Popover>

      {/* Chat Message Area - Added ref */}
      <Box ref={chatContainerRef} sx={{ flexGrow: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
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
    </Box> // Close chat screen flex container
  );

  return (
    // Main container - Removed padding, ensure full height flex
    <Box sx={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      bgcolor: 'background.paper',
      justifyContent: !isChatView && !session ? 'center' : 'flex-start'
    }}>
      {/* Profile Icon is now inside renderChatScreen header */}

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
