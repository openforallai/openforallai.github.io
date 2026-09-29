# openforallai

**Open for All AI.** A public, sourced record of what open AI costs and who pays for it.

Work in progress. The first rows go in on 2026-10-01.

## What it tracks

| File | What each row is |
|---|---|
| [`data/open_models.csv`](data/open_models.csv) | An open-weights model: who made it, where, its size and license, what training cost, and who paid |
| [`data/decentralized_compute.csv`](data/decentralized_compute.csv) | A GPU price on a decentralized network, next to the same GPU at a centralized provider |
| [`data/token_vs_usage.csv`](data/token_vs_usage.csv) | A month of a network's token emissions in dollars, against a usage number you can measure |
| [`data/korean_sovereign_ai.csv`](data/korean_sovereign_ai.csv) | A Korean government AI program: budget, recipient, and what it produced |
| [`data/funding_events.csv`](data/funding_events.csv) | Money going into an open-source AI project, and from what kind of funder |

## The one rule

Every row has a `source_url`. No source, no row.

## How the data gets here

The data is kept in a Google Sheet and published as CSV. A nightly GitHub Action copies it into `data/`, so every change has a history and the whole set can be forked.

## Corrections

If a number is wrong or a source is missing, open an issue or a pull request with the source.

## License

The data in [`data/`](data/) is under [CC BY 4.0](data/LICENSE): use it for anything, including commercially, and credit "openforallai" with a link to this repository. The code is under the [Apache License 2.0](LICENSE).
