---
source_url: "https://www.chatwoot.com/hc/user-guide/articles/1679978392-how-to-use-macros"
captured_at: "2026-06-17T09:57:41.933783+00:00"
author: "Chatwoot"
contributor: "Rovi Codex"
nav_title: "How to use Macros?"
---

# How to use Macros?

Source: https://www.chatwoot.com/hc/user-guide/articles/1679978392-how-to-use-macros

How to use Macros? | User Guide | Chatwoot

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

Home 🔎 Advanced features explained How to use Macros?

# How to use Macros?

Open in
View as Markdown

Open in ChatGPT Open in Claude

Pranav

Last updated on Aug 21, 2024

A macro is a set of sequential saved actions, like labeling a conversation, sending an email transcript, sending an attachment, etc., which you can define from your dashboard.

As a support agent, you will find that you need to repeat the same set of actions often. Here is an example: Whenever you receive a demo request, you assign the Sales team, send a standard message on how to book a slot, add the Sales label, and snooze the conversation. Or, whenever you receive spam, you send the same message about how they've come to the wrong place, assign the Spam label, and close the conversation.

Doing all these actions one-by-one, and multiple times a day can be painful and time-consuming. Instead, you can run a macro.

This guide explains, with examples, how to create macros––personal or public––and how to use them.

## How to create a macro?

Step 1. Go to Settings -> Macros -> "Add a new macro".

Step 2. You'll see a macro setup screen. Here, you can create a flow of the actions that must be performed when this macro is executed. You can also name your macro for internal reference in the right sidebar.

You can start by selecting an action from the dropdown. The currently available actions are shown below.

Select an action and set it up accordingly. When done, continue adding more actions.

### An example setup of a macro

Here is an example of the sequential actions performed whenever the Paper Layer team receives a query from a customer on the free plan.

Please note that the order in which you set these actions defines the order in which they will be performed.

Step 3. Set the visibility for your macro. If you are creating it for your personal use, set "Private". If you want your team to be able to use it, set the visibility to "Public."

Step 4. Click the "Save macro" button on the bottom-right of the setup page.

Your macro is now ready to use!

## How to execute a macro?

Step 1. Locate the "Macros" section in the right sidebar of your chat window. Click the plus sign to expand it. This will show you the list of the macros created for your account – both private to you and public.

Step 2. Preview the macro if you are unsure of the actions it would perform. To preview, click the "i" icon. It would pop up a preview of the actions set in the specific macro.

Step 3. Execute the macro by clicking the play button. This would automatically perform all the actions in the defined sequence in a split second. You'll be able to see the respective success messages for different actions. Here's an example:

## How to edit or delete a macro?

To edit or delete macros, open the list of macros by visiting Settings -> Macros. Find the specific macro and use the corresponding edit or delete button, as shown in the screenshot below.

Back to Advanced features explained
