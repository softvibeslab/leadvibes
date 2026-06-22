---
source_url: "https://www.chatwoot.com/hc/user-guide/articles/1677497472-how-to-use-agent-bots"
captured_at: "2026-06-17T09:57:16.030702+00:00"
author: "Chatwoot"
contributor: "Rovi Codex"
nav_title: "How to use Agent bots?"
---

# How to use Agent bots?

Source: https://www.chatwoot.com/hc/user-guide/articles/1677497472-how-to-use-agent-bots

How to use Agent bots? | User Guide | Chatwoot

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

Home 📚 Features explained How to use Agent bots?

# How to use Agent bots?

Open in
View as Markdown

Open in ChatGPT Open in Claude

Sojan

Last updated on May 19, 2026

AgentBot lets you connect external AI agents and custom bot logic directly to your Chatwoot inbox. It allows your bot to listen to customer conversations, process incoming queries, and respond through Chatwoot in real time.

Once an AgentBot is connected to an inbox, new conversations are automatically assigned a pending status. Chatwoot then sends conversation events to your configured bot URL as webhook events. Your AgentBot can process these events, generate the right response using your own logic or AI systems, and send messages back to the conversation using Chatwoot APIs.

This makes it easy to bring your own AI agent, automation workflow, or external customer support bot into Chatwoot while still keeping human handoff available when needed.

## How does the AgentBot work?

Explained below in a typical workflow of an AgentBot.

-
The AgentBot receives events such as widget_triggered , message_created , and message_updated based on customer interactions.

-
The AgentBot processes the received information to generate an appropriate response.

-
The AgentBot can also utilize external system APIs to gather additional customer information, such as order status or booking triggers.

-
The AgentBot can integrate AI models like OpenAI, Claude, Gemini or tools like Amazon Lex to understand what the customer wants.

-
The AgentBot can post the generated response back into the widget by utilizing Chatwoot APIs such as Create New Message .

-
The AgentBot can toggle a conversation status to open to hand off the conversation to a human agent.

-
It continues to monitor open conversations to provide contextual information to the support agent.

## How does the Human-Agent handoff work?

When an agent bot is connected to an inbox, conversations are created with a "pending" status, allowing it to triage the conversation before passing it on to a human agent.

If the bot determines that a human agent's assistance is needed or if the customer explicitly asked for human help, it can use the conversation update API to change the status to "open" which would make the conversation available to a human.

Sometimes the agents would want to push back a conversation which was handed off, back again into the bot queue. Agents can return a handed-off conversation to the bot queue by changing the status back to "pending”.

## How can I use the AgentBot?

Listed below are a few examples.

-
Businesses with high volume customer support queries can utilize an AgentBot to authenticate and filter queries, reducing the workload on human agents and improving the efficiency of customer support.

-
E-commerce websites can integrate the AgentBot with their existing databases, providing customers with real-time updates on order and shipping status, as well as answering other related queries.

-
News and content websites can use the AgentBot to send recommendations to users via card messages.

-
Hotel and movie booking websites can use the AgentBot to handle bookings, reservations and answering related queries, providing customers with a seamless and convenient booking experience.

### Examples

-
Hotel booking implementation using Dialogflow .

-
Example implementation using Rasa .

Also, look into interesting ways to leverage bot-message types on Chatwoot .

## Creating agent bots

### How to create agent bots in your Chatwoot account?

You can create agent bots from the account settings. Go to Settings -> Bots. You will see an option like the one below.

Click on "Add Bot" to create a new bot. You will see an option to provide a name, avatar and a webhook URL.

### How to connect an inbox to a bot?

Open the inbox where you want to link the bot. In Bot Configuration , pick the bot that should manage the conversations. After you click Save , you’ll start getting webhook events each time a new conversation or message is created.

For more details about the events that are supported in the webhooks, please visit the Webhook documentation here .

### Webhook Verification

Once you create an agent bot, we automatically generate a secret that you can use to verify the payload your application receives. You can read more about webhook verification here .

Back to Features explained
