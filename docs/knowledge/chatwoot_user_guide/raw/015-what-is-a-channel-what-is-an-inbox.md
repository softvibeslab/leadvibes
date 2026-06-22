---
source_url: "https://www.chatwoot.com/hc/user-guide/articles/1677492191-adding-inboxes"
captured_at: "2026-06-17T09:55:09.680949+00:00"
author: "Chatwoot"
contributor: "Rovi Codex"
nav_title: "What is a channel? What is an inbox?"
---

# What is a channel? What is an inbox?

Source: https://www.chatwoot.com/hc/user-guide/articles/1677492191-adding-inboxes

What is a channel? What is an inbox? | User Guide | Chatwoot

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

Home 👝 Setup account What is a channel? What is an inbox?

# What is a channel? What is an inbox?

Open in
View as Markdown

Open in ChatGPT Open in Claude

Pranav

Last updated on Apr 29, 2026

A channel is a type of communication — Website, Email, WhatsApp, SMS, etc. An inbox is a specific instance of a channel connected to your account. You can have multiple inboxes of the same channel type — e.g. one Website inbox for your marketing site and another for your help center, or two WhatsApp numbers for different regions.

Every conversation in Chatwoot lives inside an inbox. Inboxes carry their own agents, business hours, greetings, pre-chat form, and routing rules.

Where to set up: Settings → Inboxes → Add Inbox opens the channel picker. Pick the channel type, fill in the credentials/settings, add agents, and finish.

This doc lists every channel type Chatwoot supports, what you need to configure for each, and the settings tabs that appear on every inbox once it exists.

## The channel types

### Website (live chat widget)

The classic chat bubble on your website — the most popular starting channel and the fastest to set up. You give the inbox a name, point it at the website it'll live on, pick a brand color, and write the welcome heading and tagline that visitors see when they open the widget. After saving, Chatwoot hands you a small snippet of code to paste into your site, and the widget is live.

### Email

For handling support email inside Chatwoot. You can connect a Gmail or Google Workspace mailbox by signing in with Google, a Microsoft 365 mailbox by signing in with Microsoft, or any other email provider by entering your incoming and outgoing email server details manually.

### Facebook Messenger

For receiving and replying to direct messages sent to your Facebook Page. Sign in to Facebook through Chatwoot, pick the Page you want messages from, and you're done. From then on, every Page DM lands in your dashboard as a conversation, ready for your team to reply alongside their other channels.

### Instagram (DM)

For Instagram Direct Messages. Connect your Instagram Business account through the Meta sign-in flow — typically through the Facebook Page that's linked to your Instagram account. Once connected, your IG DMs flow into Chatwoot with the same reply, label, and assignment workflow as any other channel.

### TikTok

For TikTok Business messages. Sign in to your TikTok Business account through Chatwoot's connection flow, and customer messages on TikTok land in your Chatwoot inbox.

### WhatsApp

For two-way conversations on WhatsApp, WhatsApp Cloud API is the recommended choice for new accounts. Connect your phone number and Business Account using Meta's embedded sign-up flow inside Chatwoot.

Once connected, the message templates approved on your WhatsApp Business Account sync automatically into Chatwoot. Templates are how you start outbound conversations and re-engage customers outside the 24-hour customer-service window — WhatsApp's policy requires a pre-approved template for those messages, so they need to be created and approved on Meta's side before they're available to send from Chatwoot.

### SMS

For text-message conversations. Chatwoot supports two SMS providers:

-
Twilio — connect your Twilio phone number and the credentials Twilio gives you for messaging.

-
Bandwidth — connect your Bandwidth phone number and the credentials Bandwidth gives you.

Once set up, customer texts arrive in your dashboard as conversations and replies your team sends are delivered as SMS to the customer's phone.

### Telegram

For a Telegram bot. Create a bot in Telegram by chatting with BotFather (Telegram's official bot for creating bots), copy the bot token it gives you, and paste it into Chatwoot. Your inbox now receives every message a customer sends to your bot.

### LINE

For a LINE Official Account. Get your channel credentials from LINE Developers, paste them into Chatwoot, and customer messages on your LINE account arrive as conversations.

### API Channel

For anything that isn't one of the built-in channel types. The API channel lets you connect a custom application — for example, a niche messaging platform Chatwoot doesn't yet support natively, or an in-product chat experience inside your own software. You provide a destination URL where Chatwoot should send outbound messages, and your application is responsible for relaying them onward.

## Common inbox-level options

A few options apply across most channels and live on the Settings or Configuration tabs:

-
Auto-assignment — when on, new conversations are distributed to inbox agents. See Auto Assignment.

-
Lock to single conversation — for channels that don't have native threading (SMS, WhatsApp, Facebook, Instagram, API, LINE, TikTok, Telegram), enabling this means each contact has at most one open conversation at a time. New messages reopen the existing conversation rather than creating a new one.

-
Continuity via email — for Website inboxes, customers can reply to email transcripts and have replies land back in the same conversation.

-
Sender name — choose between Friendly (just the agent's display name) or Professional (display name + business name) on outbound messages.

-
Greeting — toggle and message; the greeting auto-sends when a new conversation begins on this inbox.

## Frequently asked questions

Can I have more than one inbox of the same type?

Yes. Multiple Website inboxes, multiple WhatsApp numbers, multiple email addresses — no limit on type.

An agent doesn't see the inbox in their queue. Why?

Inbox membership is explicit. Add them under the Collaborators tab. Adding an agent to your account doesn't automatically give them access to every inbox.

What happens if I delete an inbox?

The inbox and all its conversations are permanently removed. Export anything you need to keep first. Deletion is irreversible.

Are conversations the same contact across channels?

A single contact can have conversations on multiple channels — the contact record is account-wide. The conversation lives inside the inbox the message arrived on, but you'll see all the contact's conversations in their profile.

Which channels support outbound campaigns?

Live-chat campaigns work on Website inboxes. One-off campaigns can use SMS or WhatsApp Cloud API.

## Next steps ​

Find the detailed steps to configure each channel below.

-
Website channel

-
Facebook messenger channel

-
WhatsApp channel

-
SMS channel

-
Email channel

-
Connect a channel using API

-
Telegram channel

-
Line channel

Next: Adding teams

* Number of inboxes are subject to a fair use policy based on number of agents and subscribed plan.

Back to Setup account
