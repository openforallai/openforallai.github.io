# Adding and correcting data

Corrections and new rows are welcome as pull requests. The bar is the same for everyone.

## The rules

1. **Every row has a source, and the source must state the number.** A page that implies it, or a number you worked out yourself, is not a source. If you can't find it stated, leave the field empty or leave the row out.
2. **Prefer primary sources:** the model card, the maker's announcement, the provider's pricing page, the government's press release or budget document. Use news articles only when no primary source exists.
3. **No estimates of your own.** `training_cost_usd_estimate` holds an estimate only when a named source published it.
4. **Numbers are plain:** `1450000000000`, not `₩1.45T` or `1,450,000,000,000`. Dates are `YYYY-MM-DD`; months are `YYYY-MM`.
5. **One row, one fact.** A new price on a new date is a new row; old rows stay, so the history is kept.

## The columns

**`open_models.csv`**: one open-weights model.
`name` as on the model card · `org` · `country` of the org, full English name (`United States`, `China`, `South Korea`, `France`, `UAE`, `Canada`, …) · `params` total, with active for mixture-of-experts, e.g. `284B (13B active)` · `license` as the maker names it (`MIT`, `Apache-2.0`, `custom`) · `release_date` when the weights went public · `training_cost_usd_estimate` · `funding_source`: `corporate`, `corporate_gov` (a company model built under a government programme, e.g. Korea's sovereign foundation model project, where the government's share isn't published), `state`, `crypto` or `donation` · `source_url` · `added_date`, the day the row was added.

**`decentralized_compute.csv`**: one GPU price on a decentralized network, next to the same GPU at a centralized provider on about the same date.
`network` · `gpu_type` · `usd_per_hour` · `source_url` for that price · `centralized_provider` · `centralized_usd_per_hour` · `centralized_source_url` · `premium_pct` (leave empty; the site works it out) · `date` · `available` and `total`: units free to rent and units listed when the price was read, if the network shows them · `notes`: what the price is (average, lowest, which product) and anything a reader needs, e.g. "availability counts hosts, not GPUs".

**`token_vs_usage.csv`**: one month of one network.
`network` · `month` · `emissions_usd` · `usage_metric` (what is counted) · `usage_value` · `emissions_usd_per_usage_unit` (may be empty) · `source_url`.

**`korean_sovereign_ai.csv`**: one Korean government AI program or award.
`program` · `budget_krw` in won · `recipient` · `model_output` (the model it produced, if any) · `date` · `source_url`.

**`funding_events.csv`**: money into an open-source AI project.
`project` · `amount_usd` · `funder_type`: `corporate`, `state`, `crypto`, `donation` or `vc` · `date` · `source_url`.

## Before you open a pull request

Run `python3 scripts/check_data.py`. It checks headers, required fields, number and date formats and source links. It also runs on every pull request.
