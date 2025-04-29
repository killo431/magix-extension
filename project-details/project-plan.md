# Development Phases for Magix v1.0

A detailed development plan broken down into phases with specific technical goals and implementation details:

## Phase 1: Foundation & Infrastructure

### Extension Setup
- Create Chrome extension with Manifest V3 configuration
- Set required permissions: `activeTab`, `scripting`, `sidePanel`, `storage`, `identity`
- Configure background service worker for persistent state management
- Set up content script injection framework with proper isolation

### Authentication & Database
- Implement Supabase OAuth integration (Google/GitHub providers)
- Create secure token storage mechanism using `chrome.identity` API
- Design database schema in Supabase:
  - Users table (id, email, created_at)
  - Scripts table (id, user_id, title, domain_pattern, code, is_active, created_at, updated_at)
  - UserScripts junction table for many-to-many relationships if needed
- Set up Row Level Security policies for data protection

### UI Scaffolding
- Develop floating FAB component with proper z-index handling
- Create side panel React application structure
- Implement Chrome side panel API integration
- Design basic chat UI components (message bubbles, input field)
- Develop history toggle panel UI skeleton

## Phase 2: UI & Dummy Interaction

### Improved Chat UI
- Design and implement chat bubbles for user messages and Magix responses.
- Style the input area and send button according to the design preferences (Inter font, black/white/grey palette).
- Ensure the chat area scrolls correctly as messages are added.

### Dummy Chat Flow
- When a user sends a message (e.g., "hide youtube shorts"), display the user's message bubble.
- Display a dummy Magix response bubble (e.g., "Sure, let me hide the shorts section for you.").
- Below the response, display a placeholder "Doing magix..." indicator (e.g., a box with a shimmer effect).
- This phase does *not* involve actual LLM calls or script generation yet.

### Basic Script Testing (Example)
- Implement a hardcoded example script (e.g., one that hides YouTube shorts via CSS or simple DOM manipulation).
- Add temporary logic (e.g., triggered by a specific dummy chat message or a test button) to inject this hardcoded script using `chrome.scripting.executeScript`.
- Verify the example script works on the target site (e.g., YouTube).

## Phase 3: Core Functionality

### LLM Integration
- Set up secure Gemini API client
- Create system prompt engineering framework for JavaScript generation
- Develop prompt templates with domain-specific context injection
- Build retry and fallback logic for script generation failures
- Implement response parsing and validation

### Script Management
- Create script injection engine using `chrome.scripting.executeScript`
- Develop domain pattern matching system for auto-applying scripts
- Build script metadata extraction (automatically generate titles)
- Implement script storage and retrieval from Supabase
- Set up script versioning for potential rollbacks

### Basic UX Flow
- Connect chat UI to Gemini API
- Implement loading states and feedback during script generation
- Add success/failure notifications
- Create tab reloading mechanism after successful injection
- Test end-to-end flow from user input to script execution

## Phase 4: Enhancement & Refinement

### Script Management UI
- Develop history panel with script listing and search
- Create toggle switches for enabling/disabling scripts
- Implement script application indicators
- Add basic editing functionality for script titles
- Build script deletion with confirmation

### Persistence Layer
- Implement domain detection for auto-applying saved scripts
- Create background synchronization with Supabase
- Set up efficient caching mechanisms for script storage
- Add conflict resolution for multi-device synchronization
- Implement offline support with local storage fallback

### Error Handling & Resilience
- Create comprehensive error capture system
- Design user-friendly error messages
- Implement script sandbox isolation for safety
- Add automatic error reporting (optional)
- Build recovery mechanisms for failed injections

## Phase 5: Polish & Deployment

### Performance Optimization
- Implement lazy loading for script components
- Optimize memory usage for persistent scripts
- Add request batching and throttling
- Audit and optimize render performance

### Security Hardening
- Review and enhance permission usage
- Implement content security policies
- Add input validation and sanitization
- Conduct security review of script injection

### Final Touches
- Refine responsive design for all panel sizes
- Add subtle animations and transitions
- Implement keyboard shortcuts
- Create onboarding experience for new users
- Write comprehensive documentation

### Launch Preparation
- Set up analytics for usage tracking (respecting privacy)
- Create Chrome Web Store assets (screenshots, description)
- Prepare privacy policy and terms of service
- Submit for Chrome Web Store review
- Plan post-launch support workflow

This plan maintains your lean approach while providing more technical detail for implementation. Each phase builds logically on the previous one, allowing you to test core functionality early while adding refinement progressively.
