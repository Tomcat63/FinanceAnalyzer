# Compliance & Data Privacy Rules

## 1. Data Minimization
- **RAM Only**: Customer financial data (CSV uploads) must be processed in-memory. No permanent storage in databases or files permitted in the standard workflow.
- **Session Scope**: Data persists only for the duration of the container's runtime/session or until explicit clearance.

## 2. PII & Anonymization (GDPR/DSGVO)
- **Legal Requirement**: Strictly adhere to GDPR (DSGVO).
- **Anonymization Logic**:
    - **Transactions**: "Zahlungsempfänger" (Payee) may be analyzed for categorization but must NOT be used to build persistent shadow profiles.
    - **LLM Interaction**: Before sending data to AI (Gemini/OpenRouter):
        - Mask IBANs (e.g., `DE12 **** ****`).
        - Mask Account Numbers.
        - Ensure User Prompts do not contain names or addresses if possible (warn user).
- **App Store Policy**: Apple/Google require transparency. Our privacy policy must state we do not store financial data persistently.

## 3. Security
- **API Keys**: Store `OPENROUTER_API_KEY` and other secrets ONLY in `.env`. Never commit keys to Git.
- **Transfers**: Enforce HTTPS for all Frontend-Backend communication (except local dev).

## 4. Local Execution Logic
- **Categorization**: Use local heuristic detectors (`FixedCostDetector`) first. Only use AI for "Advisory" or complex queries to minimize data egress.
