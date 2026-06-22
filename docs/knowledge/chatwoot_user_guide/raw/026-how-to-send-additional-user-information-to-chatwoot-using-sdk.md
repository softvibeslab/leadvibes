---
source_url: "https://www.chatwoot.com/hc/user-guide/articles/1677587234-how-to-send-additional-user-information-to-chatwoot-using-sdk"
captured_at: "2026-06-17T09:56:29.153805+00:00"
author: "Chatwoot"
contributor: "Rovi Codex"
nav_title: "How to send additional user information to Chatwoot using SDK?"
---

# How to send additional user information to Chatwoot using SDK?

Source: https://www.chatwoot.com/hc/user-guide/articles/1677587234-how-to-send-additional-user-information-to-chatwoot-using-sdk

How to send additional user information to Chatwoot using SDK? | User Guide | Chatwoot

Chatwoot Help Center Home Website

English en

Language
en English pt_BR Portuguese (Brazil)

Home
Categories
🚀 Chatwoot 101
- Chatwoot Glossary

- Getting Started with Chatwoot

- Lesson 1: Your first Chatwoot conversation

- Lesson 2: Dashboard Basics

- Lesson 3 (a): Mastering core features

- Lesson 3 (b): Working with Customer Context

- Lesson 4: Automation and Routing

- Lesson 5: AI Actions

- Lesson 6: Reports and Metrics
👝 Setup account
- Creating a Chatwoot Account

- Customizing your personal profile

- Setting up notifications

- Updating your Account settings

- How to invite agents and manage your support team?

- What is a channel? What is an inbox?

- A complete guide to teams in Chatwoot
💬 Website live chat
- Website live chat settings explained

- How to install live chat using Google Tag Manager?

- How to install live chat on a Docusaurus website?

- How to install live chat on a Webflow website?

- How to install live chat on a Gatsby website?

- How to install live chat on a WordPress website?

- How to install live-chat on a React Native app?

- How to install live-chat on a Next.js app?

- How to install live-chat on a Vue.js app?

- How to send additional user information to Chatwoot using SDK?

- How to continue conversations through email?

- How to enable identity validation in Chatwoot?

- How to enable dark mode on live-chat widget?
🪵 Other channels
- How to setup a Facebook channel?

- How to setup an Instagram channel (via Facebook login)?

- How to setup a Twitter channel?

- How to setup a WhatsApp channel?

- How to setup an SMS channel?

- How to setup an Email channel?

- How to setup a Telegram channel?

- How to setup a Line channel?

- How to create an API channel inbox?

- How to Set Up a WhatsApp Channel with Twilio?

- How to setup an Instagram channel?

- How to setup a WhatsApp channel (Embedded signup)

- How to setup a WhatsApp channel (Manual flow)?

- How to setup a TikTok channel?
📞 Voice Channels
- Voice Calling in Chatwoot

- Connecting Twilio voice channel

- Connecting WhatsApp voice channel
📚 Features explained
- How to add labels?

- How to use Agent bots?

- Understanding Contacts

- How to create saved reply templates with Canned Responses?

- How to create and use custom attributes?

- How to enable CSAT surveys?

- How to assign a priority

- How to use omnichannel message signature?

- Preventing Agent Collision

- Manage team access control with flexible role-based permissions

- WhatsApp CSAT Surveys using Templates

- Review Notes for CSAT

- Business Hours and Auto-Responder
🔎 Advanced features explained
- How to use Conversation Filters?

- How to use pre-chat forms?

- How to use Campaigns?

- How to create interactive messages?

- How to use Automation?

- How to setup a WebSocket connection?

- How to use template variables?

- How to use Macros?

- How to use Audit Logs?

- Wildcard URL support in website live-chat campaigns

- Service Level Agreements

- How does sorting work?

- Setting per-agent conversation caps with Agent Capacity Policies

- What is Human Agent tag in Instagram/Messenger channel

- Whatsapp templates

- Twilio content templates

- Setting up SAML Authentication

- Common WhatsApp issues and how to fix them

- Required Conversation Attributes

- Advanced Assignment Policies
⚡ Apps and Integrations
- How to bring your Dialogflow chatbot to Chatwoot?

- How to use webhooks?

- How to answer conversations from Slack?

- How to use Dashboard Apps?

- How to enable video calls with Dyte integration?

- How to translate messages with Google Translate?

- How to enhance conversations with OpenAI integration?

- How to track Issues and Features with Linear Integration?
📊 Reports
- How to read Overview Reports (realtime)?

- How to read CSAT Reports?

- How to read Conversations Reports?

