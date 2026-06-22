---
source_url: "https://www.chatwoot.com/hc/user-guide/articles/1775045339-v2-_-how-to-set-up-custom-tools-for-captain"
captured_at: "2026-06-17T09:59:40.700718+00:00"
author: "Chatwoot"
contributor: "Rovi Codex"
nav_title: "How to Set Up Custom Tools for Captain?"
---

# How to Set Up Custom Tools for Captain?

Source: https://www.chatwoot.com/hc/user-guide/articles/1775045339-v2-_-how-to-set-up-custom-tools-for-captain

How to Set Up Custom Tools for Captain? | User Guide | Chatwoot

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

Home 🔥 Captain How to Set Up Custom Tools for Captain?

# How to Set Up Custom Tools for Captain?

Open in
View as Markdown

Open in ChatGPT Open in Claude

Aakash Bakhle

Last updated on Apr 2, 2026

Custom Tools let Captain call your external APIs during conversations — so it can check warranty status, verify service coverage, or fetch data from your own services without handing off to a human agent.

When a customer asks a question, Captain extracts the relevant values from the conversation, inserts them into your API request, and uses the response to form its reply.

Custom Tools is available on the Business plan and above.

## Creating a tool

Navigate to Captain -> Tools and click Create a new tool .
Fill in the following fields:

Tool Name — A short name like "Warranty Lookup" or "Service Area Check" (max 55 characters).

Description — Tell Captain when to use this tool. This is the most important field. Write it like you're briefing a support agent: "Checks the warranty status of a product by its serial number." Vague descriptions like "Warranty API" will cause Captain to miss opportunities to use the tool.

Method — Choose GET (for fetching data) or POST (for submitting data).

Endpoint URL — Your API's URL. Use {{ parameter_name }} to insert values extracted from the conversation:

https://api.yourcompany.com/v1/warranty/{{ serial_number }}

The URL must use HTTPS, must be a hostname (not an IP address), and cannot point to localhost or private networks.

Authentication — Choose how your API authenticates requests:

-
None — No authentication

-
Bearer Token — Sends your token in the Authorization header

-
Basic Auth — Sends a username and password

-
API Key — Sends a custom header name and value (e.g., X-API-Key )

Authentication credentials are only visible to account administrators.

Parameters — Define what Captain should extract from the customer's message. Each parameter needs a name, type, and description. For example: serial_number (String) — "The product serial number, found on the back of the device."

Request Template (POST only) — A JSON body template using Liquid syntax.

Response Template — Controls what Captain sees from your API's response. If left blank, Captain receives the raw JSON.

Use Liquid to extract relevant fields, for example: Serial {{ response.serial_number }}: {{ response.warranty_status }}. Expires: {{ response.expiry_date }}.

Use response to access the parsed JSON body. Response templates help Captain focus on the relevant data and avoid internal fields like database IDs or debug info.

## Testing your tool

Click Test connection before saving to verify your endpoint is reachable. The test reports the HTTP status code.
A green result (HTTP 200–299) means the connection and authentication are working. Note that the test sends the URL without filling in parameter values, so it only verifies that your endpoint is reachable and your credentials are accepted.

If the test fails, check the following:

-
401 Unauthorised — Your authentication credentials are incorrect. Double-check your bearer token, API key, or username/password.

-
403 Forbidden — Your API is rejecting the request. If you require identity verification, note that test requests don't include contact headers.

-
404 Not Found — The endpoint URL is wrong. Verify the path and ensure your API is running.

-
Timeout — Your API took too long to respond. Custom tools have a 30-second timeout; make sure your endpoint responds within that window

## Context sent with every tool call

When Captain calls your API, it includes metadata headers so your backend knows the context:

-
X-Chatwoot-Account-Id — Your account ID

-
X-Chatwoot-Conversation-Id — The conversation ID

-
X-Chatwoot-Contact-Email — The customer's email (if available)

-
X-Chatwoot-Contact-Inbox-Verified — Whether the customer's identity is HMAC-verified

-
X-Chatwoot-Assistant-Id — The Captain assistant making the call

-
X-Chatwoot-Tool-Slug — The tool's internal identifier

-
X-Chatwoot-Contact-Id — The customer's contact ID

-
X-Chatwoot-Contact-Phone — The customer's phone number (if available)

-
X-Chatwoot-Conversation-Display-Id — The conversation's display number

You can use these headers to look up the customer in your own system, log which conversations triggered API calls, and verify request authenticity.

## Security

Built-in protections:

-
All endpoints must use HTTPS

-
Requests to private IP ranges, localhost, and .local domains are blocked

-
HTTP redirects are not followed

-
Responses are capped at 1 MB

-
Auth credentials are only visible to administrators

Identity verification: If your tool returns customer-specific data (orders, billing, account details), your API should check the X-Chatwoot-Contact-Inbox-Verified header. Without HMAC verification enabled on your inbox, a visitor could set any email address in the chat widget. Only return sensitive data when this header is true . For tools that return public data this check is not needed.

Prompt injection: If your API returns user-generated content (reviews, forum posts), malicious text could influence Captain's behavior. Use response templates to extract only structured fields, and sanitize content on your API side.

## Limits

-
Max tools per account — 15

-
Recommended — 10 or fewer. A warning appears above 10; more tools make it harder for Captain to pick the right one.

-
Tool name length — 55 characters

-
Response size — 1 MB max

-
Request timeout — 30 seconds

## When to use custom tools

Custom tools are best suited for structured lookups with predictable inputs — checking system status, fetching schedules, or looking up records by ID. If you already have a dedicated Chatwoot integration for your use case (e.g., Shopify for e-commerce), use that instead — dedicated integrations handle search, fuzzy matching, and data sync more reliably than a single API call.

## Examples

### Warranty Lookup

When a customer asks whether their product is still under warranty, Captain can check it using the serial number.

-
Tool Name: Warranty Lookup

-
Description: Checks the warranty status of a product by its serial number. Use when a customer asks if their product is covered, when the warranty expires, or what type of coverage they have.

### Service Area Check

For businesses that operate in specific regions — customers ask whether service is available at their location.

-
Tool Name: Service Area Check

-
Description: Checks whether service or delivery is available in a specific area using the customer's zip code or city name.

Custom Tools work best when the inputs are straightforward and the API response is predictable — status checks, lookups, and other structured queries are a great fit.

Back to Captain
