---
source_url: "https://www.chatwoot.com/hc/user-guide/articles/1677672686-how-to-install-live_chat-on-a-react-native-app"
captured_at: "2026-06-17T09:56:22.899168+00:00"
author: "Chatwoot"
contributor: "Rovi Codex"
nav_title: "How to install live-chat on a React Native app?"
---

# How to install live-chat on a React Native app?

Source: https://www.chatwoot.com/hc/user-guide/articles/1677672686-how-to-install-live_chat-on-a-react-native-app

How to install live-chat on a React Native app? | User Guide | Chatwoot

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

Home 💬 Website live chat How to install live-chat on a React Native app?

# How to install live-chat on a React Native app?

Open in
View as Markdown

Open in ChatGPT Open in Claude

Pranav

Last updated on Apr 10, 2024

If you have a React Native app, you can add Chatwoot live chat widget and talk to your visitors in real-time. This can be done in 3 simple steps using the Chatwoot plugin.

## Step 1. Create a website inbox in Chatwoot​

Please refer to this guide for detailed instructions on setting a website inbox in Chatwoot.

## Step 2. Add the plugin to your project ​

Add one of the following plugins to your project.

yarn add @chatwoot/react-native-widget

or

npm install --save @chatwoot/react-native-widget --save

This library depends on react-native-webview and async-storage . Please follow the instructions provided in the docs.

iOS Installation ​

If you're using React Native versions > 60.0, it's relatively straightforward.

cd ios && pod install

## Step 3. Use it like this ​

Replace websiteToken and baseUrl with appropriate values.

import React, { useState } from 'react'; import { StyleSheet, View, SafeAreaView, TouchableOpacity, Text } from 'react-native'; import ChatWootWidget from '@chatwoot/react-native-widget'; const App = () => { const [showWidget, toggleWidget] = useState(false); const user = { identifier: ' [email protected] ', name: 'John Samuel', avatar_url: '', email: ' [email protected] ', identifier_hash: '', }; const customAttributes = { accountId: 1, pricingPlan: 'paid', status: 'active' }; const websiteToken = 'WEBSITE_TOKEN'; const baseUrl = 'CHATWOOT_INSTALLATION_URL'; const locale = 'en'; return ( <SafeAreaView style={styles.container}> <View> <TouchableOpacity style={styles.button} onPress={() => toggleWidget(true)}> <Text style={styles.buttonText}>Open widget</Text> </TouchableOpacity> </View> { showWidget&& <ChatWootWidget websiteToken={websiteToken} locale={locale} baseUrl={baseUrl} closeModal={() => toggleWidget(false)} isModalVisible={showWidget} user={user} customAttributes={customAttributes} /> } </SafeAreaView> ); }; const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', alignItems: 'center', }, button: { height: 48, marginTop: 32, paddingTop: 8, paddingBottom: 8, backgroundColor: '#1F93FF', borderRadius: 8, borderWidth: 1, borderColor: '#fff', justifyContent: 'center', }, buttonText: { color: '#fff', textAlign: 'center', paddingLeft: 10, fontWeight: '600', fontSize: 16, paddingRight: 10, }, }); export default App;

And...you're done. Check out the complete example here .

Back to Website live chat
