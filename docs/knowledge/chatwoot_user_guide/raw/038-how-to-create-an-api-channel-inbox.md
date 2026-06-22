---
source_url: "https://www.chatwoot.com/hc/user-guide/articles/1677839703-how-to-create-an-api-channel-inbox"
captured_at: "2026-06-17T09:56:42.519386+00:00"
author: "Chatwoot"
contributor: "Rovi Codex"
nav_title: "How to create an API channel inbox?"
---

# How to create an API channel inbox?

Source: https://www.chatwoot.com/hc/user-guide/articles/1677839703-how-to-create-an-api-channel-inbox

How to create an API channel inbox? | User Guide | Chatwoot

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

Home 🪵 Other channels How to create an API channel inbox?

# How to create an API channel inbox?

Open in
View as Markdown

Open in ChatGPT Open in Claude

Pranav

Last updated on Apr 8, 2026

To create and configure an API channel inbox in Chatwoot installations, follow the step described below.

## Setup the API channel

Step 1 . Go to Settings → Inboxes → “Add Inbox”.

Step 2. Click on the "API" icon.

Step 3. Provide a name for the channel and a callback URL. Here is an example:

Step 4 . "Add agents" to your API inbox.

The inbox setup is complete.

## Send messages to the API channel

To send messages to the API channel, ensure you understand the following models and nomenclature used in Chatwoot.

-
Channel : Channel defines the type of source of conversations. E.g., Facebook, Twitter, API, etc.

-
Inbox : You can create multiple sources of conversations of the same channel type. E.g., You can have more than one Facebook page connected to a Chatwoot account. Each page is called the inbox in Chatwoot.

-
Conversation : A Conversation is a collection of messages.

-
Contact : Each conversation has a real-life person associated with it, called a contact.

-
Contact Inboxes : This is the session for each contact in an inbox. A contact can have multiple sessions and multiple conversations in the same inbox.

### How to send a message in an API Channel?

To send a message in an API channel, create a contact, initiate a conversation, and finally send the message.

APIs require api_access_token in the request header. You can get this token by visiting your Profile settings → Access Token.

1. Create a contact

Ref : API documentation

Pass the inbox ID of the API channel along with other params specified. This would create a session for you automatically. A sample response would look like the one below.

{ "email": "string", "name": "string", "phone_number": "string", "thumbnail": "string", "additional_attributes": {}, "contact_inboxes": [ { "source_id": "string", "inbox": { "id": 0, "name": "string", "website_url": "string", "channel_type": "string", "avatar_url": "string", "widget_color": "string", "website_token": "string", "enable_auto_assignment": true, "web_widget_script": "string", "welcome_title": "string", "welcome_tagline": "string", "greeting_enabled": true, "greeting_message": "string" } } ], "id": 0, "availability_status": "string" }

As you can see in the payload, you will be able to see the contact_inboxes and each contact_inbox will have a source_id . Source ID can be seen as the session identifier. You will use this source_id to create a new conversation as defined below.

2. Create a conversation

Ref : API documentation

Use the source_id received in the previous API call. You will receive a conversation ID which can be used to create a message.

{ "id": 0 }

3. Create a new message

Ref: API documentation

There are 2 types of messages.

-
Incoming : Messages sent by the end user is classified as an incoming message.

-
Outgoing : Messages sent by the agent is classified as an outgoing message.

If you call the API with the correct content, you will receive a payload similar to this one:

{ "id": 0, "content": "This is a incoming message from API Channel", "inbox_id": 0, "conversation_id": 0, "message_type": 0, "content_type": null, "content_attributes": {}, "created_at": 0, "private": false, "sender": { "id": 0, "name": "Pranav", "type": "contact" } }

If everything is successful, you will see the conversation on the dashboard as follows.

You will be notified when a new message is created on the URL specified while creating the API channel. You can read about the message payload here .

## Receive messages using callback URL

When a new message is created in the API channel, you will get a POST request to the Callback URL specified while creating the API channel. The payload would look like this.

Find the full list of events supported by the webhook here .

Event type : message_created

{ "id": 0, "content": "This is a incoming message from API Channel", "created_at": "2020-08-30T15:43:04.000Z", "message_type": "incoming", "content_type": null, "content_attributes": {}, "source_id": null, "sender": { "id": 0, "name": "contact-name", "avatar": "", "type": "contact" }, "inbox": { "id": 0, "name": "API Channel" }, "conversation": { "additional_attributes": null, "channel": "Channel::Api", "id": 0, "inbox_id": 0, "status": "open", "agent_last_seen_at": 0, "contact_last_seen_at": 0, "timestamp": 0 }, "account": { "id": 1, "name": "API testing" }, "event": "message_created" }

## Create Interfaces using client APIs

Client APIs available for the API channel will help you build customer-facing interfaces for Chatwoot.

These APIs are useful for cases like the ones listed below.

-
Use a custom chat interface instead of the Chatwoot chat widget.

-
Build conversational interfaces into your mobile apps.

-
Add Chatwoot to other platforms for which Chatwoot doesn't have an official SDK.

### Creating customer objects

You can create and retrieve customer data objects using the inbox_identifier and customer_identifier .

Inbox Identifier

You can obtain the inbox_identifier from your API channel -> Settings -> Configuration.

Customer Identifier

The customer_identifier or the source_id can be obtained when creating the customer using the create API. You will need to store this identifier on your client-side to make further requests on behalf of the customer. This can be done in cookies, local storage etc.

Available APIs

The Available Client APIs are documented here . Some of the things you can do with the APIs are:

-
Create, View and Update Contact

-
Create and List Conversations

-
Create, List and Update Messages

### HMAC Authentication

The Client APIs also support HMAC Authentication . The HMAC token for the Channel can be obtained via running the following on your rails console.

# replace api_inbox_id with your inbox id Inbox.find(api_inbox_id).channel.hmac_token

### Connecting to the Chatwoot WebSockets

To get real-time updates from the agent dashboard, connect to Chatwoot WebSockets using the following URL.

<your installation url>/cable

### Authenticating your WebSocket connection

After subscribing using the customer's pubsub_token , you will receive events directed toward your customer object. The pubsub_token is provided during the customer creation API call.

Example

const connection = new WebSocket('ws://localhost:3000/cable'); connection.send(JSON.stringify({ command:"subscribe", identifier: "{\\"channel\\":\\"RoomChannel\\",\\"pubsub_token\\":\\""+ customer_pubsub_token+"\\"}" }));

Find the full list of events supported by WebSockets here .

### Webhook Verification

Once you create an API channel, we automatically generate a secret that you can use to verify the payload your application receives. You can read more about webhook verification here .

### Implementation

Here is an example chat interface build over the Client APIs.

Back to Other channels
