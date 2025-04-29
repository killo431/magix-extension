# Magix: Reshape the Web Through Conversation

## Project Description

**Magix** is a Chrome extension that empowers users to transform any website's UI through natural language conversations. By combining the power of AI with browser scripting, Magix enables non-technical users to personalize their web experience without seeing a single line of code.

### Core Concept

A magical wand icon ("🪄") appears unobtrusively in the corner of every webpage. With a single click, users access a sleek side panel with a conversational interface. Users simply describe their desired customizations in plain language: "Make YouTube dark mode even darker," "Hide all images on this news site," or "Change the font to something more readable on Medium."

Behind the scenes, Magix leverages Gemini's AI to instantly generate custom JavaScript that implements these changes. The script is immediately injected and applied to the page, creating a seamless "what you say is what you get" experience. All customizations are automatically saved to the user's cloud account and intelligently reapplied whenever they revisit matching websites.

### Key Differentiators

- **Zero Technical Knowledge Required**: Unlike traditional userscript managers that expose JavaScript, Magix completely abstracts the code layer away. Users interact solely through natural conversation.

- **Visual Transformation with Persistence**: Changes apply instantly and persist across sessions. The system remembers user preferences per site and automatically applies them on return visits.

- **Cross-Device Synchronization**: With Supabase-powered cloud database, users' customizations follow them across any device where they're signed into Magix.

- **Context-Aware Intelligence**: Magix understands the structure of popular websites, allowing for more precise and reliable modifications.

### User Experience Flow

1. **Discovery**: User notices the subtle wand icon while browsing
2. **Activation**: One click opens the side panel interface
3. **Conversation**: User describes desired website changes in plain language
4. **Transformation**: Page visibly updates as the AI-generated script takes effect
5. **Persistence**: Changes automatically reapply on future visits
6. **Management**: Simple toggle switches let users enable/disable specific customizations

### Technical Architecture

Magix combines Chrome's extension APIs with cloud infrastructure and AI:

- **Frontend**: React-based side panel with streamlined chat UI
- **Middleware**: Service workers manage script injection and persistence
- **Backend**: Supabase handles authentication and database
- **Intelligence**: Gemini AI generates precise JavaScript from natural language

### Target Users

- **Everyday browsers** who want simple customizations without technical skills
- **Productivity enthusiasts** looking to optimize frequently-visited websites
- **Accessibility-minded users** who need to adjust sites for better readability
- **Design-conscious individuals** who want to personalize their web experience

With Magix, we're democratizing web customization by combining the power of userscripts with the accessibility of conversation. No more hunting for the right script or learning JavaScript - just tell Magix what you want, and watch the web transform before your eyes.