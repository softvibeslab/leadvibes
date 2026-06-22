---
source_url: "https://www.chatwoot.com/hc/user-guide/articles/1738104411-creating-a-document-in-captain"
captured_at: "2026-06-17T09:59:16.840137+00:00"
author: "Chatwoot"
contributor: "Rovi Codex"
nav_title: "Creating a document in Captain"
---

# Creating a document in Captain

Source: https://www.chatwoot.com/hc/user-guide/articles/1738104411-creating-a-document-in-captain

Creating a document in Captain | User Guide | Chatwoot

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

Home 🔥 Captain Creating a document in Captain

# Creating a document in Captain

Open in
View as Markdown

Open in ChatGPT Open in Claude

Pranav

Last updated on Nov 4, 2025

A document in Captain acts as a knowledge resource for the assistant. By linking your help center or guides, Captain can analyze the content and effectively assist with customer inquiries.

Currently, we support website URLs and PDF files as sources , but we’re planning to expand this to include Notion documents in the future.

## How to create a document?

On the sidebar menu, click on the Documents option under Captain. You will see a page like the one below.

By clicking on Create a New Document , you will be presented with a form where you can either enter the URL of your knowledge base or upload a PDF file. Note that we only support public URLs at the moment.

Once you’ve entered the URL of your knowledge base or help center or uploaded a document, click on Create to start the process. Captain will begin analyzing the content from the provided URL or document, using it as a starting point to gather information that can help answer customer questions effectively.

Captain will systematically crawl all pages linked under the provided URL path, scanning for articles, guides, and other resources associated with the main URL. For instance, if you provide a URL like https://chatwoot.help/user-guide , Captain will analyze all URLs that start with this path. As it crawls the content, it organizes and indexes the information, making it easily accessible for answering customer inquiries. This structured crawling process guarantees that all relevant knowledge from your specified source is captured and available for reference.

For PDF uploads, Captain will extract and analyze the text content from the file. This is useful for adding product manuals, guides, or any other documentation stored as PDFs to your knowledge base.

The document will be generated, and any newly identified documents during the crawling will also be added individually as separate documents.

If you wish to remove a specific document that is not relevant, you can delete it. This will also erase all the associated information Captain has collected from that document, and ensures it is no longer referenced in any conversations.

## How can I verify that the content is properly parsed?

To ensure that the content is properly parsed, Captain analyzes the provided documents to identify potential questions. It then generates a list of FAQs related to the document. By reviewing these FAQs, you can verify that the content has been accurately processed and correctly interpreted.

You can view the FAQs generated for each document. Simply click on the three-dot menu in the document and choose View Related Responses to access them.

This will display the related FAQs, as shown below.

## Usage limit

If you haven’t subscribed to a paid add-on for Captain, the number of documents you can add will be limited. With the Startups plan, you can add up to 100 documents for free. For higher plans, the limit increases to 200 free documents with the Business plan and 300 free documents with the Enterprise plan.

Back to Captain
