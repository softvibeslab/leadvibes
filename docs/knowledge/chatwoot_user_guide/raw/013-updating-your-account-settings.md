---
source_url: "https://www.chatwoot.com/hc/user-guide/articles/1677480617-customizing-your-general-settings"
captured_at: "2026-06-17T09:54:55.465439+00:00"
author: "Chatwoot"
contributor: "Rovi Codex"
nav_title: "Updating your Account settings"
---

# Updating your Account settings

Source: https://www.chatwoot.com/hc/user-guide/articles/1677480617-customizing-your-general-settings

Updating your Account settings | User Guide | Chatwoot

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

Home 👝 Setup account Updating your Account settings

# Updating your Account settings

Open in
View as Markdown

Open in ChatGPT Open in Claude

Pranav

Last updated on Apr 28, 2026

The Account Settings page is where an administrator sets top-level details about the Chatwoot account itself — its name, default language etc.

Where to find it: Settings → Account Settings . The page header reads "Account settings" .

Who can access it: administrators only. Regular agents and custom roles cannot view or edit this page.

## General settings

All fields are saved together using the Update settings button at the bottom.

Field Required Description

Account name Yes Display name for the account, shown in account switchers and on email transcripts.

Site language Yes Default UI language for the dashboard. Individual users can override this in Profile Settings.

## Transcribe Audio Messages

When enabled, Chatwoot automatically generates a text transcript whenever an audio message is sent or received in a conversation, and shows it inline alongside the audio.

This section only appears when Captain is enabled on your account. Saving is automatic on toggle.

## Account ID

A read-only display of your account's unique numeric ID, shown in a copyable code block. You'll need it whenever you build an integration against the Chatwoot Application API. Click the code to copy.

## Delete your Account

Only displayed on Chatwoot Cloud installations.

Clicking Delete Your Account opens a confirmation modal. To confirm, type the account's exact name into the field and click Delete . The account is then marked for deletion at a future scheduled date — not removed immediately.

If the account is already marked for deletion, this section instead shows a red banner with the deletion date and a Cancel Scheduled Deletion button. Two banner variants exist:

-
"This account is scheduled for deletion on {date}. This was requested by an administrator." — manual deletion

-
"This account is scheduled for deletion on {date} due to account inactivity." — inactivity-based deletion

Cancelling reverts the deletion as long as the scheduled date hasn't passed.

## Build info

A small footer at the bottom of the page showing:

-
The current Chatwoot version (e.g. v3.16.0 )

-
The Git build identifier, clickable to copy the full value

If a newer version is available, an additional line appears above on self-hosted installations: "An update {version} for Chatwoot is available. Please update your instance."

Useful for support tickets — paste the version and build identifier when reporting an issue.

Back to Setup account