- How to read Bot Reports?

- How to read SLA Reports?

- Reading Conversations, Agents, Labels, Inbox, and Team Reports.

- How to read the SLA Reports
❓ Help Center
- How to set up a Help Center?

- How to setup an SSL certificate for your Help Center's custom domain?

- Embedding videos in Help Center
💫 Best practices
- Assigning conversations in a round-robin fashion.

- Working with command bar

- Working with keyboard shortcuts

- Group your contacts into custom segments.

- Group chats with filters, save as folders
🔥 Captain
- Introduction to Captain

- Creating an assistant with Captain

- Creating a document in Captain

- Creating an FAQ with Captain

- How to use Captain Memories?

- How to use Captain Copilot?

- How to enable Captain on self-hosted installations?

- How AI Credits work in Captain?

- Updating robots.txt to Allow Chatwoot Assistant to Crawl Your Website

- How to Set Up Custom Tools for Captain?
🛳️ Migrations
- How to migrate from Intercom to Chatwoot?

- How to migrate from Front to Chatwoot?

- How to migrate from Freshdesk to Chatwoot?

- How to migrate from Zendesk to Chatwoot?
📌 Other topics
- Which cookies are used by Chatwoot?

- Mobile app for Android

- Mobile app for iOS

- Enterprise Edition

- Languages supported in Chatwoot

- What we don't cover in Chatwoot Free Trial

- How to enable push notifications in your browser

- How to hard-reload on most browsers

- How to Use Your Coupon Code on Chatwoot?

- Inconsistencies for WhatsApp Numbers in Brazil and Argentina

- Troubleshooting: Why am I not receiving notifications?
⚙️ How To
- Purchasing a Paid Self-Hosted Chatwoot License: A Step-by-Step Guide

- How to Find Your Personal Access Token in Chatwoot

- How to Embed Your Help Center Articles in the Live Chat Widget

- How to Change Your Email Address in Chatwoot

- How to Remove the Free Usage Limit Exceeded Message in Chatwoot

- How to Segment Contacts in Chatwoot?

Home 💬 Website live chat How to send additional user information to Chatwoot using SDK?

# How to send additional user information to Chatwoot using SDK?

Open in
View as Markdown

Open in ChatGPT Open in Claude

Pranav

Last updated on Jul 24, 2025

The Chatwoot website SDK enables you to send additional user information to Chatwoot.

If you have installed our code on your website, the SDK would expose window.$chatwoot object. To make sure that the SDK has been loaded completely, please make sure that you listen to chatwoot:ready event as follows:

