---
title: Semi-dark factory
summary: A Jira label starts a local factory where an agent solves the task, an auto-reviewer comments on the merge request and the loop runs until the review is clean. A human makes the final call.
meta: AI · agents · workflow
tags: [Claude, Docker, GitLab, Jira, Code review]
order: 4
visual: dark-factory
links: []
origin: home.pl
---

## Problem

Many tasks are small and well described, but each one still needs someone to pick it up, write the change, wait for a review and fix the comments. I wanted those tasks to reach a developer already done and reviewed, with the decision still left to a person.

## What I built

A "semi-dark" factory: it runs on its own, but the lights stay on for the last step.

1. A **label in Jira** sends the task to the factory, which runs in **local Docker**.
2. An **agent solves the task** and **pushes it to GitLab**.
3. My own **auto-reviewer** reads the merge request and leaves comments.
4. The factory **picks up the comments and fixes them**, and the review runs again.
5. The loop repeats until the review is clean. Then **a human reviews the work and decides**.

## Highlights

- The loop is the point: the agent doesn't stop at its first version, it answers review comments the way a developer would.
- Everything runs locally in Docker and starts from a label the team already knows how to use.
- The factory never merges on its own. It prepares the work; a person makes the call.
