---
title: Human-in-the-loop delivery
short: Human in the loop
client: home.pl
summary: A Jira label hands a task to agents in a Docker container. They solve it and fix review comments in a loop until the review is clean; then a person reviews the work and merges it.
meta: AI · agents · workflow
tags: [Claude, Skills, Agents, Docker, GitLab, Jira, Code review]
order: 2
visual: delivery-loop
links: []
origin: home.pl
---

## Problem

Many tasks are small and well described, but each one still needs someone to pick it up, write the change, wait for a review and fix the comments. I wanted those tasks to reach a developer already done and reviewed, with the decision still left to a person.

## What I built

An automated delivery process with a human in the loop. Agents do the routine part; a person reviews the result and merges it.

**I wrote the skills, instructions and agents that make it work.** The agents run on my **"resolve ticket" skill**, which goes step by step: it reads Figma and builds components and sections in Tailwind. That skill sits on top of the team's skills, which describe how the team works and its best practices, so the agents work the way the team does.

1. A **label in Jira** hands the task to an **agent pipeline in a Docker container**.
2. The **agents solve the task** and **push it to GitLab**.
3. My own **auto-reviewer** reads the merge request and leaves comments.
4. The pipeline **picks up the comments and fixes them**, and the review runs again.
5. The loop repeats until the review is clean. Then **a human reviews the work and merges it**.

## Highlights

- The loop is the point: the agents don't stop at their first version, they answer review comments the way a developer would.
- The agents follow the team's written way of working, so their changes read like the team's own.
- Everything runs in a Docker container and starts from a label the team already knows how to use. I ran it on my machine; the Docker image is ready to run in production.
- Nothing is merged automatically. The pipeline prepares the work; a person reviews it and merges.
