---
source_url: "https://www.chatwoot.com/hc/user-guide/articles/1696162432-how-to-migrate-from-zendesk-to-chatwoot"
captured_at: "2026-06-17T09:59:47.026551+00:00"
author: "Chatwoot"
contributor: "Rovi Codex"
nav_title: "How to migrate from Zendesk to Chatwoot?"
---

# How to migrate from Zendesk to Chatwoot?

Source: https://www.chatwoot.com/hc/user-guide/articles/1696162432-how-to-migrate-from-zendesk-to-chatwoot

How to migrate from Zendesk to Chatwoot? | User Guide | Chatwoot

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

Home 🛳️ Migrations How to migrate from Zendesk to Chatwoot?

# How to migrate from Zendesk to Chatwoot?

Open in
View as Markdown

Open in ChatGPT Open in Claude

Pranav

Last updated on Apr 16, 2024

If you're currently using Zendesk and want to switch to Chatwoot, this guide will walk you through the step-by-step process of migrating your conversations, contacts, live chat widget, and setting up Chatwoot. This is a very quick process; let’s dive in.

## Before you begin

Before setting up Chatwoot, there are two essential preliminary tasks to complete in order to smoothly remove Zendesk from your ecosystem.

### Step 1. Remove the Zendesk chat widget

To start, please make sure to uninstall the existing live chat code that you would have previously integrated for enabling the Zendesk live chat widget on your website.

### Step 2. Export contacts

Next, export all of your contacts from Zendesk, with the help of this guide .

## Migrating to Chatwoot

### Step 3. Sign up

Create an account in Chatwoot, using this guide .

### Step 4. Migrate the live chat widget

Create a live chat inbox in Chatwoot, using this guide . At the end of the setup, you will find the live chat code snippet to be pasted into your website’s codebase. Complete this step, ensuring that you have already removed the live chat code snippet for Zendesk’s live chat widget, as mentioned in Step 1.

### Step 5. Migrate contacts

Open the ‘Contacts’ tab in Chatwoot, press the Import button.

Next, follow the on-screen instructions to upload the Contacts file exported from Zendesk, in a csv format. Once your upload is completed, all of your contacts will be successfully synced in Chatwoot.

### Step 6. Migrate conversations

For importing your existing conversations from Zendesk to Chatwoot, use this API .

### Step 7. Make Chatwoot your own

You are all set to use Chatwoot, congratulations! We recommend the following steps to begin making the best of Chatwoot:

Chatwoot 101 tutorials : A comprehensive guide to learn the basics of Chatwoot within minutes.

Omnichannel inbox : A helping hand to setting up your omnichannel customer service on Chatwoot.

A few best practices to make your workflow smooth as butter on Chatwoot.

For everything else, hit us up on [email protected] , and don't forget to share your feedback with us. Happy chatting!

Back to Migrations
