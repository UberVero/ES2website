---
title: "Building HIPAA-compliant AI agents"
slug: "building-hipaa-compliant-ai-agents"
description: "An updated take on implementing no-code in healthcare, with the added realities of AI agents and examples of use cases in patient management."
author: "Veronica"
post_type: "article"
category: "AI & Automation"
tags:
  - "AI Agents"
  - "Automation"
  - "Strategy"
  - "Healthcare"
image: "/resources/images/blog/building-hipaa-compliant-ai-agents/img-featured.webp"
date: "2026-03-31"
status: "published"
notion_id: "1cd7e6fb-9112-4c9c-83bf-77d9e67c72f6"
render_with_liquid: false
---


## Read this if you're building HIPAA compliant software and systems and want to use AI agents


This is an update to a case study I originally shared on [NoCode.tech](http://nocode.tech/) about bringing no-code (now known as vibe-code) into a regulated healthcare org (patient portal + care-team workflows, built to move fast without letting PHI leak into the wrong tools). See the original write-up here: [https://www.nocode.tech/article/i-helped-implement-no-code-with-a-healthcare-org-heres-what-i-learned](https://www.nocode.tech/article/i-helped-implement-no-code-with-a-healthcare-org-heres-what-i-learned)


What’s different now is not HIPAA. It’s the shape of the risk when [AI agents](/resources/ai-agents-b2b-marketing/) enter the system.

- The old rule still stands: only the systems that touch PHI need to be HIPAA ready.
- The new reality: agents touch more systems, faster, with less friction. Boundaries and audit trails matter more than ever.
- If a vendor will not sign a BAA, do not let that vendor touch PHI.

## Context: the no-code healthcare case study this is based on


The baseline pattern is the same as the [NoCode.tech](http://nocode.tech/) article: keep PHI inside a HIPAA appropriate boundary, and still let a small care team move quickly with no code by pushing non-PHI work into simpler tools. This is also how we think about [the AI-first operating model](/resources/no-code-to-ai-first-operators-marketing-model/) more broadly — systems over tasks, boundaries over blind automation. The stack combined internal tools, automations, and patient communications. The rule was simple: if a tool cannot protect PHI, it should never see PHI.


## What changed with AI agents


The temptation now is to add an agent to every workflow. In healthcare, that is only safe if you treat the agent like a new teammate.

- Clear scope: what it can do, and what it cannot do.
- Minimal access: which systems it can reach.
- Supervision: what requires human approval.
- Accountability: a clean audit trail of what it saw, decided, and did.

## Modern agent use cases (updated versions of the original workflows)


The original build used no-code tools to automate patient communication and give the care team leverage. With agents, the same workflows get smarter, but they also need tighter boundaries.


### 1) Patient outreach agent (SMS or email) for “didn’t complete X” follow-ups


Original idea: find patients who match a condition, then text them a reminder.


Agent upgrade:

- Pulls the cohort via a query (inside the HIPAA boundary)
- Generates a message variant per patient context (but only from approved fields)
- Sends via an approved channel tool (SMS/email)
- Logs what was sent and why, without storing PHI in general logs

### 2) Intake and forms agent embedded in a marketing site


Original idea: build the website anywhere, but embed a HIPAA-capable form tool for PHI.


Agent upgrade:

- Routes form submissions (PHI) into the HIPAA boundary
- Flags missing fields or contradictory answers
- Creates a case/ticket for the care team with a structured summary

![ai-generated-image.png](/resources/images/blog/building-hipaa-compliant-ai-agents/img-1.webp)


### 3) Care-team copilot for “one person supports hundreds of patients” operations


Original idea: a simple portal + internal tooling so a small team can handle volume.


Agent upgrade:

- Summarizes recent patient interactions into a work queue
- Suggests next-best actions (scripts, checklists, escalation paths)
- Requires approval before any outbound message or record update

### 4) De-identified automation agent for non-PHI tools (the safe speed boost)


Original idea: anonymize data, then use non-HIPAA tools for convenience.


Agent upgrade:

- Auto-redacts and transforms PHI into non-sensitive tokens
- Generates operational reports, reminders, and dashboards in non-PHI systems
- Maintains a mapping only inside the HIPAA boundary

![ai-generated-image.png](/resources/images/blog/building-hipaa-compliant-ai-agents/img-2.webp)


### 5) Documentation and training agent (keeps you audit-ready)


Original idea: document the architecture and train the team.


Agent upgrade:

- Keeps an up-to-date architecture + data-flow doc from a structured source of truth
- Generates role-based training checklists and refreshers
- Assembles audit evidence: access reviews, vendor list, policy acknowledgements

Below are the updated learnings, mapped to the original structure.


## 1. Audit your data flows, including agent actions


The old audit was: where does PHI exist, and where does it travel?


The updated audit is: where does PHI exist, where does it travel, and where could an agent accidentally send it?


Practical additions for 2026:

- Make a PHI data flow diagram that includes agent steps: retrieval, summarization, decisioning, tool calls, and notifications.
- Classify every field you might send to an agent: PHI, identifiers and PII, or non sensitive.
- Define PHI safe context patterns. Example: the agent works on internal IDs and de identified summaries by default, and only requests PHI inside the compliant boundary when absolutely necessary.

## 2. Permissions are the main battlefield


In the original article, I warned about row level permissions and not putting PHI in tools that cannot restrict access.


With agents, permissions matter even more because they can chain actions in seconds: read, decide, write, notify.


Updated best practices:

- Treat every tool an agent can call as a privileged operation.
- Use least privilege for integrations. Separate credentials per workflow, not one all access key.
- Put human approval on high impact actions: patient communications, changes to clinical records, exports, and access changes.
- Log every tool call: who requested it, what data scope was used, what the agent decided, and what external systems were touched.

## 3. Observability needs to be PHI safe


Everyone wants better debugging for AI. The trap is logging too much.


Updated guidance:

- Do not store raw prompts or responses containing PHI in general purpose logs.
- If you must keep transcripts for QA or compliance, store them in a controlled system with strict access, retention rules, and auditing.
- Prefer structured logs: event type, IDs, timestamps, policy decisions, and tool call metadata. Use redaction by default.

## 4. Document and train, now with an agent playbook


Compliance is repeatable process, as demonstrated by the rise in “compliance-as-service” companies live Vanta. HIPAA is a set of processes and checkboxes for people and machines, now including agents. The concept is not new.


What is new:

- A written agent policy that states what the agent is allowed to do, and what it must never do.
- A playbook for exceptions. What happens when the agent is unsure or the data is incomplete?
- Regular reviews: vendor terms, integration permissions, incident drills, and sampling of agent outputs.

## A simple reference architecture for agentic workflows


If you want a usable mental model, start here:

- Non PHI systems: marketing site, education content, general scheduling info.
- HIPAA boundary: PHI data store, clinical notes, patient identifiers.
- Agent layer: runs with minimal context by default, requests privileged context only when necessary, and only inside the HIPAA boundary.
- Tool gateway: enforces allowlists, input schemas, and approvals.
- Audit store: immutable, access controlled logs of decisions and tool calls.

![ai-generated-image.png](/resources/images/blog/building-hipaa-compliant-ai-agents/img-3.webp)


## FAQ: HIPAA and AI agents (quick answers)


### Can I use AI agents with PHI under HIPAA?


Yes, but only if the full system is designed for HIPAA: the agent, its tool access, where data is stored, and every vendor that could receive PHI. Treat the agent like a teammate with credentials: least privilege, approvals for high impact actions, and audit trails.


### Is ChatGPT HIPAA compliant?


The consumer app is not the default choice for PHI. In practice, HIPAA compliant use requires the right enterprise or API setup plus a signed BAA and a PHI safe architecture. If you cannot get a BAA for the exact services you use, do not send PHI.


### What makes an AI vendor “HIPAA compliant”?


There is no magic badge. The practical checklist is: a signed BAA, clear data handling terms (retention, training, access), and controls you can enforce (encryption, access restrictions, logging, and deletion).


### What is the biggest new risk when agents enter a healthcare workflow?


The biggest risk is uncontrolled blast radius: an agent that can see too much data or act in too many systems, plus accidental data egress (PHI leaking into prompts, logs, or third-party tools).


Permission sprawl is one common way this happens, but it’s not the only one. The practical goal is the same: keep PHI tightly bounded, keep tool access minimal, and make every action auditable.


### What should we log for agentic workflows without leaking PHI?


Prefer structured audit logs over raw prompts: timestamps, event type, tool name, who requested the action, what record IDs were touched, approval outcomes, and redacted summaries. If you keep transcripts, store them in a controlled system with strict access and retention.


### What is a safe starting architecture for an AI agent in healthcare?


Keep PHI in a HIPAA boundary, keep non PHI in simpler systems, and put a gateway in between that enforces allowlists, input schemas, and approvals. Add an immutable audit log that captures decisions and tool calls.


