---
title: QA agent
summary: An AI agent that writes test scenarios and Playwright specs for a new feature, compares the branch with master and reports back on the merge request.
meta: AI · testing · automation
tags: [Claude, Playwright, GitLab, Visual testing]
order: 3
visual: qa-agent
links: []
origin: home.pl
---

## Problem

Every new feature needs tests and a careful look at what changed on screen. Writing scenarios and specs and comparing screenshots by hand is slow, and it is the part of the job that gets skipped when a deadline is close.

## What I built

An agent built on Claude that takes a new feature and does the routine QA work:

- writes **test scenarios** in Markdown that anyone on the team can read;
- turns them into **Playwright specs**;
- runs them on **master and on the working branch** and compares the screenshots;
- posts a **comment on the GitLab merge request** with what it found;
- produces a **full HTML report** with the scenarios, the results and the visual differences.

## Highlights

- Scenarios come first, in plain language, so a person can check what the agent understood before trusting its tests.
- Comparing master with the branch shows what the change actually did, not only whether the tests pass.
- The result lands where the team already works: on the merge request.
