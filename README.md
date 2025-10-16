<div align="center">

# 🪄 Magix

### Reshape the Web Through Conversation

**AI-Powered Website Customization in Your Browser**

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Download-blue?style=for-the-badge&logo=google-chrome)](https://chromewebstore.google.com/detail/magix/ebfhenlkpdngcofiegobedbahdeemgjo)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-green?style=for-the-badge)](https://github.com/kchander/magix-extension)

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [AI Providers](#-supported-ai-providers) • [Development](#-development)

</div>

---

## 🌟 What is Magix?

Magix is a powerful Chrome extension that lets you modify **any website** using natural language. No coding required - just describe what you want, and watch as AI generates and applies the changes in real-time.

Think of it as **ChatGPT meets Tampermonkey** - the conversational intelligence of AI combined with the power of custom scripts.

### Why Magix?

- 🎨 **Customize Any Site** - Dark mode for sites that don't have it, remove annoying elements, add missing features
- 💬 **Chat-Based Interface** - Iteratively improve your modifications through conversation
- 🔒 **Privacy-First** - Uses your own API keys, no data collection
- 🌐 **Community Sharing** - Discover and install modifications made by others
- ⚡ **Instant Results** - See changes applied in real-time

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🤖 **Multiple AI Providers**
- Google Gemini 2.5
- Anthropic Claude 4
- OpenAI GPT-4.5 & o3
- xAI Grok 3/4
- OpenRouter (50+ models)

</td>
<td width="50%">

### ⚡ **Real-Time Modification**
- Instant code generation
- Live preview as you type
- Persistent across page reloads
- JavaScript & CSS support

</td>
</tr>
<tr>
<td width="50%">

### 🎯 **Smart Element Selector**
- Click to target specific elements
- Robust CSS selector generation
- Works with dynamic content
- Shadow DOM support

</td>
<td width="50%">

### 💾 **Cloud Sync**
- Save modifications to cloud
- Access from any device
- Version history via chat
- Supabase backend

</td>
</tr>
<tr>
<td width="50%">

### 🌐 **Discover & Share**
- Browse public modifications
- Install with one click
- See install counts
- Filter by website

</td>
<td width="50%">

### 🔐 **Secure by Design**
- BYO API keys
- No tracking or analytics
- Open source code
- Row-level security in DB

</td>
</tr>
</table>

---

## 🚀 Installation

### Option 1: Chrome Web Store (Recommended)

[![Install from Chrome Web Store](https://storage.googleapis.com/web-dev-uploads/image/WlD8wC6g8khYWPJUsQceQkhXSlv1/UV4C4ybeBTsZt43U4xis.png)](https://chromewebstore.google.com/detail/magix/ebfhenlkpdngcofiegobedbahdeemgjo)

Click the badge above or visit: https://chromewebstore.google.com/detail/magix/ebfhenlkpdngcofiegobedbahdeemgjo

### Option 2: Build from Source

```bash
# Clone the repository
git clone https://github.com/kchander/magix-extension.git
cd magix-extension

# Install dependencies
npm install

# Build the extension
npm run build

# Load in Chrome
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the magix-extension directory
```

---

## 🎯 Quick Start

### 1. Enable User Scripts (Required)

**Chrome 138+:**
1. Go to `chrome://extensions/`
2. Find **Magix** and click **Details**
3. Enable the **"Allow User Scripts"** toggle

**Chrome <138:**
1. Go to `chrome://extensions/`
2. Enable **"Developer Mode"** in the top right

### 2. Configure AI Provider

1. Click the Magix button (🪄) on any webpage
2. Click the **profile icon** → **Settings** → **API Keys**
3. Select your AI provider and enter your API key

**Get API Keys:**
- 🟢 **Gemini** (Free tier available): [Google AI Studio](https://makersuite.google.com/app/apikey)
- 🟣 **Claude**: [Anthropic Console](https://console.anthropic.com/)
- 🔵 **OpenAI**: [OpenAI Platform](https://platform.openai.com/api-keys)
- ⚫ **xAI (Grok)**: [xAI Console](https://console.x.ai/)
- 🌈 **OpenRouter**: [OpenRouter Keys](https://openrouter.ai/keys)

### 3. Start Modifying!

```
👤 User: "Add a dark mode toggle to this page"
🪄 Magix: *generates code and applies it instantly*

👤 User: "Make the toggle button pink"
🪄 Magix: *updates the modification*
```

---

## 💡 Usage Examples

### Basic Modifications

```
"Hide all ads on this page"
"Make all text bigger"
"Change the background to dark blue"
"Remove the cookie banner"
```

### Advanced Features

```
"Add a stopwatch in the top right corner"
"Create a text-to-speech button for all paragraphs"
"Add a download button for all images"
"Make this site look like it's from the 90s"
```

### Element-Specific Changes

```
1. Click "Select Element" chip
2. Click any element on the page
3. "Make this section sticky when scrolling"
```

---

## 🤖 Supported AI Providers

| Provider | Models | Cost | Speed | Best For |
|----------|--------|------|-------|----------|
| **Gemini** | 2.5 Pro, 2.5 Flash | 💰 Free tier | ⚡⚡⚡ Fast | General use, beginners |
| **Claude** | Sonnet 4, Opus 4 | 💰💰 Paid | ⚡⚡ Medium | Complex modifications |
| **OpenAI** | GPT-4.5, o3-mini | 💰💰 Paid | ⚡⚡ Medium | Code generation |
| **xAI** | Grok 3, Grok 4 | 💰💰 Paid | ⚡⚡⚡ Fast | Quick iterations |
| **OpenRouter** | 50+ models | 💰-💰💰 Varies | ⚡-⚡⚡⚡ Varies | Model flexibility |

---

## 🛠️ Development

### Prerequisites

- Node.js 16+
- npm or yarn
- Chrome/Chromium browser

### Local Development

```bash
# Install dependencies
npm install

# Run development server (with hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Project Structure

```
magix-extension/
├── 📄 manifest.json          # Chrome extension configuration
├── 📜 background.js          # Service worker (UserScripts API)
├── 📜 content.js             # Floating button + element selector
├── 📜 supabaseClient.js      # Database connection
├── 📁 sidepanel/             # React UI
│   ├── App.jsx               # Main app component
│   ├── aiService.js          # Multi-provider AI integration
│   ├── index.jsx             # Entry point
│   └── .env.local            # Your credentials (not committed)
├── 📁 database-schema/       # SQL migrations
│   └── *.sql                 # Supabase table schemas
└── 📁 icons/                 # Extension icons
```

### Setting Up Your Own Instance

<details>
<summary>Click to expand full setup instructions</summary>

#### 1. Supabase Setup

```bash
# Create project at https://supabase.com
# Copy your project URL and anon key
```

```bash
# Create sidepanel/.env.local
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

```sql
-- Run the migration in Supabase SQL Editor
-- File: database-schema/20250429134154_create_scripts_table.sql
```

#### 2. Google OAuth Setup

```bash
# 1. Go to Google Cloud Console
# 2. Create OAuth 2.0 Client ID (Type: Chrome App)
# 3. Copy your Client ID
```

Update `manifest.json`:
```json
"oauth2": {
  "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
  "scopes": [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile"
  ]
}
```

#### 3. Build and Test

```bash
npm run build
# Load extension in Chrome from chrome://extensions/
```

</details>

---

## 🐛 Troubleshooting

<details>
<summary><b>❌ "UserScripts API not available" Error</b></summary>

**Solution:**
- Chrome 138+: Go to `chrome://extensions/` → Magix → Details → Enable "Allow User Scripts"
- Chrome <138: Go to `chrome://extensions/` → Enable "Developer Mode"

</details>

<details>
<summary><b>❌ "API key not configured" Error</b></summary>

**Solution:**
1. Click profile icon in extension
2. Go to Settings → API Keys
3. Select provider and enter your API key

</details>

<details>
<summary><b>❌ Scripts not persisting / Sign-in not working</b></summary>

**Solution:**
- Make sure you've set up Supabase correctly
- Check that `sidepanel/.env.local` has correct credentials
- Rebuild extension: `npm run build`
- Verify database schema is applied in Supabase SQL Editor

</details>

<details>
<summary><b>❌ Modification not working on specific site</b></summary>

**Solution:**
- Try using the Element Selector to target specific elements
- Some sites have strict Content Security Policies (CSP) that may block scripts
- Check browser console (F12) for error messages

</details>

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. 🍴 Fork the repository
2. 🌿 Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. 💾 Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. 📤 Push to the branch (`git push origin feature/AmazingFeature`)
5. 🎉 Open a Pull Request

### Development Guidelines

- Follow existing code style
- Test modifications on multiple websites
- Update README if adding new features
- Keep commits focused and atomic

---

## 📋 Roadmap

- [ ] Firefox extension support
- [ ] Offline mode with local AI models
- [ ] Script marketplace with ratings
- [ ] Export/import script collections
- [ ] Collaborative editing
- [ ] Browser sync across devices
- [ ] Script scheduling (run at specific times)
- [ ] Advanced CSS preprocessor support

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

Built with amazing open-source technologies:

- [React](https://react.dev/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [Material-UI](https://mui.com/) - Component library
- [Supabase](https://supabase.com/) - Backend & Auth
- [Chrome Extensions API](https://developer.chrome.com/docs/extensions/) - Platform

Special thanks to:
- Google Gemini, Anthropic Claude, OpenAI for AI APIs
- The Chrome Extensions developer community
- All contributors and users

---

## 🔗 Links

- 🌐 **Chrome Web Store**: https://chromewebstore.google.com/detail/magix/ebfhenlkpdngcofiegobedbahdeemgjo
- 📦 **GitHub Repository**: https://github.com/kchander/magix-extension
- 🐛 **Issue Tracker**: https://github.com/kchander/magix-extension/issues
- 💬 **Discussions**: https://github.com/kchander/magix-extension/discussions

---

## 🔒 Privacy & Security

**Your Data, Your Control:**

✅ **API keys** are stored locally in your browser  
✅ **Modifications** are saved in your personal Supabase database  
✅ **No tracking** or analytics  
✅ **Open source** - audit the code yourself  
✅ **Row-level security** protects your data in the database  

**What's Shared:**

- Public modifications (only if you choose to share)
- Anonymous usage stats to AI providers when generating code

**No Third-Party Access:**

- We don't have access to your API keys
- We don't store or log your conversations
- We don't sell your data (there's nothing to sell!)

---

<div align="center">

### ⭐ Star this repo if you find it useful!

Made with ❤️ by [kchander](https://github.com/kchander)

**Happy Coding!** 🪄

</div>
