---
goals:
  business_goals:
    - Create an all-purpose internal admin console for our external SaaS platform 'Dropiti'
    - Use this admin console to manage our external SaaS platform 'Dropiti'
    - Use this admin console to manage our internal operations and workflows
    - Use this admin console to manage our users and their permissions
    - Use this admin console to manage our integrations with external services
    - Use this admin console to manage our billing and payments
    - Use this admin console to manage our notifications and communications
    - Use this admin console to manage our logs and monitoring
    - Use this admin console to manage our settings and configurations
  product_goals:
    - High user satisfaction emphasizing simplicity, ease-of-use, and minimal free-text input.
    - Successfully operate as a reliable admin console for our external SaaS platform 'Dropiti', implementing necessary KYC for payout compliance.
    - Maintain low levels of successful fraud/scam activity through proactive detection.
  measurable_kpis:
    - Include verification rates.
    - Include badge adoption.
    - Include fraud metrics.
target_audience:
  primary_user_personas:
    - Super Admin: Initial focus (P1/P2): Super Admin who will be responsible for managing the admin console and the external SaaS platform 'Dropiti'
    - Admin: Initial focus (P1/P2): Admin who will be responsible for managing the admin console and the external SaaS platform 'Dropiti'
assumptions:
  - Structured, choice-driven workflows are acceptable and preferred by the target users for simplicity, efficiency, data capture, and consistency.
  - Dropiti-admin-console can effectively act as transaction agent & implement necessary KYC.
  - Core processes/architecture allows flexibility for evolution.
  - We will use the same technology stack as our external SaaS platform 'Dropiti'
  - the Super Admin and Admin will be the only user with access to the admin console
constraints:
  - Dependence on current external payment processor AirWallex
  - Dependence on external payment processor & AI APIs, potentially KYC providers.
  - User adoption of structured workflows, AI tools, and verification steps.
  - Data privacy regulations (persona building, KYC - consent first).
  - Need for robust security (verification data, KYC data, ratings, commissions).
  - Managing user expectations & clear approval workflows for AI-generated content/translations/kit enhancements.
  - Designing core data models/workflows with enough flexibility for future evolution without over-complicating MVP.
---

# Dropiti-admin-console - Project Vision & Scope (v1)

## 1. Introduction

- **1.1. Project Name:** Dropiti-admin-console (Dropiti-admin-console)
- **1.2. Document Purpose:** To define the strategic vision, goals, target audience, and high-level scope for the Dropiti-admin-console platform, serving as the baseline for initial development phases.
- **1.3. Project Overview:** Dropiti-admin-console is a platform that allows the Super Admin and Admin to manage the external SaaS platform 'Dropiti'. The initial focus is to manage the payout process for customers onboarded onto the external SaaS platform 'Dropiti'.

## 2. Business Opportunity / Problem Statement

- **2.1. Market Need/Gap:** Hong Kong individuals and companies struggle with the pre-tenancy process when applying for a new tenancy in real-estate. Using the SaaS platform 'Dropiti', clients are able to apply for a new tenancy for real-estate with the 'Dropiti' platform. With the development integrations and blockchain technology, the 'Dropiti' platform is able to provide a seamless and efficient process for clients to apply for a new tenancy for real-estate and to manage the payout process for customers onboarded onto the external SaaS platform 'Dropiti'.

- **2.2. Why this platform? Why now?:** In order to go live with the external SaaS platform 'Dropiti', we need to be able to manage the payout process for customers onboarded onto the external SaaS platform 'Dropiti'.

## 3. Vision Statement

'Dropiti' is a platform that allows individuals and companies to apply for a new tenancy for real-estate with the 'Dropiti' platform. With the development integrations and blockchain technology, the 'Dropiti' platform is able to provide a seamless and efficient process for clients to apply for a new tenancy for real-estate and to manage the payout process for customers onboarded onto the external SaaS platform 'Dropiti'.

## 4. Core Value Proposition / Unique Selling Points (USPs)

- **AI-Powered Efficiency:** Intelligent matching, automated workflows (structured negotiation), AI content assistance, AI marketing kit enhancement & translation - all accessible via simple interfaces.
- **Structured Workflow Hub:** Centralized, efficient management of the entire partnership lifecycle. Minimized ambiguity, faster processing, better data capture, and enhanced consistency via structured, choice-driven processes.
- **Trust & Safety:** Robust multi-level verification, clear badges, proactive fraud/bot detection, compliance checks (KYC).
- **Dual-Sided Tools & Value:** Sophisticated tools benefiting both the Super Admin and Admin.

## 5. Scope (Phased Approach Summary - aligned with Roadmap v1)

- **P1:** Core loop MVP (Simple matching, apply, approve, track, transact). Extreme focus on simplicity & choice-based UI.
- **P2:** Stabilize, enhance usability, add parity features (ratings, basic CRM), foundational verification & trust badges, basic monetization, initial AI assist. Internal fraud detection systems activated.
- **P3:** Launch core AI differentiators (Matching, Content Assist, Structured Negotiation, Persona Analysis - using verified data), full monetization (inc. simple matching fee), RBAC, text translation, tier/performance badges, optional/mandatory KYC implementation. Wave 2 expansion.
