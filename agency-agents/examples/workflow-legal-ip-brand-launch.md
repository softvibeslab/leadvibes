# Workflow: Legal IP & Brand Launch

Use with: `Legal IP & Brand Formation Architect`

## Goal

Turn a software project, SaaS product, AI product, marketplace, or digital community into an attorney-ready legal launch packet covering intellectual property, trademark, company formation, privacy, contracts, and legal operations.

This workflow does not replace a lawyer, trademark attorney, notary, accountant, or tax advisor. It creates the structured evidence, questions, checklists, and draft scaffolds those professionals need to review faster.

## Ideal Use Cases

- A founder wants to protect a new software brand before launch.
- A SaaS already has users but no clean IP assignment trail.
- A product team wants to register software, documentation, courses, templates, or marketplace assets.
- A company needs to decide whether to form an entity before charging customers.
- A marketplace wants creator terms, seller rules, takedown flow, and revenue-share documentation.
- A CRM, AI agent, or marketing platform needs privacy/data mapping before commercial rollout.

## Inputs To Collect First

| Area | Minimum input |
| --- | --- |
| Brand | Product name, logo, slogans, domains, social handles, target market |
| Software | Repositories, release version, contributors, vendors, agencies, major dependencies |
| Ownership | Founder agreements, employment contracts, contractor SOWs, invoices, IP assignments |
| Business | Pricing, customers, legal owner today, desired entity, investor plans |
| Data | User data collected, CRM/leads data, payments, analytics, AI prompts, files uploaded |
| Assets | Fonts, icons, templates, datasets, generated AI assets, stock media |
| Geography | Default Mexico, plus any US/EU/international customers or contractors |

## Agent Activation Prompt

```text
Activate Legal IP & Brand Formation Architect.

Scope: [Mexico / Mexico + international]
Product: [name]
Business model: [SaaS / marketplace / agency / AI product / community]
Goal: create an attorney-ready legal launch packet.

Start with Skill 1: IP Intake & Ownership Triage.
Do not provide legal advice. Produce checklists, risk flags, evidence requests, and professional review questions.
```

## Phase 1: IP Intake & Ownership Triage

Skill: `IP Intake & Ownership Triage`

Prompt:

```text
Run an IP intake for this software product.
Create an asset inventory, chain-of-title matrix, missing assignment checklist, and P0/P1/P2 risk map.
Ask only for missing evidence that changes the legal readiness score.
```

Expected output:

- IP asset inventory.
- Ownership chain matrix.
- Missing contracts/assignments.
- Open-source and AI provenance gap list.
- Attorney handoff memo.

## Phase 2: Trademark Readiness

Skill: `Trademark Clearance & IMPI Filing Planner`

Prompt:

```text
Prepare a trademark readiness plan for Mexico.
Separate brand name, product name, logo, slogan, domain, and legal company name.
Map likely Nice classes and produce an IMPI filing packet checklist.
Use placeholders for fees or dates that require current official verification.
```

Expected output:

- Trademark filing matrix.
- Proposed Nice class/product-service map.
- Search plan: exact, phonetic, visual, conceptual, Spanish/English variants.
- Filing packet checklist.
- Professional review questions before filing.

## Phase 3: Software Copyright Readiness

Skill: `Software Copyright & INDAUTOR Registration Planner`

Prompt:

```text
Prepare an INDAUTOR software registration readiness packet.
Identify what version of the software should be deposited, who the authors are, who owns patrimonial rights, what evidence is missing, and what should be redacted or archived.
```

Expected output:

- Work registration brief.
- Authors versus rights-holder matrix.
- Deposit package checklist.
- Version/evidence storage plan.
- Assignment gaps for counsel review.

## Phase 4: Entity And Operating Vehicle

Skill: `Company Formation & Brand Vehicle Readiness`

Prompt:

```text
Create a legal vehicle readiness brief.
Compare the practical questions for SAS, S. de R.L., S.A. de C.V., or S.A.P.I. discussion with counsel/accountant.
Include denomination authorization, RFC, bank, invoicing, founder governance, and IP transfer to the entity.
```

Expected output:

- Entity readiness score.
- Founder decision matrix.
- Denomination checklist.
- Post-formation checklist.
- Attorney, notary, and accountant handoff.

## Phase 5: Contracts, Privacy, And Marketplace Rules

Skills:

- `SaaS Contract Pack Generator`
- `Privacy & Data Protection Compliance Mapper`

Prompt:

```text
Generate the contract and privacy work plan for this software launch.
Create attorney-review outlines for SaaS terms, privacy notice, DPA, contractor SOW, IP assignment, NDA, marketplace seller terms, and AI acceptable use policy.
Map the personal data flows and flag consent, processor, retention, transfer, and AI-training risks.
```

Expected output:

- Contract pack index.
- Clause variables requiring attorney review.
- Data map.
- Privacy notice outline.
- Vendor/processor register.
- ARCO/request and incident runbook.

## Phase 6: Open Source And AI Provenance

Skill: `Open Source & AI Provenance Audit`

Prompt:

```text
Audit open-source, AI-generated, stock, template, font, icon, dataset, and marketplace assets.
Create a release gate that flags GPL/AGPL, missing attribution, missing license proof, AI output provenance, and third-party model terms.
```

Expected output:

- License and asset provenance table.
- High-risk dependency log.
- Remediation plan.
- Release gate checklist.

## Phase 7: Legal Ops Calendar And Evidence Vault

Skill: `Legal Ops Calendar & Evidence Vault Builder`

Prompt:

```text
Create a 12-month legal ops system.
Design the evidence vault folder taxonomy, naming convention, owner matrix, review calendar, filing deadline register, and monthly checklist.
```

Expected output:

- Evidence vault structure.
- Legal calendar CSV-style table.
- Deadline register.
- Monthly founder/legal ops checklist.
- Board/founder legal status report template.

## Suggested Evidence Vault

```text
legal-vault/
  00-intake/
  01-brand/
    trademarks/
    domains/
    logos/
    evidence-of-use/
  02-software-ip/
    repositories/
    release-deposits/
    authorship/
    assignments/
    open-source/
    ai-provenance/
  03-corporate/
    denomination/
    formation/
    rfc-tax/
    governance/
  04-contracts/
    ndas/
    customers/
    contractors/
    marketplace/
    privacy/
  05-filings-certificates/
    impi/
    indautor/
    sat/
  06-calendar-deadlines/
  07-attorney-handoff/
```

## Final Deliverable Prompt

```text
Compile everything into a Legal Architecture Brief for attorney review.
Include:
1. Executive summary
2. Legal maturity score
3. P0 blockers
4. Asset map
5. Trademark filing matrix
6. Software registration readiness
7. Company formation readiness
8. Contract/privacy pack
9. Open-source and AI provenance findings
10. Evidence vault and 12-month legal calendar
11. Questions for attorney, accountant, notary, and IP specialist
```

