---
source_url: "https://www.chatwoot.com/hc/user-guide/articles/1765223602-how-ai-credits-work-in-captain"
captured_at: "2026-06-17T09:59:42.897498+00:00"
author: "Chatwoot"
contributor: "Rovi Codex"
nav_title: "How AI Credits work in Captain?"
---

# How AI Credits work in Captain?

Source: https://www.chatwoot.com/hc/user-guide/articles/1765223602-how-ai-credits-work-in-captain

How AI Credits work in Captain? | User Guide | Chatwoot

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

Home 🔥 Captain How AI Credits work in Captain?

# How AI Credits work in Captain?

Open in
View as Markdown

Open in ChatGPT Open in Claude

Pranav

Last updated on Dec 10, 2025

This guide explains how AI credits are consumed, how your credits are updated when you top up, when your monthly renewal happens, what happens when you change plans, and how notifications work if your credits run out.

## How are AI credits consumed?

AI credits are deducted whenever an AI action is performed. Examples include:

-
Captain assistant responses

-
Copilot lookups

-
Editor actions (rephrase, summarise, suggest a reply)

-
Label Suggestions

-
Any workflow or automation that triggers a model call

-
Audio transcription

Different models consume credits at different rates. At the moment, all actions consume 1 credit per message , since a fixed model configuration only is supported.

This will change in the future as more model options are supported, at which point different models may consume different credit amounts per action.

If an action cannot be completed due to insufficient credits, a credit failure occurs (explained later).

## When does usage reset?

Usage resets to 0 only during monthly renewal.

Usage does NOT reset when:

-
Topping up credits

-
Changing your plan

-
Changing seat count

This means you can top up credits at any time without losing track of your current usage cycle.

## How are AI credits updated?

### 1. Topping Up Credits

When you buy additional credits, they are simply added to your existing balance.

Example

-
Previous credits: 1500

-
Top-up: 1000

-
New total credits: 2500

No other values change.

### 2. Monthly Renewal

Every plan includes a monthly free credit allowance. At renewal, we adjust usage and credits based on how much you consumed in the previous month.

Case A: No usage

Usage: 0 → Your total credits do not change.

Case B: Usage is less than your monthly free credits

-
Previous credits: 1500

-
Usage: 200

-
Monthly free credits: 300

→ No deduction is applied.
→ Total credits stay 1500 .
→ Usage resets to 0 .

Case C: Usage exceeds your monthly free credits

-
Previous credits: 1500

-
Usage: 600

-
Monthly free credits: 500

Overage = 600 − 500 = 100

→ Deduct overage from total credits.
→ New total credits: 1400
→ Usage resets to 0 .

### 3. Changing Your Plan

When you switch plans, your monthly free credits may increase or decrease.

Example

-
Startup plan: 300 free credits

-
Business plan: 500 free credits

-
Enterprise plan: 800 free credits

If you switch from Startups to Business, your total credits would increase by 200. Similarly, if you downgrade from Business to Startups, your total credits would decrease by 200.

Your usage remains unchanged.

## Credit Failure (Insufficient Credit Handling)

A credit failure occurs when an AI action is triggered but there are not enough credits to perform it.

What Happens During Credit Failure

-
The action is not executed. Any available fallbacks are executed — for example, if the assistant cannot respond, the conversation is transferred directly to an agent.

-
We log the failed action internally for audit

Back to Captain
