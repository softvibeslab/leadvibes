---
source_url: "https://www.chatwoot.com/hc/user-guide/articles/1677691027-how-to-setup-a-web_socket-connection"
captured_at: "2026-06-17T09:57:42.734141+00:00"
author: "Chatwoot"
contributor: "Rovi Codex"
nav_title: "How to setup a WebSocket connection?"
---

# How to setup a WebSocket connection?

Source: https://www.chatwoot.com/hc/user-guide/articles/1677691027-how-to-setup-a-web_socket-connection

How to setup a WebSocket connection? | User Guide | Chatwoot

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

Home 🔎 Advanced features explained How to setup a WebSocket connection?

# How to setup a WebSocket connection?

Open in
View as Markdown

Open in ChatGPT Open in Claude

Muhsin

Last updated on Apr 17, 2023

WebSockets establish a continuous connection between the client and server, enabling bi-directional communication. Chatwoot utilizes this connection to provide real-time updates about platform events. To connect to the Chatwoot WebSocket, simply provide a token and follow the setup instructions outlined in this guide.

Note : This feature is experimental, and the documentation may change with each release. Additionally, backward compatibility cannot be guaranteed, so it is important to ensure you are using the latest version of the implementation.

## Why should I use a WebSocket connection?

A WebSocket connection allows for real-time data updates, making it ideal for clients such as an Android or iOS client SDK for Chatwoot. This helps update the dashboard without the need to reload the page. Hence, it can enhance the user experience and improve an agent's productivity.

## How to set up a WebSocket connection with Chatwoot?

To set up a WebSocket connection with Chatwoot, you need to initiate a connection with the authentication PubSub token provided by Chatwoot. The URL for the connection is wss://<your-installation-url>/cable . If you are using Chatwoot Cloud, you can use wss://app.chatwoot.com/cable as the URL.

A PubSub token is a token that is used to authenticate a client when connecting to a PubSub (publish-subscribe) service. The client must present this token to the service in order to establish a connection and begin publishing or subscribing to messages.

There are two types of PubSub tokens available in Chatwoot, as listed below.

-
User PubSub Token : This token has the privileges of an agent/admin and would receive all of the events listed later on the page. You can get the PubSub token by calling the Profile API .

-
Contact PubSub Token : Chatwoot generates a unique PubSub token for each session a contact has. This token can be used to connect to the WebSocket and receive real-time updates for the same session. When a contact is created through the public APIs, the pubsub_token is included in the response payload. This token only grants access to events related to the current session, such as conversation.created , conversation.status_changed , message.created , message.updated , conversation_typing_on , conversation_typing_off and presence.update .

Please refer Client APIs to build real time customer facing integrations using Chatwoot.

Note : This token may be rotated regularly based on your installation type. Please ensure that you are using the latest token.

### How to connect to Chatwoot WebSocket?

To connect to the Chatwoot WebSocket, use the command subscribe and include your pubSubToken , accountId , and userId (if using a user token) in the connection request. Here is an example of how you can connect with Chatwoot.

// Add a helper method to convert JSON to a string const stringify = (payload = {}) => JSON.stringify(payload); const pubSubToken = "<contact/user-pub-sub-token>"; const accountId = "<your-account-id-in-integer>"; const userId = "<user-id-in-integer-if-using-user-token>"; const connection = new WebSocket( "wss://app.chatwoot.com/cable" ); connection.send( stringify({ command: "subscribe", identifier: stringify({ channel: "RoomChannel", pubsub_token: pubSubToken, account_id: accountId, user_id: userId, }), }) ); // The expected string in connection.send is of the format: // {"command":"subscribe","identifier":"{\\"channel\\":\\"RoomChannel\\",\\"pubsub_token\\":\\"your-pubsub-token\\",\\"account_id\\": account_id_integer,\\"user_id\\":user_id_integer }"}

### Publishing presence to the WebSocket server

