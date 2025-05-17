import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient'; // Import the Supabase client
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
// import ListItem from '@mui/material/ListItem'; // Replaced by ListItemButton for script list
import ListItemText from '@mui/material/ListItemText';
import Switch from '@mui/material/Switch';
import AccountCircleIcon from '@mui/icons-material/AccountCircle'; // Profile icon
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'; // Submit icon
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; // Back icon
import MyLocationIcon from '@mui/icons-material/MyLocation'; // Crosshair/Select icon
import DeleteIcon from '@mui/icons-material/Delete'; // Import Delete icon
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Popover from '@mui/material/Popover';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon'; // Added for modal list icons
import Tabs from '@mui/material/Tabs'; // For settings screen
import Tab from '@mui/material/Tab';   // For settings screen
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Chip from '@mui/material/Chip'; // For Pro User pill
import LinearProgress from '@mui/material/LinearProgress'; // For usage bar
import ContentCopyIcon from '@mui/icons-material/ContentCopy'; // Import Copy icon
import { ListItem } from '@mui/material'; // Keep for Popover
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';


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
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [currentView, setCurrentView] = useState('home');
  const [messages, setMessages] = useState([]);
  const chatContainerRef = useRef(null);
  const chatEndRef = useRef(null);
  const [accountMenuAnchorEl, setAccountMenuAnchorEl] = useState(null);
  const [settingsTab, setSettingsTab] = useState(0);
  const [userName, setUserName] = useState('');
  const [userScripts, setUserScripts] = useState([]);
  const [isSelectingElement, setIsSelectingElement] = useState(false);
  const [selectedElementPath, setSelectedElementPath] = useState('');

  const [currentChatId, setCurrentChatId] = useState(null);
  const [currentScriptContentForChat, setCurrentScriptContentForChat] = useState('');
  const [currentChatTitle, setCurrentChatTitle] = useState('');

  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [animatedPlaceholder, setAnimatedPlaceholder] = useState('');

  // State for delete confirmation dialog
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [scriptPendingDeletion, setScriptPendingDeletion] = useState(null);
  const triggerRef = useRef(null); // Ref to store the element that triggered the dialog

  const [userProfile, setUserProfile] = useState(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false); 


  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      // console.log("Initial session:", session);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        // console.log("Auth state changed:", _event, session);
        setIsLoading(false);
        setError(null);
        if (!session) {
          setCurrentView('home');
          setMessages([]);
          setCurrentChatId(null);
          setCurrentScriptContentForChat('');
          setCurrentChatTitle('');
        }
      }
    );
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const fetchUserScripts = async () => {
    if (session?.user?.id) {
      // console.log("Fetching scripts for user:", session.user.id);
      try {
        const { data, error } = await supabase
          .from('scripts')
          .select('id, title, domain_pattern, is_active, code') // Ensure 'code' is selected
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        // console.log("Fetched scripts:", data);
        setUserScripts(data || []);
      } catch (fetchError) {
        console.error("Error fetching user scripts:", fetchError);
        setError(`Failed to load your scripts: ${fetchError.message}`);
        setUserScripts([]);
      }
    } else {
      setUserScripts([]);
    }
  };

  useEffect(() => {
    fetchUserScripts();
    const fetchUserProfile = async () => {
      if (session?.user?.id) {
        const { data, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profileError) {
          console.error("Error fetching user profile", profileError);
          // setError("Could not load your profile information."); // Optional: set user-facing error
        } else {
          setUserProfile(data);
        }
      } else {
        setUserProfile(null);
      }
    };
    fetchUserProfile();
  }, [session]);

  // Effect to load chat data when currentChatId changes
  useEffect(() => {
    const loadChatData = async () => {
      if (currentChatId && session?.user?.id) {
        // console.log(`Loading data for chat ID: ${currentChatId}`);
        setIsLoading(true);
        setError(null);
        try {
          const { data: chatData, error: chatError } = await supabase
            .from('chats')
            .select('title, script_id, scripts ( id, code, title )') // Join with scripts
            .eq('id', currentChatId)
            .eq('user_id', session.user.id)
            .single();

          if (chatError) throw chatError;

          if (chatData) {
            setCurrentChatTitle(chatData.title || chatData.scripts?.title || 'Chat');
            setCurrentScriptContentForChat(chatData.scripts?.code || '');
            
            const { data: messagesData, error: messagesError } = await supabase
              .from('chat_messages')
              .select('*')
              .eq('chat_id', currentChatId)
              .order('created_at', { ascending: true });

            if (messagesError) throw messagesError;
            
            setMessages(messagesData.map(msg => ({ // Ensure consistent message structure
                id: msg.id, // Use DB id for messages from DB
                sender: msg.sender_type,
                text: msg.content,
                status: msg.status, // if you add status to DB
                chat_id: msg.chat_id
            })) || []);
            setCurrentView('chat');
          } else {
            setError("Could not load the selected chat or chat not found.");
            setCurrentChatId(null); // Reset if chat is invalid
            setCurrentView('home');
          }
        } catch (e) {
          console.error("Error loading chat data:", e);
          setError(`Failed to load chat: ${e.message}`);
        } finally {
          setIsLoading(false);
        }
      } else if (!currentChatId && currentView === 'chat') {
        // If currentChatId becomes null (e.g., user clicks back from chat), go home
        setCurrentView('home');
        setMessages([]);
        setCurrentScriptContentForChat('');
        setCurrentChatTitle('');
      }
    };
    loadChatData();
  }, [currentChatId, session?.user?.id]);


  useEffect(() => {
    const messageListener = (message, sender, sendResponse) => {
      if (message.type === 'ELEMENT_SELECTED') {
        setSelectedElementPath(message.selector || '');
        setIsSelectingElement(false);
        sendResponse({ status: "Selector received by sidepanel" });
        return true;
      }
      return false;
    };
    chrome.runtime.onMessage.addListener(messageListener);
    return () => chrome.runtime.onMessage.removeListener(messageListener);
  }, []);

  useEffect(() => {
    if (currentView === 'chat') chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentView]);

  useEffect(() => {
    if (currentView !== 'home' || currentChatId) {
      setAnimatedPlaceholder(''); return;
    }
    let timeoutId;
    if (subIndex < placeholderSuggestions[placeholderIndex].length && !reverse) {
      timeoutId = setTimeout(() => { setAnimatedPlaceholder(p => p + placeholderSuggestions[placeholderIndex][subIndex]); setSubIndex(i => i + 1); }, 100);
    } else if (subIndex === placeholderSuggestions[placeholderIndex].length && !reverse) {
      timeoutId = setTimeout(() => setReverse(true), 1500);
    } else if (subIndex > 0 && reverse) {
      timeoutId = setTimeout(() => { setAnimatedPlaceholder(p => p.slice(0, -1)); setSubIndex(i => i - 1); }, 50);
    } else if (subIndex === 0 && reverse) {
      setReverse(false); setPlaceholderIndex(i => (i + 1) % placeholderSuggestions.length);
    }
    return () => clearTimeout(timeoutId);
  }, [subIndex, placeholderIndex, reverse, currentView, currentChatId]);

  const handleAccountMenuOpen = (event) => setAccountMenuAnchorEl(event.currentTarget);
  const handleAccountMenuClose = () => setAccountMenuAnchorEl(null);
  const openAccountMenu = Boolean(accountMenuAnchorEl);
  const accountMenuId = openAccountMenu ? 'account-popover' : undefined;
  const handleSettingsTabChange = (event, newValue) => setSettingsTab(newValue);
  const handleNameUpdate = () => { /* console.log("Update name clicked:", userName); */ }
  const handleDeleteAccount = () => { /* console.log("Delete account clicked"); */ }

  const handleSignIn = async () => {
    setError(null); setIsLoading(true);
    try {
      const manifest = chrome.runtime.getManifest();
      if (!manifest.oauth2?.client_id || !manifest.oauth2?.scopes) throw new Error("OAuth2 config missing.");
      const authUrl = new URL('https://accounts.google.com/o/oauth2/auth');
      const redirectUri = `https://${chrome.runtime.id}.chromiumapp.org`;
      authUrl.searchParams.set('client_id', manifest.oauth2.client_id);
      authUrl.searchParams.set('response_type', 'id_token');
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('scope', manifest.oauth2.scopes.join(' '));
      chrome.identity.launchWebAuthFlow({ url: authUrl.href, interactive: true }, async (redirectedTo) => {
        if (chrome.runtime.lastError || !redirectedTo) {
          setError(`Sign-in failed: ${chrome.runtime.lastError?.message || 'Flow failed.'}`);
          setIsLoading(false); return;
        }
        try {
          const params = new URLSearchParams(new URL(redirectedTo).hash.substring(1));
          const idToken = params.get('id_token');
          if (!idToken) { setError("Sign-in failed: ID token not found."); setIsLoading(false); return; }
          const { error: supabaseError } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
          if (supabaseError) throw supabaseError;
        } catch (e) { setError(`Sign-in failed: ${e.message}`); setIsLoading(false); }
      });
    } catch (e) { setError(`Sign-in failed: ${e.message}`); setIsLoading(false); }
  };

  const handleInputChange = (event) => setInputValue(event.target.value);

  const handleSubmit = async () => {
    if (isLoading) return;
    const originalMessageText = inputValue.trim();
    if (!originalMessageText && !currentChatId) return;

    setIsLoading(true);
    setError(null);
    setInputValue('');

    let activeChatId = currentChatId;
    let scriptContentForThisInteraction = currentScriptContentForChat;
    let isNewChat = false;
    const userId = session?.user?.id;

    try {
      if (!userId) {
        handleSignIn(); setIsLoading(false); return;
      }

      // --- Monthly Quota Check and Reset ---
      if (userProfile && !userProfile.is_pro) {
        let currentRequestCount = userProfile.request_count;
        const lastRequestDate = new Date(userProfile.last_request_at);
        const now = new Date();
        const currentMonthUTC = now.getUTCMonth();
        const currentYearUTC = now.getUTCFullYear();
        const lastRequestMonthUTC = lastRequestDate.getUTCMonth();
        const lastRequestYearUTC = lastRequestDate.getUTCFullYear();

        let profileNeedsUpdateForReset = false;
        if (currentYearUTC > lastRequestYearUTC || (currentYearUTC === lastRequestYearUTC && currentMonthUTC > lastRequestMonthUTC)) {
          // console.log("Monthly quota reset for user:", userId); // Removed for production
          currentRequestCount = 10; // Reset count
          profileNeedsUpdateForReset = true; 
        }

        if (currentRequestCount <= 0) {
          // setError("You've reached your monthly request limit (10 requests). Please upgrade to Pro for unlimited requests or wait until next month.");
          setIsUpgradeModalOpen(true);
          setIsLoading(false); return;
        }
        
        // If reset happened, update DB and local state before proceeding
        if (profileNeedsUpdateForReset) {
          try {
            const { error: updateError } = await supabase
              .from('user_profiles')
              .update({ request_count: 10, last_request_at: new Date().toISOString() })
              .eq('id', userId);
            if (updateError) throw updateError;
            setUserProfile(prev => ({ ...prev, request_count: 10, last_request_at: new Date().toISOString() }));
          } catch (e) {
            console.error("Could not reset monthly request quota:", e);
            setError("Could not reset your monthly request quota. Please try again.");
            setIsLoading(false); return;
          }
        }
      }
      // --- End Quota Check ---

      if (!activeChatId) {
        isNewChat = true;
        const chatTitle = originalMessageText.substring(0, 75) + (originalMessageText.length > 75 ? '...' : '');
        const { data: newChatData, error: newChatError } = await supabase.from('chats').insert({ user_id: userId, title: chatTitle }).select().single();
        if (newChatError) throw new Error(`Failed to create chat: ${newChatError.message}`);
        if (!newChatData) throw new Error("Failed to get new chat data.");
        activeChatId = newChatData.id;
        setCurrentChatId(activeChatId);
        setCurrentChatTitle(chatTitle);
        setCurrentScriptContentForChat('');
        scriptContentForThisInteraction = '';
        setMessages([]);
      }

      const { error: userMsgErr } = await supabase.from('chat_messages').insert({ chat_id: activeChatId, user_id: userId, sender_type: 'user', content: originalMessageText });
      if (userMsgErr) throw new Error(`Failed to save user message: ${userMsgErr.message}`);
      setMessages(prev => [...prev, { id: `user-${Date.now()}`, sender: 'user', text: originalMessageText, chat_id: activeChatId }]);
      if(currentView !== 'chat') setCurrentView('chat');

      let promptForBackend = originalMessageText;
      const currentSelectedElemPath = selectedElementPath;
      if (currentSelectedElemPath) {
        promptForBackend = `${originalMessageText} (Selected Element: ${currentSelectedElemPath})`;
        setSelectedElementPath('');
      }

      const { data: analysis, error: analysisErr } = await supabase.functions.invoke('analyze-prompt', { body: { prompt: promptForBackend, selected_element_selector: currentSelectedElemPath, existing_script_content: scriptContentForThisInteraction } });
      if (analysisErr) throw new Error(`Analysis failed: ${analysisErr.message}`);
      if (!analysis || typeof analysis.response !== 'string' || typeof analysis.is_code_needed !== 'boolean') throw new Error("Unexpected analysis response.");

      const { error: aiMsgErr } = await supabase.from('chat_messages').insert({ chat_id: activeChatId, user_id: userId, sender_type: 'ai', content: analysis.response });
      if (aiMsgErr) console.error("Failed to save AI message:", aiMsgErr.message);
      setMessages(prev => [...prev, { id: `ai-${Date.now()}`, sender: 'magix', text: analysis.response, chat_id: activeChatId }]);

      if (analysis.is_code_needed) {
        const procId = `proc-${Date.now()}`;
        setMessages(prev => [...prev, { id: procId, sender: 'magix', status: 'processing', chat_id: activeChatId }]);
        try {
          const { data: script, error: scriptErr } = await supabase.functions.invoke('generate-script', { body: { prompt: promptForBackend, selected_element_selector: currentSelectedElemPath, existing_script_content: scriptContentForThisInteraction } });
          if (scriptErr) throw new Error(`Code generation failed: ${scriptErr.message}`);
          if (script?.generatedCode) {
            const newCode = script.generatedCode;
            setCurrentScriptContentForChat(newCode);
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab?.id) throw new Error("No active tab.");
            const type = ['function', 'const', 'let', 'var', 'document', 'window', '=>'].some(k => newCode.includes(k)) ? 'JS' : 'CSS';

            // --- Refactored Logic ---
            // 1. Save/Update script in DB first to get the stable scriptId (UUID)
            // Note: saveScriptToSupabase needs modification to return the ID
            const savedScriptId = await saveScriptToSupabase(
              userId,
              newCode,
              originalMessageText,
              tab.url,
              activeChatId,
              !isNewChat && !!scriptContentForThisInteraction // isUpdating flag
            );

            if (!savedScriptId) {
              // Error should be handled within saveScriptToSupabase, but we stop processing here.
              // setError might already be set by saveScriptToSupabase.
              console.error("Stopping handleSubmit: Failed to get script ID from save/update operation.");
              // Ensure loading state is reset even if we throw an error implicitly below
              // by not continuing. We might need a more robust error message here.
              // For now, rely on error set by saveScriptToSupabase.
              return; // Exit the try block for this message processing
            }

            // 2. Inject/Register based on type, using the savedScriptId for JS registration
            if (type === 'CSS') {
              // Inject CSS directly
              await chrome.scripting.insertCSS({ target: { tabId: tab.id }, css: newCode });
              // console.log(`CSS injected for script ${savedScriptId}`);
              // CSS doesn't need separate registration via background script currently
              if (savedScriptId) { // Ensure DB save was successful before adding success message
                setMessages(prev => [...prev, { 
                  id: `ai-code-success-${Date.now()}`, 
                  sender: 'magix', 
                  text: 'Alright, I\'ve applied the changes! Take a look and let me know what you think or if there\'s anything else.', 
                  chat_id: activeChatId 
                }]);
              }
            } else {
              // Register JS using the database ID
              const cleanCode = newCode.replace(/^```javascript\n/, '').replace(/\n```$/, '');
              chrome.runtime.sendMessage({
                type: 'REGISTER_USER_SCRIPT',
                scriptId: savedScriptId, // Pass the database ID
                code: cleanCode,
                targetUrl: tab.url
              }, (res) => { // No need for async here anymore
                if (chrome.runtime.lastError || (res && !res.success)) {
                  const eMsg = chrome.runtime.lastError?.message || res?.error || "Unknown script registration error.";
                  console.error(`Script registration failed for ${savedScriptId}: ${eMsg}`);
                  setError(`Script registration failed: ${eMsg}`);
                  setMessages(p => [...p, {id: `err-${Date.now()}`, sender:'magix', text: `Script registration error: ${eMsg}`, chat_id: activeChatId}]);
                } else if (res?.success) {
                  // console.log(`Script ${savedScriptId} registered successfully via background.`);
                  setMessages(prev => [...prev, { 
                    id: `ai-code-success-${Date.now()}`, 
                    sender: 'magix', 
                    text: 'Alright, I\'ve applied the changes! Take a look and let me know what you think or if there\'s anything else.', 
                    chat_id: activeChatId 
                  }]);
                }
              });
            }
            // --- End Refactored Logic ---

          } else throw new Error("Unexpected code format.");
        } catch (e) {
          setError(`Script error: ${e.message}`);
          setMessages(p => [...p, {id: `err-${Date.now()}`, sender:'magix', text: `Script error: ${e.message}`, chat_id: activeChatId}]);
        } finally {
          setMessages(p => p.filter(m => m.id !== procId));
        }
      }

      // Decrement request count for non-pro user after successful interaction (defined as at least analysis call made)
      if (userProfile && !userProfile.is_pro) {
        try {
          // Ensure we use the latest count if it was just reset
          const countToDecrementFrom = userProfile.request_count === 10 && (new Date().getUTCMonth() !== new Date(userProfile.last_request_at).getUTCMonth() || new Date().getUTCFullYear() !== new Date(userProfile.last_request_at).getUTCFullYear()) 
                                      ? 10 // If reset just happened (or would have), decrement from 10
                                      : userProfile.request_count; // Otherwise, use current count

          const newCount = Math.max(0, countToDecrementFrom - 1);

          const { error: decrementError } = await supabase
            .from('user_profiles')
            .update({ 
                request_count: newCount,
                last_request_at: new Date().toISOString() 
            })
            .eq('id', userId);
          if (decrementError) throw decrementError;
          setUserProfile(prev => ({ ...prev, request_count: newCount, last_request_at: new Date().toISOString() }));
          // console.log(`Request count decremented for user ${userId}. New count: ${newCount}`); // Removed for production
        } catch (e) {
          console.error("Error decrementing request count:", e);
          // Non-critical for the current interaction, but log it.
        }
      }

    } catch (e) {
      setError(`Error: ${e.message}`);
      setMessages(p => [...p, {id: `err-${Date.now()}`, sender:'magix', text: `Error: ${e.message}`, chat_id: activeChatId || 'unknown'}]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveScriptToSupabase = async (userId, code, promptText, tabUrl, chatId, isUpdatingExistingScriptInChat = false) => {
    let domain = '*';
    try { if (tabUrl && !tabUrl.startsWith('chrome://')) domain = new URL(tabUrl).hostname; } catch (e) { console.error("URL parse error:", e); }
    // console.log(`saveScriptToSupabase: ChatID: ${chatId}, Update: ${isUpdatingExistingScriptInChat}`);
    let scriptIdToReturn = null; // Variable to hold the ID to return

    try {
      if (isUpdatingExistingScriptInChat && chatId) {
        // --- Update Existing Script ---
        const { data: chat, error: chatErr } = await supabase.from('chats').select('script_id').eq('id', chatId).single();
        if (chatErr) throw new Error(`Failed to fetch chat details for update: ${chatErr.message}`);
        if (!chat?.script_id) throw new Error("Chat is not linked to a script, cannot update.");

        const scriptId = chat.script_id; // Get the existing script ID
        const { error: updateErr } = await supabase
          .from('scripts')
          .update({ code, title: promptText.substring(0, 50) + (promptText.length > 50 ? '...' : '') })
          .eq('id', scriptId)
          .eq('user_id', userId); // Ensure user owns the script

        if (updateErr) throw new Error(`Failed to update script: ${updateErr.message}`);

        // console.log(`Script ${scriptId} updated successfully.`);
        setCurrentScriptContentForChat(code); // Update local state
        fetchUserScripts(); // Refresh script list
        scriptIdToReturn = scriptId; // Set ID to return

      } else {
        // --- Insert New Script ---
        const { data: newScript, error: insertErr } = await supabase
          .from('scripts')
          .insert({ user_id: userId, code, title: promptText.substring(0, 50) + (promptText.length > 50 ? '...' : ''), domain_pattern: domain })
          .select('id') // Only select the ID
          .single();

        if (insertErr) throw new Error(`Failed to save new script: ${insertErr.message}`);
        if (!newScript?.id) throw new Error("Failed to retrieve ID after inserting new script.");

        scriptIdToReturn = newScript.id; // Set ID to return
        // console.log(`New script ${scriptIdToReturn} saved successfully.`);
        setCurrentScriptContentForChat(code); // Update local state

        // Link to chat if a chatId was provided (should be the case if called from handleSubmit)
        if (chatId) {
          const { error: linkErr } = await supabase
            .from('chats')
            .update({ script_id: scriptIdToReturn })
            .eq('id', chatId);

          if (linkErr) {
            // Log error but don't necessarily stop everything, script is saved.
            console.error(`Failed to link script ${scriptIdToReturn} to chat ${chatId}: ${linkErr.message}`);
            setError(`Failed to link script to chat: ${linkErr.message}`); // Show error to user
          } else {
            // console.log(`Script ${scriptIdToReturn} linked to chat ${chatId}.`);
          }
        }
        fetchUserScripts(); // Refresh script list
      }
    } catch (e) {
      console.error("Error in saveScriptToSupabase:", e);
      setError(e.message || "An unknown error occurred while saving the script.");
      scriptIdToReturn = null; // Ensure null is returned on error
    }

    return scriptIdToReturn; // Return the ID (or null if error occurred)
  };

  const handleScriptItemClick = async (script) => {
    if (!session?.user?.id) { handleSignIn(); return; }
    setIsLoading(true); setError(null);
    // console.log("Script item clicked:", script.id, script.title);

    try {
      const { data: existingChats, error: fetchChatError } = await supabase
        .from('chats')
        .select('id, title, script_id, scripts (id, code, title)') // scripts (code) is important
        .eq('script_id', script.id)
        .eq('user_id', session.user.id)
        .limit(1);

      if (fetchChatError) throw fetchChatError;

      if (existingChats && existingChats.length > 0) {
        const chat = existingChats[0];
        // console.log("Found existing chat for script:", chat.id);
        setCurrentChatId(chat.id); // This will trigger the useEffect to load messages & set view
        // useEffect will also set title and script content
      } else {
        // console.log("No existing chat for script, creating new one for script ID:", script.id);
        const newChatTitle = script.title || 'Chat about script';
        const { data: newChatData, error: newChatError } = await supabase
          .from('chats')
          .insert({ user_id: session.user.id, script_id: script.id, title: newChatTitle })
          .select('id, title') // Select id and title of the new chat
          .single();

        if (newChatError) throw newChatError;
        if (!newChatData) throw new Error("Failed to create and retrieve new chat for script.");
        
        setCurrentChatId(newChatData.id);
        setCurrentChatTitle(newChatData.title); // Set title from new chat data
        setCurrentScriptContentForChat(script.code || ''); // script.code should be available
        setMessages([]); // New chat starts with no messages from DB
        setCurrentView('chat'); // Explicitly set view after setting ID
      }
    } catch (e) {
      console.error("Error in handleScriptItemClick:", e);
      setError(`Failed to process script click: ${e.message}`);
    } 
    // setIsLoading(false); // isLoading will be handled by the useEffect for currentChatId
  };

  const handleCloseConfirmDialog = () => {
    setIsConfirmDeleteDialogOpen(false);
    setScriptPendingDeletion(null);
    // Return focus after a short delay to ensure dialog is closed
    setTimeout(() => {
      triggerRef.current?.focus();
    }, 0);
  };

  const handleConfirmDeleteScript = async () => { // Renamed and made async
    if (!scriptPendingDeletion) {
      handleCloseConfirmDialog();
      return;
    }

    const scriptToDelete = scriptPendingDeletion; // Keep a reference before clearing state

    // 1. Request removal of local effect
    // console.log(`Requesting removal of local effect for script: ${scriptToDelete.id}`);
    chrome.runtime.sendMessage({
      type: 'REMOVE_SCRIPT_EFFECT',
      scriptId: scriptToDelete.id,
      scriptCode: scriptToDelete.code
    }, async (response) => { // Made callback async to await DB deletion
       if (chrome.runtime.lastError) {
         console.error("Error sending remove effect message:", chrome.runtime.lastError.message);
         setError(`Error removing script effect: ${chrome.runtime.lastError.message}`);
         // Don't proceed to DB delete if local removal fails to notify
       } else if (response && !response.success) {
         console.error("Failed to remove script effect (response):", response.error);
         setError(`Failed to remove script effect: ${response.error}`);
         // Don't proceed to DB delete if local removal fails
       } else {
         // console.log("Script effect removal message processed successfully by background script.");

         // 2. Delete from database
         if (scriptToDelete?.id && session?.user?.id) {
           // console.log(`Attempting to delete script ${scriptToDelete.id} from database.`);
           try {
             const { error: deleteError } = await supabase
               .from('scripts')
               .delete()
               .eq('id', scriptToDelete.id)
               .eq('user_id', session.user.id); // Ensure user owns the script

             if (deleteError) {
               throw deleteError;
             }

             // console.log(`Script ${scriptToDelete.id} deleted from database.`);
             fetchUserScripts(); // Refresh the list from DB
             // Optionally, show a success notification/toast here
           } catch (dbError) {
             console.error("Error deleting script from database:", dbError);
             setError(`Failed to delete script from database: ${dbError.message}`);
             // UI will still close, error will be displayed.
           }
         }
       }
    });
    // Dialog closing and focus management is now handled after both operations attempt
    handleCloseConfirmDialog();
  };


  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const renderHomeInputArea = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', p: 1, borderRadius: 3, bgcolor: 'grey.100', border: '1px solid #e0e0e0', position: 'relative', mb: 2, pb: selectedElementPath ? '48px' : '40px' }}>
      <Chip icon={<MyLocationIcon sx={{ fontSize: '1rem', color: (isSelectingElement || selectedElementPath) ? 'primary.main' : 'grey.500' }} />} label={isSelectingElement ? "Selecting..." : selectedElementPath ? "Selected" : "Select"} size="small" variant={(isSelectingElement || selectedElementPath) ? "filled" : "outlined"} color={(isSelectingElement || selectedElementPath) ? "primary" : "default"} clickable onClick={async () => { if (isSelectingElement) return; if (selectedElementPath) { setSelectedElementPath(''); } else { setIsSelectingElement(true); setSelectedElementPath(''); setError(null); try { const [tab] = await chrome.tabs.query({ active: true, currentWindow: true }); if (tab?.id) chrome.tabs.sendMessage(tab.id, { type: 'START_ELEMENT_SELECTION' }, r => { if (chrome.runtime.lastError) { setError(`Selection error: ${chrome.runtime.lastError.message}`); setIsSelectingElement(false); }}); else throw new Error("No active tab."); } catch (e) { setError(`Selection error: ${e.message}`); setIsSelectingElement(false); }}}} sx={{ position: 'absolute', bottom: 8, left: 8, fontSize: '0.75rem', height: '28px', borderColor: '#e0e0e0', '& .MuiChip-label': { px: '8px' }, '& .MuiChip-icon': { ml: '6px', mr: '-4px' }}} />
      <TextField fullWidth multiline minRows={2} maxRows={3} variant="standard" placeholder={animatedPlaceholder + '|'} value={inputValue} onChange={handleInputChange} onKeyDown={handleKeyDown} InputProps={{ disableUnderline: true, sx: { fontSize: '0.9rem' } }} sx={{ flexGrow: 1, '& .MuiInputBase-root': { py: 0.5 } }} disabled={isLoading} />
      <IconButton onClick={handleSubmit} disabled={isLoading || (!inputValue.trim() && !currentChatId) } sx={{ position: 'absolute', bottom: 8, right: 8, bgcolor: 'common.black', color: 'common.white', width: 28, height: 28, '&:hover': { bgcolor: 'grey.800' }, '&.Mui-disabled': { backgroundColor: 'grey.300', color: 'grey.500' }}}>{isLoading ? <CircularProgress size={16} sx={{ color: 'white' }}/> : <ArrowUpwardIcon sx={{ fontSize: '1rem' }} />}</IconButton>
    </Box>
  );

  const renderChatInputArea = () => (
    <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', p: 1, px: 2, pb: 2, borderRadius: 0, bgcolor: 'grey.100', border: '1px solid #e0e0e0', mt: 'auto' }}>
      <TextField fullWidth multiline={false} variant="standard" placeholder="Ask Magix..." value={inputValue} onChange={handleInputChange} onKeyDown={handleKeyDown} InputProps={{ disableUnderline: true, sx: { fontSize: '0.9rem' } }} sx={{ mr: 1, '& .MuiInputBase-root': { py: 1 } }} disabled={isLoading} />
      <IconButton onClick={handleSubmit} disabled={isLoading || !inputValue.trim()} sx={{ bgcolor: 'common.black', color: 'common.white', width: 28, height: 28, '&:hover': { bgcolor: 'grey.800' }, '&.Mui-disabled': { backgroundColor: 'grey.300', color: 'grey.500' }}}>{isLoading ? <CircularProgress size={16} sx={{ color: 'white' }}/> : <ArrowUpwardIcon sx={{ fontSize: '1rem' }} />}</IconButton>
    </Box>
  );

  const renderHomeScreen = () => (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', flexGrow: 1, overflowY: 'auto' }}>
      <Typography variant="h6" component="h1" sx={{ textAlign: 'center', mb: 2, fontSize: '1.05rem', fontWeight: 600 }}>Modify any website 🪄</Typography>
      {renderHomeInputArea()}
      {session && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'text.secondary' }}>Your Modifications:</Typography>
          <List dense sx={{ pt: 0, maxHeight: '350px', overflowY: 'auto', '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none', '-ms-overflow-style': 'none' }}>
            {userScripts.length > 0 ? (
              userScripts.map((script) => (
                <ListItemButton key={script.id} onClick={() => handleScriptItemClick(script)} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, mb: 1, py: 0.5 }}>
                  <ListItemText id={`script-list-item-${script.id}`} primary={script.title} secondary={script.domain_pattern || 'All sites'} primaryTypographyProps={{ sx: { fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }} secondaryTypographyProps={{ sx: { fontSize: '0.8rem' } }} />
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    size="small"
                    onClick={(e) => {
                      triggerRef.current = e.currentTarget; // Store the clicked button
                      e.stopPropagation(); // Prevent ListItemButton click
                      setScriptPendingDeletion(script); // Store the script object
                      setIsConfirmDeleteDialogOpen(true); // Open the dialog
                    }}
                  >
                    <DeleteIcon sx={{ color: 'grey.500', fontSize: '1.1rem' }} />
                  </IconButton>
                </ListItemButton>
              )) ) : ( <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block', mt: 2 }}>No modifications saved yet. Create one using the input above!</Typography> )}
          </List>
         </Box>
       )}
      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mt: 3 }}>
        Magix is in its early stages and may occasionally make mistakes.
      </Typography>
     </Box>
   );

  const renderChatScreen = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ position: 'sticky', top: 0, zIndex: 1, bgcolor: 'background.paper', p: 1, mb: 1, display: 'flex', alignItems: 'center' }}>
         <IconButton onClick={() => { setCurrentChatId(null); /* useEffect will handle view change */ }} size="small" sx={{ mr: 1}}><ArrowBackIcon /></IconButton>
         <Typography variant="subtitle1" sx={{ flexGrow: 1, textAlign: 'center', fontWeight: 500, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentChatTitle || "Chat"}</Typography>
         <Box sx={{ width: 40 }} />
      </Box>
      <Box ref={chatContainerRef} sx={{ flexGrow: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {messages.map((msg) => (
          <Box key={msg.id} sx={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
            {msg.status === 'processing' ? ( <Paper className="shimmer-bubble" elevation={0} sx={{ p: 1, borderRadius: 2, bgcolor: 'grey.200', display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden', position: 'relative' }}><Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary', fontSize: '0.9rem' }}>Doing magix...</Typography></Paper>
            ) : msg.sender === 'user' ? ( <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'grey.200' }}><Typography variant="body2" sx={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.text}</Typography></Paper>
            ) : msg.codeToCopy ? ( <Box><Typography variant="body2" sx={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', mb: 1 }}>{msg.text}</Typography><Paper variant="outlined" sx={{ p: 1, bgcolor: 'grey.100', position: 'relative', borderRadius: 1, overflowX: 'auto' }}><pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.8rem' }}><code>{msg.codeToCopy}</code></pre><IconButton size="small" onClick={() => navigator.clipboard.writeText(msg.codeToCopy)} sx={{ position: 'absolute', top: 4, right: 4 }} title="Copy code"><ContentCopyIcon sx={{ fontSize: '0.9rem' }} /></IconButton></Paper></Box>
            ) : ( <Typography variant="body2" sx={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', alignSelf: 'flex-start' }}>{msg.text}</Typography> )}
          </Box>
        ))}
        <div ref={chatEndRef} />
      </Box>
      {renderChatInputArea()}
    </Box>
  );

  const renderAccountSettingsScreen = () => (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
       <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
         <IconButton onClick={() => setCurrentView('home')} size="small"><ArrowBackIcon /></IconButton>
         <Typography variant="h6" sx={{ ml: 1, fontSize: '1.1rem', fontWeight: 600 }}>Account Settings</Typography>
       </Box>
       <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
         <Tabs value={settingsTab} onChange={handleSettingsTabChange} aria-label="account settings tabs" textColor="inherit" sx={{ '& .MuiTabs-indicator': { backgroundColor: 'common.black' }, '& .Mui-selected': { color: 'common.black', fontWeight: 600 }, }}>
           <Tab label="Account Info" {...a11yProps(0)} sx={{ textTransform: 'none', fontSize: '0.9rem' }} />
           <Tab label="Billing" {...a11yProps(1)} sx={{ textTransform: 'none', fontSize: '0.9rem' }} />
         </Tabs>
       </Box>
       <TabPanel value={settingsTab} index={0}>
         <Box sx={{ pt: 3, px: 1 }}>
           <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
             <TextField label="Name" variant="outlined" size="small" value={userName} onChange={(e) => setUserName(e.target.value)} InputProps={{ sx: { fontSize: '0.9rem' } }} sx={{ flexGrow: 1, mr: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            <Button variant="contained" size="small" onClick={handleNameUpdate} disableElevation sx={{ textTransform: 'none', borderRadius: 2, bgcolor: 'common.black', '&:hover': { bgcolor: 'grey.800' } }}>Update</Button>
         </Box>
         <TextField label="Email" variant="outlined" size="small" disabled value={session?.user?.email || ''} fullWidth InputProps={{ sx: { fontSize: '0.9rem' } }} sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
         <Divider sx={{ my: 2 }} />
         <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="error" sx={{ mb: 1, fontWeight: 500 }}>Danger Zone</Typography>
            <Button variant="outlined" color="error" size="small" onClick={handleDeleteAccount} disableElevation sx={{ textTransform: 'none', borderRadius: 2 }}>Delete Account</Button>
         </Box>
         <Divider sx={{ my: 3 }} />
         <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Link href="https://trymagix.com/privacy" target="_blank" rel="noopener noreferrer" underline="hover" variant="caption" color="text.secondary">Privacy Policy</Link>
            <Link href="https://trymagix.com/terms" target="_blank" rel="noopener noreferrer" underline="hover" variant="caption" color="text.secondary">Terms of Service</Link>
            <Link href="https://trymagix.com/contact" target="_blank" rel="noopener noreferrer" underline="hover" variant="caption" color="text.secondary">Contact Us</Link>
         </Box>
        </Box>
       </TabPanel>
       <TabPanel value={settingsTab} index={1}>
         <Box sx={{ pt: 3, px: 1 }}>
           {userProfile?.is_pro ? (
             <Chip label="Pro User" size="small" sx={{ mb: 2, bgcolor: 'success.main', color: 'common.white', fontWeight: 500 }} />
           ) : (
             <Chip label="Free Tier" size="small" sx={{ mb: 2 }} />
           )}

           {userProfile?.is_pro ? (
             <Typography variant="body2" sx={{ mb: 1 }}>You have unlimited requests!</Typography>
           ) : (
             <>
               <Typography variant="body2" sx={{ mb: 1 }}>
                 Monthly Requests: {userProfile?.request_count !== undefined ? `${10 - (userProfile.request_count || 0)} / 10 used` : 'Loading...'}
               </Typography>
               <LinearProgress 
                 variant="determinate" 
                 value={userProfile?.request_count !== undefined ? ((10 - (userProfile.request_count || 0)) / 10) * 100 : 0} 
                 color={userProfile?.request_count !== undefined && (10 - userProfile.request_count) >= 8 ? 'error' : (10 - userProfile.request_count) >= 5 ? 'warning' : 'success'} 
                 sx={{ mb: 2, height: 8, borderRadius: 1 }} 
               />
               <Typography variant="caption" display="block" sx={{ mb: 2, color: 'text.secondary' }}>
                 Your free requests will reset on the 1st of next month (UTC).
               </Typography>
             </>
           )}
          
           {userProfile?.is_pro ? (
             <Button 
               variant="contained" 
               size="small" 
               disableElevation 
               sx={{ textTransform: 'none', borderRadius: 2, bgcolor: 'common.black', '&:hover': { bgcolor: 'grey.800' } }}
               onClick={() => userProfile.customer_portal_url && window.open(userProfile.customer_portal_url, '_blank')}
               disabled={!userProfile.customer_portal_url}
             >
               Manage Billing
             </Button>
           ) : (
             <Button 
               variant="contained" 
               size="small" 
               disableElevation 
               color="success"
               sx={{ textTransform: 'none', borderRadius: 2 }}
               onClick={() => window.open('YOUR_LEMON_SQUEEZY_PRO_CHECKOUT_URL', '_blank')} // TODO: Replace with actual Lemon Squeezy URL
             >
               Upgrade to Pro
             </Button>
           )}
        </Box>
       </TabPanel>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'background.paper', justifyContent: currentView === 'home' && !session ? 'center' : 'flex-start' }}>
      {session && currentView !== 'settings' && currentView !== 'chat' && (
        <IconButton onClick={handleAccountMenuOpen} size="small" sx={{ position: 'absolute', top: 16, left: 16, zIndex: 2 }}>
           <AccountCircleIcon sx={{ color: 'grey.600', fontSize: '1.25rem' }} />
        </IconButton>
      )}
       <Popover id={accountMenuId} open={openAccountMenu} anchorEl={accountMenuAnchorEl} onClose={handleAccountMenuClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left'}} slotProps={{ paper: { sx: { width: '200px', mt: 1, borderRadius: 2 } } }} >
          <List dense>
            <ListItem>
              <ListItemText 
                primary="Monthly Requests:" 
                secondary={
                  userProfile ? (
                    userProfile.is_pro ? "Unlimited" : 
                    (userProfile.request_count !== undefined ? `${10 - userProfile.request_count} / 10 used` : "Loading...")
                  ) : "Loading..."
                } 
              />
            </ListItem>
            {currentView === 'chat' ? (
              <ListItemButton onClick={() => { setCurrentView('home'); setCurrentChatId(null); setMessages([]); setCurrentScriptContentForChat(''); setCurrentChatTitle(''); handleAccountMenuClose(); }}>
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

      {currentView === 'chat' ? renderChatScreen()
       : currentView === 'settings' ? renderAccountSettingsScreen()
       : renderHomeScreen()}

      {/* Upgrade Modal */}
      <Dialog open={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)}>
        <DialogTitle>{"Unlock Unlimited Magix"}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            You've used all your 10 free requests for this month.
          </DialogContentText>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Upgrade to **Magix Pro** for:
          </Typography>
          <List dense sx={{mb: 2, '& .MuiListItemIcon-root': {minWidth: '30px'} }}>
            <ListItem disableGutters>
              <ListItemIcon>✅</ListItemIcon>
              <ListItemText primary="Unlimited website modifications" />
            </ListItem>
            <ListItem disableGutters>
              <ListItemIcon>🚀</ListItemIcon>
              <ListItemText primary="Access to all current & future Pro features" />
            </ListItem>
            <ListItem disableGutters>
              <ListItemIcon>❤️</ListItemIcon>
              <ListItemText primary="Support independent development" />
            </ListItem>
          </List>
          <DialogContentText variant="caption">
            Your quota will reset on the 1st of next month.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button onClick={() => setIsUpgradeModalOpen(false)} color="inherit">
            Maybe Later
          </Button>
          <Button 
            onClick={() => {
              window.open('YOUR_LEMON_SQUEEZY_PRO_CHECKOUT_URL', '_blank'); // TODO: Replace!
              setIsUpgradeModalOpen(false);
            }} 
            variant="contained" 
            color="success"
            autoFocus
          >
            Upgrade to Pro
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={isConfirmDeleteDialogOpen}
        onClose={handleCloseConfirmDialog} // Use the new handler
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Confirm Delete"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to permanently delete this script? This action will remove it from your list and the database, and cannot be undone. Associated chat history will remain but will no longer be linked to this script.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>Cancel</Button>
          <Button onClick={handleConfirmDeleteScript} autoFocus color="error">
            Confirm Delete
          </Button>
        </DialogActions>
      </Dialog>


      {error && (
        <Typography color="error" sx={{ mt: 2, textAlign: 'center', p: 2 }}>
          Error: {error}
        </Typography>
      )}
    </Box>
  );
}

export default App;
