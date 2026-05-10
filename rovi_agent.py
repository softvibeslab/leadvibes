#!/usr/bin/env python3
"""
Rovi CRM Agent - Scaffold example for LeadVibes / Rovi.

This agent demonstrates how to use the Claude Agent SDK to create a
reusable automation script for CRM workflows, lead summaries, and market
insight extraction.

Usage:
    pip install claude-agent-sdk anyio
    python rovi_agent.py

Customize the prompts and agent actions for your specific Rovi workflows.
"""

import anyio
from claude_agent_sdk import query, ClaudeAgentOptions, ResultMessage

AGENT_ROOT = "/root/leadvibes"


async def run_agent(prompt: str, label: str):
    print(f"\n--- {label} ---")
    async for message in query(
        prompt=prompt,
        options=ClaudeAgentOptions(
            cwd=AGENT_ROOT,
            allowed_tools=["Read", "Write", "Agent"],
            # Add mcp_servers if running with a local MCP server environment.
            mcp_servers={},
        ),
    ):
        if isinstance(message, ResultMessage):
            print(f"\n✅ {label} result:\n{message.result}\n")


async def summarize_lead_pipeline():
    prompt = """
You are an AI assistant for the Rovi CRM. Review the current lead pipeline
and provide a short summary with the following:
- Most active lead sources
- Leads that require follow-up today
- Any trends in property type or stage

Use the repository context to simulate an analysis of the CRM pipeline.
"""
    await run_agent(prompt, "Lead Pipeline Summary")


async def generate_campaign_copy():
    prompt = """
Create a short SMS campaign message for a high-value property in Tulum.
Use a friendly but professional tone, highlight exclusivity, and invite the
prospect to schedule a viewing this week.
"""
    await run_agent(prompt, "Campaign Copy Generator")


async def main():
    print("=" * 60)
    print("🤖 Rovi CRM Agent")
    print("=" * 60)

    await summarize_lead_pipeline()
    await generate_campaign_copy()

    print("\n" + "=" * 60)
    print("✨ Rovi agent execution completed")
    print("=" * 60)


if __name__ == "__main__":
    anyio.run(main)
