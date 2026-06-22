---
source_url: "https://www.chatwoot.com/hc/user-guide/articles/1677482414-adding-agents"
captured_at: "2026-06-17T09:55:06.098855+00:00"
author: "Chatwoot"
contributor: "Rovi Codex"
nav_title: "How to invite agents and manage your support team?"
---

# How to invite agents and manage your support team?

Source: https://www.chatwoot.com/hc/user-guide/articles/1677482414-adding-agents

How to invite agents and manage your support team? | User Guide | Chatwoot

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

Home 👝 Setup account How to invite agents and manage your support team?

# How to invite agents and manage your support team?

Open in
View as Markdown

Open in ChatGPT Open in Claude

Pranav

Last updated on Apr 28, 2026

An agent is anyone on your team who has access to Chatwoot to handle customer conversations. Every person who logs into your Chatwoot account is an agent — there is no separate "user" concept beyond agents and the role each one holds.

Each agent has:

-
A name and email — used to log in and to display on customer-facing replies

-
A role that determines what they can see and do in the account

-
An availability state — Online, Busy, or Offline — shown to teammates and used to influence auto-assignment

### The two built-in roles

Out of the box, Chatwoot has exactly two roles:

Role What they can do

Administrator Full access. Can change account settings, manage agents, configure inboxes, build automations, view all conversations.

Agent Standard support role. Can handle conversations on inboxes they're a member of, but cannot change account settings or manage other agents.

If you need more granular control, for example, "this person can manage contacts and view reports, but can't see other agents' conversations" . You can define your own roles via the Custom Roles feature. See Custom Roles for the full guide. When custom roles exist, they appear in the same role dropdown wherever you'd

otherwise pick Administrator or Agent.

Permissions: only administrators can invite, edit, or delete agents. Regular agents can see who's on the team but cannot manage the team list.

## Managing agents

### How to invite a new agent and assign their role

Adding an agent in Chatwoot is a single-screen modal — not a multi-step wizard. The agent isn't fully active until they accept the invite via email and set up their password.

Step 1 — Open the invite modal.

Go to Settings → Agents and click the Add Agent button at the top right of the page.

Step 2 — Fill in the agent's details.

The "Add agent to your team" modal opens. Fill in:

Field What it's for

Agent Name The full name your customers will see on outgoing replies.

Role A dropdown listing Administrator , Agent , and any custom roles you've defined. Pick whichever level of access this person needs.

Email Address The email the invite is sent to and that the agent will use to log in.

Click Add Agent to submit.

Step 3 — The agent confirms via email.

Chatwoot creates the account in an unconfirmed state and emails the new agent a confirmation link. Until they click that link and set a password, they appear in the agents list with a Verification Pending badge. Once confirmed, the badge changes to Verified and they can log in normally.

Tip: if a teammate says they didn't get the invite, check their spam folder first, then have an admin open their row, click Edit , and resend the invite by re-saving — or use Reset Password to send them a fresh login link.

### How to edit an agent's role, name, or availability

-
Go to Settings → Agents .

-
Find the agent and click the edit (pencil) icon next to their row (tooltip: Edit ).

-
The "Edit agent" modal opens. You can change:

-
Agent Name

-
Role — switch between Administrator, Agent, or any custom role

-
Availability — Online, Busy, or Offline

-
Click Update to save.

You can also use the Reset Password button inside the edit modal to email the agent a new password-reset link. (This button is hidden for accounts that authenticate via SAML / SSO.)

Note: changing an agent's role is instant. If you demote an admin to a standard agent while they're logged in, their access to settings will disappear on their next page navigation.

### How to remove an agent

-
Go to Settings → Agents .

-
Find the agent and click the delete (trash bin) icon next to their row (tooltip: Delete ). The icon turns red on hover.

-
Confirm the deletion in the modal.

Who you can't delete:

-
Yourself. The delete button is hidden on your own row.

-
The last verified administrator on the account. Chatwoot enforces at least one admin at all times.

What happens when an agent is deleted?

