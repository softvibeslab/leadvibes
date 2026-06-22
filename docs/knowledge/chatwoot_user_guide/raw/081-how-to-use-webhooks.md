---
source_url: "https://www.chatwoot.com/hc/user-guide/articles/1677693021-how-to-use-webhooks"
captured_at: "2026-06-17T09:58:12.892310+00:00"
author: "Chatwoot"
contributor: "Rovi Codex"
nav_title: "How to use webhooks?"
---

# How to use webhooks?

Source: https://www.chatwoot.com/hc/user-guide/articles/1677693021-how-to-use-webhooks

How to use webhooks? | User Guide | Chatwoot

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

Home ⚡ Apps and Integrations How to use webhooks?

# How to use webhooks?

Open in
View as Markdown

Open in ChatGPT Open in Claude

Pranav

Last updated on Feb 26, 2026

Webhooks are HTTP callbacks that are set up for each account. These are triggered when actions such as creating a message occur in Chatwoot. Multiple webhooks can be created for a single account.

## How to add a webhook?

Step 1. Go to Settings → Integrations → Webhooks . Click on the "Configure" button.

Step 2. Click on the "Add new webhook" button. A modal will open up. Here, input the URL to which the POST request should be sent. Next, you need to select the events you want to subscribe. This option would allow you to only listen to the relevant events in Chatwoot.

Chatwoot will send a POST request with the following payload to the configured URLs for various updates in your account.

### A sample webhook payload

