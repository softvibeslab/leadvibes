---
source_url: "https://www.chatwoot.com/hc/user-guide/articles/1738101547-creating-an-assistant-with-captain"
captured_at: "2026-06-17T09:59:30.249884+00:00"
author: "Chatwoot"
contributor: "Rovi Codex"
nav_title: "Creating an assistant with Captain"
---

# Creating an assistant with Captain

Source: https://www.chatwoot.com/hc/user-guide/articles/1738101547-creating-an-assistant-with-captain

Creating an assistant with Captain | User Guide | Chatwoot

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

Home 🔥 Captain Creating an assistant with Captain

# Creating an assistant with Captain

Open in
View as Markdown

Open in ChatGPT Open in Claude

Pranav

Last updated on Jan 29, 2025

The Assistant in Captain is built to help answer customer questions, provide solutions, and assist with product-related issues. It learns from your help center articles and past conversations to give accurate responses. When linked to an inbox, it can handle conversations directly with your customers.

## How to create an assistant in Captain?

If you’re using a paid plan on Chatwoot Cloud, you’ll find the Captain menu on the left-hand sidebar. Under this menu, you’ll see options for Assistants, Documents, and FAQs.

Click on Assistants. You will see a page like the one give below.

Click on Create a new Assistant button.

Here are the fields currently available in the form to create an assistant:

Field Name Description Default Required

Assistant Name This is the internal name of the assistant -- Yes

Description Provide a description of the assistant on what it does. Note: This is not an instruction to the assistant -- Yes

Product Name This is important. The assistant is built around the product, having the product name would help it to identify the content gaps and the questiosn from the user -- Yes

Features: Enable FAQs from resolved conversations If you enable this option, the Captain Assistant would try to identify the gaps in your help center article and would suggest with new FAQs, refer to FAQ document for more false No

Features: Capture key details as memories from customer interactions If enabled, this would try to identify key details from conversations and would save it in the notes false No

Once you’ve entered the details, click Create , and your assistant will be added to your account! You can create multiple assistants to handle different use cases if needed.

## How do you connect an assistant to inboxes?

Adding an assistant to your account doesn’t automatically connect it to all the inboxes. You’ll need to manually link each assistant to the relevant inboxes where it’s required. This gives you the flexibility to assign assistants based on specific products, or customer segments.

To connect an assistant, click on the three-dot menu next to the assistant details. From the dropdown, select View Connected Inboxes .

This will take you to a page displaying all the inboxes linked to the assistant. From there, you can manage the connections. Note: Each inbox can only be connected to one assistant at a time.

Click on Connect a New Inbox to see a list of available inboxes. Select an inbox from the list and connect it.

That’s it! The assistant is now live on the inbox. Give it a try—send a message in your chat and see if it responds with the initial greeting. You can deploy the assistant on any available inbox, whether it’s live chat, WhatsApp, Instagram, email, or more.

Great! The assistant has been set up successfully. However, at this stage, it doesn’t have any knowledge about your business and the product. After the initial greeting, the assistant will attempt to transfer the conversation to an agent. To give the assistant context about your product, you can add documents. Learn more about documents in this article .

Back to Captain