To keep your users’ status online in Chatwoot, you can send a presence update event to Chatwoot every 30 seconds. This action would keep the status of the agent/contact online.

How to update the presence of an agent/admin?

To update the presence of an agent or admin, send the following payload to the server:

const userPayload = stringify({ command: "message", identifier: stringify({ channel: "RoomChannel", pubsub_token: "<user-pubsub-token>", account_id: accountId, user_id: userId, }), data: stringify({ action: "update_presence" }), }); connection.send(userPayload); // The expected string in connection.send is of the format: // {"command":"message","identifier":"{\\"channel\\":\\"RoomChannel\\",\\"pubsub_token\\":\\"your-pubsub-token\\",\\"account_id\\": account_id_integer,\\"user_id\\":user_id_integer ","data":"{\\"action\\":\\"update_presence\\"}"}

How to update the presence of a contact?

To update the presence of a contact, send the following payload to the server:

const agentPayload = stringify({ command: "message", identifier: stringify({ channel: "RoomChannel", pubsub_token: "<user-pubsub-token>", }), data: stringify({ action: "update_presence" }), }); connection.send(agentPayload); // The expected string in connection.send is of the format: // {"command":"message","identifier":"{\\"channel\\":\\"RoomChannel\\",\\"pubsub_token\\":\\"your-pubsub-token\\","data":"{\\"action\\":\\"update_presence\\"}"}

## WebSocket Payload

### Objects

An event can contain any of the following objects as payload. Different types of objects supported in Chatwoot are as follows.

Conversation

The following payload will be returned for a conversation.