{ "event": "message_created", // The name of the event "id": "1", // Message ID "content": "Hi", // Content of the message "created_at": "2020-03-03 13:05:57 UTC", // Time at which the message was sent "message_type": "incoming", // This will have a type incoming, outgoing or template. The user from the widget sends incoming messages, and the agent sends outgoing messages to the user. "content_type": "enum", // This is an enum, it can be input_select, cards, form or text. The message_type will be template if content_type is one og these. Default value is text "content_attributes": {} // This will an object, different values are defined below "source_id": "", // This would the external id if the inbox is a Twitter or Facebook integration. "sender": { // This would provide the details of the agent who sent this message "id": "1", "name": "Agent", "email": " [email protected] " }, "contact": { // This would provide the details of the user who sent this message "id": "1", "name": "contact-name" }, "conversation": { // This would provide the details of the conversation "display_id": "1", // This is the ID of the conversation which you can see in the dashboard. "additional_attributes": { "browser": { "device_name": "Macbook", "browser_name": "Chrome", "platform_name": "Macintosh", "browser_version": "80.0.3987.122", "platform_version": "10.15.2" }, "referer": "<http://www.chatwoot.com>", "initiated_at": "Tue Mar 03 2020 18:37:38 GMT-0700 (Mountain Standard Time)" } }, "account": { // This would provide the details of the account "id": "1", "name": "Chatwoot", } }

## Supported webhook events in Chatwoot

Chatwoot publishes various events to the configured webhook endpoints. If you want to configure a webhook, refer to the guide here .

Each event has its payload structure based on the type of model they are acting on. The following section describes the main objects we use in Chatwoot and their attributes.

## Objects

An event payload may include any of the following objects. The various types of objects supported by Chatwoot are listed below.

Account

{ "id": "integer", "name": "string" }

Inbox

{ "id": "integer", "name": "string" }

Contact

{ "id": "integer", "name": "string", "avatar": "string", "type": "contact", "account": { // <...Account Object> } }

User

{ "id": "integer", "name": "string", "email": "string", "type": "user" }

Conversation

{ "additional_attributes": { "browser": { "device_name": "string", "browser_name": "string", "platform_name": "string", "browser_version": "string", "platform_version": "string" }, "referer": "string", "initiated_at": { "timestamp": "iso-datetime" } }, "can_reply": "boolean", "channel": "string", "id": "integer", "inbox_id": "integer", "contact_inbox": { "id": "integer", "contact_id": "integer", "inbox_id": "integer", "source_id": "string", "created_at": "datetime", "updated_at": "datetime", "hmac_verified": "boolean" }, "messages": ["Array of message objects"], "meta": { "sender": { // Contact Object }, "assignee": { // User Object } }, "status": "string", "unread_count": "integer", "agent_last_seen_at": "unix-timestamp", "contact_last_seen_at": "unix-timestamp", "timestamp": "unix-timestamp", "account_id": "integer" }

Message

{ "id": "integer", "content": "string", "message_type": "integer", "created_at": "unix-timestamp", "private": "boolean", "source_id": "string / null", "content_type": "string", "content_attributes": "object", "sender": { "type": "string - contact/user" // User or Contact Object }, "account": { // Account Object }, "conversation": { // Conversation Object }, "inbox": { // Inbox Object } }

A sample webhook payload

{ "event": "event_name" // Attributes related to the event }

## Webhook Events

Chatwoot supports the following webhook events. You can subscribe to them while configuring a webhook in the dashboard or using the API.

### conversation_created

This event will be triggered when a new conversation is created in the account. The payload for the event is as follows.

{ "event": "conversation_created" // <...Conversation Attributes> }

### conversation_updated

This event will be triggered when there is a change in any of the attributes in the conversation.

{ "event": "conversation_updated", "changed_attributes": [ { "<attribute_name>": { "current_value": "", "previous_value": "" } } ] // <...Conversation Attributes> }

### conversation_status_changed

This event will be triggered when the status of the conversation is changed.

Note: If you are using agent bot APIs instead of webhooks, this event is not supported yet.

{ "event": "conversation_status_changed" // <...Conversation Attributes> }

### message_created

This event will be triggered when a message is created in a conversation. The payload for the event is as follows.

{ "event": "message_created" // <...Message Attributes> }

### message_updated

This event will be triggered when a message is updated in a conversation. The payload for the event is as follows.

{ "event": "message_updated" // <...Message Attributes> }

### webwidget_triggered

This event will be triggered when the end user opens the live-chat widget.

{ "event": "webwidget_triggered", "id": "", "contact": { // <...Contact Object> }, "inbox": { // <...Inbox Object> }, "account": { // <...Account Object> }, "current_conversation": { // <...Conversation Object> }, "source_id": "string", "event_info": { "initiated_at": { "timestamp": "date-string" }, "referer": "string", "widget_language": "string", "browser_language": "string", "browser": { "browser_name": "string", "browser_version": "string", "device_name": "string", "platform_name": "string", "platform_version": "string" } } }

### conversation_typing_on

This event is triggered when an agent starts typing in a conversation. It could be either a private note or a message to the customer. You can use the is_private flag to distinguish between the two.

{ "event": "conversation_typing_on", "conversation": { ...<Conversation Object> }, "user": { ... <User / AgentBot / Captain Object> }, "is_private": true }

### conversation_typing_off

This event is triggered when an agent stops typing or when they leave the conversation window.

{ "event": "conversation_typing_off", "conversation": { ...<Conversation Object> }, "user": { ... <User / AgentBot / Captain Object> }, "is_private": true }

# Verifying webhooks

Chatwoot signs every outgoing webhook request so your server can verify that the payload was sent by Chatwoot and has not been tampered with. The secret is shown to you once the webhook is created, and you can view it again on the webhook edit form.

Every webhook request sends the following headers, which can be used to compute the HMAC signature of the payload

-
X-Chatwoot-Signature : HMAC-SHA256 signature prefixed with sha256=

-
X-Chatwoot-Timestamp : Unix timestamp (seconds) when the request was signed

-
X-Chatwoot-Delivery : Unique delivery ID for the webhook event (when available)

The signature is computed as:

sha256=HMAC-SHA256(webhook_secret, "{timestamp}.{raw_body}")

Where:

-
webhook_secret is the secret associated with the webhook

-
timestamp is the value of the X-Chatwoot-Timestamp header

-
raw_body is the raw JSON request body (not parsed/re-serialized)

## Verification Steps

-
Extract X-Chatwoot-Signature and X-Chatwoot-Timestamp from the request headers

-
Read the raw request body as bytes (do not parse and re-serialize)

-
Compute the expected signature: sha256=HMAC-SHA256(secret, "{timestamp}.{raw_body}")

-
Compare the computed signature with the received signature using a constant-time comparison

-
Optionally, reject requests where the timestamp is too old to prevent replay attacks

## Examples

### Ruby

def verify_signature(raw_body, timestamp, received_signature, secret) expected = "sha256=#{OpenSSL::HMAC.hexdigest('SHA256', secret, "#{timestamp}.#{raw_body}")}" ActiveSupport::SecurityUtils.secure_compare(expected, received_signature) end

### Python

import hmac import hashlib def verify_signature(raw_body: bytes, timestamp: str, received_signature: str, secret: str) -> bool: message = f"{timestamp}.".encode() + raw_body expected = "sha256=" + hmac.new(secret.encode(), message, hashlib.sha256).hexdigest() return hmac.compare_digest(expected, received_signature)

### Node.js

const crypto = require("crypto"); function verifySignature(rawBody, timestamp, receivedSignature, secret) { const message = `${timestamp}.${rawBody}`; const expected = "sha256=" + crypto.createHmac("sha256", secret).update(message).digest("hex"); return crypto.timingSafeEqual( Buffer.from(expected), Buffer.from(receivedSignature) ); }

### Go

import ( "crypto/hmac" "crypto/sha256" "encoding/hex" "fmt" ) func verifySignature(rawBody []byte, timestamp, receivedSignature, secret string) bool { mac := hmac.New(sha256.New, []byte(secret)) mac.Write([]byte(fmt.Sprintf("%s.%s", timestamp, rawBody))) expected := "sha256=" + hex.EncodeToString(mac.Sum(nil)) return hmac.Equal([]byte(expected), []byte(receivedSignature)) }

## Important Notes

-
Always use the raw request body for verification. Parsing the JSON and re-serializing it may change key ordering, whitespace, or unicode escaping, which will produce a different signature.

-
Always use constant-time comparison (e.g., hmac.compare_digest , crypto.timingSafeEqual , ActiveSupport::SecurityUtils.secure_compare ) to prevent timing attacks.

-
Consider rejecting requests with timestamps older than 5 minutes to mitigate replay attacks.

Back to Apps and Integrations
