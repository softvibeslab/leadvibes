---
source_url: "https://www.chatwoot.com/hc/user-guide/articles/1763978164-chatwoot-assignment-v2"
captured_at: "2026-06-17T09:58:37.716656+00:00"
author: "Chatwoot"
contributor: "Rovi Codex"
nav_title: "Advanced Assignment Policies"
---

# Advanced Assignment Policies

Source: https://www.chatwoot.com/hc/user-guide/articles/1763978164-chatwoot-assignment-v2

Advanced Assignment Policies | User Guide | Chatwoot

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

Home 🔎 Advanced features explained Advanced Assignment Policies

# Advanced Assignment Policies

Open in
View as Markdown

Open in ChatGPT Open in Claude

Tanmay Deep Sharma

Last updated on May 20, 2026

## Overview

The advanced assignment introduces a comprehensive policy-based conversation assignment system. This provides centralized management, advanced algorithms, and enterprise-grade capacity controls.

## Feature Availability

-
Open Source : Assignment policies with round-robin algorithm

-
Enterprise and Business : All OSS features plus balanced assignment and agent capacity management

## Core Concepts

### Assignment Policies

Assignment policies are centralized rules that control how conversations are automatically assigned to agents. Each policy defines:

-
Assignment Order : How agents are selected (round-robin or balanced)

-
Conversation Priority : Which conversations get assigned first

-
Fair Distribution : Rate limiting to prevent agent overload

### Agent Capacity Policies (Enterprise)

Capacity policies set conversation limits per agent with inbox-specific granularity and advanced filtering rules.

## Assignment Policies

### Creating Assignment Policies

-
Navigate to Settings → Agent assignment → Assignment policy

-
Click Create Assignment Policy

-
Configure the following:

#### Basic Configuration

-
Name : Unique policy identifier

-
Description : Optional policy description

-
Enabled : Toggle policy activation

#### Assignment Settings

-
Assignment Order :

-
Round Robin : Cycles through available agents sequentially (OSS & Enterprise)

-
Balanced : Distributes based on current workload, equal assignment (Enterprise only)

-
Conversation Priority :

-
Earliest Created : Assigns oldest conversations first

-
Longest Waiting : Prioritizes conversations with longest wait times

-
Fair Distribution:

-
Limit : Maximum conversations per agent within time window (default: 100)

-
Window : Time period in seconds for rate limiting (default: 3600)

### Linking Policies to Inboxes

-
Go to Settings → Agent Assignment

-
Edit a policy.

-
Add an Inbox.

## Agent Capacity Management (Enterprise)

### Creating Capacity Policies

-
Navigate to Settings → Assignment Policy → Capacity

-
Click Create Capacity Policy

-
Configure:

-
Basic Settings

-
Name : Policy identifier

-
Description : Optional description

-
Inbox Capacity Limits

-
For each inbox, set:

-
Conversation Limit : Maximum open conversations per agent

-
Exclusion Rules (JSON Configuration)

-
Excluded Labels : Conversations with these labels won't be auto-assigned

-
Age Threshold : Exclude conversations older than specified hours

### Assigning Capacity Policies to Agents

-
Go to Assignment Policy → Agent Capacity Policy

-
Select an Agent Capacity Policy

-
Add Inbox capacity limits

-
Assign agents to the policy

## Assignment Algorithms

### Round Robin (OSS & Enterprise)

Cycles through available agents sequentially, ensuring equal distribution over time.

### Balanced Assignment (Enterprise)

Intelligently distributes conversations based on:

-
Current agent workload

-
Equal assignment

## Troubleshooting

### Common Issues

#### Conversations Not Being Assigned

-
Verify assignment policy is enabled and linked to inbox

-
Check if agents are available and online

-
Ensure agents haven't reached capacity limits (Enterprise)

-
Verify exclusion rules aren't filtering out conversations

#### Uneven Distribution

-
Review fair distribution settings

-
Consider switching to balanced assignment (Enterprise)

-
Check agent availability patterns

### Debugging Steps

-
Check assignment policy configuration

-
Verify inbox-policy linkage

-
Review agent capacity settings (Enterprise)

-
Monitor assignment service logs

-
Validate agent availability status

Assignment V2 provides a robust, scalable solution for conversation management that grows with your organization's needs while maintaining optimal agent workload distributio

Back to Advanced features explained
