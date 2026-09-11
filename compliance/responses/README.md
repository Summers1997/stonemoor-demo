# Responses

Answers a named person has given to questions the pipeline asked.

Write these with `compliance respond`, which reads the last report so nobody has to copy a
64-character hash by hand:

```bash
compliance respond \
  --rule CLAIM-ENVIRONMENT-001 \
  --answer evidenced \
  --statement "Assessed by Example Carbon Consultants in March 2026, covering materials, transport and plant." \
  --evidence "Shared drive /compliance/carbon-assessment-2026.pdf" \
  --by "A Client" --role Director --organisation "Example Trading Limited"
```

## What a response is, and what it is not

A response records that **a question was answered**. It is not an exception, and the distinction is
load-bearing.

| | Response | Exception |
|---|---|---|
| Says | "here is the answer" | "we accept this risk" |
| Applies to | `REVIEW_REQUIRED` only | any open finding |
| Bound to | what was asked about | a finding, with an expiry |
| Needs | a statement, and evidence where the answer is that evidence exists | a reason, a compensating control and an approver |

A failing control has not asked a question, and a control that errored has an unknown risk nobody is
in a position to answer for. Neither can be retired by a response — both need an exception, which is
a deliberate acceptance of risk by somebody entitled to accept it.

## How an answer survives to the next release

A response is bound to the finding's **subject fingerprint** — a hash over the phrases, assets or
quotations the question was about — rather than to a commit.

So the answer stands for exactly as long as that content is unchanged. Deploy an unrelated fix and
the answer still applies. Add a new claim and it lapses, and the report says which wording nobody has
answered for. That is the behaviour you want: binding to a commit would force a re-answer on every
release, which is how a control comes to be ignored; binding to the rule alone would let new copy
inherit an answer given about different copy.

Files in this directory are compliance metadata, so they do not dirty the working tree for gate
purposes — an answer cannot exist before the run that asked the question.
