---
source_url: "https://www.chatwoot.com/hc/user-guide/articles/1677502327-how-to-create-and-use-custom-attributes"
captured_at: "2026-06-17T09:57:27.579421+00:00"
author: "Chatwoot"
contributor: "Rovi Codex"
nav_title: "How to create and use custom attributes?"
---

# How to create and use custom attributes?

Source: https://www.chatwoot.com/hc/user-guide/articles/1677502327-how-to-create-and-use-custom-attributes

How to create and use custom attributes? | User Guide | Chatwoot

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

Home 📚 Features explained How to create and use custom attributes?

# How to create and use custom attributes?

Open in
View as Markdown

Open in ChatGPT Open in Claude

Pranav

Last updated on Apr 10, 2024

Chatwoot allows you to track additional information about your conversations and contacts beyond the standard data attributes like name, email, and location. These additional pieces of information are called custom attributes and can be anything you want to track. Listed below are a few examples of custom attributes.

-
Subscription plan

-
Subscribed date

-
Signup date

-
Most ordered item

-
Ordered product link

-
Last transaction date

Custom data attributes allow you to attach additional information to a conversation or customer, such as purchase history or account status. This information can be used to better understand and segment your customer base.

The only difference between custom and standard attributes is standard data attributes automatically get updated.

## How to create a custom attribute?

Step 1. Go to Settings → Custom Attributes. Click on the “Add Custom Attribute” button.

Step 2. A modal will open up, asking details about the new custom attribute. Fill these details in. Here is an example:

These are the inputs required to create the custom attribute:

-
Applies to

Attribute type (Conversation/Contact).

-
Display name

Act as a label while rendering custom attribute.

-
Key

Unique identifier attached to the custom attribute.

-
Description

Description of the custom attribute.

-
Type

Text, Number, Link, Date, List, and Checkbox.

Note : You cannot create a custom attribute with the same key twice in the account.

Step 3. Once you enter the details, click the ” Create” button. If the request is successful, a message "Custom attribute added successfully" will be displayed.

## How to use a conversation custom attribute?

You can add conversation custom attributes to a conversation from the conversation sidebar. Follow the steps described below.

Step 1. On your dashboard, when you open a particular conversation, you’ll find a section that reads “Conversation Information”. Click on the + sign to expand it.

Step 2. You’ll see an option that reads “Add Attributes” followed by a dropdown of all the Custom Attributes on your account. Use the search bar to narrow down on the name of the attribute you’re looking for. Or click on one to select it. If you need to create a new one instead, use the “Create new attribute” button from the same dropdown.

Step 3. Based on the type of attribute you added (list, checkbox, text, etc.), populate it at your will. Here are a couple of examples:

To edit/delete/copy an attribute, hover on it to see the options.

## How to use a contact custom attribute?

There two ways to set custom attributes for contacts.

### Set attributes via SDK method

To set a contact custom attribute, call setCustomAttributes method as follows.

window.$chatwoot.setCustomAttributes({ key: value, // Key is a unique identifier which is already defined while creating a custom attribute // Value should be based on type (Currently support Number, Date, String and Number) // Double-check that your keys always have a JSON-valid value // You need to flatten nested JSON structure while using this function });

Example :

window.$chatwoot.setCustomAttributes({ key: value, // Key is a unique identifier which is already defined while creating a custom attribute // Value should be based on type (Currently support Number, Date, String and Number) // Double-check that your keys always have a JSON-valid value // You need to flatten nested JSON structure while using this function });

You can view these attributes in the contact/conversation sidepanel.

To delete a custom attribute, use deleteCustomAttribute as follows.

window.$chatwoot.deleteCustomAttribute("attribute-key");

Example :

window.$chatwoot.deleteCustomAttribute("signUpDate");

Note : Prior to version v1.22, all the attributes rendered as text. Please create new definition to display the value properly.

### Set attributes via contact side panel

For adding Contact Attributes, follow the same procedure as described above for conversation custom attributes, but use the Contact Attributes section of your chat sidebar instead. This is what it would look like:

Based on the type of attribute you added (list, checkbox, text, etc.), populate it at your will. Here is an example:

Back to Features explained
