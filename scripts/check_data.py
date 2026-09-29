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
    ],
    "token_vs_usage": [
        "network", "month", "emissions_usd", "usage_metric", "usage_value",
        "emissions_usd_per_usage_unit", "source_url",
    ],
    "korean_sovereign_ai": [
        "program", "budget_krw", "recipient", "model_output", "date", "source_url",
    ],
    "funding_events": ["project", "amount_usd", "funder_type", "date", "source_url"],
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
}

NUMBERS = {
    "training_cost_usd_estimate", "usd_per_hour", "centralized_usd_per_hour", "premium_pct",
    "emissions_usd", "usage_value", "emissions_usd_per_usage_unit", "budget_krw", "amount_usd",
}
DATES = {"release_date", "added_date", "date"}
CHOICES = {
    "funding_source": {"corporate", "state", "crypto", "donation"},
    "funder_type": {"corporate", "state", "crypto", "donation", "vc"},
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


def main():
    problems = []
    for name, columns in SCHEMA.items():
        problems += check(name, columns)
    extra = {p.stem for p in DATA.glob("*.csv")} - SCHEMA.keys()
    problems += [f"data/{e}.csv: not a known table" for e in sorted(extra)]
    for p in problems:
        print(p)
    if problems:
        sys.exit(1)
    print("data OK")


if __name__ == "__main__":
    main()
