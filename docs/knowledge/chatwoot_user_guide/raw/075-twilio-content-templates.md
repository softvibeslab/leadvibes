---
source_url: "https://www.chatwoot.com/hc/user-guide/articles/1756195741-twilio-content-templates"
captured_at: "2026-06-17T09:58:01.511277+00:00"
author: "Chatwoot"
contributor: "Rovi Codex"
nav_title: "Twilio content templates"
---

# Twilio content templates

Source: https://www.chatwoot.com/hc/user-guide/articles/1756195741-twilio-content-templates

Twilio content templates | User Guide | Chatwoot

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

Home 🔎 Advanced features explained Twilio content templates

# Twilio content templates

Open in
View as Markdown

Open in ChatGPT Open in Claude

Muhsin

Last updated on Jan 5, 2026

Twilio Content Templates allow you to send pre-approved WhatsApp message templates through your Twilio WhatsApp Business channels in Chatwoot. These templates enable you to initiate conversations and send structured messages that comply with WhatsApp's messaging policies.

## Template Types Supported

Text Templates

-
Simple text messages with optional variables

-
Support for up to 100 variables per template using {{1}} , {{2}} format

-
Multi-language support

Media Templates

-
Image Templates : Text with image headers (JPEG/PNG, max 5MB)

-
Video Templates : Text with video headers (MP4/3GPP, max 16MB)

-
Document Templates : Text with document attachments (PDF/Office formats, max 100MB)

-
Support for dynamic media URLs with variables

Quick Reply Templates

-
Interactive button responses handled by WhatsApp

-
Simple button actions for common responses

-
Support for multiple language variants

Call-to-Action Templates

-
URL Button Templates : Send messages with clickable action buttons

-
Variable Support : Both message text and button parameters can include variables

-
Action Types : URL buttons for payments, bookings, websites, etc.

## Prerequisites

Before using Twilio Content Templates:

-
Twilio Account : Active Twilio account with WhatsApp Business API access

-
Approved Templates : Templates created and approved in Twilio Console

-
Chatwoot Integration : Twilio WhatsApp channel configured in Chatwoot

-
WhatsApp Business Account : Verified WhatsApp Business profile

## Setting Up Templates

-
Log into your Twilio Console

-
Navigate to Messaging → Content Template Builder

-
Click Create new template

-
Choose your template type: Text : For simple text messages, Media : For images, videos, or documents, Quick Reply : For interactive buttons

-
Configure the template based on the purpose.

-
Submit template for WhatsApp approval

-
Wait for approval (5 minutes to 24 hours)

-
Approved templates receive a ContentSid

-
Templates are now ready for use in Chatwoot

## Syncing Templates to Chatwoot

Automatic Sync via API

Templates are automatically synced when you:

-
Open the content templates modal in a conversation

-
Create a new conversation with a Twilio WhatsApp channel

Manual Sync

For inbox administrators:

-
Go to Settings → Inboxes

-
Select your Twilio WhatsApp inbox

-
Click Sync Templates button

-
Wait for sync completion notification

## Using Templates in Conversations

#### Step 1: Access template options

Open any conversation with a WhatsApp contact, Click on the template icon in the message composer, Select "WhatsApp Templates" from the dropdown menu

#### Step 2: Choose your template

Browse through your approved templates, Use the search bar to find specific templates quickly

#### Step 3: Customize your message

Depending on your template type, you may need to fill in:

## Best Practices

Template Design

-
Keep messages concise and clear

-
Use variables for personalization

-
Ensure media files are optimized and accessible

-
Test templates before approval submission

Variable Usage

-
Use descriptive variable names in Twilio Console

-
Provide clear examples for approval

-
Keep variable count reasonable (under 10 for best UX)

Media Guidelines

-
Host media files on reliable, fast servers

-
Use HTTPS URLs for all media

-
Optimize file sizes for faster delivery

-
Include fallback text for media templates

Compliance

-
Follow WhatsApp Business Policy guidelines

-
Ensure templates serve legitimate business purposes

-
Respect user privacy and consent

-
Monitor template performance and approval status

## Troubleshooting

Common Issues

Template Not Appearing

-
Cause : Template not approved by WhatsApp

-
Solution : Check approval status in Twilio Console

Template Sync Failed

-
Cause : API connection issues or invalid credentials

-
Solution : Verify Twilio credentials and retry sync

Media Not Loading

-
Cause : Media URL not accessible or wrong format

-
Solutions : Verify URL is publicly accessible, Check file format and size limits, Ensure HTTPS protocol

Variables Not Working

-
Cause : Incorrect variable format or missing values

-
Solutions : Use correct {{1}} , {{2}} format in Twilio, Fill all required variables in Chatwoot, Check variable count matches template

## Error Messages

"Template not found"

-
Template not synced to Chatwoot

-
Run manual sync or check template approval

"Media file too large"

-
File exceeds WhatsApp limits

-
Compress file or use different format

"Invalid template parameters"

-
Missing or incorrect variable values

-
Review and complete all required fields

## Template Examples

Basic Text Template

Name: welcome_message Content: "Welcome to {{1}}! We're excited to help you with {{2}}." Variables: Company name, Service type

Product Showcase (Media Template)

Name: product_launch Media: Product image Content: "🎉 New arrival! {{1}} is now available for {{2}}. Limited time offer!" Variables: Product name, Price

Order Confirmation (Text Template)

Name: order_confirmed Content: "Hi {{1}}! Your order {{2}} has been confirmed. Delivery expected: {{3}}." Variables: Customer name, Order ID, Delivery date

Quick Reply Template

Name: support_options Content: "How can we help you today?" Buttons: "Technical Support", "Billing", "General Info"

## Limitations

Current Limitations

-
Templates not supported in campaigns (coming in future updates)

-
List picker templates

-
Catalog templates

-
Carousel templates

Template Limits

-
Maximum 100 variables per template

-
Media files must be publicly accessible

-
Templates require WhatsApp approval

-
Sequential parameter numbering required

## Support

For additional help:

-
Check Twilio WhatsApp Documentation

-
Review WhatsApp Business Platform Guidelines

-
Contact your system administrator for technical issues

-
Refer to Chatwoot documentation for general platform guidanc

Back to Advanced features explained
