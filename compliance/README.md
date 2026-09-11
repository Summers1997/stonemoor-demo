# Compliance configuration for this website

This directory is the project-specific half of the Push Pipeline. The rules, checks and gate
logic live in the pipeline package; only decisions about *this client and this site* live here.

| Path | What it is | Who owns it |
|---|---|---|
| `config/client-profile.yml` | The compliance intake questionnaire. Determines which controls apply. | Agency, answered with the client |
| `config/site-profile.yml` | Technical profile: repo, framework, URLs, routes, DAST authorisation. | Agency |
| `config/policy.yml` | Agency policy: how strict we choose to be. Never a statement of law. | Agency compliance owner |
| `registry/processors.yml` | Third parties that receive data from this site. | Agency, confirmed by client |
| `registry/asset-register.yml` | Provenance and licence of every material third-party asset. | Agency, provenance from client for client-supplied assets |
| `registry/ai-register.yml` | AI-generated assets and their misleadingness review. | Agency |
| `approvals/` | Client and specialist sign-off, each bound to a git commit and content hash. | Client / specialist |
| `exceptions/` | Knowingly accepted findings. Every one expires. | Named approver |
| `evidence/`, `reports/`, `releases/` | Generated. Gitignored — these are private and may contain client detail. | Generated |

## Commands

```bash
npx compliance validate     # config and rule packs parse, and what would activate
npx compliance classify     # risk classification, with every trigger and its reason
npx compliance run          # full run, writes an evidence pack and evaluates the gate
```

## The one thing to understand

A green report is not a legal opinion. It records that a documented, repeatable, risk-based
process ran against an identified commit, what it found, and who accepted what. That is the
claim the agency can defend. Anything stronger is not supportable and the pipeline is built so
it cannot be produced.
