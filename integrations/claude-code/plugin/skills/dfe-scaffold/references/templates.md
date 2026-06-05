# DFE Starter Templates

Available via `dfe init --template <alias>` or `getTemplate(id)` from `@dmc--98/dfe-core`.

| Alias | Template id | Best for | Demonstrates |
|-------|-------------|----------|--------------|
| `onboarding` | `user-onboarding` | Signup / account setup | Multi-step flow; conditional fields (business-only fields appear when account type = business) |
| `application` | `loan-application` | Loan / job / intake applications | Conditional employer field; a **computed** monthly estimate; a review step |
| `workflow` | `admin-approval-workflow` | Internal request → approval | Conditional fields; require-when-rejecting reason; **step branching** (approve skips to summary) |

Pick by the user's intent:
- "sign people up / onboard users" → `onboarding`
- "collect an application / intake / request details with a review" → `application`
- "someone submits, someone approves" → `workflow`

Each generates `src/forms/<id>.ts` exporting typed `FormField[]` and `FormStep[]` you then edit. They are real, validated configs — a correct starting point, not throwaway samples.
