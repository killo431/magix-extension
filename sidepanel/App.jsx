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
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; // Back icon
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Popover from '@mui/material/Popover';
import ListItemButton from '@mui/material/ListItemButton';
import Tabs from '@mui/material/Tabs'; // For settings screen
import Tab from '@mui/material/Tab';   // For settings screen
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Chip from '@mui/material/Chip'; // For Pro User pill
import LinearProgress from '@mui/material/LinearProgress'; // For usage bar

// TabPanel component for settings screen
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        // Removed default padding, will add specifically to content
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

// Placeholder suggestions for animation
const placeholderSuggestions = [
  "Hide the promotions tab in gmail",
  "Remove the shorts section in youtube",
  "Make twitter dark mode",
  "Increase font size on wikipedia",
];

// Removed test CSS constant

function App() {
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [currentView, setCurrentView] = useState('home'); // 'home', 'chat', 'settings'
  const [messages, setMessages] = useState([]);
  const chatContainerRef = useRef(null);
  const chatEndRef = useRef(null);
  const [accountMenuAnchorEl, setAccountMenuAnchorEl] = useState(null);
  const [settingsTab, setSettingsTab] = useState(0);
  const [userName, setUserName] = useState(''); // State for name field

  // State for placeholder animation
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [animatedPlaceholder, setAnimatedPlaceholder] = useState('');

  // --- Authentication Handling ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      // TODO: Fetch user profile/name if available
      console.log("Initial session:", session);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        console.log("Auth state changed:", _event, session);
        setIsLoading(false);
        setError(null);
        if (!session) {
          setCurrentView('home');
          setMessages([]);
        } else {
           // TODO: Fetch user profile/name if available
        }
      }
    );
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // --- Scroll to bottom effect ---
  useEffect(() => {
    if (currentView === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, currentView]);

  // --- Placeholder Animation Effect (Revised Timer Logic) ---
  useEffect(() => {
    // Only run animation on home screen
    if (currentView !== 'home') {
      setAnimatedPlaceholder(''); // Reset placeholder if navigating away
      return; // Stop the effect if not on home screen
    }

    let timeoutId; // Define timer ID variable

    // Typing effect
    if (subIndex < placeholderSuggestions[placeholderIndex].length && !reverse) {
      timeoutId = setTimeout(() => {
        setAnimatedPlaceholder(prev => prev + placeholderSuggestions[placeholderIndex][subIndex]);
        setSubIndex(prev => prev + 1);
      }, 100); // Typing speed
    }
    // Pause at end of typing
    else if (subIndex === placeholderSuggestions[placeholderIndex].length && !reverse) {
       timeoutId = setTimeout(() => {
         setReverse(true);
       }, 1500); // Pause duration
    }
    // Deleting effect
    else if (subIndex > 0 && reverse) {
      timeoutId = setTimeout(() => {
        setAnimatedPlaceholder(prev => prev.slice(0, -1));
        setSubIndex(prev => prev - 1);
      }, 50); // Deleting speed
    }
    // Switch to next placeholder after deleting
    else if (subIndex === 0 && reverse) {
      // No timeout needed here, just update state for the next cycle
      setReverse(false);
      setPlaceholderIndex(prev => (prev + 1) % placeholderSuggestions.length);
    }

    // Cleanup function clears the single timer
    return () => clearTimeout(timeoutId);

  }, [subIndex, placeholderIndex, reverse, currentView]); // Dependencies remain the same


  // --- Account Menu Handlers ---
   const handleAccountMenuOpen = (event) => {
    setAccountMenuAnchorEl(event.currentTarget);
  };
  const handleAccountMenuClose = () => {
    setAccountMenuAnchorEl(null);
  };
  const openAccountMenu = Boolean(accountMenuAnchorEl);
  const accountMenuId = openAccountMenu ? 'account-popover' : undefined;

  // --- Settings Tab Handler ---
  const handleSettingsTabChange = (event, newValue) => {
    setSettingsTab(newValue);
  };

  // --- Name Update Handler (Placeholder) ---
  const handleNameUpdate = () => {
    console.log("Update name clicked:", userName);
    // TODO: Implement actual name update logic with Supabase
  };

  // --- Delete Account Handler (Placeholder) ---
   const handleDeleteAccount = () => {
    console.log("Delete account clicked");
    // TODO: Implement confirmation and deletion logic
  };


  const handleSignIn = async () => {
    // ... (keep existing handleSignIn logic) ...
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

    console.log("handleSubmit triggered with text:", messageText);

    // Removed test script trigger logic

    if (!session) {
      console.log("User not authenticated, triggering sign-in...");
      handleSignIn();
    } else {
      console.log("User authenticated, adding dummy messages...");
      const newUserMessage = { id: Date.now(), sender: 'user', text: messageText };
      const magixResponse = { id: Date.now() + 1, sender: 'magix', text: "Sure, let me try to modify that for you." };
      const magixIndicator = { id: Date.now() + 2, sender: 'magix', status: 'processing' };

      setMessages(prev => [...prev, newUserMessage, magixResponse, magixIndicator]);
      setCurrentView('chat');
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

  const renderHomeInputArea = () => (
    <Box sx={{
      display: 'flex', flexDirection: 'column', p: 1, borderRadius: 3,
      bgcolor: 'grey.100', border: '1px solid #e0e0e0', position: 'relative',
      mb: 2, minHeight: 'calc(1.5em * 4 + 16px)',
    }}>
      <TextField
        fullWidth multiline minRows={2} maxRows={3} variant="standard"
        placeholder={animatedPlaceholder + '|'}
        value={inputValue} onChange={handleInputChange} onKeyDown={handleKeyDown}
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

  const renderChatInputArea = () => (
    <Box sx={{
      display: 'flex', flexDirection: 'row', alignItems: 'center',
      p: 1, px: 2, pb: 2, borderRadius: 0, bgcolor: 'grey.100',
      border: '1px solid #e0e0e0', mt: 'auto'
    }}>
      <TextField
        fullWidth multiline={false} variant="standard" placeholder="Ask Magix..."
        value={inputValue} onChange={handleInputChange} onKeyDown={handleKeyDown}
        InputProps={{ disableUnderline: true, sx: { fontSize: '0.9rem' } }}
        sx={{ mr: 1, '& .MuiInputBase-root': { py: 1 } }}
      />
      <IconButton
        onClick={handleSubmit} disabled={isLoading || !inputValue.trim()}
        sx={{
          bgcolor: 'common.black', color: 'common.white', width: 28, height: 28,
          '&:hover': { bgcolor: 'grey.800' },
          '&.Mui-disabled': { backgroundColor: 'grey.300', color: 'grey.500' }
        }}
      >
        <ArrowUpwardIcon sx={{ fontSize: '1rem' }} />
      </IconButton>
    </Box>
  );

  const renderHomeScreen = () => (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" component="h1" sx={{ textAlign: 'center', mb: 2, fontSize: '1.05rem', fontWeight: 600 }}>
        Modify any website 🪄
      </Typography>
      {renderHomeInputArea()}
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
    </Box>
  );

  const renderChatScreen = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Fixed Header */}
      <Box sx={{
        position: 'sticky', top: 0, zIndex: 1, bgcolor: 'background.paper',
        p: 1, mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
         <Box sx={{ width: 28 }} />
         <Switch
            size="small" checked={true} inputProps={{ 'aria-label': 'dummy toggle' }}
            sx={{
              transform: 'scale(0.75)',
              '& .MuiSwitch-switchBase.Mui-checked': { color: 'green', '&:hover': { backgroundColor: 'rgba(0, 128, 0, 0.08)' }, },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: 'green', },
            }}
         />
      </Box>

      {/* Chat Message Area */}
      <Box ref={chatContainerRef} sx={{ flexGrow: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {messages.map((msg) => (
          <Box key={msg.id} sx={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
            {msg.status === 'processing' ? (
              <Paper className="shimmer-bubble" elevation={0} sx={{ p: 1, borderRadius: 2, bgcolor: 'grey.200', display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden', position: 'relative' }}>
                 <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary', fontSize: '0.9rem' }}>
                   Doing magix...
                 </Typography>
              </Paper>
            ) : msg.sender === 'user' ? (
               <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'grey.200' }}>
                 <Typography variant="body2" sx={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                   {msg.text}
                 </Typography>
               </Paper>
            ) : (
               <Typography variant="body2" sx={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', alignSelf: 'flex-start' }}>
                  {msg.text}
               </Typography>
            )}
          </Box>
        ))}
        <div ref={chatEndRef} />
      </Box>
      {renderChatInputArea()}
    </Box>
  );

  const renderAccountSettingsScreen = () => (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
       {/* Header with Back Button */}
       <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
         <IconButton onClick={() => setCurrentView('home')} size="small">
           <ArrowBackIcon />
         </IconButton>
         <Typography variant="h6" sx={{ ml: 1, fontSize: '1.1rem', fontWeight: 600 }}>
           Account Settings
         </Typography>
       </Box>

       {/* Tabs - Updated indicator color */}
       <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
         <Tabs
           value={settingsTab}
           onChange={handleSettingsTabChange}
           aria-label="account settings tabs"
           textColor="inherit" // Use inherit to allow sx override
           sx={{
             '& .MuiTabs-indicator': { backgroundColor: 'common.black' },
             '& .Mui-selected': { color: 'common.black', fontWeight: 600 }, // Style selected tab text
           }}
          >
           <Tab label="Account Info" {...a11yProps(0)} sx={{ textTransform: 'none', fontSize: '0.9rem' }} />
           <Tab label="Billing" {...a11yProps(1)} sx={{ textTransform: 'none', fontSize: '0.9rem' }} />
         </Tabs>
       </Box>

       {/* Tab Panels */}
       <TabPanel value={settingsTab} index={0}>
         {/* Account Info Content - Added specific padding */}
         <Box sx={{ pt: 3, px: 1 }}>
           <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
             <TextField
                label="Name"
                variant="outlined"
                size="small"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                // Added border radius & font size styling
                InputProps={{ sx: { fontSize: '0.9rem' } }}
                sx={{ flexGrow: 1, mr: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            {/* Updated button styling: black, no elevation */}
            <Button variant="contained" size="small" onClick={handleNameUpdate} disableElevation sx={{ textTransform: 'none', borderRadius: 2, bgcolor: 'common.black', '&:hover': { bgcolor: 'grey.800' } }}>
                Update
            </Button>
         </Box>
         <TextField
            label="Email"
            variant="outlined"
            size="small"
            disabled
            value={session?.user?.email || ''}
            fullWidth
            // Added border radius & font size styling
            InputProps={{ sx: { fontSize: '0.9rem' } }}
            sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
         />

         <Divider sx={{ my: 2 }} />

         {/* Danger Zone - Reduced text weight */}
         <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="error" sx={{ mb: 1, fontWeight: 500 }}>
                Danger Zone
            </Typography>
            {/* Changed variant to outlined */}
            <Button variant="outlined" color="error" size="small" onClick={handleDeleteAccount} disableElevation sx={{ textTransform: 'none', borderRadius: 2 }}>
                Delete Account
            </Button>
         </Box>

         <Divider sx={{ my: 3 }} />

         {/* Links - Updated href and added target */}
         <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Link href="https://trymagix.com/privacy" target="_blank" rel="noopener noreferrer" underline="hover" variant="caption" color="text.secondary">Privacy Policy</Link>
            <Link href="https://trymagix.com/terms" target="_blank" rel="noopener noreferrer" underline="hover" variant="caption" color="text.secondary">Terms of Service</Link>
            <Link href="https://trymagix.com/contact" target="_blank" rel="noopener noreferrer" underline="hover" variant="caption" color="text.secondary">Contact Us</Link>
         </Box>
        </Box> {/* Close specific padding Box */}
       </TabPanel>
       <TabPanel value={settingsTab} index={1}>
         {/* Billing Content - Added specific padding */}
         <Box sx={{ pt: 3, px: 1 }}>
           {/* Pro User Pill - Changed color */}
           <Chip label="Pro User" size="small" sx={{ mb: 2, bgcolor: 'common.black', color: 'common.white' }} />
           {/* Usage Text */}
           <Typography variant="body2" sx={{ mb: 1 }}>Monthly Limits: 1/10 messages used.</Typography>
           {/* Progress Bar - Added dynamic color */}
           <LinearProgress
             variant="determinate"
             value={10} // Dummy value (1/10 = 10%)
             color={10 >= 80 ? 'error' : 10 >= 50 ? 'warning' : 'success'} // Dynamic color based on value
             sx={{ mb: 2, height: 8, borderRadius: 1 }}
            />
           {/* Updated Manage Billing Button */}
           <Button variant="contained" size="small" disableElevation sx={{ textTransform: 'none', borderRadius: 2, bgcolor: 'common.black', '&:hover': { bgcolor: 'grey.800' } }}>
             Manage Billing (Dummy)
           </Button>
        </Box> {/* Close specific padding Box for Billing */}
       </TabPanel>
    </Box>
  );

  // --- Main Return ---
  return (
    <Box sx={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      bgcolor: 'background.paper',
      justifyContent: currentView === 'home' && !session ? 'center' : 'flex-start'
    }}>
      {/* Profile Icon */}
      {session && currentView !== 'settings' && (
        <IconButton onClick={handleAccountMenuOpen} size="small" sx={{ position: 'absolute', top: 16, left: 16, zIndex: 2 }}>
           <AccountCircleIcon sx={{ color: 'grey.600', fontSize: '1.25rem' }} />
        </IconButton>
      )}

       {/* Account Popover */}
       <Popover
          id={accountMenuId}
          open={openAccountMenu}
          anchorEl={accountMenuAnchorEl}
          onClose={handleAccountMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left'}}
          slotProps={{ paper: { sx: { width: '200px', mt: 1, borderRadius: 2 } } }}
        >
          <List dense>
            <ListItem>
              <ListItemText primary="Monthly messages:" secondary="0/10" />
            </ListItem>
            {currentView === 'chat' ? (
              <ListItemButton onClick={() => { setCurrentView('home'); handleAccountMenuClose(); }}>
                <ListItemText primary="Go to dashboard" />
              </ListItemButton>
            ) : (
              <ListItemButton onClick={() => { setCurrentView('settings'); handleAccountMenuClose(); }}>
                <ListItemText primary="Account settings" />
              </ListItemButton>
            )}
             {currentView === 'chat' && (
                 <ListItemButton onClick={() => { setCurrentView('settings'); handleAccountMenuClose(); }}>
                    <ListItemText primary="Account settings" />
                 </ListItemButton>
             )}
             {currentView !== 'chat' && (
                 <ListItemButton onClick={() => { supabase.auth.signOut(); handleAccountMenuClose(); }}>
                   <ListItemText primary="Log out" />
                 </ListItemButton>
             )}
          </List>
        </Popover>

      {/* Main Content Area */}
      {currentView === 'chat' ? renderChatScreen()
       : currentView === 'settings' ? renderAccountSettingsScreen()
       : renderHomeScreen()}

      {error && (
        <Typography color="error" sx={{ mt: 2, textAlign: 'center', p: 2 }}>
          Error: {error}
        </Typography>
      )}

    </Box>
  );
}

export default App;
