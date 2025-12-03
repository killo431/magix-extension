import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient'; // Import the Supabase client
import { analyzePrompt, generateScript, getAIConfig, saveAIConfig, AI_PROVIDERS, PROVIDER_MODELS } from './aiService'; // Import local AI service
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
// import ListItem from '@mui/material/ListItem'; // Replaced by ListItemButton for script list
import ListItemText from '@mui/material/ListItemText';
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
import SearchIcon from '@mui/icons-material/Search';
import PublicIcon from '@mui/icons-material/Public';
import StarIcon from '@mui/icons-material/Star';
import GitHubIcon from '@mui/icons-material/GitHub';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';

// Add pulse animation styles
const pulseKeyframes = `
  @keyframes pulse {
    0% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.02); }
    100% { opacity: 1; transform: scale(1); }
  }
`;

// Inject the styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = pulseKeyframes;
  document.head.appendChild(styleSheet);
}


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
  "Add a stopwatch on X",
  "Turn all fonts into comic sans",
  "Place a text to speech button on this blog",
  "Change the theme of this website to cyberpunk vibes",
];

// Detect browser type (Chrome, Edge, or other Chromium-based)
function detectBrowser() {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Edg/')) {
    return 'edge';
  } else if (userAgent.includes('Chrome/')) {
    return 'chrome';
  }
  return 'chromium';
}

