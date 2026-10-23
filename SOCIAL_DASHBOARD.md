# TN Lens social intelligence — v0.3

## Product question

How do published YouTube and Instagram content themes relate to measurable Tamil Nadu development questions, and what do the original public sources actually substantiate?

This is **not** a voter analytics or persuasion system. No individual audience profiles, party preference classifications, sentiment verdicts, location inference, or targeting recommendations.

## Waterfall navigation

**Overview → Platform → Topic → Individual public post → Development outcome compact**

The Social dashboard opens first. Platform options focus on YouTube and Instagram, with other authorised public channels grouped separately. Topic labels come from the import CSV; they are **not** model-generated or representative survey categories. A reviewer selects a development compact manually so no unsupported causal bridge is inferred.

The contribution waterfall is an *additive chart*, not a trend. It adds recorded **likes + comments + shares** across platforms, topics, posts, or interaction types. The total is exactly the sum of the visible source rows, not an estimate of Tamil Nadu residents' opinions.

## Source integrity and data states

- **No import:** The screen explicitly says no social feed is connected. No artificial engagement examples appear in production.
- **Import:** CSV records are validated against the supported platform host, published date, topic, URL and nonnegative numeric counts. The importer does not authenticate account ownership or reported counts.
- **Drilldown:** Each post retains its public HTTPS URL, platform, publication date, topic, reported metrics and import timestamp.
- **Date filter:** Uses *post publication date*, not the period in which lifetime views or interactions were earned. Never call a filtered total "views this week".
- **Missing views:** Displayed as unknown; missing counts are never treated as zero. The dashboard states how many posts have known views.
- **Export:** A Markdown memo includes filters, source links, metric coverage, disclosed limits and a topic breakdown.
- **Persistence:** Hosted static site stores edits only in the visitor's browser. The backend is local-only until access control is implemented.

## Import schema

Use **Download CSV template**. Required columns:

```
platform,published_on,topic,post_url,views,likes,comments,shares
```

No private messages, individual commenters, user identifiers, private profile exports or personal data. Only platform-permitted data exports from public organisational accounts.

## Source connections not implemented

- **YouTube:** Public-video metadata can be retrieved with YouTube Data API `videos.list` when a project has an appropriate credential and quota. Confirm exact channel IDs and data rights before ingestion. Google's 2026-08-24 adjustment to view-count definitions affects interpretation. [Official videos reference](https://developers.google.com/youtube/data/reference/rest/v3/videos).
- **Instagram:** Instagram Insights needs applicable professional-account authorization, token scopes and channel access; Meta's official API is not an unrestricted public scraping tool. [Meta's Instagram API documentation](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api).
- **Publication/source link:** WTL's site links its Instagram foundation handle. That is a reference for account verification, not evidence of a connected live feed. [WTL site](https://www.wetheleader.org/).

Do not place tokens in client-side JavaScript or static hosting environment builds. Use a server-side connector with secrets management, rate limits, data minimisation, a transparent refresh timestamp and source-audit trail.

## Manual acceptance

1. Open the deployed site; it should land on **Social dashboard** without presenting fictional engagement numbers.
2. Import a valid public-post CSV; the total recorded interactions should equal the sum of likes + comments + shares across imported rows.
3. Select YouTube → a topic → an individual post; verify source URL and metric coverage.
4. Move back through breadcrumb links; change the published-date filter; export a Markdown source memo.
5. Choose a Tamil Nadu 2031 outcome and open its compact. Confirm it does **not** assert a political pledge, causality or verified impact.
6. Test at a narrow mobile viewport and with an invalid-domain CSV; the latter must not be silently accepted.
