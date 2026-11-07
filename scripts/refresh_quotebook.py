#!/usr/bin/env python3
"""Refresh the public Quotebook data from its Google Sheet."""

import csv
import io
import json
from pathlib import Path
from urllib.request import Request, urlopen


SHEET_CSV = (
    "https://docs.google.com/spreadsheets/d/"
    "1Nk9crrlF-TXF-k0evJdG9WTIYJ4tAhecPmbyvu1h0Ic/export?format=csv&gid=0"
)
OUTPUT = Path(__file__).resolve().parents[1] / "quotebook" / "quotes.json"


def main():
    request = Request(SHEET_CSV, headers={"User-Agent": "Quotebook/1.0"})
    with urlopen(request, timeout=30) as response:
        text = response.read().decode("utf-8-sig")

    reader = csv.DictReader(io.StringIO(text))
    required = {"Quote", "By", "Date", "Cultural significance"}
    if not reader.fieldnames or not required.issubset(reader.fieldnames):
        raise ValueError("The public sheet did not return the expected CSV columns")

    quotes = []
    for row in reader:
        quote = (row.get("Quote") or "").strip()
        if quote:
            quotes.append(
                {
                    "quote": quote,
                    "by": (row.get("By") or "").strip(),
                    "date": (row.get("Date") or "").strip(),
                    "note": (row.get("Cultural significance") or "").strip(),
                }
            )

    if not quotes:
        raise ValueError("The public sheet contains no quotes; keeping the prior data")

    content = json.dumps(quotes, ensure_ascii=False, indent=2) + "\n"
    if not OUTPUT.exists() or OUTPUT.read_text(encoding="utf-8") != content:
        OUTPUT.write_text(content, encoding="utf-8")
        print(f"Updated {OUTPUT.name} with {len(quotes)} quotes")
    else:
        print(f"No changes: {len(quotes)} quotes")


if __name__ == "__main__":
    main()
