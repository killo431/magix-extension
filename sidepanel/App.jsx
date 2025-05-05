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
import MyLocationIcon from '@mui/icons-material/MyLocation'; // Crosshair/Select icon
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
import ContentCopyIcon from '@mui/icons-material/ContentCopy'; // Import Copy icon

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


function App() {
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Combined loading state
  const [inputValue, setInputValue] = useState('');
  const [currentView, setCurrentView] = useState('home'); // 'home', 'chat', 'settings'
  const [messages, setMessages] = useState([]);
  const chatContainerRef = useRef(null);
  const chatEndRef = useRef(null);
  const [accountMenuAnchorEl, setAccountMenuAnchorEl] = useState(null);
  const [settingsTab, setSettingsTab] = useState(0);
  const [userName, setUserName] = useState(''); // State for name field
  const [userScripts, setUserScripts] = useState([]); // State for user's scripts
  const [isSelectingElement, setIsSelectingElement] = useState(false); // State for element selection mode
  const [selectedElementPath, setSelectedElementPath] = useState(''); // State for the selected element's path/selector

  // State for placeholder animation
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [animatedPlaceholder, setAnimatedPlaceholder] = useState('');

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
        setIsLoading(false); // Stop loading on auth change
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

  // --- Fetch User Scripts Effect ---
  useEffect(() => {
    const fetchUserScripts = async () => {
      if (session?.user?.id) {
        console.log("Fetching scripts for user:", session.user.id);
        try {
          const { data, error } = await supabase
            .from('scripts')
            .select('id, title, domain_pattern, is_active') // Select necessary fields
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false }); // Optional: order by creation date

          if (error) {
            throw error;
          }
          console.log("Fetched scripts:", data);
          setUserScripts(data || []);
        } catch (fetchError) {
          console.error("Error fetching user scripts:", fetchError);
          setError(`Failed to load your scripts: ${fetchError.message}`);
          setUserScripts([]); // Clear scripts on error
        }
      } else {
        // Clear scripts if user logs out
        setUserScripts([]);
      }
    };

    fetchUserScripts();
  }, [session]); // Re-run when session changes

  // --- Element Selection Listener ---
  useEffect(() => {
    const messageListener = (message, sender, sendResponse) => {
      console.log("Sidepanel received message:", message);
      if (message.type === 'ELEMENT_SELECTED') { // Changed type check
        console.log('Element selection complete. Selector:', message.selector);
        const receivedSelector = message.selector || '';
        setSelectedElementPath(receivedSelector); // Store the selector
        setIsSelectingElement(false); // Exit selection mode UI state
        // Optionally, update the input field with the selector or provide other feedback
        // setInputValue(prev => `${prev} ${receivedSelector}`); // Example: Append selector to input
        sendResponse({ status: "Selector received by sidepanel" }); // Acknowledge receipt
        return true; // Indicate async response IS sent for this specific message type
      }
      // Handle other message types if needed in the future

      // If the message type wasn't 'ELEMENT_SELECTED', we don't need to keep the message channel open.
      // Returning false or undefined signals this.
      return false;
    };

    chrome.runtime.onMessage.addListener(messageListener);

    // Cleanup listener on component unmount
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []); // Empty dependency array means this runs once on mount

  // --- Scroll to bottom effect ---
  useEffect(() => {
    if (currentView === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, currentView]);

  // --- Placeholder Animation Effect (Revised Timer Logic) ---
  useEffect(() => {
    if (currentView !== 'home') {
      setAnimatedPlaceholder('');
      return;
    }
    let timeoutId;
    if (subIndex < placeholderSuggestions[placeholderIndex].length && !reverse) {
      timeoutId = setTimeout(() => {
        setAnimatedPlaceholder(prev => prev + placeholderSuggestions[placeholderIndex][subIndex]);
        setSubIndex(prev => prev + 1);
      }, 100);
    } else if (subIndex === placeholderSuggestions[placeholderIndex].length && !reverse) {
       timeoutId = setTimeout(() => { setReverse(true); }, 1500);
    } else if (subIndex > 0 && reverse) {
      timeoutId = setTimeout(() => {
        setAnimatedPlaceholder(prev => prev.slice(0, -1));
        setSubIndex(prev => prev - 1);
      }, 50);
    } else if (subIndex === 0 && reverse) {
      setReverse(false);
      setPlaceholderIndex(prev => (prev + 1) % placeholderSuggestions.length);
    }
    return () => clearTimeout(timeoutId);
  }, [subIndex, placeholderIndex, reverse, currentView]);


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
    setError(null);
    setIsLoading(true); // Start loading for auth
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
            // Auth state change listener will handle setting session and isLoading=false
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
   }; // <-- Added missing closing brace here
  // --- Input Handling ---
  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  // --- Submit Handler (Updated for Edge Function) ---
  const handleSubmit = async () => { // Made async
    if (isLoading) return;
    const originalMessageText = inputValue.trim(); // Store original text for UI
    if (!originalMessageText) return;

    // Construct the prompt for the backend, potentially including the selector
    let promptForBackend = originalMessageText;
    if (selectedElementPath) {
      promptForBackend = `${originalMessageText} (Selected Element: ${selectedElementPath})`;
      console.log("Appending selected element path to backend prompt:", selectedElementPath);
      setSelectedElementPath(''); // Clear the path immediately after using it for the prompt
    }

    console.log("handleSubmit triggered. Original text:", originalMessageText, "Backend prompt:", promptForBackend);

    if (!session) {
      console.log("User not authenticated, triggering sign-in...");
      handleSignIn(); // Auth loading is handled by handleSignIn
    } else {
      console.log("User authenticated, calling Edge Function...");
      setIsLoading(true); // Start loading for API call
      setError(null); // Clear previous errors

      // Add user message immediately (using original text)
      const newUserMessage = { id: Date.now(), sender: 'user', text: originalMessageText };
      setMessages(prev => [...prev, newUserMessage]);
      setCurrentView('chat');
      setInputValue(''); // Clear input

      try {
        // --- Step 1: Call analyze-prompt ---
        console.log("Calling analyze-prompt with:", promptForBackend);
        const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
          'analyze-prompt',
          { body: { prompt: promptForBackend } } // Send potentially modified prompt
        );

        if (analysisError) {
          throw new Error(`Analysis failed: ${analysisError.message}`);
        }

        if (!analysisData || typeof analysisData.response !== 'string' || typeof analysisData.is_code_needed !== 'boolean') {
          console.error("Invalid response structure from analyze-prompt:", analysisData);
          throw new Error("Received an unexpected analysis response from the AI.");
        }

        console.log("Analysis response:", analysisData);

        // Add the textual response from Magix immediately
        const magixTextResponse = { id: Date.now() + 1, sender: 'magix', text: analysisData.response };
        setMessages(prev => [...prev, magixTextResponse]);

        // --- Step 2: Conditionally call generate-script ---
        if (analysisData.is_code_needed) {
          console.log("Code is needed, showing indicator and calling generate-script...");
          // Add processing indicator before the second call
          const processingMsgId = Date.now() + 2; // Unique ID for the indicator
          const magixIndicator = { id: processingMsgId, sender: 'magix', status: 'processing' };
          setMessages(prev => [...prev, magixIndicator]);

          try {
            console.log("Calling generate-script with:", promptForBackend);
            const { data: scriptData, error: scriptError } = await supabase.functions.invoke(
              'generate-script',
              { body: { prompt: promptForBackend } } // Send potentially modified prompt again
            );

            if (scriptError) {
              throw new Error(`Code generation failed: ${scriptError.message}`);
            }

            if (scriptData && scriptData.generatedCode) {
              console.log("Generated code response:", scriptData.generatedCode);
              const generatedCode = scriptData.generatedCode; // Use the code from the second function

              // --- Inject and Save Logic (Moved inside the conditional block) ---
              // Note: The try/catch for injection/saving is nested within the try for generate-script
              try {
                // Get active tab ID first
                const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });

                if (!currentTab?.id) {
                  throw new Error("Could not find active tab to inject into.");
                }
                const targetTabId = currentTab.id;

                // Refined check for JS vs CSS
                let injectionType = 'CSS'; // Default to CSS
                const strongJsKeywords = [
                  'function', 'const', 'let', 'var', 'document', 'window',
                  '=>', 'addEventListener', 'MutationObserver', 'async', 'await',
                  'class ', 'import ', 'export ', '.log', '.error', 'fetch', 'try', 'catch'
                 ]; // Using stronger, less ambiguous JS indicators

                // If the code contains strong JS indicators, classify as JS
                if (strongJsKeywords.some(keyword => generatedCode.includes(keyword))) {
                   injectionType = 'JS';
                }
                // If no strong JS indicators found, assume CSS.
                // This relies on the AI providing either JS or CSS as requested.

                console.log(`Detected type: ${injectionType}.`);

                // Inject directly from side panel
                if (injectionType === 'CSS') {
                  console.log("Injecting CSS directly...");
                  await chrome.scripting.insertCSS({
                    target: { tabId: targetTabId },
                    css: generatedCode
                  });
                  console.log("CSS injected directly.");
                  // Save CSS script immediately (use original text for title)
                  saveScriptToSupabase(session.user.id, generatedCode, originalMessageText, currentTab.url);

                } else { // injectionType === 'JS'
                  // Clean the generated code: remove markdown backticks and language identifier
                  const cleanedCode = generatedCode.replace(/^```javascript\n/, '').replace(/\n```$/, '');
                  console.log("Cleaned JS code:", cleanedCode); // Log the cleaned code

                  // Send code to the background script for registration via userScripts API
                  console.log("Sending REGISTER_USER_SCRIPT message to background script...");
                  chrome.runtime.sendMessage(
                    // Add the targetUrl and send the cleaned code
                    { type: 'REGISTER_USER_SCRIPT', code: cleanedCode, targetUrl: currentTab.url },
                    (response) => {
                      const lastError = chrome.runtime.lastError;
                      if (lastError) {
                        console.error("Error registering script via background:", lastError.message);
                        setError(`Failed to register script: ${lastError.message}`);
                        // Optionally add a message to the chat indicating failure
                        const errorMsg = { id: Date.now() + 5, sender: 'magix', text: `Error: Could not apply the script changes (${lastError.message}).` };
                        setMessages(prev => [...prev, errorMsg]);
                      } else if (response && !response.success) {
                        console.error("Background script reported error during registration:", response.error);
                        setError(`Failed to register script: ${response.error}`);
                        const errorMsg = { id: Date.now() + 5, sender: 'magix', text: `Error: Could not apply the script changes (${response.error}).` };
                        setMessages(prev => [...prev, errorMsg]);
                      } else if (response && response.success) {
                        console.log("Background script confirmed successful registration:", response.scriptId);
                        // Save JS script only after successful registration confirmation (use original text for title)
                        saveScriptToSupabase(session.user.id, generatedCode, originalMessageText, currentTab.url); // Still save original code with markdown
                        // Optionally add a success message to chat
                        // const successMsg = { id: Date.now() + 6, sender: 'magix', text: "Script changes applied successfully!" };
                        // setMessages(prev => [...prev, successMsg]);
                      } else {
                        // Handle unexpected response from background script
                        console.warn("Unexpected response from background script during registration:", response);
                        setError("Received an unexpected response while registering the script.");
                      }
                    }
                  );
                }

              } catch (injectSaveError) {
                 console.error("Error during CSS injection or sending message to background:", injectSaveError);
                 // Set error state
                 setError(`Error processing script: ${injectSaveError.message}`);
              }
              // --- End Inject and Save Logic ---

            } else {
              // Handle cases where generate-script succeeded but didn't return expected data
              console.error("generate-script returned unexpected data:", scriptData);
              throw new Error("Received unexpected code format from the AI.");
            }
          } catch (scriptGenError) {
             // Catch errors specifically from the generate-script call or subsequent logic
             console.error("Error during script generation/injection:", scriptGenError);
             setError(`Error: ${scriptGenError.message}`); // Set the error state
             // Add error message to chat
             const errorResponse = { id: Date.now() + 3, sender: 'magix', text: `Sorry, an error occurred during code generation: ${scriptGenError.message}` };
             setMessages(prev => [...prev, errorResponse]);
          } finally {
             // Remove processing indicator regardless of success/failure of the second step
             setMessages(prev => prev.filter(msg => msg.id !== processingMsgId));
          }
        } else {
          console.log("Code not needed based on analysis.");
          // No further action needed if code is not required
        }

      } catch (err) { // This outer catch handles errors from analyze-prompt or unexpected structure issues
        console.error("Error during Magix processing (outer):", err);
        setError(`Error: ${err.message}`); // Set the error state
        // Add error message to chat
        const errorResponse = { id: Date.now() + 4, sender: 'magix', text: `Sorry, an error occurred: ${err.message}` };
        setMessages(prev => [...prev, errorResponse]);
      } finally {
        setIsLoading(false); // Stop loading regardless of outcome (covers both steps)
      }
    }
  };

  // Helper function to save script details
  const saveScriptToSupabase = async (userId, code, promptText, tabUrl) => {
      console.log("Attempting to save script to Supabase...");
      let domain = '*'; // Default fallback
      try {
        if (tabUrl && !tabUrl.startsWith('chrome://')) {
           const urlObj = new URL(tabUrl);
           domain = urlObj.hostname;
        } else {
           console.log("Cannot extract domain from chrome:// URL or invalid URL:", tabUrl);
        }
      } catch (urlError) {
         console.error("Error parsing tab URL for domain:", urlError);
      }
      console.log(`Using domain: ${domain}`);

      const { error: insertError } = await supabase
        .from('scripts')
        .insert({
          user_id: userId,
          code: code,
          title: promptText.substring(0, 50) + (promptText.length > 50 ? '...' : ''), // Basic title from prompt
          domain_pattern: domain, // Use extracted domain
          // is_active defaults to true in DB schema
        });

      if (insertError) {
        console.error("Error saving script to Supabase:", insertError);
        setError(`Failed to save script: ${insertError.message}`); // Set error state
      } else {
        console.log("Script saved to Supabase successfully.");
      }
  };


  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  // --- Render Functions ---

  const renderHomeInputArea = () => (
    <Box sx={{
      display: 'flex', flexDirection: 'column', p: 1, borderRadius: 3,
      bgcolor: 'grey.100', border: '1px solid #e0e0e0', position: 'relative',
      mb: 2, // Removed minHeight, will adjust padding below
      pb: selectedElementPath ? '48px' : '40px', // Add extra padding at bottom if selector is shown
      // Removed duplicate position: 'relative'
    }}>
      {/* Select Element Chip - Updated Logic */}
      <Chip
        icon={<MyLocationIcon sx={{ fontSize: '1rem', color: (isSelectingElement || selectedElementPath) ? 'primary.main' : 'grey.500' }} />}
        label={isSelectingElement ? "Selecting..." : selectedElementPath ? "Selected" : "Select"}
        size="small"
        variant={(isSelectingElement || selectedElementPath) ? "filled" : "outlined"} // Filled when selecting or selected
        color={(isSelectingElement || selectedElementPath) ? "primary" : "default"} // Primary when selecting or selected
        clickable
        onClick={async () => {
          if (isSelectingElement) {
            // Currently selecting, do nothing (or implement cancel later)
            console.log("Selection in progress...");
            return;
          }
          if (selectedElementPath) {
            // Currently selected, clear the selection
            console.log("Clearing selected element path.");
            setSelectedElementPath('');
            // Optionally send a message to content script to stop highlighting if needed
          } else {
            // Not selecting and nothing selected, start selection
            setIsSelectingElement(true);
            setSelectedElementPath(''); // Ensure it's clear before starting
            console.log("Starting element selection...");
            setError(null); // Clear previous errors
            try {
              const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
              if (currentTab?.id) {
                chrome.tabs.sendMessage(currentTab.id, { type: 'START_ELEMENT_SELECTION' }, (response) => {
                  const lastError = chrome.runtime.lastError;
                  if (lastError) {
                    console.error("Error sending START_ELEMENT_SELECTION:", lastError.message);
                    setError(`Could not initiate selection mode: ${lastError.message}`);
                    setIsSelectingElement(false); // Reset state on error
                  } else {
                    console.log("START_ELEMENT_SELECTION message sent, response:", response);
                    // Don't reset isSelectingElement here, wait for ELEMENT_SELECTED message
                  }
                });
              } else {
                throw new Error("Could not find active tab.");
              }
            } catch (error) {
              console.error("Error starting element selection:", error);
              setError(`Error initiating selection: ${error.message}`);
              setIsSelectingElement(false); // Reset state on error
            }
          }
        }}
        sx={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          fontSize: '0.75rem',
          height: '28px',
          borderColor: '#e0e0e0',
          '& .MuiChip-label': { px: '8px' },
          '& .MuiChip-icon': { ml: '6px', mr: '-4px' }
        }}
      />
      <TextField
        fullWidth multiline minRows={2} maxRows={3} variant="standard"
        placeholder={animatedPlaceholder + '|'}
        value={inputValue} onChange={handleInputChange} onKeyDown={handleKeyDown}
        InputProps={{ disableUnderline: true, sx: { fontSize: '0.9rem' } }}
        sx={{ flexGrow: 1, '& .MuiInputBase-root': { py: 0.5 } }} // Removed mb: 4
        disabled={isLoading} // Disable input while loading
      />
      {/* Removed the Typography component that displayed the selected path */}
      <IconButton
        onClick={handleSubmit} disabled={isLoading || !inputValue.trim()}
        sx={{
          position: 'absolute', bottom: 8, right: 8, bgcolor: 'common.black', color: 'common.white',
          width: 28, height: 28, '&:hover': { bgcolor: 'grey.800' },
          '&.Mui-disabled': { backgroundColor: 'grey.300', color: 'grey.500' }
        }}
      >
        {isLoading ? <CircularProgress size={16} sx={{ color: 'white' }}/> : <ArrowUpwardIcon sx={{ fontSize: '1rem' }} />}
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
        disabled={isLoading} // Disable input while loading
      />
      <IconButton
        onClick={handleSubmit} disabled={isLoading || !inputValue.trim()}
        sx={{
          bgcolor: 'common.black', color: 'common.white', width: 28, height: 28,
          '&:hover': { bgcolor: 'grey.800' },
          '&.Mui-disabled': { backgroundColor: 'grey.300', color: 'grey.500' }
        }}
      >
         {isLoading ? <CircularProgress size={16} sx={{ color: 'white' }}/> : <ArrowUpwardIcon sx={{ fontSize: '1rem' }} />}
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
        <Box sx={{ mt: 2 }}> {/* Removed flexGrow and overflowY */}
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'text.secondary' }}>
            Your Modifications: {/* Changed text */}
          </Typography>
          <List dense sx={{
            pt: 0,
            maxHeight: '350px', // Increased height
            overflowY: 'auto',
            // Hide scrollbar styles
            '&::-webkit-scrollbar': {
              display: 'none'
            },
            scrollbarWidth: 'none', // Firefox
            '-ms-overflow-style': 'none' // IE and Edge
          }}>
            {userScripts.length > 0 ? (
              userScripts.map((script) => (
                <ListItem
                  key={script.id}
                  secondaryAction={
                    <Switch
                      edge="end"
                      checked={script.is_active}
                      disabled={true} // Disable toggle functionality for now
                      inputProps={{ 'aria-labelledby': `switch-list-label-${script.id}` }}
                      sx={{
                        transform: 'scale(0.75)',
                        '& .MuiSwitch-switchBase.Mui-checked': { color: 'green', '&:hover': { backgroundColor: 'rgba(0, 128, 0, 0.08)' }, },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: 'green', },
                        // Style disabled state if needed
                        '& .Mui-disabled': { cursor: 'not-allowed' }
                      }}
                    />
                  }
                  sx={{ border: '1px solid #e0e0e0', borderRadius: 2, mb: 1, py: 0.5 }}
                >
                  <ListItemText
                    id={`switch-list-label-${script.id}`}
                    primary={script.title}
                    secondary={script.domain_pattern || 'All sites'} // Show domain or fallback
                    primaryTypographyProps={{ sx: { fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }}
                    secondaryTypographyProps={{ sx: { fontSize: '0.8rem' } }}
                  />
                </ListItem>
              ))
            ) : (
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block', mt: 2 }}>
                No modifications saved yet. Create one using the input above! {/* Changed text */}
              </Typography>
            )}
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
            ) : msg.codeToCopy ? ( // Check if it's a fallback message with code
               <Box>
                 <Typography variant="body2" sx={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', mb: 1 }}>
                   {msg.text}
                 </Typography>
                 <Paper variant="outlined" sx={{ p: 1, bgcolor: 'grey.100', position: 'relative', borderRadius: 1, overflowX: 'auto' }}>
                   <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.8rem' }}>
                     <code>{msg.codeToCopy}</code>
                   </pre>
                   <IconButton
                     size="small"
                     onClick={() => navigator.clipboard.writeText(msg.codeToCopy)}
                     sx={{ position: 'absolute', top: 4, right: 4 }}
                     title="Copy code"
                   >
                     <ContentCopyIcon sx={{ fontSize: '0.9rem' }} /> {/* Use Material UI Copy Icon */}
                   </IconButton>
                 </Paper>
               </Box>
            ) : ( // Regular Magix text response
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
