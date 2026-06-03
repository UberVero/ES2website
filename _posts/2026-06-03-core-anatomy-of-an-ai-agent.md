---
title: "The Core Anatomy of an AI Agent"
slug: "core-anatomy-of-an-ai-agent"
description: "Every AI agent, no matter the framework, needs three components: a brain (LLM), memory, and tools. Here’s how they fit together, what can go wrong, and how to design them for real work."
key_quote: "A chatbot answers. An agent decides, remembers, and acts."
author: "Veronica"
post_type: "article"
category: "AI & Automation"
tags:
  - "AI Agents"
  - "Automation"
  - "Strategy"
date: "2026-06-03"
status: "published"
notion_id: "b6ee13a9-4c4a-4e1a-8086-9232273332cc"
render_with_liquid: false
---


Most people call anything with a chat UI an “agent.”


It’s not.


A chatbot responds. An agent **decides, remembers, and acts**.


That’s the whole point of agentic AI: you’re not just generating text. You’re running a loop that can take real steps in the world.


Regardless of whether you build with LangGraph, OpenAI Assistants, Notion AI, CrewAI, or a pile of scripts, every true AI agent has three parts:

1. **The Brain (LLM)**
2. **Memory**
3. **Tools (Hands)**

This is the core anatomy. If you understand it, you can evaluate any agent product in five minutes, and you can design your own without getting lost in framework details.


---


## 1) The Brain (the LLM)


The “brain” is the model that handles reasoning and language: GPT-4o, Claude 3.5 Sonnet, etc.


But the important part isn’t the brand.


It’s what you’re asking it to do.


### The brain’s job


At minimum, the brain needs to:

- Interpret the current situation (your prompt + context)
- Decide what to do next (answer now vs. ask a question vs. use a tool)
- Generate structured outputs (plans, tool calls, summaries)

If you want the agent to be reliable, you usually want the brain producing **constrained outputs**, not just freeform prose:

- JSON tool calls
- bulletproof checklists
- a plan with explicit steps
- a final answer that matches a format

### Common failure modes

- **Overconfidence:** the model fabricates facts instead of using tools.
- **Prompt drift:** it forgets the goal halfway through a long run.
- **Style instead of substance:** it sounds convincing, but doesn’t do the work.

The fix is rarely “a better model.”


It’s better constraints, better context, and an execution loop that forces verification.


---


## 2) Memory (short-term + long-term)


An agent without memory is a goldfish. It can reason, but it can’t build continuity.


There are two kinds of memory that matter:


### Short-term memory (working context)


This is everything the agent can see _right now_.


In practice that means:

- the immediate task instructions
- the current conversation
- any documents you’ve loaded into context
- intermediate notes the agent writes for itself

Even if you never use a database, you still have short-term memory. It’s the context window.


**Design note:** a lot of agent systems die here because they stuff too much into context and create noise. “More context” often makes the agent worse.


### Long-term memory (stored knowledge)


This is what lets an agent learn across sessions:

- facts about a project
- past decisions
- what you like / don’t like
- recurring patterns

You can store this in:

- a vector database (Pinecone, Weaviate, etc.)
- a normal database with good schemas
- a knowledge base (Notion, Confluence)

The pattern is usually:

1. Capture important events or preferences
2. Store them in a retrievable format
3. Retrieve the right pieces later based on the current task

**The trap:** if you store everything, retrieval becomes garbage. Long-term memory needs curation or summarization.


---


## 3) Tools (hands that touch the world)


Tools are what make an agent an agent.


Without tools, the LLM can only talk. With tools, it can:

- search the web
- query internal docs
- update a CRM
- open a PR in GitHub
- generate images
- schedule meetings

This is where agents cross the line from “assistant” to “operator.”


### Tools require an interface


You need a way to describe a tool so the model can call it safely:

- name
- input schema
- what it returns
- permissions and constraints

That’s why **Model Context Protocol (MCP)** is becoming a standard: it’s a consistent way to expose tools and data sources to models.


If you’ve experimented with MCP, you’ve already felt the shift: it turns integrations from “custom work for each app” into “plug in a server and go.”


### Tool reliability is the real bottleneck


Most agent failures aren’t “the model isn’t smart enough.”


They’re:

- bad tool error handling
- ambiguous tool outputs
- missing confirmation steps on destructive actions
- brittle parsing

A practical agent design treats tool calls like production code:

- validate inputs
- log outputs
- retry thoughtfully
- fall back gracefully

---


## How the three parts work together (the agent loop)


If you want the simplest mental model, it’s this:

1. **Observe:** read user request + relevant context
2. **Decide:** think, plan, or pick a tool
3. **Act:** call the tool / write output
4. **Update memory:** store what matters
5. **Repeat** until done

Frameworks differ mainly in how they implement this loop (and how much control they give you).


---


## A quick test: is it really an agent?


If you’re evaluating a product that claims “agent,” ask:

- **Can it take actions (tools) without copy/paste?**
- **Can it run multi-step work with checks?**
- **Can it remember anything across sessions?**
- **Can you constrain its actions (permissions, confirmations)?**

If the answer to the first one is no, it’s probably not an agent. It’s a chatbot with a nicer landing page.


---


## Where this matters in real teams


For B2B marketing and ops, this anatomy maps cleanly onto real workflows:

- Brain: chooses what to do next and writes the draft
- Memory: brand voice, positioning, historical performance, customer context
- Tools: keyword research APIs, CMS, CRM, GitHub, analytics, task trackers

If this is the direction you’re going, you’ll probably like:

- [How AI Agents Are Changing B2B Marketing (And What to Do About It)](https://app.notion.com/p/31961616825381d3961dc46441ed5f1f)
- [The Multi-Agent Marketing Pyramid: Orchestrator + Specialists](https://app.notion.com/p/5b8c4555a94c499795102d961b141329)
- [Notion AI Agents vs. Cowork: Scheduled Task Automation Compared](https://app.notion.com/p/b85cf81826dc42d9b8941b37b0dc1d12)
- [Can Claude be your Webflow dev? A look at the updated MCP](https://app.notion.com/p/34361616825380798813c8491196b855)

---


## CTA


If you’re trying to design an agent that actually ships work (not demos), start by writing down:

- the decision loop (what “done” means)
- the memory you need (and what you should _not_ store)
- the smallest tool set that can produce a real outcome

That’s the foundation.


— Veronica


