# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary: data providers.** Ocean scientists, technicians and data managers describing a dataset so it can be discovered through CIOOS. Most use the form occasionally, and few know ISO 19115. They come to finish one record (or update one) and leave.
- **Secondary: regional reviewers and admins.** CIOOS Regional Association staff who review submitted records, request changes, mint DOIs and publish. They work through queues of records and come back often.

## Product Purpose

A bilingual (English/French) web form for creating, editing, reviewing and publishing metadata records for the Canadian Integrated Ocean Observing System (CIOOS). It collects ISO 19115-compliant metadata without asking providers to understand the standard. Success means a provider finishes a complete, valid record unaided and a reviewer can publish it with few round trips.

## Positioning

The CIOOS-specific way into the national ocean data catalogue. It speaks the providers' vocabulary (EOVs, platforms, instruments, taxa, contacts) instead of ISO element names, works the same in both official languages, and connects straight to CIOOS review, DataCite DOIs and catalogue publishing.

## Operating Context

- Entry is per region: `/:language/:region/...`. The user picks a CIOOS region, and that region's branding and reviewers apply.
- A record is filled in across tabs (Start, Identification, Contacts, Spatial, Platform, Taxa, Resources, Submit) and saved as a draft between sessions.
- Saved contacts, platforms and instruments are reused across records.
- Submitted records go to regional reviewers. Automated review findings are shown on the record, and reviewers can request changes or publish.
- Translation between EN and FR is machine-assisted (Cohere, with a CIOOS glossary) and edited by the user.
- Sign-in uses Firebase Auth, including institutional providers (e.g. Microsoft for DFO).

## Capabilities and Constraints

- Every user-facing string exists in EN and FR, and both are first-class.
- Bilingual fields store both languages for each value.
- Validation maps errors to fields and tabs, and submission is blocked until required fields pass.
- Stack: React 19, Vite, MUI v7, Firebase (RTDB, Functions, Auth), React-Leaflet for maps.
- Light and dark colour schemes are both supported.

## Brand Commitments

- **EN/FR parity is binding.** French strings run longer, and layouts must hold them without truncating, overflowing or wrapping awkwardly.
- **Regional brand colours must never compromise contrast.** Each region supplies its own colours (ranging from near-black to saturated yellow), and the UI has to stay legible and accessible with any of them in both colour schemes.
- CIOOS / SIOOC naming and regional identities are preserved.

## Evidence on Hand

- Region definitions and brand colours: `src/regions.js`.
- In-app release notes: `src/data/githubReleases.json` (What's New page).
- No user research, analytics or testimonials are on hand. Don't fabricate any.

## Product Principles

1. **Guide, don't gatekeep.** Explain what a field means in plain language, and keep the ISO jargon behind the scenes.
2. **Never lose work.** Drafts, saved entities and translations must survive navigation, sign-out and errors.
3. **Two languages, one product.** Neither language is a translation afterthought.
4. **The region owns the colour, the system owns legibility.** Regional branding adapts to the system, never the other way round.
5. **Reviewers' time is scarce.** Surface problems before submission so review is quick.

## Accessibility & Inclusion

WCAG 2.1 AA is the required floor in both light and dark mode and with every region's colours: contrast, keyboard operation, visible focus, labelled controls and screen-reader-announced errors.