// Get extensions URL based on browser type
function getExtensionsUrl() {
  const browser = detectBrowser();
  const extensionId = chrome.runtime.id;
  if (browser === 'edge') {
    return `edge://extensions/?id=${extensionId}`;
  }
  return `chrome://extensions/?id=${extensionId}`;
}


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
  const [aiProvider, setAiProvider] = useState(AI_PROVIDERS.GEMINI);
  const [aiModel, setAiModel] = useState('gemini-2.5-pro-preview');
  const [apiKey, setApiKey] = useState('');
  const [useCustomModel, setUseCustomModel] = useState(false);
  const [customModelName, setCustomModelName] = useState('');
  const [apiKeySaveStatus, setApiKeySaveStatus] = useState('');
  const [userScripts, setUserScripts] = useState([]);
  const [activeScripts, setActiveScripts] = useState([]); // Scripts currently registered in browser
  const [isSelectingElement, setIsSelectingElement] = useState(false);
  const [selectedElementPath, setSelectedElementPath] = useState('');

  const [currentChatId, setCurrentChatId] = useState(null);
  const [currentScriptContentForChat, setCurrentScriptContentForChat] = useState('');
  const [currentChatTitle, setCurrentChatTitle] = useState('');
  const [currentScriptId, setCurrentScriptId] = useState(null);
  const [currentScriptIsPublic, setCurrentScriptIsPublic] = useState(false);
  const [currentScriptInstallCount, setCurrentScriptInstallCount] = useState(0);
  const [currentScriptUsageCount, setCurrentScriptUsageCount] = useState(0);
  const [currentScriptTitle, setCurrentScriptTitle] = useState('');

  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [animatedPlaceholder, setAnimatedPlaceholder] = useState('');

  // State for delete confirmation dialog
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [scriptPendingDeletion, setScriptPendingDeletion] = useState(null);
  const triggerRef = useRef(null); // Ref to store the element that triggered the dialog

  // State for UserScripts not available modal
  const [isUserScriptsModalOpen, setIsUserScriptsModalOpen] = useState(false);
  const [userScriptsGuidance, setUserScriptsGuidance] = useState(''); 

  // Discover view state
  const [discoverScripts, setDiscoverScripts] = useState([]);
  const [isDiscoverLoading, setIsDiscoverLoading] = useState(false);
  const [discoverError, setDiscoverError] = useState(null);
  const [discoverHostname, setDiscoverHostname] = useState('');

  // Public toggle confirmation dialog state
  const [isPublicConfirmOpen, setIsPublicConfirmOpen] = useState(false);
  const [publicToggleScriptId, setPublicToggleScriptId] = useState(null);
  const [publicToggleTargetValue, setPublicToggleTargetValue] = useState(false);
  const [publicTitleInput, setPublicTitleInput] = useState('');
  const PUBLIC_TITLE_MAX = 75;

  // Function to check if UserScripts API is available
  const checkUserScriptsAvailability = () => {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({
          type: 'CHECK_USER_SCRIPTS_AVAILABILITY'
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.warn("Could not check UserScripts availability:", chrome.runtime.lastError.message);
            resolve({ available: false, error: "Could not check UserScripts availability" });
          } else if (response) {
            resolve(response);
          } else {
            resolve({ available: false, error: "No response from background script" });
          }
        });
      } catch (error) {
        console.error("Error checking UserScripts availability:", error);
        resolve({ available: false, error: error.message });
      }
    });
  };


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
          setCurrentScriptId(null);
          setCurrentScriptIsPublic(false);
          setCurrentScriptInstallCount(0);
          setCurrentScriptUsageCount(0);
          setCurrentScriptTitle('');
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

  const fetchActiveScripts = async () => {
    try {
      chrome.runtime.sendMessage({
        type: 'GET_REGISTERED_SCRIPTS'
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn("Could not fetch registered scripts:", chrome.runtime.lastError.message);
          setActiveScripts([]);
        } else if (response && response.success) {
          // console.log("Active scripts:", response.scripts);
          setActiveScripts(response.scripts || []);
        } else {
          console.warn("Failed to fetch registered scripts:", response?.error);
          setActiveScripts([]);
        }
      });
    } catch (error) {
      console.error("Error fetching active scripts:", error);
      setActiveScripts([]);
    }
  };

  // Function to get only active scripts to display
  const getDisplayedScripts = () => {
    // Always show only scripts that are currently active/registered
    const activeScriptIds = new Set(activeScripts.map(script => script.id));
    return userScripts.filter(script => activeScriptIds.has(script.id));
  };

  // Load AI config on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await getAIConfig();
        setAiProvider(config.provider);
        setAiModel(config.model);
        setApiKey(config.apiKey);
        setUseCustomModel(config.useCustomModel || false);
        setCustomModelName(config.customModelName || '');
      } catch (error) {
        console.error('Error loading AI config:', error);
      }
    };
    loadConfig();
  }, []);

  useEffect(() => {
    fetchUserScripts();
    fetchActiveScripts(); // Also fetch currently active scripts
    
    if (session?.user?.id) {
      // Set user name from session metadata or email
      if (session.user.user_metadata?.full_name) {
        setUserName(session.user.user_metadata.full_name);
      } else if (session.user.email) {
        setUserName(session.user.email.split('@')[0]); // Fallback to part of email
      }
    } else {
      setUserName(''); // Clear name if no session
    }
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

  // When entering a chat, fetch its script_id and set
  useEffect(() => {
    if (!currentChatId) return;
    (async () => {
      try {
        // First fetch the chat to get script_id
        const { data: chatRow, error: chatErr } = await supabase
          .from('chats')
          .select('id, script_id, title')
          .eq('id', currentChatId)
          .single();
        if (chatErr) throw chatErr;
        const scriptId = chatRow?.script_id || null;
        setCurrentScriptId(scriptId);

        if (scriptId) {
          // Then fetch the script details
          const { data: scriptRow, error: scriptErr } = await supabase
            .from('scripts')
            .select('title, is_public, install_count, usage_count')
            .eq('id', scriptId)
            .single();
          if (scriptErr) throw scriptErr;
          setCurrentScriptTitle(scriptRow?.title || '');
          setCurrentScriptIsPublic(Boolean(scriptRow?.is_public));
          setCurrentScriptInstallCount(Number(scriptRow?.install_count || 0));
          setCurrentScriptUsageCount(Number(scriptRow?.usage_count || 0));
        } else {
          setCurrentScriptIsPublic(false);
          setCurrentScriptInstallCount(0);
          setCurrentScriptUsageCount(0);
          setCurrentScriptTitle('');
        }
      } catch (e) {
        console.warn('Could not fetch chat/script details:', e.message);
      }
    })();
  }, [currentChatId]);

  // Fetch public scripts for current site (Discover)
  const fetchDiscoverScripts = async () => {
    setIsDiscoverLoading(true);
    setDiscoverError(null);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const hostname = tab?.url && !tab.url.startsWith('chrome://') ? new URL(tab.url).hostname : null;
      if (!hostname) throw new Error('No active site to discover modifications for.');
      setDiscoverHostname(hostname);
      const query = supabase
        .from('scripts')
        .select('id, user_id, title, domain_pattern, code, is_public, install_count')
        .eq('domain_pattern', hostname)
        .eq('is_public', true)
        .order('install_count', { ascending: false })
        .limit(50);
      const { data, error } = await query;
      if (error) throw error;
      setDiscoverScripts(data || []);
    } catch (e) {
      setDiscoverError(e.message);
      setDiscoverScripts([]);
    } finally {
      setIsDiscoverLoading(false);
    }
  };

  // Install (duplicate) and apply a public script
  const installPublicScript = async (sourceScript) => {
    if (!session?.user?.id) { handleSignIn(); return; }
    setIsLoading(true); setError(null);
    try {
      const userId = session.user.id;
      // 1) Duplicate into user's scripts
      const { data: inserted, error: insertErr } = await supabase
        .from('scripts')
        .insert({
          user_id: userId,
          code: sourceScript.code,
          title: sourceScript.title,
          domain_pattern: sourceScript.domain_pattern,
          source_script_id: sourceScript.id
        })
        .select('id')
        .single();
      if (insertErr) throw insertErr;
      const newScriptId = inserted.id;

      // 2) Increment install_count on source
      {
        const { error: incErr } = await supabase.from('scripts')
          .update({ install_count: (sourceScript.install_count || 0) + 1 })
          .eq('id', sourceScript.id);
        if (incErr) {
          console.warn('Could not increment install_count (check RLS/policy):', incErr.message);
        } else {
          // Optimistically bump local Discover list so user sees the change immediately
          setDiscoverScripts(prev => prev.map(s => s.id === sourceScript.id ? { ...s, install_count: (s.install_count || 0) + 1 } : s));
        }
      }

      // 3) Apply/inject to current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error('No active tab.');
      const typeIsJs = ['function', 'const', 'let', 'var', 'document', 'window', '=>'].some(k => (sourceScript.code || '').includes(k));
      if (typeIsJs) {
        const cleanCode = (sourceScript.code || '').replace(/^```javascript\n/, '').replace(/\n```$/, '');
        await new Promise((resolve) => {
          chrome.runtime.sendMessage({
            type: 'REGISTER_USER_SCRIPT',
            scriptId: newScriptId,
            code: cleanCode,
            targetUrl: tab.url
          }, (res) => {
            resolve(res);
          });
        });
        // Reload page to apply JS world registration deterministically
        chrome.tabs.reload(tab.id);
      } else {
        await chrome.scripting.insertCSS({ target: { tabId: tab.id }, css: sourceScript.code || '' });
        // Reload page to ensure consistent CSS application
        chrome.tabs.reload(tab.id);
      }

      // 4) Increment usage_count on source
      {
        const { error: useErr } = await supabase.from('scripts')
          .update({ usage_count: (sourceScript.usage_count || 0) + 1 })
          .eq('id', sourceScript.id);
        if (useErr) {
          console.warn('Could not increment usage_count (check RLS/policy):', useErr.message);
        }
      }

      // 5) Create chat for this installed script
      const newChatTitle = sourceScript.title || 'Installed modification';
      const { data: newChat, error: chatErr } = await supabase
        .from('chats')
        .insert({ user_id: userId, script_id: newScriptId, title: newChatTitle })
        .select('id, title')
        .single();
      if (chatErr) throw chatErr;
      setCurrentChatId(newChat.id);
      setCurrentChatTitle(newChat.title);
      setCurrentScriptContentForChat(sourceScript.code || '');
      setCurrentView('chat');

      // 6) Persist a success message and show it in UI
      const successText = 'This modification was installed from Discover and applied successfully.';
      const { error: successMsgErr } = await supabase
        .from('chat_messages')
        .insert({ chat_id: newChat.id, user_id: userId, sender_type: 'ai', content: successText });
      if (successMsgErr) {
        console.warn('Could not save success message:', successMsgErr.message);
      } else {
        setMessages(prev => [...prev, { id: `ai-${Date.now()}`, sender: 'magix', text: successText, chat_id: newChat.id }]);
      }

    } catch (e) {
      console.error('Install failed:', e);
      setError(`Install failed: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh stats for current script
  const refreshCurrentScriptStats = async () => {
    if (!currentScriptId) return;
    try {
      const { data, error } = await supabase
        .from('scripts')
        .select('title, is_public, install_count, usage_count')
        .eq('id', currentScriptId)
        .single();
      if (error) throw error;
      setCurrentScriptTitle(data?.title || '');
      setCurrentScriptIsPublic(Boolean(data?.is_public));
      setCurrentScriptInstallCount(Number(data?.install_count || 0));
      setCurrentScriptUsageCount(Number(data?.usage_count || 0));
    } catch (e) {
      console.warn('Failed to refresh script stats:', e.message);
    }
  };

  // Toggle public status for current chat's script
  const requestTogglePublic = async () => {
    if (!currentScriptId) { setIsPublicConfirmOpen(false); return; }
    try {
      const trimmedTitle = (publicTitleInput || currentScriptTitle || currentChatTitle || '').slice(0, PUBLIC_TITLE_MAX);
      await supabase.from('scripts')
        .update(publicToggleTargetValue ? { is_public: true, title: trimmedTitle } : { is_public: false })
        .eq('id', currentScriptId)
        .eq('user_id', session?.user?.id || '');
      setIsPublicConfirmOpen(false);
      setCurrentScriptIsPublic(publicToggleTargetValue);
      if (publicToggleTargetValue) setCurrentScriptTitle(trimmedTitle);
      // Feedback message
      setMessages(prev => [...prev, { id: `sys-${Date.now()}`, sender: 'magix', text: publicToggleTargetValue ? 'Your modification is now public.' : 'Your modification is now private.', chat_id: currentChatId }]);
      await refreshCurrentScriptStats();
    } catch (e) {
      setIsPublicConfirmOpen(false);
      setError(`Failed to update public status: ${e.message}`);
    }
  };

  // Discover screen renderer
  const renderDiscoverScreen = () => (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={() => setCurrentView('home')} size="small" sx={{ mr: 1, borderRadius: 2, '&:hover': { bgcolor: 'grey.50' } }}>
          <ArrowBackIcon sx={{ fontSize: '1.1rem', color: 'grey.500' }} />
        </IconButton>
        <Typography variant="subtitle1" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>Discover Modifications{discoverHostname ? ` (${discoverHostname})` : ''}</Typography>
      </Box>
      {isDiscoverLoading ? (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Loading...</Typography>
      ) : discoverError ? (
        <Typography variant="body2" sx={{ color: 'error.main' }}>{discoverError}</Typography>
      ) : (
        <Box sx={{ pt: 0, maxHeight: '100%', overflowY: 'auto' }}>
          {discoverScripts.length === 0 ? (
            <Typography variant="caption" sx={{ color: 'grey.500' }}>No public modifications found for this site yet.</Typography>
          ) : (
            discoverScripts.map((s) => (
              <Paper key={s.id} elevation={0} variant="outlined" sx={{ borderRadius: 6, p: 1.5, mb: 1.5, borderColor: '#e0e0e0' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body1" sx={{ fontSize: '0.9rem', lineHeight: 1.3, mb: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {s.title}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip size="small" label={`Installs: ${s.install_count || 0}`} sx={{ bgcolor: 'grey.100', '& .MuiChip-label': { fontSize: '0.7rem' } }} />
                    </Box>
                    {/* domain removed since it's already in header */}
                  </Box>
                  <Button 
                    onClick={() => installPublicScript(s)} 
                    variant="contained" 
                    size="small" 
                    sx={{ 
                      textTransform: 'none', 
                      borderRadius: 50, 
                      px: 2,
                      py: 0.75,
                      fontSize: '0.85rem',
                      bgcolor: 'common.black',
                      '&:hover': { bgcolor: 'grey.800' }
                    }}
                  >
                    Install
                  </Button>
                </Box>
              </Paper>
            ))
          )}
        </Box>
      )}
    </Box>
  );

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

  const handleNameUpdate = async () => {
    if (!session?.user) {
      setError("You must be logged in to update your name.");
      return;
    }
    const trimmedName = userName.trim();
    if (!trimmedName) {
      setError("Name cannot be empty.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: updateError } = await supabase.auth.updateUser({
        data: { full_name: trimmedName } 
      });

      if (updateError) throw updateError;

      // console.log("Name updated successfully:", data.user);
      // Update local session state to reflect the change immediately in the UI if needed
      if (data.user) {
        setSession(prevSession => ({
          ...prevSession,
          user: data.user
        }));
        // Optionally, show a success message (e.g., using a snackbar or temporary state)
      }
    } catch (e) {
      console.error("Error updating name:", e);
      setError(`Failed to update name: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  const handleDeleteAccount = () => { /* console.log("Delete account clicked"); */ }

  const handleSaveApiConfig = async () => {
    setApiKeySaveStatus('saving');
    setError(null);
    try {
      await saveAIConfig(aiProvider, aiModel, apiKey.trim(), useCustomModel, customModelName.trim());
      setApiKeySaveStatus('success');
      setTimeout(() => setApiKeySaveStatus(''), 3000);
    } catch (e) {
      console.error('Error saving AI config:', e);
      setError(`Failed to save configuration: ${e.message}`);
      setApiKeySaveStatus('error');
      setTimeout(() => setApiKeySaveStatus(''), 3000);
    }
  };

  const handleProviderChange = (newProvider) => {
    setAiProvider(newProvider);
    // Set default model for the new provider
    const defaultModel = PROVIDER_MODELS[newProvider][0].id;
    setAiModel(defaultModel);
  };

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

    // 1. Check login status first
    const userId = session?.user?.id;
    if (!userId) {
      handleSignIn();
      return;
    }

    // 2. Check if API key is configured before proceeding
    const config = await getAIConfig();
    if (!config.apiKey || config.apiKey.trim() === '') {
      setError('Please configure your API key in Settings → API Keys before using Magix.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setInputValue('');

    // Check UserScripts availability at the very beginning before any processing
    const userScriptsCheck = await checkUserScriptsAvailability();
    if (!userScriptsCheck.available) {
      setUserScriptsGuidance(userScriptsCheck.guidance || userScriptsCheck.error);
      setIsUserScriptsModalOpen(true);
      setIsLoading(false);
      setInputValue(originalMessageText); // Restore the input text
      return;
    }

    let activeChatId = currentChatId;
    let scriptContentForThisInteraction = currentScriptContentForChat;
    let isNewChat = false;

    try {
      // No usage limits - users bring their own API keys!

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

      // Use local AI service instead of Supabase function
      const analysis = await analyzePrompt(promptForBackend, currentSelectedElemPath, scriptContentForThisInteraction);
      if (!analysis || typeof analysis.response !== 'string' || typeof analysis.is_code_needed !== 'boolean') throw new Error("Unexpected analysis response.");

      const { error: aiMsgErr } = await supabase.from('chat_messages').insert({ chat_id: activeChatId, user_id: userId, sender_type: 'ai', content: analysis.response });
      if (aiMsgErr) console.error("Failed to save AI message:", aiMsgErr.message);
      setMessages(prev => [...prev, { id: `ai-${Date.now()}`, sender: 'magix', text: analysis.response, chat_id: activeChatId }]);

      if (analysis.is_code_needed) {
        const procId = `proc-${Date.now()}`;
        setMessages(prev => [...prev, { id: procId, sender: 'magix', status: 'processing', chat_id: activeChatId }]);
        try {
          // Use local AI service instead of Supabase function
          const script = await generateScript(promptForBackend, currentSelectedElemPath, scriptContentForThisInteraction);
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
                // Auto-refresh the current tab to show changes immediately
                chrome.tabs.query({ active: true, currentWindow: true }, ([activeTab]) => {
                  if (activeTab?.id) {
                    chrome.tabs.reload(activeTab.id);
                  }
                });
                
                setMessages(prev => [...prev, { 
                  id: `ai-code-success-${Date.now()}`, 
                  sender: 'magix', 
                  text: 'Perfect! Your modification has been applied. Take a look and let me know what you think or if there\'s anything else you\'d like to change!', 
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
                  
                  // Check if this is a UserScripts API error and provide better messaging
                  if (eMsg.includes("UserScripts API not available")) {
                    setError("Please enable User Scripts to use this feature");
                    setMessages(p => [...p, {
                      id: `err-${Date.now()}`, 
                      sender:'magix', 
                      text: `⚠️ To use Magix, you need to enable User Scripts:\n\n${eMsg.split('. ')[1] || eMsg}`, 
                      chat_id: activeChatId
                    }]);
                  } else {
                    setError(`Script registration failed: ${eMsg}`);
                    setMessages(p => [...p, {id: `err-${Date.now()}`, sender:'magix', text: `Script registration error: ${eMsg}`, chat_id: activeChatId}]);
                  }
                } else if (res?.success) {
                  // console.log(`Script ${savedScriptId} registered successfully via background.`);
                  // Refresh active scripts list after successful registration
                  fetchActiveScripts();
                  
                  // Auto-refresh the current tab to show changes immediately
                  chrome.tabs.query({ active: true, currentWindow: true }, ([activeTab]) => {
                    if (activeTab?.id) {
                      chrome.tabs.reload(activeTab.id);
                    }
                  });
                  
                  setMessages(prev => [...prev, { 
                    id: `ai-code-success-${Date.now()}`, 
                    sender: 'magix', 
                    text: 'Perfect! Your modification has been applied. Take a look and let me know what you think or if there\'s anything else you\'d like to change!', 
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

      // No usage tracking needed - users manage their own API costs!

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
          .update({ code })
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

  const handleConfirmDeleteScript = async () => {
    if (!scriptPendingDeletion || !session?.user?.id) {
      handleCloseConfirmDialog();
      return;
    }

    const scriptToDelete = scriptPendingDeletion;
    setIsLoading(true);
    setError(null);

    try {
      // 1. First, delete from database
      const { error: deleteError } = await supabase
        .from('scripts')
        .delete()
        .eq('id', scriptToDelete.id)
        .eq('user_id', session.user.id);

      if (deleteError) {
        throw new Error(`Failed to delete script from database: ${deleteError.message}`);
      }

      // 2. Remove script effect from browser
    chrome.runtime.sendMessage({
      type: 'REMOVE_SCRIPT_EFFECT',
      scriptId: scriptToDelete.id,
      scriptCode: scriptToDelete.code
      }, (response) => {
       if (chrome.runtime.lastError) {
          console.warn("Warning: Could not remove script effect:", chrome.runtime.lastError.message);
       } else if (response && !response.success) {
          console.warn("Warning: Script effect removal failed:", response.error);
        }
      });

      // 3. Update local state - remove from scripts list
      setUserScripts(prev => prev.filter(script => script.id !== scriptToDelete.id));
      
      // 4. Refresh active scripts to update the UI
      fetchActiveScripts();

      // 4. Handle chat cleanup if current chat is linked to this script
      if (currentChatId && currentScriptContentForChat) {
        try {
          // Check if current chat is linked to the deleted script
          const { data: chatData, error: chatError } = await supabase
            .from('chats')
            .select('script_id')
            .eq('id', currentChatId)
            .single();

          if (!chatError && chatData?.script_id === scriptToDelete.id) {
            // Unlink the script from the chat
            await supabase
              .from('chats')
              .update({ script_id: null })
              .eq('id', currentChatId);
            
            // Clear local script content
            setCurrentScriptContentForChat('');
          }
        } catch (chatError) {
          console.warn("Warning: Could not update chat linkage:", chatError.message);
             }
      }

      console.log(`Script ${scriptToDelete.id} deleted successfully`);
      
      // 5. Refresh the current tab after successful deletion
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          chrome.tabs.reload(tab.id);
        }
      } catch (refreshError) {
        console.warn("Could not refresh tab:", refreshError.message);
        // Don't show error to user since deletion was successful
      }
      
    } catch (error) {
      console.error("Error deleting script:", error);
      setError(error.message || "Failed to delete script");
    } finally {
      setIsLoading(false);
    handleCloseConfirmDialog();
    }
  };


  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const renderHomeInputArea = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', p: 1, borderRadius: 6, bgcolor: 'grey.100', border: '1px solid #e0e0e0', position: 'relative', mb: 2, pb: selectedElementPath ? '48px' : '40px' }}>
      <Chip icon={<MyLocationIcon sx={{ fontSize: '1rem', color: (isSelectingElement || selectedElementPath) ? 'primary.main' : 'grey.500' }} />} label={isSelectingElement ? "Selecting..." : selectedElementPath ? "Element Selected" : "Select Element"} size="small" variant={(isSelectingElement || selectedElementPath) ? "filled" : "outlined"} color={(isSelectingElement || selectedElementPath) ? "primary" : "default"} clickable onClick={async () => { if (isSelectingElement) return; if (selectedElementPath) { setSelectedElementPath(''); } else { setIsSelectingElement(true); setSelectedElementPath(''); setError(null); try { const [tab] = await chrome.tabs.query({ active: true, currentWindow: true }); if (tab?.id) chrome.tabs.sendMessage(tab.id, { type: 'START_ELEMENT_SELECTION' }, r => { if (chrome.runtime.lastError) { setError(`Selection error: ${chrome.runtime.lastError.message}`); setIsSelectingElement(false); }}); else throw new Error("No active tab."); } catch (e) { setError(`Selection error: ${e.message}`); setIsSelectingElement(false); }}}} sx={{ position: 'absolute', bottom: 8, left: 8, fontSize: '0.75rem', height: '28px', borderColor: '#e0e0e0', '& .MuiChip-label': { px: '8px' }, '& .MuiChip-icon': { ml: '6px', mr: '-4px' }}} />
      <TextField fullWidth multiline minRows={2} maxRows={3} variant="standard" placeholder={animatedPlaceholder + '|'} value={inputValue} onChange={handleInputChange} onKeyDown={handleKeyDown} InputProps={{ disableUnderline: true, sx: { fontSize: '0.9rem' } }} sx={{ flexGrow: 1, '& .MuiInputBase-root': { py: 0.5 } }} disabled={isLoading} />
      <IconButton onClick={handleSubmit} disabled={isLoading || (!inputValue.trim() && !currentChatId) } sx={{ position: 'absolute', bottom: 8, right: 8, bgcolor: 'common.black', color: 'common.white', width: 28, height: 28, borderRadius: '50%', '&:hover': { bgcolor: 'grey.800' }, '&.Mui-disabled': { backgroundColor: 'grey.300', color: 'grey.500' }}}>{isLoading ? <CircularProgress size={16} sx={{ color: 'white' }}/> : <ArrowUpwardIcon sx={{ fontSize: '1rem' }} />}</IconButton>
    </Box>
  );

  const renderChatInputArea = () => (
    <Box sx={{ p: 2, pt: 1 }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        bgcolor: 'white',
        border: '1px solid', 
        borderColor: 'grey.200',
        borderRadius: 6, 
        px: 2, 
        py: 1.5,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        '&:focus-within': {
          borderColor: 'grey.400',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
        }
      }}>
        <TextField 
          fullWidth 
          multiline={false} 
          variant="standard" 
          placeholder="Ask Magix to modify this page..." 
          value={inputValue} 
          onChange={handleInputChange} 
          onKeyDown={handleKeyDown} 
          InputProps={{ 
            disableUnderline: true, 
            sx: { 
              fontSize: '0.9rem',
              color: 'text.primary',
              '& input::placeholder': {
                color: 'grey.400',
                opacity: 1
              }
            } 
          }} 
          sx={{ 
            '& .MuiInputBase-root': { 
              py: 0
            } 
          }} 
          disabled={isLoading} 
        />
        <IconButton 
          onClick={handleSubmit} 
          disabled={isLoading || !inputValue.trim()} 
                     sx={{ 
             bgcolor: isLoading || !inputValue.trim() ? 'grey.200' : 'common.black', 
             color: isLoading || !inputValue.trim() ? 'grey.400' : 'white', 
             width: 32, 
             height: 32, 
             ml: 1,
             borderRadius: '50%',
             '&:hover': { 
               bgcolor: isLoading || !inputValue.trim() ? 'grey.200' : 'grey.800' 
             },
             '&.Mui-disabled': { 
               backgroundColor: 'grey.200', 
               color: 'grey.400' 
             }
           }}
        >
          {isLoading ? (
            <CircularProgress size={16} sx={{ color: 'grey.400' }}/> 
          ) : (
            <ArrowUpwardIcon sx={{ fontSize: '1.1rem' }} />
          )}
        </IconButton>
      </Box>
    </Box>
  );

  const renderHomeScreen = () => {
    const displayedScripts = getDisplayedScripts();
    
    return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', flexGrow: 1, overflowY: 'auto' }}>
        <Typography variant="h6" component="h1" sx={{ 
          textAlign: 'center', 
          mb: 2, 
          fontSize: '1rem', 
          fontWeight: 400,
          color: 'grey.500',
          fontFamily: '"Instrument Serif", serif'
        }}>
          Modify Any Website
        </Typography>
      {renderHomeInputArea()}
      {session && (
        <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 400, color: 'grey.500', fontSize: '0.75rem' }}>Active Modifications</Typography>
          <List dense sx={{ pt: 0, maxHeight: '350px', overflowY: 'auto', '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none', '-ms-overflow-style': 'none' }}>
              {displayedScripts.length > 0 ? (
                displayedScripts.map((script) => (
                <ListItemButton key={script.id} onClick={() => handleScriptItemClick(script)} sx={{ border: '1px solid #e0e0e0', borderRadius: 4, mb: 1, py: 0.5 }}>
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
              )) ) : ( 
                <Typography variant="caption" sx={{ 
                  textAlign: 'center', 
                  display: 'block', 
                  mt: 3, 
                  mx: 2,
                  fontSize: '0.75rem',
                  color: 'grey.400',
                  fontWeight: 400,
                  lineHeight: 1.4
                }}>
                  No active modifications. Create one using the input above
                </Typography> 
              )}
          </List>
         </Box>
       )}

     </Box>
   );
  };

  const renderChatScreen = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ position: 'sticky', top: 0, zIndex: 1, bgcolor: 'background.paper', p: 1, mb: 1, display: 'flex', alignItems: 'center' }}>
         <IconButton onClick={() => { setCurrentChatId(null); /* useEffect will handle view change */ }} size="small" sx={{ mr: 1, borderRadius: 2, '&:hover': { bgcolor: 'grey.50' } }}><ArrowBackIcon sx={{ fontSize: '1.1rem', color: 'grey.500' }} /></IconButton>
         <Typography variant="subtitle1" sx={{ flexGrow: 1, textAlign: 'center', fontWeight: 400, fontSize: '0.85rem', color: 'grey.500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentChatTitle || "Chat"}</Typography>
         <IconButton
           size="small"
           disabled={!currentScriptId}
           onClick={async () => {
             await refreshCurrentScriptStats();
             // If private, set target true; if public, target false
             setPublicToggleTargetValue(!currentScriptIsPublic);
             setPublicTitleInput(currentScriptTitle || currentChatTitle || '');
             setIsPublicConfirmOpen(true);
           }}
           sx={{ ml: 1, borderRadius: 2, '&:hover': { bgcolor: 'grey.50' } }}
           title={!currentScriptId ? 'Create a modification first to share publicly' : (currentScriptIsPublic ? 'Public (click for details)' : 'Make Public')}
         >
           <PublicIcon sx={{ fontSize: '1.1rem', color: currentScriptIsPublic ? 'success.main' : 'grey.500' }} />
         </IconButton>
      </Box>
      <Box ref={chatContainerRef} sx={{ flexGrow: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {messages.map((msg) => (
          <Box key={msg.id} sx={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
            {msg.status === 'processing' ? ( <Paper className="shimmer-bubble" elevation={0} sx={{ px: 2, py: 1, borderRadius: 20, bgcolor: 'grey.200', display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden', position: 'relative' }}><Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary', fontSize: '0.9rem' }}>Doing magix...</Typography></Paper>
            ) : msg.sender === 'user' ? ( <Paper elevation={0} sx={{ p: 1.5, borderRadius: 6, bgcolor: '#f4c2c4' }}><Typography variant="body2" sx={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'black' }}>{msg.text}</Typography></Paper>
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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.paper' }}>
       {/* Header */}
       <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 2, borderBottom: '1px solid', borderColor: 'grey.100' }}>
         <IconButton onClick={() => setCurrentView('home')} size="small" sx={{ mr: 1, borderRadius: 2, '&:hover': { bgcolor: 'grey.50' } }}>
           <ArrowBackIcon sx={{ fontSize: '1.1rem', color: 'grey.500' }} />
         </IconButton>
         <Typography variant="h6" sx={{ 
           fontSize: '0.85rem', 
           fontWeight: 400, 
           color: 'grey.500'
         }}>
           Account Settings
         </Typography>
       </Box>

       {/* Tab Navigation */}
       <Box sx={{ borderBottom: '1px solid', borderColor: 'grey.100', px: 2 }}>
         <Tabs 
           value={settingsTab} 
           onChange={handleSettingsTabChange} 
           aria-label="account settings tabs" 
           textColor="inherit" 
           sx={{ 
             '& .MuiTabs-indicator': { 
               backgroundColor: 'common.black',
               height: 2,
               borderRadius: 1
             }, 
             '& .Mui-selected': { 
               color: 'common.black', 
               fontWeight: 500 
             },
             '& .MuiTab-root': {
               fontSize: '0.85rem',
               fontWeight: 400,
               textTransform: 'none',
               color: 'grey.500',
               minHeight: 48
             }
           }}
         >
           <Tab label="Account Info" {...a11yProps(0)} />
           <Tab label="API Keys" {...a11yProps(1)} />
         </Tabs>
       </Box>

       {/* Content Area */}
       <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
       <TabPanel value={settingsTab} index={0}>
           <Box sx={{ p: 3 }}>
             {/* Account Info Section */}
             <Box sx={{ mb: 4 }}>
               <Typography variant="subtitle2" sx={{ 
                 mb: 2, 
                 fontSize: '0.75rem', 
                 fontWeight: 500, 
                 color: 'grey.500',
                 textTransform: 'uppercase',
                 letterSpacing: '0.5px'
               }}>
                 Personal Information
               </Typography>
               
               <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, mb: 3 }}>
                 <TextField 
                   label="Name" 
                   variant="outlined" 
                   size="small" 
                   value={userName} 
                   onChange={(e) => setUserName(e.target.value)} 
                   InputProps={{ sx: { fontSize: '0.85rem' } }}
                   InputLabelProps={{ sx: { fontSize: '0.85rem' } }}
                   sx={{ 
                     flexGrow: 1,
                     '& .MuiOutlinedInput-root': { 
                       borderRadius: 3,
                       '&:hover .MuiOutlinedInput-notchedOutline': {
                         borderColor: 'grey.400'
                       }
                     }
                   }} 
                 />
                 <Button 
                   variant="contained" 
                   size="small" 
                   onClick={handleNameUpdate} 
                   disableElevation 
                   sx={{ 
                     textTransform: 'none', 
                     borderRadius: 3, 
                     bgcolor: 'common.black',
                     fontSize: '0.8rem',
                     fontWeight: 500,
                     px: 2,
                     py: 1,
                     '&:hover': { bgcolor: 'grey.800' } 
                   }}
                 >
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
                 InputProps={{ sx: { fontSize: '0.85rem' } }}
                 InputLabelProps={{ sx: { fontSize: '0.85rem' } }}
                 sx={{ 
                   '& .MuiOutlinedInput-root': { 
                     borderRadius: 3,
                     bgcolor: 'grey.50'
                   }
                 }} 
               />
             </Box>

             {/* Community Section */}
             <Box sx={{ pt: 3, borderTop: '1px solid', borderColor: 'grey.100' }}>
               <Typography variant="subtitle2" sx={{ 
                 mb: 2, 
                 fontSize: '0.75rem', 
                 fontWeight: 500, 
                 color: 'grey.500',
                 textTransform: 'uppercase',
                 letterSpacing: '0.5px'
               }}>
                 Community
               </Typography>
               <Box sx={{ 
                 bgcolor: 'grey.50', 
                 borderRadius: 3, 
                 p: 2.5, 
                 border: '1px solid', 
                 borderColor: 'grey.200',
                 display: 'flex',
                 alignItems: 'center',
                 gap: 2
               }}>
                 <GitHubIcon sx={{ color: 'grey.800', fontSize: '2rem' }} />
                 <Box sx={{ flexGrow: 1 }}>
                   <Typography variant="body2" sx={{ 
                     fontSize: '0.85rem', 
                     fontWeight: 600, 
                     color: 'grey.800',
                     mb: 0.5
                   }}>
                     Star us on GitHub!
                   </Typography>
                   <Typography variant="caption" sx={{ 
                     fontSize: '0.75rem', 
                     color: 'grey.600',
                     display: 'block'
                   }}>
                     Help us grow and improve Magix
                   </Typography>
                 </Box>
                 <Button
                   variant="outlined"
                   size="small"
                   startIcon={<StarIcon />}
                   onClick={() => window.open('https://github.com/kchander/magix-extension', '_blank')}
                   sx={{
                     textTransform: 'none',
                     borderRadius: 2,
                     borderColor: 'grey.300',
                     color: 'grey.700',
                     fontSize: '0.75rem',
                     fontWeight: 500,
                     px: 2,
                     '&:hover': {
                       borderColor: 'grey.400',
                       bgcolor: 'grey.100'
                     }
                   }}
                 >
                   Star
                 </Button>
               </Box>
             </Box>

             {/* Footer Links */}
             <Box sx={{ pt: 3, borderTop: '1px solid', borderColor: 'grey.100' }}>
               <Typography variant="subtitle2" sx={{ 
                 mb: 2, 
                 fontSize: '0.75rem', 
                 fontWeight: 500, 
                 color: 'grey.500',
                 textTransform: 'uppercase',
                 letterSpacing: '0.5px'
               }}>
                 Legal
               </Typography>
               <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                 <Link 
                   href="https://trymagix.com/privacy" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   underline="hover" 
                   sx={{ 
                     fontSize: '0.8rem',
                     color: 'grey.600',
                     fontWeight: 400,
                     '&:hover': { color: 'text.primary' }
                   }}
                 >
                   Privacy Policy
                 </Link>
                 <Link 
                   href="https://trymagix.com/terms" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   underline="hover" 
                   sx={{ 
                     fontSize: '0.8rem',
                     color: 'grey.600',
                     fontWeight: 400,
                     '&:hover': { color: 'text.primary' }
                   }}
                 >
                   Terms of Service
                 </Link>
                 <Link 
                   href="https://tally.so/r/mVyQYl" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   underline="hover" 
                   sx={{ 
                     fontSize: '0.8rem',
                     color: 'grey.600',
                     fontWeight: 400,
                     '&:hover': { color: 'text.primary' }
                   }}
                 >
                   Contact Us
                 </Link>
               </Box>
         </Box>
        </Box>
       </TabPanel>

       <TabPanel value={settingsTab} index={1}>
           <Box sx={{ p: 3 }}>
             {/* API Keys Configuration */}
             <Box sx={{ mb: 4 }}>
               <Typography variant="subtitle2" sx={{ 
                 mb: 2, 
                 fontSize: '0.75rem', 
                 fontWeight: 500, 
                 color: 'grey.500',
                 textTransform: 'uppercase',
                 letterSpacing: '0.5px'
               }}>
                 AI Configuration
               </Typography>
               
               <Typography variant="body2" sx={{ mb: 3, fontSize: '0.85rem', color: 'grey.600' }}>
                 Choose your AI provider and model. Configure once and use the same model for both analysis and code generation.
               </Typography>

               <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                 <FormControl fullWidth size="small">
                   <InputLabel sx={{ fontSize: '0.85rem' }}>AI Provider</InputLabel>
                   <Select
                     value={aiProvider}
                     label="AI Provider"
                     onChange={(e) => handleProviderChange(e.target.value)}
                     sx={{ 
                       fontSize: '0.85rem',
                       '& .MuiOutlinedInput-notchedOutline': {
                         borderRadius: 3
                       }
                     }}
                   >
                     <MenuItem value={AI_PROVIDERS.GEMINI}>Google Gemini</MenuItem>
                     <MenuItem value={AI_PROVIDERS.ANTHROPIC}>Anthropic Claude (Official)</MenuItem>
                     <MenuItem value={AI_PROVIDERS.OPENAI}>OpenAI GPT</MenuItem>
                     <MenuItem value={AI_PROVIDERS.XAI}>xAI Grok</MenuItem>
                     <MenuItem value={AI_PROVIDERS.OPENROUTER}>OpenRouter (Multi-Model)</MenuItem>
                     <MenuItem value={AI_PROVIDERS.CLAUDE_REPLICATE}>Claude via Replicate (Legacy)</MenuItem>
                   </Select>
                 </FormControl>

                 {!useCustomModel && (
                   <FormControl fullWidth size="small">
                     <InputLabel sx={{ fontSize: '0.85rem' }}>Model</InputLabel>
                     <Select
                       value={aiModel}
                       label="Model"
                       onChange={(e) => setAiModel(e.target.value)}
                       sx={{ 
                         fontSize: '0.85rem',
                         '& .MuiOutlinedInput-notchedOutline': {
                           borderRadius: 3
                         }
                       }}
                     >
                       {PROVIDER_MODELS[aiProvider] && PROVIDER_MODELS[aiProvider].map(model => (
                         <MenuItem key={model.id} value={model.id}>{model.name}</MenuItem>
                       ))}
                     </Select>
                   </FormControl>
                 )}

                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                   <FormControlLabel
                     control={
                       <Checkbox
                         checked={useCustomModel}
                         onChange={(e) => {
                           setUseCustomModel(e.target.checked);
                           if (!e.target.checked) setCustomModelName('');
                         }}
                         size="small"
                         sx={{ py: 0 }}
                       />
                     }
                     label={<Typography sx={{ fontSize: '0.8rem' }}>Use custom model name</Typography>}
                   />
                 </Box>

                 {useCustomModel && (
                   <TextField
                     label="Custom Model Name"
                     variant="outlined"
                     size="small"
                     fullWidth
                     value={customModelName}
                     onChange={(e) => setCustomModelName(e.target.value)}
                     placeholder="e.g., gpt-4-turbo-preview, claude-3-opus-20240229"
                     InputProps={{ sx: { fontSize: '0.85rem' } }}
                     InputLabelProps={{ sx: { fontSize: '0.85rem' } }}
                     sx={{
                       '& .MuiOutlinedInput-root': {
                         borderRadius: 3
                       }
                     }}
                     helperText="Enter the exact model name compatible with your provider's API"
                     FormHelperTextProps={{ sx: { fontSize: '0.7rem' } }}
                   />
                 )}

                 <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                   <TextField 
                     label="API Key" 
                     variant="outlined" 
                     size="small" 
                     type="password"
                     value={apiKey} 
                     onChange={(e) => setApiKey(e.target.value)} 
                     placeholder={`Enter your ${
                       aiProvider === AI_PROVIDERS.GEMINI ? 'Gemini' :
                       aiProvider === AI_PROVIDERS.ANTHROPIC ? 'Anthropic' :
                       aiProvider === AI_PROVIDERS.OPENAI ? 'OpenAI' :
                       aiProvider === AI_PROVIDERS.XAI ? 'xAI' :
                       aiProvider === AI_PROVIDERS.OPENROUTER ? 'OpenRouter' :
                       aiProvider === AI_PROVIDERS.CLAUDE_REPLICATE ? 'Replicate' : ''
                     } API key`}
                     InputProps={{ sx: { fontSize: '0.85rem' } }}
                     InputLabelProps={{ sx: { fontSize: '0.85rem' } }}
                     sx={{ 
                       flexGrow: 1,
                       '& .MuiOutlinedInput-root': { 
                         borderRadius: 3,
                         '&:hover .MuiOutlinedInput-notchedOutline': {
                           borderColor: 'grey.400'
                         }
                       }
                     }}
                   />
                   <Button 
                     variant="contained" 
                     size="small" 
                     onClick={handleSaveApiConfig}
                     disabled={apiKeySaveStatus === 'saving'}
                     disableElevation 
                     sx={{ 
                       textTransform: 'none', 
                       borderRadius: 3, 
                       bgcolor: 'common.black',
                       fontSize: '0.8rem',
                       fontWeight: 500,
                       px: 2,
                       py: 1,
                       '&:hover': { bgcolor: 'grey.800' } 
                     }}
                   >
                     {apiKeySaveStatus === 'saving' ? 'Saving...' : apiKeySaveStatus === 'success' ? '✓ Saved' : 'Update'}
                   </Button>
                 </Box>

                 {apiKeySaveStatus === 'success' && (
                   <Typography variant="caption" sx={{ color: 'success.main', fontSize: '0.75rem', mt: -1 }}>
                     Configuration saved successfully!
                   </Typography>
                 )}

                 <Typography variant="caption" sx={{ color: 'grey.500', fontSize: '0.75rem', display: 'block', mt: -0.5 }}>
                   {aiProvider === AI_PROVIDERS.GEMINI && (
                     <>Get your API key from <Link href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener" sx={{ fontSize: '0.75rem' }}>Google AI Studio</Link></>
                   )}
                   {aiProvider === AI_PROVIDERS.ANTHROPIC && (
                     <>Get your API key from <Link href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener" sx={{ fontSize: '0.75rem' }}>Anthropic Console</Link></>
                   )}
                   {aiProvider === AI_PROVIDERS.OPENAI && (
                     <>Get your API key from <Link href="https://platform.openai.com/api-keys" target="_blank" rel="noopener" sx={{ fontSize: '0.75rem' }}>OpenAI Platform</Link></>
                   )}
                   {aiProvider === AI_PROVIDERS.XAI && (
                     <>Get your API key from <Link href="https://console.x.ai/" target="_blank" rel="noopener" sx={{ fontSize: '0.75rem' }}>xAI Console</Link></>
                   )}
                   {aiProvider === AI_PROVIDERS.OPENROUTER && (
                     <>Get your API key from <Link href="https://openrouter.ai/keys" target="_blank" rel="noopener" sx={{ fontSize: '0.75rem' }}>OpenRouter</Link></>
                   )}
                   {aiProvider === AI_PROVIDERS.CLAUDE_REPLICATE && (
                     <>Get your API key from <Link href="https://replicate.com/account/api-tokens" target="_blank" rel="noopener" sx={{ fontSize: '0.75rem' }}>Replicate</Link></>
                   )}
                 </Typography>
               </Box>
             </Box>
           </Box>
       </TabPanel>
     </Box>

    </Box>
  );

  // Public toggle confirmation dialog
  const handlePublicToggle = () => {
    setIsPublicConfirmOpen(true);
    setPublicToggleTargetValue(!publicToggleTargetValue);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'background.paper', justifyContent: currentView === 'home' && !session ? 'center' : 'flex-start' }}>
      {currentView === 'home' && (
        <IconButton onClick={handleAccountMenuOpen} size="small" sx={{ position: 'absolute', top: 16, left: 16, zIndex: 2 }}>
           <AccountCircleIcon sx={{ color: session ? 'grey.400' : 'grey.300', fontSize: '1.4rem' }} />
        </IconButton>
      )}
      {currentView === 'home' && (
        <IconButton onClick={() => { setCurrentView('discover'); fetchDiscoverScripts(); }} size="small" sx={{ position: 'absolute', top: 16, right: 16, zIndex: 2 }}>
          <SearchIcon sx={{ color: 'grey.400', fontSize: '1.4rem' }} />
        </IconButton>
      )}
      <Popover id={accountMenuId} open={openAccountMenu} anchorEl={accountMenuAnchorEl} onClose={handleAccountMenuClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left'}} slotProps={{ paper: { sx: { width: '220px', mt: 1, borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid rgba(0,0,0,0.04)' } } }} >
        <List dense sx={{ py: 1 }}>
            {currentView === 'chat' ? (
            <ListItemButton onClick={() => { setCurrentView('home'); setCurrentChatId(null); setMessages([]); setCurrentScriptContentForChat(''); setCurrentChatTitle(''); handleAccountMenuClose(); }} sx={{ mx: 1, borderRadius: 2, py: 1, '&:hover': { bgcolor: 'grey.50' } }}>
              <ListItemText primary="Go to dashboard" primaryTypographyProps={{ sx: { fontSize: '0.85rem', fontWeight: 400 } }} />
              </ListItemButton>
            ) : (
            <ListItemButton onClick={() => { setCurrentView('settings'); handleAccountMenuClose(); }} sx={{ mx: 1, borderRadius: 2, py: 1, '&:hover': { bgcolor: 'grey.50' } }}>
              <ListItemText primary="Account settings" primaryTypographyProps={{ sx: { fontSize: '0.85rem', fontWeight: 400 } }} />
              </ListItemButton>
            )}
             {currentView === 'chat' && (
               <ListItemButton onClick={() => { setCurrentView('settings'); handleAccountMenuClose(); }} sx={{ mx: 1, borderRadius: 2, py: 1, '&:hover': { bgcolor: 'grey.50' } }}>
                  <ListItemText primary="Account settings" primaryTypographyProps={{ sx: { fontSize: '0.85rem', fontWeight: 400 } }} />
                 </ListItemButton>
             )}
             {currentView !== 'chat' && (
               <ListItemButton onClick={() => { 
                 if (session) {
                   supabase.auth.signOut(); 
                 } else {
                   handleSignIn();
                 }
                 handleAccountMenuClose(); 
               }} sx={{ mx: 1, borderRadius: 2, py: 1, '&:hover': { bgcolor: 'grey.50' } }}>
                 <ListItemText primary={session ? "Log out" : "Sign in"} primaryTypographyProps={{ sx: { fontSize: '0.85rem', fontWeight: 400 } }} />
                 </ListItemButton>
             )}
          </List>
        </Popover>

      {currentView === 'chat' ? renderChatScreen()
       : currentView === 'settings' ? renderAccountSettingsScreen()
       : currentView === 'discover' ? renderDiscoverScreen()
       : renderHomeScreen()}

      {/* Public toggle confirmation dialog */}
      <Dialog 
        open={isPublicConfirmOpen} 
        onClose={() => setIsPublicConfirmOpen(false)}
        PaperProps={{ sx: { borderRadius: 4, p: 2.5, minWidth: '280px', maxWidth: '360px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' } }}
      >
        <DialogTitle sx={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 600, pb: 1 }}>
          {currentScriptIsPublic ? 'Public Modification' : 'Make Public?'}
        </DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          {currentScriptIsPublic ? (
            <>
              <DialogContentText sx={{ fontSize: '0.85rem', color: 'text.secondary', mb: 1 }}>
                This modification is public. Stats:
              </DialogContentText>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <Chip size="small" label={`Installs: ${currentScriptInstallCount}`} />
              </Box>
              <DialogContentText sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                You can make it private again. It will be removed from Discover.
              </DialogContentText>
            </>
          ) : (
            <>
              <DialogContentText sx={{ fontSize: '0.85rem', color: 'text.secondary', mb: 1 }}>
                This modification will be visible to others on this site in Discover.
              </DialogContentText>
              <TextField
                label="Title"
                value={publicTitleInput}
                onChange={(e) => setPublicTitleInput(e.target.value.slice(0, PUBLIC_TITLE_MAX))}
                fullWidth
                size="small"
                sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                helperText={`${publicTitleInput.length}/${PUBLIC_TITLE_MAX}`}
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ pt: 0, flexDirection: 'column', gap: 1.5, p: 2 }}>
          <Button onClick={() => setIsPublicConfirmOpen(false)} size="small" sx={{ textTransform: 'none', fontSize: '0.85rem', color: 'text.secondary' }}>Close</Button>
          <Button onClick={requestTogglePublic} size="medium" autoFocus variant="contained" sx={{ textTransform: 'none', borderRadius: 2 }}>
            {currentScriptIsPublic ? 'Make Private' : 'Make Public'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* UserScripts Not Available Modal */}
      <Dialog 
        open={isUserScriptsModalOpen} 
        onClose={() => setIsUserScriptsModalOpen(false)}
        PaperProps={{ 
          sx: { 
            borderRadius: 4,
            p: 2.5,
            minWidth: '280px',
            maxWidth: '320px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          } 
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 600, pb: 1, px: 1 }}>
          {"Enable User Scripts"}
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pt: 0, px: 1 }}>
          <DialogContentText sx={{ mb: 2, fontSize: '0.85rem', color: 'text.secondary', lineHeight: 1.4 }}>
            To use Magix, enable User Scripts for this extension.
          </DialogContentText>
          
          {/* Compact Visual Instructions */}
          <Box sx={{ textAlign: 'left', bgcolor: 'grey.50', p: 2, borderRadius: 2, mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, fontSize: '0.85rem', color: 'text.primary' }}>
              📍 Steps:
            </Typography>
            <Box sx={{ fontSize: '0.8rem', lineHeight: 1.3, color: 'text.secondary' }}>
              <div>1. Find <strong>"Allow User Scripts"</strong></div>
              <div>2. In <strong>"Extension options"</strong></div>
              <div>3. Toggle it <strong>ON</strong></div>
            </Box>
            
            {/* Compact Toggle Mockup */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1, 
              mt: 1.5,
              p: 1, 
              bgcolor: 'white', 
              border: '1px dashed', 
              borderColor: 'grey.300',
              borderRadius: 1,
              fontSize: '0.75rem'
            }}>
              <span style={{ color: '#666' }}>Allow User Scripts</span>
              <Box sx={{ 
                width: 32, 
                height: 18, 
                bgcolor: '#4caf50', 
                borderRadius: 2, 
                position: 'relative',
                flexShrink: 0
              }}>
                <Box sx={{ 
                  width: 14, 
                  height: 14, 
                  bgcolor: 'white', 
                  borderRadius: '50%', 
                  position: 'absolute',
                  top: 2,
                  right: 2
                }} />
              </Box>
              <span style={{ color: '#4caf50', fontWeight: 600 }}>← Enabled</span>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0, flexDirection: 'column', gap: 1.5 }}>
          <Button 
            onClick={() => {
              chrome.tabs.create({ url: getExtensionsUrl() });
            }} 
            variant="contained" 
            size="medium"
            fullWidth
            sx={{ 
              borderRadius: 2,
              py: 1, 
              fontSize: '0.9rem',
              fontWeight: 500,
              bgcolor: 'common.black',
              color: 'white',
              textTransform: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              '&:hover': { 
                bgcolor: 'grey.800',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }
            }}
          >
            Open Magix Settings
          </Button>
          <Button 
            onClick={() => setIsUserScriptsModalOpen(false)} 
            size="small"
            sx={{ 
              fontSize: '0.8rem', 
              textTransform: 'none',
              color: 'text.secondary',
              minHeight: 'auto',
              '&:hover': {
                bgcolor: 'transparent',
                color: 'text.primary'
              }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={isConfirmDeleteDialogOpen}
        onClose={handleCloseConfirmDialog}
        PaperProps={{ 
          sx: { 
            borderRadius: 4,
            p: 2.5,
            minWidth: '280px',
            maxWidth: '320px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          } 
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 600, pb: 1, px: 1 }}>
          {"Delete Modification"}
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pt: 0, px: 1 }}>
          <DialogContentText sx={{ mb: 2, fontSize: '0.85rem', color: 'text.secondary', lineHeight: 1.4 }}>
            Are you sure you want to delete this modification?
          </DialogContentText>
          
          {/* Important Notice Box */}
          <Box sx={{ textAlign: 'left', bgcolor: 'orange.50', border: '1px solid', borderColor: 'orange.200', p: 2, borderRadius: 2, mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, fontSize: '0.85rem', color: 'orange.800' }}>
              📍 Important:
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', lineHeight: 1.3, color: 'orange.700' }}>
              Make sure you're on <strong>{scriptPendingDeletion?.domain_pattern || 'the target site'}</strong> to completely remove this modification.
            </Typography>
          </Box>
          
          <DialogContentText variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
            This will permanently remove the modification from your list.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0, flexDirection: 'column', gap: 1.5 }}>
          <Button 
            onClick={handleConfirmDeleteScript} 
            variant="contained"
            size="medium"
            fullWidth
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={16} /> : null}
            sx={{ 
              borderRadius: 2,
              py: 1, 
              fontSize: '0.9rem',
              fontWeight: 500,
              bgcolor: '#f44336',
              color: 'white',
              textTransform: 'none',
              boxShadow: '0 2px 8px rgba(244,67,54,0.25)',
              '&:hover': { 
                bgcolor: '#d32f2f',
                boxShadow: '0 4px 12px rgba(244,67,54,0.35)'
              },
              '&:disabled': {
                bgcolor: 'grey.400'
              }
            }}
          >
            {isLoading ? 'Deleting...' : 'Delete Modification'}
          </Button>
          <Button 
            onClick={handleCloseConfirmDialog} 
            size="small"
            disabled={isLoading}
            sx={{ 
              fontSize: '0.8rem', 
              textTransform: 'none',
              color: 'text.secondary',
              minHeight: 'auto',
              '&:hover': {
                bgcolor: 'transparent',
                color: 'text.primary'
              }
            }}
          >
            Cancel
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
