# Project Summary

Among-Us is an open-source, self-hostable hackathon submission and judging portal. It is designed to run fully offline with local PostgreSQL and custom email/password authentication.

## Roles

- PARTICIPANT
- JUDGE
- ORGANIZER
- ADMIN

## Folder ownership

- Person A owns: docker files, prisma/, src/lib/\*\*
- Person B owns: pages and team/submission/gallery services
- Person C owns: judging, scoring, normalization, and export services

## Scope

This repository is meant to be developed by multiple contributors. The platform must support self-hosted operations without cloud or SaaS dependencies.
