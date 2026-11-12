---
name: readable-text
description: Write text a person can scan quickly. Use for anything a human will read — chat replies and final summaries, PR titles and descriptions, commit messages, issues, docs, READMEs, changelogs, tables, dashboards, session titles and status updates. Matters most when the output is a set of parallel items (bullets, headings, table rows, cards, titles), and as a review pass before sending or committing any such text.
---

# Readable text

People skim. They read the first words of each line and skip most of the rest. A list reads fast
when every item is predictable, and slowly when each item makes the reader work out its shape again.

These five rules come from Shreya Shankar's
[Five Principles for Generating Readable AI Text in Bulk](https://fsdatalab.github.io/blog/agent-text-at-scale/)
(Full Stack Data Lab, 2026). The post is about feeds of AI-written items. The rules hold for any set
of parallel items: bullets, headings, table rows, commit subjects, PR titles, changelog entries,
issue titles, cards, status updates.

## The five rules

### 1. Start each item with its subject or its verb

Readers take the first noun as the actor, the next verb as the action and the next noun as the
object. Text in another order gets parsed wrongly, then read again.

- Start with the subject or the verb, never with the object or a qualifier.
- Drop the subject when every item shares it, and start with the verb.
- Put the first verb in the tense the reader expects: past for finished work, continuous for work
  in progress, imperative or future for work still to do.

| Before | After |
|---|---|
| Nav overflow on iPhone SE fixed | Fixed nav overflow on iPhone SE |
| KV persistence | Adding KV persistence |
| There are three posts whose images failed to sync | Three posts failed to sync images |

### 2. Put the distinguishing words first

Readers of a list often see only the first two words of each item.

- Find the words that make this item different from its neighbours.
- Move those words as close to the start as possible.

| Before | After |
|---|---|
| Your order #1001 has shipped | Shipped: order #1001 |
| Weekly SEO audit: ranking drop on /results/ | Ranking drop on /results/ (weekly SEO audit) |

### 3. Use one structure and one word per concept

An item reads faster when it has the same structure as the item before it.

- Use one grammatical structure for every item in a set.
- Use one word for each concept. If it is an "issue" in the first row, it is not a "ticket" or a
  "page" in the third.

Before:

- The issue reports that sync fails on large images
- Pressing Ctrl+C leaves a stale lock file
- This page describes a timeout in the audit job

After:

- Sync fails on large images
- Ctrl+C leaves a stale lock file
- Audit job times out

### 4. Vary only when the difference means something

A reader assumes any difference between items is deliberate. If one item names a version number,
runs twice as long or carries a caveat, the reader concludes the other items have no version, less
to say and no caveat.

- Give every item the same components, in the same order.
- Keep items to a similar length.
- Handle a detail that belongs to only one item one of three ways: add its equivalent to every
  item, move it below the list, or cut it.

### 5. Pick verbs that show whether the news is good or bad

A skimming reader should know from the verb alone what kind of item this is.

- Use plainly negative verbs for problems: fails, breaks, blocks, loses, complains.
- Use plainly positive verbs for wins: fixes, speeds up, passes, unblocks.
- Avoid a neutral or upbeat opener on bad news. "Checkout is an area of active feedback" hides
  what "Users abandon checkout at the address step" says.

## How the rules apply to common outputs

| Output | Opening | Notes |
|---|---|---|
| Commit subject, PR title | Imperative verb | Keep the repo's own prefix convention (`docs:`, `fix:`), then the verb |
| "What changed" bullets in a PR or summary | Past-tense verb | Same components in each bullet |
| Progress updates, session titles | Continuous verb | "Measuring", "Migrating" |
| Plans, next steps, checklists | Imperative verb | One action per item |
| Findings, audit items, bug lists | Subject, then a negative verb | Same components each: what, where, impact |
| Sibling headings in a doc | One form throughout | All noun phrases or all verb phrases |
| Table rows | One form per column | Add or drop a column rather than overloading one cell |

## Review pass

Run this on any set of items before sending, committing or publishing it.

1. Read only the first two words of each item. Can you tell the items apart?
2. Check the opening of each item. Do all items open the same way, in the same tense?
3. Check the vocabulary. Is each thing called by one name throughout?
4. Compare the components. Does any item carry a kind of detail the others lack?
5. Read only the verbs. Can you tell good news from bad?

Fix the set, not the single item. One item that cannot fit the shared structure usually belongs in
a different list.

## Limits

- Leave ordinary prose as prose. These rules cover sets of parallel items and titles, not an
  explanation or an argument, and a chain of reasoning should not be chopped into fragments.
- Follow repo conventions, templates and brand voice guidelines where they conflict with a rule.
- Keep every fact the reader needs in order to act. Uniformity means moving a detail to a
  consistent place, not deleting it.
- Leave quoted text, code, commands and error messages verbatim.
