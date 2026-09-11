# verify/

The library's own check harness, pointed at this site.

    python <library>/_tools/serve.py 8791 --root <this project>
    # then open http://127.0.0.1:8791/verify/check-all.html
    #      and press "Run everything"

**Use that server, not `python -m http.server`.** It sends no-cache
headers, and without them the browser will happily keep running a
`site.js` it fetched ten minutes ago. That is not hypothetical: a real
chassis fix, on disk and being served correctly, appeared not to work
for twenty minutes for exactly this reason. A cache-buster on the page
URL does not help - it does not reach the scripts the page pulls in.

Regenerate after adding or removing a page:

    python <library>/_tools/make_targets.py --project <this folder>

This folder sits outside `site/`, which is the web root, so it is never
deployed. Do not put anything in here that you would mind publishing
anyway - the separation is a convention, not a guarantee.

`check_project.py` and this are different questions and you want both:
that one asks whether the library's demo content is still in the site,
this one asks whether the pages actually work.

## Neither of them is the go-live gate

Both run while you are BUILDING. Before the site goes live, the Push
Pipeline is the authority - accessibility against WCAG 2.2, claims,
reviews, image and font licensing, cookies before consent, security
headers, and a deployment gate with approvals bound to a commit.

    npx compliance init && npx compliance run

Where this harness and the Push Pipeline disagree about accessibility,
**the Pipeline is right** - it runs axe-core and tests reflow at 320px,
the actual success criterion, where this one checks 375px. This harness
earns its place by running in seconds with no configuration, not by
being thorough. See `_tools/PIPELINE-BOUNDARY.md` in the library.
