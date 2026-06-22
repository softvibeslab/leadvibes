---
source_url: "https://www.chatwoot.com/hc/user-guide/articles/1677691702-how-to-use-dashboard-apps"
captured_at: "2026-06-17T09:58:16.629589+00:00"
author: "Chatwoot"
contributor: "Rovi Codex"
nav_title: "How to use Dashboard Apps?"
---

# How to use Dashboard Apps?

Source: https://www.chatwoot.com/hc/user-guide/articles/1677691702-how-to-use-dashboard-apps

How to use Dashboard Apps? | User Guide | Chatwoot

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

Home ⚡ Apps and Integrations How to use Dashboard Apps?

# How to use Dashboard Apps?

Open in
View as Markdown

Open in ChatGPT Open in Claude

Pranav

Last updated on Apr 10, 2024

With Dashboard apps, you can integrate an app within the Chatwoot dashboard for agents' use. This feature enables you to create an application independently, which can then be embedded to provide customers' information, orders, past payment history, etc.

When embedded in Chatwoot's dashboard, your application will get the context of the conversation and contact as a window event. Implement a listener for the message event on your page to receive the context.

P.S. Check out our YouTube live on building a Dashboard App .

## How to create a dashboard app?

Step 1. Go to Settings → Integrations → Dashboard apps. Click on the “Configure” button corresponding to the Dashboard Apps.

Step 2. Add your app name and the URL on which your app is hosted.

Once you are done, a new tab with the name you gave to the app will appear in the conversation window. In this case, it is “Customer Orders”.

When you click on the new tab, you will be able to see your application fetching data on the Chatwoot dashboard.

### Receiving data from Chatwoot into your app

Chatwoot will deliver the conversation and contact context as a window event. This can be accessed within your app by implementing a listener for the event, as shown here:

window.addEventListener("message", function (event) { if (!isJSONValid(event.data)) { return; } const eventData = JSON.parse(event.data); });

## On-demand request for data from Chatwoot

If you need to request the conversation data on demand from Chatwoot, you can send a message to the parent window using the javascript postMessage API .

Chatwoot will be listening to this key: chatwoot-dashboard-app:fetch-info .

### Example

The following code can be used to query the dashboard app. Chatwoot will respond to this request by providing the updated conversation payload promptly.

window.parent.postMessage('chatwoot-dashboard-app:fetch-info', '*') // You would get a message in the on message listener with the appContext payload.

## Event Payload

### conversation object ​

{ "meta": { "sender": { "additional_attributes": { "description": "string", "company_name": "string", "social_profiles": { "github": "string", "twitter": "string", "facebook": "string", "linkedin": "string" } }, "availability_status": "string", "email": "string", "id": "integer", "name": "string", "phone_number": "string", "identifier": "string", "thumbnail": "string", "custom_attributes": "object", "last_activity_at": "integer" }, "channel": "string", "assignee": { "id": "integer", "account_id": "integer", "availability_status": "string", "auto_offline": "boolean", "confirmed": "boolean", "email": "string", "available_name": "string", "name": "string", "role": "string", "thumbnail": "string" }, "hmac_verified": "boolean" }, "id": "integer", "messages": [ { "id": "integer", "content": "Hello", "inbox_id": "integer", "conversation_id": "integer", "message_type": "integer", "content_type": "string", "content_attributes": {}, "created_at": "integer", "private": "boolean", "source_id": "string", "sender": { "additional_attributes": { "description": "string", "company_name": "string", "social_profiles": { "github": "string", "twitter": "string", "facebook": "string", "linkedin": "string" } }, "custom_attributes": "object", "email": "string", "id": "integer", "identifier": "string", "name": "string", "phone_number": "string", "thumbnail": "string", "type": "string" } } ], "account_id": "integer", "additional_attributes": { "browser": { "device_name": "string", "browser_name": "string", "platform_name": "string", "browser_version": "string", "platform_version": "string" }, "referer": "string", "initiated_at": { "timestamp": "string" } }, "agent_last_seen_at": "integer", "assignee_last_seen_at": "integer", "can_reply": "boolean", "contact_last_seen_at": "integer", "custom_attributes": "object", "inbox_id": "integer", "labels": "array", "muted": "boolean", "snoozed_until": null, "status": "string", "timestamp": "integer", "unread_count": "integer", "allMessagesLoaded": "boolean", "dataFetched": "boolean" }

### contact object ​

{ "additional_attributes": { "description": "string", "company_name": "string", "social_profiles": { "github": "string", "twitter": "string", "facebook": "string", "linkedin": "string" } }, "availability_status": "string", "email": "string", "id": "integer", "name": "string", "phone_number": "+91 9000000001", "identifier": "string || null", "thumbnail": "+91 9000000001", "custom_attributes": {}, "last_activity_at": "integer" }

### currentAgent object ​

{ "email": "string", "id": "integer", "name": "string" }

### Final Payload ​

{ "event": "appContext", "data": { "conversation": { // <...Conversation Attributes> }, "contact": { // <...Contact Attributes> }, "currentAgent": { // <...Current agent Attributes> } } }

Back to Apps and Integrations
