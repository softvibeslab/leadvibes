---
source_url: "https://www.chatwoot.com/hc/user-guide/articles/1779863425-voice-calling-in-chatwoot"
captured_at: "2026-06-17T09:56:55.055047+00:00"
author: "Chatwoot"
contributor: "Rovi Codex"
nav_title: "Voice Calling in Chatwoot"
---

# Voice Calling in Chatwoot

Source: https://www.chatwoot.com/hc/user-guide/articles/1779863425-voice-calling-in-chatwoot

Voice Calling in Chatwoot | User Guide | Chatwoot

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

Home 📞 Voice Channels Voice Calling in Chatwoot

# Voice Calling in Chatwoot

Open in
View as Markdown

Open in ChatGPT Open in Claude

Tanmay Deep Sharma

Last updated on May 27, 2026

Talk to your customers by voice, right from the same inbox where you already handle chats. This guide is in three parts:

-
What voice calling is and how it helps : overview on voice calling feature

-
Connecting a voice channel : setup for each provider (Twilio and WhatsApp)

-
Using voice calling day to day : answering, assignments, who gets rung, and what happens after a call

## 1. What voice calling is and how it helps

Voice calling lets your agents make and receive phone calls inside Chatwoot, without juggling a separate phone app. A call lives in the same place as the rest of the conversation, so the chat history, contact details, notes, and the call all sit together in one timeline.

### 1.1. Why teams use it

-
One screen for everything. When a customer calls, the agent already sees who they are and what they've talked about before, no asking them to repeat themselves.

-
No phones to manage. Agents talk through their browser using a headset or the computer's mic and speakers. There's no additional overhead of any new softwares or browser extensions.

-
Every call is on the record. Each call automatically becomes a message in the conversation, showing whether it was answered, how long it lasted, who picked it up, and, when available, a recording you can replay and a written transcript you can read.

-
The team shares the load. An incoming call rings the right available agents at once, so customers reach a real person quickly.

### 1.2. Different ways to receive a call

Chatwoot supports voice through two providers. You can use either or both:

Provider Best for How the customer reaches you

Twilio Voice A traditional business phone line Customer dials your phone number from any phone

WhatsApp Calling Businesses already on WhatsApp Customer taps "call" on your business inside the WhatsApp app

Note: Voice calling is a premium feature. It must be enabled on your account (the Voice Channel feature) before the options below appear. If you don't see voice settings, contact your account admin or your Chatwoot provider.

## 2. Connecting a voice channel

Setting up voice is an admin task, done once per inbox. Pick the section that matches the provider you want.

### 2.1. Twilio Voice (a phone-number line)

Please follow along this article to setup Twilio Voice: Connecting Twilio voice channel

### 2.2. WhatsApp Calling

Please follow along this article to setup WhatsApp Calling: Connecting WhatsApp voice channel

One requirement for agents: their browser must have microphone permission granted for Chatwoot.

## 3. Using voice calling day to day

Once an inbox has voice enabled, calling works the same way for agents no matter which provider is behind it.

### 3.1. Receiving an incoming call

When a customer calls, a floating call widget pops up in the corner of the screen for the agents who should answer, and a ringtone plays. The card shows the caller's name, number, and (when known) their location, plus which channel the call came in on.

From that widget an agent can:

-
Join call : answer and start talking by clicking the green call accept button.

-
Reject : decline the call (the caller is no longer ringing this agent) by clicking the red call reject button.

-
Dismiss : quietly hide the popup on this screen without rejecting the call, so other agents can still pick it up. You can do this by clicking the cross button on the top right of the widget.

If a teammate (or the same agent in another browser tab) has already grabbed the call, the widget shows "Being handled in another tab" so two people don't answer the same call.

While connected, the widget shows a running timer and these controls:

-
Mute mic / Unmute mic : turn the agent's microphone off and on by clicking in the green mic button.

-
End call : hang up by clicking on the red call end button.

-
Go to conversation thread / View chat history : jump to the full conversation while staying on the call by clicking on the "Go to conversation thread" link at the bottom of the widget. This makes it easier for the agent can see the previous history of the conversation or get more details about the contact.

### 3.2. Notification and call assignments

Chatwoot rings the people most likely to help, it does not ring everyone blindly. For an incoming call, it rings in this order of priority:

-
The assigned agent , if the conversation already has one, only they are rung.

-
Otherwise, the online agents in that inbox , everyone who is available gets the call notification at once.

-
Otherwise, all online admins on the account , a last resort so no call goes unanswered.

A few rules that follow from this:

-
Only available (online) agents get a ringing popup for incoming calls. Agents who are offline or busy are skipped.

-
First to answer wins. There's no queue or round-robin, whoever picks up first takes the call, and for the others it stop ringing and the call notification goes away.

-
The call is auto-assigned to whoever answers. The conversation becomes theirs, so follow-up stays with the person who handled it.

-
Outbound calls always belong to the agent who started them.

### 3.3. Call states (what the labels mean)

Every call moves through a simple lifecycle, and the conversation reflects it:

What you see Meaning

Incoming call / Outgoing call The call is ringing

Call in progress Connected and talking

Call ended Finished normally

No answer ( Contact didn't pick up) Outbound call the customer didn't answer

Missed call ( No agent picked up) Incoming call nobody answered

Declined by {agent} An agent rejected the call

### 3.4. After the call

When a call ends, it's saved as a call entry in the conversation timeline, so there's a permanent record. Depending on your setup, that entry can include:

-
Call summary : Direction (incoming/outgoing), the final status, how long it lasted, and which agent answered (e.g. "You answered" , "{agent} answered" , or "They answered" ).

-
Recording : For Twilio calls a recording is captured automatically and attached so you can replay it. For WhatsApp calls a recording is attached when it is available.

-
Transcript : If your account has AI transcription enabled (the Captain integration, subject to available quota), the recording is turned into readable text right inside the call entry, with a Show more / Show less toggle for long calls.

A missed or declined call still leaves an entry (e.g. Missed call - No agent picked up), and the agent can use Call back from the conversation to return it.

### 3.5 Starting an outbound call

When an agent misses a call, Chatwoot provides the ability to seamlessly do a callback to the customer from the dashboard. From inside a conversation, the agent can use the call button in the conversation header:

You can also start a call from the contact info screen also.

### Quick troubleshooting

-
No voice settings appear. The Voice Channel feature isn't enabled on your account — ask your admin or Chatwoot provider.

-
WhatsApp calling won't turn on. The number isn't enrolled in the WhatsApp Business Calling API yet, or the inbox isn't a WhatsApp Cloud inbox. Onboard the number with Meta / your provider and try again.

-
The call connects but there's no sound, or it won't start. Check hat the browser has microphone permission for Chatwoot, and that a headset/mic is selected.

-
A customer says they can't call your WhatsApp number. They may not have accepted the call permission request yet — they'll get one when an agent tries to call, and calls work once they accept.

Back to Voice Channels
