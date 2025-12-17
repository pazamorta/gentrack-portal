---
trigger: always_on
---

# Antigravity Salesforce Delivery Rules (GTCX)

## 1. Org Alias Management

- **Target Org:** Always point all Salesforce CLI commands and tool interactions to the specific org alias: **GTCX**.
- **Verification:** Before running any destructive or deployment commands, verify the connection context is set to **GTCX** org id 00DDx000000LN4nMAG with username juan.trujillopez@gmail.com.gtk.emea.demo.gtcx

## 2. Metadata Operations

To ensure consistency and compatibility with the Antigravity workflow, use the designated Salesforce MCP tools for all environment synchronization:

- **Retrieval:** Use `retrieve_metadata` to pull changes from the GTCX org.
- **Deployment:** Use `deploy_metadata` to push local changes to the GTCX org.
- **Note:** Avoid raw `sf project deploy start` commands unless explicitly directed; favor the MCP abstractions.

## 3. Security and Permission Sets

Security is a day-zero requirement.

- **Mandatory Update:** Whenever a new Custom Object or Custom Field is created, you must immediately update:
  - **Permission Set Name:** `Gentrack_B2B_Access`
- **Requirements:**
  - Ensure **Object Level Security (OLS)** is defined (Read/Create/Edit as required).
  - Ensure **Field Level Security (FLS)** is defined (Edit/Read access) for all newly created fields.

## 4. Lightning Web Component (LWC) Development

When developing LWCs, you must consult and follow the guidelines provided by the Salesforce MCP tools. Do not rely on generic documentation; use these specific guides to ensure "Antigravity" compliance:

| Requirement           | MCP Tool / Guide to Use                          |
| --------------------- | ------------------------------------------------ |
| Design Guidelines     | `guide_design_general`                           |
| Code Quality/Patterns | `guide_lwc_best_practices`                       |
| Standard Procedures   | `guide_lwc_development`                          |
| Security Standards    | `guide_lwc_security`                             |
| Data Handling         | `guide_lds_development` (Lightning Data Service) |
| Unit Testing          | `create_lwc_jest_tests`                          |

**LWC Workflow**

- **Analyze:** Run `guide_lwc_development` and `guide_lwc_best_practices` before starting the implementation.
- **Secure:** Reference `guide_lwc_security` if the component handles sensitive data or user input.
- **Optimize:** Use `guide_lds_development` to prefer Lightning Data Service over Apex wherever possible.
- **Validate:** Every LWC must have a corresponding Jest test suite created via `create_lwc_jest_tests`.

---

## 6. Apex Development Rules (Server-Side)

### 6.1 When to Use Apex

- **Prefer LDS / UI API first** (especially for CRUD/FLS correctness and simpler maintenance).
- Use Apex only when **platform features can’t satisfy** the requirement (complex orchestration, integrations, heavy validation, async processing).

### 6.2 Code Structure & Quality

- **No logic in triggers.** Triggers should delegate immediately to a handler/service layer.
- **Bulkify everything.** Assume every entry point receives lists (triggers, invocable, queueable input).
- **No SOQL/DML in loops.** Aggregate IDs, query once, DML once.
- **Be governor-limit aware** (CPU, heap, SOQL rows/queries, DML rows/statements). Escalate to async (Queueable/Batch/Scheduled) when appropriate.

### 6.3 Security (Mandatory)

Apex commonly runs with elevated permissions; you must explicitly enforce security:

- Default to `with sharing` or `inherited sharing` unless there is a documented exception.
- **Enforce CRUD/FLS** for any Apex that reads/writes SObjects for UI use:
  - Prefer SOQL `WITH SECURITY_ENFORCED` where it fits.
  - Otherwise validate via Schema describe checks and/or `Security.stripInaccessible(...)`.
- Avoid dynamic SOQL where possible. If required, **use bind variables** and prevent injection patterns.

### 6.4 Performance & UX (Apex for UI)

- Mark read-only `@AuraEnabled` methods as cacheable when safe (`cacheable=true`).
- Avoid chatty server calls: design APIs to fetch what the UI needs in as few round-trips as possible.

---

## 7. Apex Testing Rules (Mandatory)

### 7.1 Minimum Requirements

- **Every new/changed Apex class/trigger must include/update tests** in the same delivery.
- Tests must be deterministic and isolated:
  - Default `SeeAllData=false`.
  - Create only the data you need.
- Deployment readiness:
  - Maintain **>= 75% org-wide Apex coverage** and ensure **all tests pass**.

### 7.2 What Every Test Suite Must Cover

- **Happy path + negative path** (expected exceptions/validation failures).
- **Bulk coverage:** test lists (e.g., 200 records) for trigger/service paths.
- **Assertions required:** verify outcomes (DML results, field values, side effects). No “coverage-only” tests.
- Use `@testSetup` for shared baseline data.
- Use `Test.startTest()` / `Test.stopTest()` around async, limits-sensitive sections, and to flush Queueables/Futures.

---

## 8. Lightning Pages Rules (Lightning App Builder / FlexiPages)

### 8.1 Design & Maintainability

- Prefer **standard components** and **Dynamic Forms/Dynamic Actions** over custom UI where feasible.
- Keep pages simple:
  - Minimize component count and nesting.
  - Avoid adding multiple bespoke components when one well-designed component will do.
- Use **Visibility Rules** deliberately:
  - Keep rule logic readable; document intent in the commit/PR description.
  - Validate behavior for each target profile/record type/device form factor.

### 8.2 Performance

- Treat Lightning pages as performance-sensitive surfaces:
  - Review **Lightning Page Performance** and page load behavior after changes.
  - Avoid components that trigger unnecessary Apex calls on load.

### 8.3 Security

- Don’t “surface” sensitive fields via custom components unless you explicitly enforce CRUD/FLS in Apex and respect sharing.
- Prefer standard record components when possible to inherit platform security behavior.

### 8.4 Testing Lightning Pages (Practical)

Lightning Pages aren’t unit-tested like code, so you must add a **page smoke checklist** to every change:

- Load page as an admin + at least one lower-privilege user.
- Verify:
  - Component visibility rules behave as intended.
  - Fields shown/hidden align with FLS expectations.
  - No unexpected errors/toasts on load.
  - Key interactions work (edit/save, related lists, actions).
- If the page uses custom LWCs/Apex:
  - Ensure **Jest tests** (LWC) and **Apex tests** are updated accordingly.

---

## 9. Summary Checklist for Tasks

- Am I connected to **GTCX**?
- Have I used `retrieve_metadata` or `deploy_metadata`?
- If I added a field/object, is it in the **Gentrack_B2B_Access** permission set?
- Have I validated my **LWC** against the 6 MCP Guide Tools?
- Does the **LWC** have Jest tests?
- If I added/changed **Apex**, do I have:
  - CRUD/FLS + sharing handled correctly?
  - Tests covering happy/negative/bulk paths with real assertions?
- If I changed a **Lightning Page**, did I:
  - Keep it lightweight and readable (visibility rules)?
  - Run the Lightning Page smoke checklist (admin + low-priv user)?
  - Update Jest/Apex tests for any custom components/controllers?