window.addEventListener("chatwoot:ready", function () { // Use window.$chatwoot here // ... });

If you would like to listen to the messages in the widget you can use the following event.

window.addEventListener('chatwoot:on-message', function(e) { console.log('chatwoot:on-message', e.detail) })

### SDK settings ​

To hide the bubble, you can use the setting mentioned below.

Note : If you use this, you must also trigger the widget.

window.chatwootSettings = { hideMessageBubble: false, showUnreadMessagesDialog: false, // Disable the unread message dialog position: "left", // This can be left or right locale: "en", // Language to be set useBrowserLanguage: false, // Set widget language from user's browser type: "standard", // [standard, expanded_bubble] darkMode: "auto", // [light, auto] // baseDomain: "yourdomain.com" // configure if you want to track users across subdomains };

### Use browser language in your live chat widget automatically

To show the live chat widget in the user's browser locale, set the useBrowserLanguage to true in the window.chatwootSettings mentioned above.

Note : If useBrowserLanguage is set to true , The locale mentioned will be ignored. If the browser language is not supported by chatwoot, the locale mentioned under locale will be used. If that's also missing, the widget will fall back to the locale of the agent dashboard.

### Dark Mode ​

Chatwoot live-chat widget supports dark mode v2.4.0 onwards. To enable the dark mode, follow the steps mentioned here .

### Widget designs ​

Chatwoot supports two designs for the widget.

-
Standard (default)

-
Expanded bubble

If you are using expanded bubble, you can customize the text used in the bubble by setting launcherTitle parameter on chatwootSettings as described below.

window.chatwootSettings = { type: "expanded_bubble", launcherTitle: "Chat with us", };

### Enable popout window ​

In order to enable the popout window, add the following configuration to chatwootSettings . This option is disabled by default.

window.chatwootSettings = { // ...Other Config showPopoutButton: true, } You can also popout the chat window programatically with the `popoutChatWindow()` method.

### Custom messages ​

Customize the welcome and availability messages shown in the widget header and team status indicators.

window.chatwootSettings = { // ...Other Config welcomeTitle: "Need help?", // Custom widget header welcomeDescription: "We’re here to support you.", // Header subtitle availableMessage: "We’re online and ready to chat!", // When team is online unavailableMessage: "We’re currently offline." // When team is unavailable };

### Feature toggles

Enable or disable optional UI features inside the widget:

window.chatwootSettings = { // ...Other Config enableFileUpload: true, // Show file attachment button enableEmojiPicker: true, // Enable emoji picker in the chat input enableEndConversation: true // Let users end the conversation };

### Programatically open the popout window ​

You can open the popout window programatically with the popoutChatWindow() method.

To initiate this, call the method like below.

window.$chatwoot.popoutChatWindow();

### Toggle the widget bubble visibility ​

If you want to hide/show the Chatwoot widget bubble, you can do so with toggleBubbleVisibility('show/hide')

Example

window.$chatwoot.toggleBubbleVisibility("show"); // to display the bubble window.$chatwoot.toggleBubbleVisibility("hide"); // to hide the bubble

### Trigger widget programmatically

If you want to open the chat window by clicking a link on the website, follow the method below. In your action, call the Chatwoot SDK as described below.

window.$chatwoot.toggle(); // Toggle widget by passing state window.$chatwoot.toggle("open"); // To open widget window.$chatwoot.toggle("close"); // To close widget

### Set the user in the widget ​

window.$chatwoot.setUser("<unique-identifier-key-of-the-user>", { email: "< [email protected] >", name: "<name-of-the-user>", avatar_url: "<avatar-url-of-the-user>", phone_number: "<phone-number-of-the-user>", });

setUser accepts an identifier which can be a user_id in your database or any unique parameter which represents a user. You can pass email, name, avatar_url, phone_number as params. Support for additional parameters is in progress.

Ensure you reset the session when the user logs out of your app.

### Identity validation using HMAC ​

To disallow impersonation and to keep the conversation with your customers private, we recommend setting up the identity validation in Chatwoot. Identity validation is enabled by generating an HMAC(hash based message authentication code) based on the identifier attribute, using SHA256. Along with the identifier you can pass identifier_hash also as shown below to make sure that the user is correct one.

window.$chatwoot.setUser(`<unique-identifier-key-of-the-user>`, { name: "", // Name of the user avatar_url: "", // Avatar URL email: "", // Email of the user identifier_hash: "", // Identifier Hash generated based on the webwidget hmac_token phone_number: "", // Phone Number of the user description: "", // description about the user country_code: "", // Two letter country code city: "", // City of the user company_name: "", // company name social_profiles: { twitter: "", // Twitter user name linkedin: "", // LinkedIn user name facebook: "", // Facebook user name github: "", // Github user name }, });

To generate HMAC, read identity validation . Note that implementing HMAC authentication will allow chat history to persist across sessions.

### Set custom attributes ​

To set additional information about the customer, you can use customer custom attributes field. Read more about custom attributes here .

To set a custom attribute, call setCustomAttributes as follows

window.$chatwoot.setCustomAttributes({ accountId: 1, pricingPlan: "paid", // Here the key which is already defined in custom attribute // Value should be based on type (Currently support Number, Date, String and Number) });

You can view these information in the sidepanel of a conversation.

To delete a custom attribute, use deleteCustomAttribute as follows

window.$chatwoot.deleteCustomAttribute("attribute-key");

### Set language manually ​

window.$chatwoot.setLocale("en");

To set the language manually, use the setLocale function.

### Set labels on the conversation ​

Please note that the labels will be set on a conversation if the user has not started a conversation. In that case, the following items will not have any effect:

window.$chatwoot.setLabel("support-ticket"); window.$chatwoot.removeLabel("support-ticket");

### Refresh the session (use this while you logout the user from your app) ​

window.$chatwoot.reset();

### Widget errors ​

To see any errors in the widget, please make sure that you listen to chatwoot:event event as follows:

window.addEventListener("chatwoot:error", function () { // ... });

Note: This feature is available in v2.3.0 and later.

### Customize the welcome header, description

You can change:

-
The welcome title and description

-
Messages shown when your team is online or offline

-
Selectively enable UI features like file upload, emoji picker, and end conversation button

window.chatwootSettings = { welcomeTitle: 'Need help?', welcomeDescription: 'We’re here to support you.', availableMessage: 'We’re online and ready to chat!', unavailableMessage: 'We’re currently offline.', enableFileUpload: true, enableEmojiPicker: true, enableEndConversation: true };

Back to Website live chat
