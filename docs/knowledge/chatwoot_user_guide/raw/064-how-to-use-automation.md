---
source_url: "https://www.chatwoot.com/hc/user-guide/articles/1677689800-how-to-use-automation"
captured_at: "2026-06-17T09:57:37.273883+00:00"
author: "Chatwoot"
contributor: "Rovi Codex"
nav_title: "How to use Automation?"
---

# How to use Automation?

Source: https://www.chatwoot.com/hc/user-guide/articles/1677689800-how-to-use-automation

How to use Automation? | User Guide | Chatwoot

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

Home 🔎 Advanced features explained How to use Automation?

# How to use Automation?

Open in
View as Markdown

Open in ChatGPT Open in Claude

Pranav

Last updated on Apr 10, 2024

Chatwoot's automation feature streamlines team workflow by automating repetitive tasks and saving time. It allows for various actions such as assigning labels, and teams and routing conversations to the most suitable agent, enabling the team to focus on their core responsibilities and spend less time on manual tasks.

## How does Automation work?

An automation rule is made up of three things––An Event , Conditions , and Actions . The Event is the trigger for automation to perform itself. The conditions are criteria that must be met before the actions are executed. The Actions are tasks that will be executed when the conditions are met.

### Automation Events

Automation Events are triggers that initiate the execution of automation. Chatwoot currently offers three types of events.

-
Conversation created: A trigger/event initiated when a new conversation is created. This includes conversations created in all channels.

-
Conversation updated: A trigger/event initiated when a conversation is updated.

-
Message created: A trigger/event initiated when a new message in a conversation is created.

-
Conversation opened: A trigger/event initiated when a previously snoozed, resolved, or pending conversation is opened again.

### Automation Conditions

Conditions are the criteria that must be met before the actions are performed. They are evaluated in the order they are defined.

Conditions depend on the type of event you select. Here is a comprehensive list:

### Automation Actions

Actions are tasks/processes that are executed whenever respective conditions are met. Chatwoot currently supports the following actions:

-
Assign to agent

-
Assign a team

-
Add a label

-
Send an email to team

-
Send an email transcript

-
Mute conversation

-
Snooze conversation

-
Resolve conversation

-
Send Webhook Event

-
Cancel

-
Send Attachment

-
Send a message

These actions are available irrespective of the Events or Conditions you choose.

## How to create an Automation rule?

Step 1. Go to Settings → Automation. Click on the “Add Automation Rule” button.

Step 2. An automation rule creation modal will open up. Start filling the fields as listed below.

-
Give your automation a name to easily refer to it later.

-
Add a description (optional).

-
Select an event from the dropdown menu.

-
Add conditions. Use equal to or not equal to operators to define the conditions.

-
Add actions.

You can add multiple conditions and actions as well. Use AND , OR operators to do this.

Example

You want to assign all new conversations to the France sales team whenever the Browser language is French. Here’s how you can create an automation rule for this –

-
Add a name and a description.

-
Select event as Conversation Created .

-
Add two conditions and join them with the AND operator. Condition 1: Conversation Status is Open , and Condition 2: Browser Language is Francais (fr) from the dropdown.

-
Add an action - Assign a team and select the team France sales from the dropdown. (You need to create your team first).

## How to pause, edit, clone, and delete automation rules?

Your list of Automation rules appears under “Automations”. You can view this page by going to Settings → Automation. You will find a set of quick actions here:

To pause an automation rule:

Toggle the switch off under the “Active” column.

To edit a rule:

Click on the pencil icon.

To clone a rule:

Click on the copy icon.

To delete a rule:

Click on the red cross icon.

Back to Advanced features explained
