---
source_url: "https://www.chatwoot.com/hc/user-guide/articles/1677743452-how-to-integrate-your-dialogflow-chatbot-with-chatwoot"
captured_at: "2026-06-17T09:58:11.640767+00:00"
author: "Chatwoot"
contributor: "Rovi Codex"
nav_title: "How to bring your Dialogflow chatbot to Chatwoot?"
---

# How to bring your Dialogflow chatbot to Chatwoot?

Source: https://www.chatwoot.com/hc/user-guide/articles/1677743452-how-to-integrate-your-dialogflow-chatbot-with-chatwoot

How to bring your Dialogflow chatbot to Chatwoot? | User Guide | Chatwoot

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

Home ⚡ Apps and Integrations How to bring your Dialogflow chatbot to Chatwoot?

# How to bring your Dialogflow chatbot to Chatwoot?

Open in
View as Markdown

Open in ChatGPT Open in Claude

Sojan

Last updated on May 15, 2023

Chatbots are valuable for many customer engagement teams. They efficiently handle trivial questions and free human agents to focus on more pressing issues.

Dialogflow and Rasa.ai are leading NLP (Natural Language Processing) platforms for building customized chatbots. In this guide, we explain how you can create a bot in Dialogflow and easily integrate it with Chatwoot in seconds.

## How to create a Dialogflow bot?

Step 1. Go to your Dialogflow Console . We will be using Dialogflow Essentials for this article. Click on "Create Agent". You will see options like these:

Step 2. You will need to create intents based on how you want your bot to respond. There will be 2 default intents in the project called "Default Fallback Intent" and "Default Welcome Intent", as shown below.

This completes the basic bot configuration. Let us create a service account and connect it with Chatwoot.

You can also create additional intents for your specific use cases.
Chatwoot also supports advanced intents that enables agent handoff , interactive messages , etc.
refer: Scroll down to "Advanced Intents".

Step 3. Create a service account ​ . To connect this bot with Chatwoot, you need to create a service account on your Google Cloud console. Navigate to the project console in Google cloud by clicking on the Project ID in the project settings.

Navigate to IAM & Admin -> Service Accounts . You will see a view like the one shown below. Click on "Create Service Account".

Provide a Service Account name and description as shown below.

To provide access, select Dialogflow API Client from the dropdown.

Continue and click on "Done". Now, you would be able to see the service listed in the dashboard. The next step is to create a key so that it can be shared with Chatwoot. Click on the service account and click on the "Keys" tab. Then, click on "Add Key". You will be able to see a screen like the one below.

Click on "JSON" and click on "Create". It will generate a key for your service account. Download the key and save it for use later.

## Setting up Dialogflow Integration in Chatwoot ​

Chatwoot has a native Dialogflow integration. You can connect your bot with Chatwoot in two quick steps.

Step 1. Go to "Settings -> Applications -> Dialogflow". Click on "Configure".

Step 2. Click the "Add a new hook" button. it will open up a setup modal. You need to add "Project ID," "Project Key file," and an inbox to create a hook. Copy the contents of the key file downloaded earlier and paste it into the text area.

That's it! The integration is complete. Test out the website inbox to see if the bot handles the initial query.

## Advanced Intents ​

### Creating a handoff intent ​

Once the user requests to talk to the agent, Dialogflow must inform Chatwoot that an agent can take over the conversation.

Create an intent named "Handoff Intent" with training phrases like "Talk to an agent" or "Speak with an agent," etc. To handle the handoff intent, we will create a "Custom Payload" response, as shown below.

{ "action": "handoff" }

Upon triggering an intent with the above payload, Chatwoot will toggle the status of the conversation to open and hand it off to an agent.

### Interactive Messages ​

Note : Interactive messages are supported only in the website inbox currently.

Chatwoot-Dialogflow integration also supports interactive messages . The following types of interactive messages are supported.

-
Options (follow-up supported)

-
Cards

-
Articles

#### Creating an interactive message Intent ​

You can create other interactive messages by changing the payload as mentioned in the interactive messages guide .

Create an intent with required training phrases and a "Custom Payload" response, as shown below for an options message.

## example for an options interactive message { "content_type": "input_select", "content": "Select your favorite food from below", "content_attributes": { "items": [ { "value": "I like sushi", "title": "Sushi" }, { "title": "Biryani", "value": "I like biryani" }, { "title": "Pizza", "value": "I like pizza" } ] }, "private": false }

When a user interacts with input messages and selects a value, it returns to Dialogflow. This allows for configuring follow-up intents, such as creating an intent with the training phrase "I like biryani" for cases where the contact selects the "biryani" option.

## How can an agent transfer the conversation back to Dialogflow bot? ​

When the Dialogflow bot is connected to an inbox, conversations are created with pending status instead of open . This lets the initial triaging happen via the bot before the conversation is passed on to an agent. When handoff happens, the conversation status is changed to open and the bot stops responding to it.

Sometimes the agents would want to push back a conversation that was handed off, back again into the bot queue. They can do this by changing the conversation status back to pending . This will make the bot start responding to that conversation again.

Back to Apps and Integrations
