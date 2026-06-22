---
source_url: "https://www.chatwoot.com/hc/user-guide/articles/1741998212-agent-capacity"
captured_at: "2026-06-17T09:57:53.559995+00:00"
author: "Chatwoot"
contributor: "Rovi Codex"
nav_title: "Setting per-agent conversation caps with Agent Capacity Policies"
---

# Setting per-agent conversation caps with Agent Capacity Policies

Source: https://www.chatwoot.com/hc/user-guide/articles/1741998212-agent-capacity

Setting per-agent conversation caps with Agent Capacity Policies | User Guide | Chatwoot

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

Home 🔎 Advanced features explained Setting per-agent conversation caps with Agent Capacity Policies

# Setting per-agent conversation caps with Agent Capacity Policies

Open in
View as Markdown

Open in ChatGPT Open in Claude

Pranav

Last updated on Apr 29, 2026

An Agent Capacity Policy is a bundle of rules that caps how many open conversations a single agent can hold at a time. It's how you stop one agent from drowning while another sits idle, and how you keep auto-assignment fair when conversation volumes spike.

When auto-assignment looks for an eligible agent, it checks each candidate's capacity policy (if they have one) before assigning. Agents at or over their cap are skipped; the next eligible agent under cap is assigned instead.

A policy has:

-
A name (required)

-
An optional description

-
A set of per-inbox capacity limits — different caps per inbox if you want

-
Optional exclusion rules — labels and conversation age that should be ignored when counting open conversations

Permissions: only administrators can create, edit, or delete capacity policies, and only admins can attach them to agents.

## Managing capacity policies

### How to create a capacity policy?

-
Go to Settings → Agent Capacity and click Create agent capacity policy .

-
Fill in:

-
Policy name — required, max 255 characters.

-
Description — optional.

-
Inbox capacity limits — for each inbox you want to cap, set a maximum number of open conversations an agent under this policy can hold on that inbox.

-
Exclusion rules (optional):

-
Excluded labels — conversations with these labels don't count toward the cap.

-
Exclude older than — conversations older than N hours don't count toward the cap.

-
Add the agents who should be governed by this policy under Assigned agents .

-
Save.

### How to edit a capacity policy?

-
Go to Settings → Agent Capacity and open the policy.

-
Change the limits, exclusions, or assigned agents.

-
Save.

### Delete a capacity policy

Deleting a policy unassigns it from every agent. The agents revert to having no cap and become eligible for unrestricted auto-assignment.

## How exclusion rules work

The point of exclusions is to make caps measure real, active workload — not just any open conversation that happens to still exist.

### Excluded labels

Add labels like waiting-on-customer or parked to the exclusion list. Conversations with those labels still belong to the agent but don't count toward the cap. So if your cap is 10 and an agent has 7 active + 5 waiting-on-customer , they still have capacity for 3 new ones.

### Age exclusion

Set "exclude older than 24 hours" and conversations created more than a day ago drop out of the count. Useful for long-running conversations (e.g. multi-day enterprise tickets) that you don't want monopolizing an agent's capacity number.

Tip: start with a generous cap and no exclusions. Add exclusions only when you can point to a specific kind of conversation that's distorting the count.

## How to attach a policy to an agent?

You can attach the policy when creating it (under Assigned agents in the policy form) or after the fact:

-
Open the policy.

-
Click Add agent .

-
Pick the agents you want under this policy. Multiple agents can share one policy.

A given agent can be on at most one capacity policy at a time. Assigning a new policy replaces any prior one.

## How auto-assignment uses capacity?

When a new conversation arrives in an inbox with auto-assignment enabled:

-
Chatwoot finds eligible agents (inbox members, available status).

-
For each candidate with a capacity policy, count their currently-open conversations on that inbox, applying exclusion rules.

-
Filter out agents at or over their cap.

-
Pick the next eligible agent using the configured assignment strategy (Round Robin or Balanced).

If no agent is under cap, the conversation stays unassigned in the queue until somebody's count drops or capacity frees up.

Capacity is per inbox . An agent can be at cap on Inbox A while still having capacity on Inbox B — they'll be skipped for A but eligible for B.

## A practical example

A 12-agent support team has these inboxes:

-
Website — high volume, short conversations

-
Email — lower volume, longer conversations

You create two capacity policies:

Policy Website cap Email cap

Standard agent 10 5

Senior agent 15 8

Junior agents go on Standard ; senior agents on Senior . Add exclusion: waiting-on-customer (so parked conversations don't count). Add age exclusion: 48 hours (so a week-old enterprise email isn't blocking an agent's slot).

The result: traffic gets distributed without any single agent being overwhelmed, and the senior team takes a heavier share without manual intervention.

## Frequently asked questions

What happens to a conversation that's already assigned when an agent hits their cap?

Nothing. Caps only affect new auto-assignments. Existing assignments stay put.

Can an agent reassign a conversation away to free up capacity?

Yes — manual reassignment works as normal. If you reassign a conversation to a teammate, your open count drops by one and the next inbound auto-assignment can target you again.

What if every agent is at cap?

The conversation stays unassigned in the queue until somebody's count drops (a conversation gets resolved, snoozed, or reassigned). Pair this with monitoring of unassigned-queue length — if it grows, you need either more headcount or a higher cap.

Can I set per-team capacity?

Capacity is configured per agent, not per team. To approximate team capacity, attach the same capacity policy to every agent on the team.

Are exclusions applied at the agent level or the policy level?

Policy level. All agents on a given policy share the same exclusion rules.

Back to Advanced features explained
