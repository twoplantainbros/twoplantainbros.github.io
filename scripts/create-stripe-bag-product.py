#!/usr/bin/env python3
"""Create one Stripe Product + $6 Price for Gambit bags (used by Checkout / Apps Script)."""
import json
import os
import sys
import urllib.parse
import urllib.request


def stripe_post(path: str, data: dict) -> dict:
    key = os.environ.get("STRIPE_SECRET_KEY")
    if not key:
        sys.exit("Set STRIPE_SECRET_KEY in the environment.")
    body = urllib.parse.urlencode(data).encode()
    req = urllib.request.Request(
        f"https://api.stripe.com/v1/{path}",
        data=body,
        method="POST",
        headers={"Authorization": f"Bearer {key}"},
    )
    with urllib.request.urlopen(req) as resp:
        return json.load(resp)


def main() -> None:
    prod = stripe_post(
        "products",
        {
            "name": "Gambit Waffle-Cut Plantain Chips — single bag",
            "description": "3 servings per bag. Free shipping when ordering 6+ bags.",
            "metadata[sku]": "gambit-bag",
        },
    )
    price = stripe_post(
        "prices",
        {
            "product": prod["id"],
            "unit_amount": "600",
            "currency": "usd",
        },
    )
    out = {"product_id": prod["id"], "price_id": price["id"], "unit_amount_cents": 600}
    print(json.dumps(out, indent=2))
    print("\nSet STRIPE_PRICE_ID in Apps Script to:", price["id"], file=sys.stderr)


if __name__ == "__main__":
    main()
