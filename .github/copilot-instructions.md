# Copilot Instructions - Delta Workforces Payroll Project

## 1. General Principles

- Purpose: A payroll receipt portal for Delta Workforces employees. Data is imported from QuickBooks via CSV/JSON.
- Main Goal: Both Admin and Employees must primarily visualize the last 4 weeks of payment to maintain clear and recent payroll control.
- Language Policy:
    - Codebase: 100% English (variables, functions, comments, commits).
    - UI/UX: Strictly English. Use high-quality, professional labels and messages only.
- Simplicity: Targeted at industrial/operational personnel. Clean UI, large tap targets, and intuitive navigation.
- Clean Code: Follow SOLID principles. Functions must be small and have a Single Responsibility (SRP). Use meaningful, descriptive English names.
- Security: Protect sensitive data (SSN, amounts, deductions). Never expose private information in logs or raw API responses.

## 2. Architecture & Modularization

- Structure: Monorepo with folders `/client` (Vue 3 + Vite) and `/server` (Node.js + Express + Sequelize).
- Decoupling Strategy: Business logic must be separated from the framework.
- Backend: Use a layered architecture: Routes -> Controllers -> Services -> Models.
- Frontend: Separate concerns: Views (pages), Components (UI), Composables (state/logic), and Services (API clients).
- Modularity: Organize code into self-contained modules. Avoid "God files" or monolithic controllers.

## 3. Frontend Standards (Vue 3)

- Framework: Vue 3 using `<script setup>` (Composition API).
- Componentization:
    - Use Atomic Design. Create reusable presentational components in `src/components/common`.
    - Components must be modular, receive data via props, and communicate via emits.
    - Extract complex logic into Composables (`src/composables`) to keep components thin.
- Visual Style (Delta Branding):
    - Primary: delta-blue (#1448A8).
    - Backgrounds: delta-gray (#F3F4F6).
    - Typography: Clean Sans-serif (Inter/Montserrat).
    - Icons: Use `lucide-vue-next`.
- Mobile First: Mandatory optimization for mobile devices.
- Hierarchy: The Dashboard must highlight the latest payment received above the historical list.

## 4. Backend & Database Standards

- Stack: Node.js, Express, PostgreSQL, Sequelize.
- Clean API: Use a dedicated Service Layer to handle QuickBooks parsing and complex DB operations.
- Query Rule (4-Week Limit):
    - All payroll queries must implement `limit: 4` and `order: [['payment_date', 'DESC']]`.
    - This applies to both employee views and admin previews.
- Flexibility: Use `JSONB` for the `details` field in the receipts table to store dynamic payroll data (hours, bonuses, deductions).
- PDF Generation: Puppeteer "on-the-fly". Use `--no-sandbox` and `--disable-setuid-sandbox` flags for Docker/Railway compatibility.
- Auth: JWT-based sessions. `auth.js` middleware is mandatory for all protected routes.

## 5. Import & Administration Flow

- Automation: If an imported employee does not exist in the DB, the system must auto-create a User + Employee record with a temporary password.
- Hybrid Matching: Implement robust matching logic by `quickbooks_id`, filename parsing, or `first_name + last_name` heuristics.
- Admin Capability: Allow the administrator to view the 4-week history of any selected employee.

## 6. Error Handling & UX

- UX: Clear English notifications (Toasts) for all status changes (success/error).
- Resilience: Implement robust `try-catch` blocks in all asynchronous operations.
- Consistency: Use a centralized error-handling middleware in the backend and a decoupled API utility in the frontend.

---

Notes for contributors:

- Keep all code and commit messages in English.
- When editing UI text, use professional, concise English copy.
- Do not log sensitive payroll fields. Use structured server-side logs and redact PII.

This file contains the canonical project conventions for Copilot and contributors. Follow it when creating new features or refactoring existing modules.