{ "additional_attributes": { "browser": { "device_name": "string", "browser_name": "string", "platform_name": "string", "browser_version": "string", "platform_version": "string" }, "referer": "string", "initiated_at": { "timestamp": "iso-datetime" } }, "can_reply": "boolean", "channel": "string", "id": "integer", "inbox_id": "integer", "contact_inbox": { "id": "integer", "contact_id": "integer", "inbox_id": "integer", "source_id": "string", "created_at": "datetime", "updated_at": "datetime", "hmac_verified": "boolean" }, "messages": ["Array of message objects"], "meta": { "sender": { // Contact Object }, "assignee": { // User Object } }, "status": "string", "unread_count": "integer", "agent_last_seen_at": "unix-timestamp", "contact_last_seen_at": "unix-timestamp", "timestamp": "unix-timestamp", "account_id": "integer" }

Contact

The following payload will be returned for a contact.

{ "additional_attributes": "object", "custom_attributes": "object", "email": "string", "id": "integer", "identifier": "string or null", "name": "string", "phone_number": "string or null", "thumbnail": "string" }

User

The following payload will be returned for an agent/admin.

{ "id": "integer", "name": "string", "available_name": "string", "avatar_url": "string", "availability_status": "string", "thumbnail": "string" }

Message

The following payload will be returned for a message.

{ "id": "integer", "content": "string", "account_id": "integer", "inbox_id": "integer", "message_type": "integer", "created_at": "unix-timestamp", "updated_at": "datetime", "private": "boolean", "status": "string", "source_id": "string / null", "content_type": "string", "content_attributes": "object", "sender_type": "string", "sender_id": "integer", "external_source_ids": "object", "sender": { "type": "string - contact/user" // User or Contact Object } }

Notification

The following payload will be returned for a notification.

{ "id": "integer", "notification_type": "string", "primary_actor_type": "string", "primary_actor_id": "integer", "primary_actor": { "can_reply": "boolean", "channel": "string", "id": "integer", "inbox_id": "integer", "meta": { "assignee": { "id": "integer", "name": "string", "available_name": "string", "avatar_url": "string", "type": "user", "availability_status": "string", "thumbnail": "string" }, "hmac_verified": "boolean" }, "agent_last_seen_at": "unix-timestamp", "contact_last_seen_at": "unix-timestamp", "timestamp": "unix-timestamp", }, "read_at": "unix-timestamp", "secondary_actor": "object/null", "created_at":"unix-timestamp", "account_id": "integer", "push_message_title": "string" }

### Identifier

Each event will have an identifier attribute in the following format.

{ "identifier": "{\\"channel\\":\\"RoomChannel\\",\\"pubsub_token\\":\\"token\\",\\"account_id\\":id,\\"user_id\\":user_id}" }

### Message

Each event will include a message attribute which we return the event name as well as the data associated with it. To see the list of events, refer the documentation below.

## Types of Events

### conversation.created

This event is triggered when a new conversation is initiated. If subscribing to the contact's PubSub token, this event will only include data related to the specific session associated with the PubSub token.

Available to : agent/admin, contact

{ "message": { "event": "conversation.created", "data": { // Conversation object will be available here } } }

### conversation.read

This event is triggered and sent to the agents/admins who have access to the inbox, when a contact has read a message.

Available to : agent/admin

{ "message": { "event": "conversation.read", "data": { // Conversation object will be available here } } }

### message.created

This event is triggered and sent to the agents, admins, contacts when a new message is created in a conversation they have access to.

Available to : agent/admin, contact

{ "message": { "event": "message.created", "data": { // Message object will be available here } } }

### message.updated

This event is triggered and sent to the agents, admins, contacts when a message is updated in a conversation they have access to.

Available to : agent/admin, contact

{ "message": { "event": "message.updated", "data": { // Message object will be available here } } }

### conversation.status_changed

This event is sent to the agents, admins, contacts when a conversation status is updated.

Available to : agent/admin, contact

{ "message": { "event": "conversation.status_changed", "data": { // Conversation object will be available here } } }

### conversation.typing_on

This event is sent to the agents, admins, contacts when a contact or an agent starts typing a response.

Available to : agent/admin, contact

{ "message": { "event": "conversation.typing_on", "data": { "conversation": { // Conversation object will be available here }, "user": { // Contact / Agent,Admin User object will be available here. }, "is_private": "boolean", // Shows whether the agent is typing a private note or not. "account_id": "integer" } } }

### conversation.typing_off

This event is sent to the agents, admins, contacts when a contact or an agent ends typing a response.

Available to : agent/admin, contact

{ "message": { "event": "conversation.typing_off", "data": { "conversation": { // Conversation object will be available here }, "user": { // Contact / User object will be available here. }, "account_id": "integer" } } }

### assignee.changed

This event is sent to the agents/admins with access to an inbox when the assigned agent is changed.

Available to : agent/admin

{ "message": { "event": "assignee.changed", "data": { // Conversation object will be available here } } }

### team.changed

This event is sent to the agents/admins with access to an inbox when the assigned team is changed.

Available to : agent/admin

{ "message": { "event": "team.changed", "data": { // Conversation object will be available here } } }

### conversation.contact_changed

This event is sent to the agents/admins when two contacts are merged all their conversations are consolidated under one contact.

Available to : agent/admin

{ "message": { "event": "conversation.contact_changed", "data": { // Conversation object will be available here } } }

### contact.created

This event is sent to the agents/admins when a contact is created.

Available to : agent/admin

{ "message": { "event": "contact.created", "data": { // Contact object will be available here } } }

### contact.updated

This event is sent to the agents/admins when a contact is updated.

Available to : agent/admin

{ "message": { "event": "contact.updated", "data": { // Contact object will be available here } } }

### presence.update

Available for both agent and the contact, this event provides real-time updates on the availability status of the users in the system. The event delivered to contacts will not include information about other contacts' availability status.

Available to : agent/admin

{ "message": { "event": "presence.update", "data": { "account_id": "integer", "users": { "user-id": "string" }, "contacts": { "contact-id": "string" } } } }

### notification_created

This event is sent to the agents/admins when a notification is created.

Available to : agent/admin

Back to Advanced features explained
