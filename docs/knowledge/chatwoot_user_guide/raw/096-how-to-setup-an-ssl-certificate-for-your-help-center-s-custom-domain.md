---
source_url: "https://www.chatwoot.com/hc/user-guide/articles/1677855950-generate-ssl-certificate"
captured_at: "2026-06-17T09:58:52.030557+00:00"
author: "Chatwoot"
contributor: "Rovi Codex"
nav_title: "How to setup an SSL certificate for your Help Center's custom domain?"
---

# How to setup an SSL certificate for your Help Center's custom domain?

Source: https://www.chatwoot.com/hc/user-guide/articles/1677855950-generate-ssl-certificate

How to setup an SSL certificate for your Help Center's custom domain? | User Guide | Chatwoot

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

Home ❓ Help Center How to setup an SSL certificate for your Help Center's custom domain?

# How to setup an SSL certificate for your Help Center's custom domain?

Open in
View as Markdown

Open in ChatGPT Open in Claude

Pranav

Last updated on Aug 7, 2025

Using your own domain, like docs.your-company.com, makes your help center feel more trustworthy and on-brand. Chatwoot allows you to use your own custom domain and would help you to secure your site with SSL certificates so that it's safe for your visitors.

This guide walks you through setting up a custom domain for your Help Center portal in Chatwoot.

Note : This guide is for Chatwoot Cloud users. If you're using the self-hosted version, you'll need to set up and manage the SSL certificate on your own.

TLDR: Add your custom domain in Chatwoot portal settings, update your DNS with the CNAME Chatwoot provides, and we will issue the SSL certificate. Once it's ready, your Help Center will be live and accessible to your customers.

### Step 1: Set up your custom domain in portal settings

Log in to your Chatwoot dashboard and go to the Help Center you want to connect with your custom domain. Click on Settings , then scroll to the Custom Domain section. Click the Add custom domain button to begin the setup.

You'll now see a prompt asking for your custom domain. Enter the domain where you want your Help Center to be available (e.g., docs.yourdomain.com ). This is the website address your customers will visit to access your documentation.

Next, you'll be shown the DNS settings you need to add so we can confirm that the domain is yours and connect it to your Help Center. You’ll need to copy this information and update your DNS provider accordingly.

If you’re not sure how to do it, you can use the option on the screen to email these details to your developer.

### Step 2: Update your DNS with the CNAME record

You must point your custom domain to Chatwoot by creating a CNAME record.

Host: docs
Type: CNAME
Value: chatwoot.help

Instructions vary by DNS provider:

#### Using Cloudflare:

You can find the setting under the "DNS" tab.

Note: Make sure that the SSL encryption mode is set to Full in Cloudflare (You can view this under SSL/TLS -> Overview).

#### Using AWS Route 53:

You can find the setting under the "Route53" service.

If you're using a different DNS provider, the steps are generally the same. Look for the DNS settings section and add a CNAME record as described. If you’re unsure how to do this, just search for instructions specific to your provider using a phrase like How to add a CNAME record on [Your DNS Provider] .

This step links your domain to Chatwoot’s servers. Once it’s done, we’ll have everything we need, your portal details and the domain configuration to issue the SSL certificate and make your Help Center live.

### Step 3: Getting an SSL certificate ​

Chatwoot provides SSL certificates for all cloud customers on paid plans who set up a custom domain for their Help Center portal.

This step happens automatically. Once you add the CNAME record to your DNS, our server will verify the domain and begin issuing the SSL certificate. This usually takes just a few minutes, but in some cases, depending on your DNS provider and how long they take to update records, it may take up to 24–48 hours.

You can track the status of your SSL certificate right from the Chatwoot dashboard. Initially, you’ll see the status as Awaiting Verification . This means we’re still confirming your domain setup before the certificate is issued.

If there are any issues during the SSL verification process like an incorrect CNAME record or DNS propagation delays, you’ll see an error message next to the status on your dashboard. Hover over the status indicator to view more details about what went wrong and what you need to fix. This helps you quickly identify and resolve any problems in the setup process.

Once the verification is successful and the SSL certificate is issued, the status will change to 'Live' on your dashboard. This means your Help Center is now securely available at your custom domain. Your customers can visit the URL and browse the content.

Back to Help Center
