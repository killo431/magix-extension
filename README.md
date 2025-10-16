<div align="center">

# 🪄 Magix

### Reshape the Web Through Conversation

**AI-Powered Website Customization in Your Browser**

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Download-blue?style=for-the-badge&logo=google-chrome)](https://chromewebstore.google.com/detail/magix/ebfhenlkpdngcofiegobedbahdeemgjo)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-green?style=for-the-badge)](https://github.com/kchander/magix-extension)
[![Twitter Follow](https://img.shields.io/badge/Follow-@kishanchander__-1DA1F2?style=for-the-badge&logo=x&logoColor=white)](https://x.com/kishanchander_)

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Discover Mods](#-discover--share-public-modifications) • [AI Providers](#-supported-ai-providers) • [Development](#-development)

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
- See install counts & usage stats
- Filter by website domain

</td>
<td width="50%">

### 🔐 **Secure by Design**
- BYO API keys (no subscription)
- No tracking or analytics
- Open source code
- Row-level security in DB

</td>
</tr>
</table>

---

## 🚀 Installation

### ⭐ Chrome Web Store (Recommended)

**The easiest way to use Magix is to install it directly from the Chrome Web Store.**

[![Install from Chrome Web Store](https://storage.googleapis.com/web-dev-uploads/image/WlD8wC6g8khYWPJUsQceQkhXSlv1/UV4C4ybeBTsZt43U4xis.png)](https://chromewebstore.google.com/detail/magix/ebfhenlkpdngcofiegobedbahdeemgjo)

**Why install from Chrome Web Store?**

✅ **No setup required** - Install and start using immediately  
✅ **Automatic updates** - Get new features and bug fixes automatically  
✅ **Use your own API keys** - No subscription costs, just pay for what you use with your chosen AI provider  
✅ **Fully functional** - All features work out of the box  
✅ **No coding needed** - No need to build from source  

**Installation link:** https://chromewebstore.google.com/detail/magix/ebfhenlkpdngcofiegobedbahdeemgjo

---

### 🔧 Build from Source (For Developers)

Only needed if you want to contribute or customize the extension.

<details>
<summary>Click to expand build instructions</summary>

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

**Note:** If building from source, you'll need to set up your own Supabase backend. See [Supabase Setup Guide](#-supabase-setup-for-developers) below.

</details>

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

**Get API Keys (All offer pay-as-you-go pricing):**
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

**⚠️ Important:** Stay on the current tab while Magix is generating and applying modifications. Switching tabs may interrupt the process.

---

## 💡 Usage Examples

### Basic Modifications

```
"Hide all ads on this page"
"Make all text bigger"
"Change the background to dark blue"
"Remove the cookie banner"
"Add dark mode to this site"
```

### Advanced Features

```
"Add a stopwatch in the top right corner"
"Create a text-to-speech button for all paragraphs"
"Add a download button for all images"
"Make this site look like it's from the 90s"
"Add a floating note-taking widget"
```

### Element-Specific Changes

```
1. Click "Select Element" chip in the input area
2. Click any element on the page
3. Type: "Make this section sticky when scrolling"
4. Magix targets that specific element
```

---

## 🌐 Discover & Share Public Modifications

### Finding Public Modifications

Magix has a built-in **Discover** feature that lets you browse and install modifications created by other users for the current website.

**How to discover modifications:**

1. Navigate to any website (e.g., YouTube, Twitter, Reddit)
2. Click the Magix button (🪄)
3. Click the **Search icon** (🔍) in the top navigation
4. Browse available public modifications for the current domain
5. Click **"Install"** on any modification to apply it instantly
6. The modification is added to your active mods and starts working immediately

**What you'll see:**
- Modification title and description
- Install count (how many people installed it)
- One-click installation
- Automatic filtering by website domain

### Sharing Your Modifications

Made something cool? Share it with the community!

**How to make a modification public:**

1. Create a modification by chatting with Magix
2. Once the modification is applied and working, click the **Profile icon** in the chat header
3. Click the **Public icon** (🌐) button
4. Enter a descriptive title for your modification (max 75 characters)
5. Click **"Make Public"**
6. Your modification is now visible in the Discover tab for all users on that domain

**Tips for sharing:**
- Use clear, descriptive titles (e.g., "Dark Mode Toggle" instead of "My Mod")
- Test thoroughly before making public
- You can make it private again anytime by clicking the Public icon again

**Privacy note:** When you make a modification public, only the code and title are shared. Your personal information remains private.

---

## 🤖 Supported AI Providers

| Provider | Models | Cost | Speed | Best For |
|----------|--------|------|-------|----------|
| **Gemini** | 2.5 Pro, 2.5 Flash | 💰 Free tier | ⚡⚡⚡ Fast | General use, beginners |
| **Claude** | Sonnet 4, Opus 4 | 💰💰 Paid | ⚡⚡ Medium | Complex modifications |
| **OpenAI** | GPT-4.5, o3-mini | 💰💰 Paid | ⚡⚡ Medium | Code generation |
| **xAI** | Grok 3, Grok 4 | 💰💰 Paid | ⚡⚡⚡ Fast | Quick iterations |
| **OpenRouter** | 50+ models | 💰-💰💰 Varies | ⚡-⚡⚡⚡ Varies | Model flexibility |

**All providers use pay-as-you-go pricing with your own API key - no subscription to Magix required!**

---

## 🛠️ Development

### Prerequisites

- Node.js 16+
- npm or yarn
- Chrome/Chromium browser
- Supabase account (for data persistence)

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
│   ├── .env.local            # Your credentials (not committed)
│   └── .env.example          # Template for environment variables
├── 📁 database-schema/       # Database setup
│   └── setup.sql             # Run this in Supabase SQL Editor
└── 📁 icons/                 # Extension icons
```

---

## 🗄️ Supabase Setup (For Developers)

**Note:** If you installed from Chrome Web Store, you can skip this section. This is only needed if you're building from source.

Magix uses Supabase for:
- User authentication (Google OAuth)
- Storing your modifications
- Syncing across devices
- Public modification sharing

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **"New Project"**
3. Enter project details:
   - Project name: `magix-extension` (or any name)
   - Database password: Generate a strong password
   - Region: Choose closest to you
4. Wait for project to be created (1-2 minutes)

### Step 2: Get Your Credentials

1. In your Supabase project, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon/public key** (the `anon` key)

### Step 3: Configure Environment Variables

1. Navigate to `sidepanel/` directory
2. Copy `.env.example` to `.env.local`:
   ```bash
   cp sidepanel/.env.example sidepanel/.env.local
   ```
3. Open `sidepanel/.env.local` and add your credentials:
   ```env
   VITE_SUPABASE_URL="https://your-project-id.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-anon-key-here"
   ```

### Step 4: Set Up Database Schema

1. In Supabase, go to **SQL Editor**
2. Click **"New Query"**
3. Open the file `database-schema/setup.sql` from this repository
4. Copy the entire contents and paste into the SQL editor
5. Click **"Run"**
6. You should see: "Success. No rows returned"

This single file creates:
- All 3 tables (`scripts`, `chats`, `chat_messages`)
- Database indexes for performance
- Row-level security policies
- Auto-update timestamp triggers

Everything is set up in one go!

### Step 5: Enable Google OAuth (Optional)

If you want sign-in functionality:

1. Go to **Authentication** → **Providers** → **Google**
2. Enable Google provider
3. Follow Supabase instructions to set up Google OAuth
4. Update your `manifest.json` with your OAuth client ID

### Step 6: Build and Test

```bash
npm run build
# Load extension in Chrome from chrome://extensions/
```

**That's it!** Your self-hosted Magix instance is ready.

### Troubleshooting Supabase Setup

<details>
<summary>Click for common issues</summary>

**Issue: "Error connecting to database"**
- Check that your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Make sure there are no extra spaces or quotes
- Rebuild the extension after changing `.env.local`

**Issue: "Sign-in not working"**
- Verify Google OAuth is enabled in Supabase
- Check that your OAuth client ID is in `manifest.json`
- Make sure redirect URLs are configured in Google Cloud Console

**Issue: "Scripts not saving"**
- Verify database schema is applied (check tables exist in Supabase Table Editor)
- Check RLS policies are created
- Look for errors in browser console (F12)

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
- If using Chrome Web Store version: This should work out of the box
- If building from source: Make sure you've set up Supabase correctly (see Supabase Setup guide above)
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
- Stay on the tab while modification is being applied

</details>

<details>
<summary><b>❌ Modification stops working after switching tabs</b></summary>

**Solution:**
- Don't switch tabs or navigate away while Magix is generating and applying code
- Wait for the success message before switching tabs
- If interrupted, try applying the modification again

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
- The Chrome Extensions developer community
- All contributors and users
- Shoutout to [Droid from Factory AI](https://factory.ai) for being an awesome coding buddy throughout this project!

---

## 🔗 Links

- 🌐 **Chrome Web Store**: https://chromewebstore.google.com/detail/magix/ebfhenlkpdngcofiegobedbahdeemgjo
- 📦 **GitHub Repository**: https://github.com/kchander/magix-extension
- 🐛 **Issue Tracker**: https://github.com/kchander/magix-extension/issues
- 💬 **Discussions**: https://github.com/kchander/magix-extension/discussions
- 🐦 **Follow on Twitter/X**: https://x.com/kishanchander_

---

## 🔒 Privacy & Security

**What Data is Collected:**

The Chrome Web Store version of Magix stores the following in a secure Supabase database:

✅ **Your modifications** - The code you generate and apply to websites  
✅ **Chat history** - Your conversations with the AI (to maintain context and history)  
✅ **Account info** - Your Google account email and profile (for authentication)  

**What's NOT Collected:**

❌ **API keys** - Stored locally in your browser only, never sent to our servers  
❌ **Browsing history** - We don't track what websites you visit  
❌ **Personal data** - No analytics, tracking pixels, or telemetry  
❌ **Third-party sharing** - Your data is never sold or shared  

**Security Features:**

🔒 **Row-level security** - You can only access your own data  
🔒 **Encrypted storage** - Database is secured with industry-standard encryption  
🔒 **Open source** - Audit the code yourself on GitHub  
🔒 **OAuth authentication** - Secure Google sign-in, no passwords stored  

**What's Shared Publicly (Optional):**

When you make a modification public:
- The modification code and title become visible to other users
- Install and usage counts are tracked
- Your personal information remains private

**Data Control:**

- Delete your account anytime to remove all your data
- Make modifications private/public as you choose
- Export your data (coming soon)

**For Self-Hosted Instances:**

If you build from source, all data stays in your own Supabase database that you control.

---

<div align="center">

### ⭐ Star this repo if you find it useful!

Made with ❤️ by [kchander](https://github.com/kchander)

[![Follow on X](https://img.shields.io/badge/Follow-@kishanchander__-1DA1F2?style=flat&logo=x&logoColor=white)](https://x.com/kishanchander_)

**Want to support this project?**  
⭐ Star the repo • 🐦 Follow on [X/Twitter](https://x.com/kishanchander_) • 💬 Share with friends

**Happy Coding!** 🪄

</div>