A background worker handles cleanup atomically:

-
They're removed from every team they were a member of.

-
They're removed from every inbox they were a collaborator on.

-
Every conversation they were the assignee of is unassigned . The conversations are not deleted, not re-routed automatically, and not re-assigned to anyone — they sit in the unassigned queue until a human or auto-assignment picks them up.

Plan accordingly: if a high-volume agent is leaving, consider re-assigning their open conversations before you delete them, so nothing slips through the unassigned queue.

## Agent availability: Online, Busy, Offline

Every agent has one of three availability states. The state shows on their avatar throughout the dashboard so teammates know who's around.

State Meaning

Online Available — auto-assignment routes new conversations to them.

Busy They're at the desk but heads-down. Auto-assignment would skip them.

Offline They're done for the day. Auto-assignment doesn't pick them.

Agents set their own availability from the avatar dropdown in the top-right of the dashboard. Admins can change anyone's availability from the Edit agent modal.

## How to use agents

Once an agent exists in your account, they become available wherever a person can be selected, mentioned, or filtered. Here's the full set of places.

### 1. Inbox membership

Agents are added as members of specific inboxes ( Settings → Inboxes → [an inbox] → Collaborators ). Only inbox members can see and reply to conversations on that inbox. Adding someone to your account does not automatically give them access to every inbox — you grant inbox access deliberately.

### 2. Team membership

Agents can belong to one or more teams ( Settings → Teams ). Team membership is what makes them eligible for team-scoped auto-assignment. See Teams for the full picture.

### 3. Conversation assignee

The Assignee field in the conversation actions sidebar is a dropdown of eligible agents (those on the conversation's inbox). The assignee is the one person currently responsible for replying.

### 4. Conversation participants

Beyond the assignee, you can add agents as participants so they can follow along, get notifications, and chime in privately without taking ownership. Useful for shadowing, escalations, or looping in subject-matter experts.

### 5. @-mentions in private notes

Inside a conversation's Private Notes tab, type @ and start typing a teammate's name to tag them. Mentioned agents get a notification and the conversation appears in their Mentions view in the navigation rail.

### 6. Macros

The macro action picker ( Settings → Macros ) includes Assign Agent as an action. So a "Refund issued" macro can in one click reassign the conversation to whichever agent should handle finance follow-up.

### 7. Automation rules

Automation rules ( Settings → Automation ) can both filter on an agent (as a condition: "if assigned agent is X" ) and assign an agent (as an action: "assign agent X" ) or remove an existing assignment.

### 8. Reports

-
Agent Reports show the same six core metrics (conversations created, incoming/outgoing messages, avg first response time, avg resolution time, resolutions count, avg reply time) scoped to one agent.

-
CSAT and SLA reports both accept an agent filter so you can drill into one person's CSAT score or SLA hit-rate.

## Frequently asked questions

What's the difference between Administrator and Agent in practical terms?

Administrators can change settings, manage agents, configure inboxes, build automations, and see every conversation in the account. Agents can handle conversations on inboxes they're members of and edit their own profile, but can't manage account-level settings or other people. If you need shades in between (e.g. "can manage contacts but not settings"), use Custom Roles.

Where does an agent go to set their own availability?

Bottom left avatar dropdown on the dashboard → Online / Busy / Offline. Admins can also set availability from the edit modal on the agents list.

Does Busy stop me from getting any conversations?

Busy is a softer signal than Offline, but it would take you out of the pool the way Offline does.

Can custom roles be mixed with the built-in Administrator and Agent roles?

Yes — the role dropdown on the agent invite/edit modal lists both built-in roles and every custom role you've defined. You pick exactly one. If you assign a custom role, it replaces the built-in role for that agent.

An agent left the company. What's the safest deletion order?

-
Reassign their open conversations to a teammate.

-
Remove them from any teams where their absence would cause auto-assignment confusion.

-
Delete the agent — the cleanup job removes them from inboxes/teams and unassigns anything left.

Back to Setup account
