---
source_url: "https://www.chatwoot.com/hc/user-guide/articles/1777421876-business-hours-and-auto_responder"
captured_at: "2026-06-17T09:57:32.765774+00:00"
author: "Chatwoot"
contributor: "Rovi Codex"
nav_title: "Business Hours and Auto-Responder"
---

# Business Hours and Auto-Responder

Source: https://www.chatwoot.com/hc/user-guide/articles/1777421876-business-hours-and-auto_responder

Business Hours and Auto-Responder | User Guide | Chatwoot

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

Home 📚 Features explained Business Hours and Auto-Responder

# Business Hours and Auto-Responder

Open in
View as Markdown

Open in ChatGPT Open in Claude

Pranav

Last updated on Apr 29, 2026

Business Hours define when your team is available. They power three things:

-
Out-of-office message — customers who message outside working hours see a custom message instead of nothing

-
SLA timer behavior — when SLAs are configured to use business hours, the clock pauses overnight and on weekends

-
Reporting accuracy — response-time metrics can be calculated against working time instead of wall-clock time

Business Hours are set per inbox, so a US Support inbox and an EU Support inbox can have completely different schedules.

Permissions : Only administrators can configure an inbox's business hours and out-of-office message.

## Setting up business hours on an inbox

-
Go to Settings → Inboxes and open the inbox you want to configure.

-
Click the Business Hours tab.

-
Toggle Enable business availability for this inbox on.

-
Pick your timezone — all schedule times are interpreted in this timezone.

-
For each day of the week, set:

-
Start time and End time , or

-
Mark the day as closed all day , or

-
Mark the day as open all day

-
Write your out-of-office message — keep it short and useful. "Thanks for reaching out! Our team is available Monday–Friday, 9am–6pm EST. We'll get back to you first thing tomorrow." is a solid default.

-
Save.

## What customers see?

When a customer sends an incoming message to an inbox that's currently outside its business hours, Chatwoot automatically sends the configured out-of-office message back to them as an outgoing reply. So a customer messaging your WhatsApp inbox at midnight gets the out-of-office reply on WhatsApp.

A few rules govern when the auto-reply fires:

-
The out-of-office message is sent once per day per conversation — repeated messages from the same customer the same day don't generate a second auto-reply.

-
If an agent has sent a public reply in the conversation within the last 5 minutes , the auto-reply is suppressed (so a conversation that's still being actively handled at the close of business hours isn't interrupted).

The auto-reply is informational. It doesn't block the customer from sending more, and it doesn't change the conversation status. The conversation arrives normally and agents see it whenever the inbox is back in business hours.

## How business hours change SLA timers?

If you've configured an SLA with Only during business hours turned on, the timer pauses outside working hours:

-
Customer messages on Friday 6pm with an SLA of 4 hours

-
Inbox is closed from 6pm Friday to 9am Monday

-
Timer doesn't run over the weekend

-
Effective deadline: Monday 1pm (4 working hours from 9am Monday open)

If business hours are off on the SLA (or off on the inbox), the timer runs 24/7 — Friday 6pm + 4 hours = Friday 10pm.

## How business hours show up in reports?

In the Reports section, most reports have a Business hours toggle. When on: Average First Response Time, Resolution Time, etc. are calculated against working time only — overnight gaps don't count.

## Frequently asked questions

Can I have different business hours for different days?

Yes — you set start/end times per day independently. Saturday at 10am-2pm while Mon-Fri runs 9-6 is a normal config.

Can I configure business hours account-wide rather than per inbox?

Not directly. Each inbox has its own schedule. If you have many inboxes that should share the same hours, you'll need to set them on each — but that's also a feature, since teams in different timezones often staff different inboxes.

Does Chatwoot block messages outside business hours?

No. The inbox is always open to receiving. Business hours just control what we show to the customer and how the timers behave.

What if a holiday closes the office for a day?

There's no built-in holiday calendar. Temporarily change that day to closed all day and revert later.

Back to Features explained
