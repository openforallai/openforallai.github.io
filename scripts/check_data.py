#!/usr/bin/env python3
"""Checks every file in data/ before it reaches the site.

Run it locally with `python3 scripts/check_data.py`. It also runs on every
push and pull request. It exits non-zero and names the file, row and column
of every problem it finds.
"""
import csv
import re
import sys
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"

SCHEMA = {
    "open_models": [
        "name", "org", "country", "params", "license", "release_date",
        "training_cost_usd_estimate", "funding_source", "source_url", "added_date",
    ],
    "decentralized_compute": [
        "network", "gpu_type", "usd_per_hour", "source_url", "centralized_provider",
        "centralized_usd_per_hour", "centralized_source_url", "premium_pct", "date",
        "available", "total", "notes",
    ],
    "token_vs_usage": [
        "network", "month", "emissions_usd", "usage_metric", "usage_value",
        "emissions_usd_per_usage_unit", "source_url",
    ],
    "korean_sovereign_ai": [
        "program", "budget_krw", "recipient", "model_output", "date", "source_url",
    ],
    "funding_events": ["project", "amount_usd", "funder_type", "date", "source_url"],
    "benchmarks": [
        "model", "org", "country", "weights", "benchmark", "score", "measured_by",
        "setting", "date", "source_url", "notes",
    ],
    "model_releases": ["model", "org", "weights", "release_date", "source_url", "notes"],
    "agent_run_costs": [
        "model", "org", "weights", "benchmark", "score", "usd_per_run", "statistic",
        "hours_per_run", "date", "source_url", "notes",
    ],
}

REQUIRED = {
    "open_models": ["name", "org", "country", "funding_source", "source_url", "added_date"],
    "decentralized_compute": [
        "network", "gpu_type", "usd_per_hour", "source_url", "centralized_provider",
        "centralized_usd_per_hour", "centralized_source_url", "date",
    ],
    "token_vs_usage": ["network", "month", "emissions_usd", "usage_metric", "usage_value", "source_url"],
    "korean_sovereign_ai": ["program", "budget_krw", "date", "source_url"],
    "funding_events": ["project", "amount_usd", "funder_type", "date", "source_url"],
    "benchmarks": ["model", "org", "weights", "benchmark", "score", "measured_by", "date", "source_url"],
    "model_releases": ["model", "org", "weights", "source_url"],
    "agent_run_costs": ["model", "org", "weights", "benchmark", "usd_per_run", "statistic", "date", "source_url"],
}

NUMBERS = {
    "training_cost_usd_estimate", "usd_per_hour", "centralized_usd_per_hour", "premium_pct",
    "emissions_usd", "usage_value", "emissions_usd_per_usage_unit", "budget_krw", "amount_usd",
    "available", "total", "score", "usd_per_run", "hours_per_run",
}
DATES = {"release_date", "added_date", "date"}
CHOICES = {
    "funding_source": {"corporate", "corporate_gov", "state", "crypto", "donation"},
    "funder_type": {"corporate", "state", "crypto", "donation", "vc"},
    "weights": {"open", "closed"},
    "statistic": {"mean", "median"},
}

DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
MONTH_RE = re.compile(r"^\d{4}-\d{2}$")
NUMBER_RE = re.compile(r"^-?\d+(\.\d+)?$")


def check(name, columns):
    problems = []
    path = DATA / f"{name}.csv"
    if not path.exists():
        return [f"{path.name}: missing"]
    with path.open(newline="", encoding="utf-8") as f:
        rows = list(csv.reader(f))
    if not rows or rows[0] != columns:
        return [f"{path.name}: header must be exactly: {','.join(columns)}"]
    for n, row in enumerate(rows[1:], start=2):
        where = f"{path.name} line {n}"
        if not any(v.strip() for v in row):
            problems.append(f"{where}: empty line")
            continue
        if len(row) != len(columns):
            problems.append(f"{where}: {len(row)} fields, expected {len(columns)}")
            continue
        rec = dict(zip(columns, row))
        for col in REQUIRED[name]:
            if not rec[col].strip():
                problems.append(f"{where}: {col} is required")
        for col, v in rec.items():
            v = v.strip()
            if not v:
                continue
            if v != rec[col]:
                problems.append(f"{where}: {col} has spaces around it")
            if col.endswith("source_url") and not v.startswith(("https://", "http://")):
                problems.append(f"{where}: {col} must be a full URL")
            elif col in NUMBERS and not NUMBER_RE.match(v):
                problems.append(f"{where}: {col} must be a plain number (no commas, symbols or units), got '{v}'")
            elif col in DATES and not DATE_RE.match(v):
                problems.append(f"{where}: {col} must be YYYY-MM-DD, got '{v}'")
            elif col == "month" and not MONTH_RE.match(v):
                problems.append(f"{where}: month must be YYYY-MM, got '{v}'")
            elif col in CHOICES and v not in CHOICES[col]:
                problems.append(f"{where}: {col} must be one of {sorted(CHOICES[col])}, got '{v}'")
    return problems


def read_keys(name, columns):
    """(model, org, weights) of every row, or None if the file can't be read."""
    path = DATA / f"{name}.csv"
    if not path.exists():
        return None
    with path.open(newline="", encoding="utf-8") as f:
        rows = list(csv.reader(f))
    if not rows or rows[0] != columns:
        return None
    i = [columns.index(c) for c in ("model", "org", "weights")]
    return [
        (n, tuple(r[j] for j in i))
        for n, r in enumerate(rows[1:], start=2)
        if len(r) == len(columns)
    ]


def check_join(name):
    """Every model in the table must match a model in benchmarks.csv exactly
    (model, org and weights), so the site can join them and open/closed is
    decided in one place."""
    rows = read_keys(name, SCHEMA[name])
    benchmarks = read_keys("benchmarks", SCHEMA["benchmarks"])
    if rows is None or benchmarks is None:
        return []
    known = {k for _, k in benchmarks}
    known_models = {k[0] for k in known}
    problems = []
    for n, (model, org, weights) in rows:
        if (model, org, weights) in known:
            continue
        where = f"{name}.csv line {n}"
        if model in known_models:
            problems.append(f"{where}: '{model}' is in benchmarks.csv, but with a different org or weights")
        else:
            problems.append(f"{where}: model '{model}' is not in benchmarks.csv")
    return problems


def main():
    problems = []
    for name, columns in SCHEMA.items():
        problems += check(name, columns)
    problems += check_join("model_releases")
    problems += check_join("agent_run_costs")
    extra = {p.stem for p in DATA.glob("*.csv")} - SCHEMA.keys()
    problems += [f"data/{e}.csv: not a known table" for e in sorted(extra)]
    for p in problems:
        print(p)
    if problems:
        sys.exit(1)
    print("data OK")


if __name__ == "__main__":
    main()
