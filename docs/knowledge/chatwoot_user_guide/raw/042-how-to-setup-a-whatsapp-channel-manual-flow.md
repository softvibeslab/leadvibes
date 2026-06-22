---
source_url: "https://www.chatwoot.com/hc/user-guide/articles/1756799850-how-to-setup-a-whats_app-channel-manual-flow"
captured_at: "2026-06-17T09:56:50.834255+00:00"
author: "Chatwoot"
contributor: "Rovi Codex"
nav_title: "How to setup a WhatsApp channel (Manual flow)?"
---

# How to setup a WhatsApp channel (Manual flow)?

Source: https://www.chatwoot.com/hc/user-guide/articles/1756799850-how-to-setup-a-whats_app-channel-manual-flow

How to setup a WhatsApp channel (Manual flow)? | User Guide | Chatwoot

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

Home 🪵 Other channels How to setup a WhatsApp channel (Manual flow)?

# How to setup a WhatsApp channel (Manual flow)?

Open in
View as Markdown

Open in ChatGPT Open in Claude

Jithin

Last updated on Sep 15, 2025

You can manage your WhatsApp business account conversations from Chatwoot. To set it up, you have two options to choose your provider:

-
WhatsApp Cloud API

-
Twilio

We'll explain all the procedures in this guide.

### Prerequisites

-
You need a Meta Developer Account to setup WhatsApp API. If you dont have a developer account already click here to create one before proceeding

-
A valid phone number

## Using Whatsapp Cloud API

WhatsApp Cloud API is available to all businesses and individual developers. Since it's hosted on Meta's cloud infrastructure, you no longer need to use third-party providers like Twilio, Zendesk, 360Dialog, or MessageBird ( Business Solution Providers ) to host your WhatsApp Business API.

## Set up your Business Profile

Create a professional WhatsApp business profile with your company name, description, and contact information. A well-crafted profile helps customers recognise and trust your brand when they interact with you.

Log into https://business.facebook.com and click the create portfolio button in the dropdown menu under Home

Complete all required fields to set up your business portfolio.

Once you have created your business portfolio, it's time to create your Facebook app.

## Setup your Facebook App

Log into https://developers.facebook.com/ and click the Create App button.

Complete the required fields

Click "Other" from the options

Choose "Business" as your app type

Enter your contact email address and choose your business portfolio from the dropdown menu.

## Add Whatsapp to your app

After creating your app, you'll be directed to the app dashboard. From there, click "Add Product" and choose WhatsApp from the available products list.

Click the "Set up" button for WhatsApp

Note: Before proceeding, verify your business with Meta. You'll need to submit documentation for verification, which is required for full API access.

## Set Up a Permanent WhatsApp Cloud API Access Token

You'll need to create a System User and generate a permanent token to maintain secure, uninterrupted access.

Log in to your Facebook developer account, select your WhatsApp app, and navigate to the Business settings page .

Click on "System Users" and add a new system user with the role Admin

Click the "Add Assets" button, select your app name, choose the "Full Control" option, and click "Assign assets."

Return to the system users page, select your newly created system user from the list, and click the " Generate new token " button.

Select your app from the dropdown menu

Select these three permission levels for your token:

-
whatsapp_business_manage_events

-
whatsapp_business_management

-
whatsapp_business_messaging

Copy and save your token

## Set Up WhatsApp Cloud API

To create a new Meta business account, select " create a business account " from the dropdown menu. If you already have a business account, you can select it from the existing options. I'm selecting " create a business account ". Click the continue button.

Paste your permanent token here

Add your production ready phone number

Note : Meta requires a verified phone number for WhatsApp API setup. You can verify your number using an OTP (one-time password).

Once you have added and verified your phone number, the next step is configuring a webhook to receive inbound messages.

## Connecting Your Chatwoot Account

Let's connect your Chatwoot account with your WhatsApp Cloud API

Copy your WhatsApp Phone Number ID and Business Account ID from this section

Log into your Chatwoot account, go to Settings > Inbox, and select WhatsApp channel

Enter your phone number, phone number ID, and business ID from your WhatsApp API setup

Add team members to your WhatsApp inbox

Copy the webhook URL and webhook verification token provided here

## Set Up Your Webhook

We need to set up the WhatsApp webhook to receive incoming customer messages sent to your business number.

Your callback URL should be in the format of https://app.chatwoot.com/webhooks/whatsapp/{phone_number} .

Log into your Facebook developer account and navigate to WhatsApp > Configuration

Paste your Chatwoot webhook URL and verification token here, then click "Verify and Save"

Set up webhook permissions by subscribing to messages

That's it—you're all done! You can now start sending WhatsApp messages through Chatwoot.

### FAQ’s

How to configure multiple numbers under a single Facebook app?

Facebook App allows configuring only a single Webhook endpoint. So create Inboxes in Chatwoot for all the numbers as required. You will need to configure the Webhook URL provided for only one of these inboxes in the Facebook app for all the other inboxes to work.

What type of Whatsapp templates are supported by Chatwoot ?

Please check the doc for more details about templates.

What are the supported media types?

Back to Other channels
