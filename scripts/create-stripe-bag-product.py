#!/usr/bin/env python3
"""Create Stripe products/prices for Gambit case ($6/bag) and solo ($11.49/bag)."""
import json
import os
import sys
import urllib.parse
import urllib.request

CASE_CENTS = 600
SOLO_CENTS = 1149


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
    case_prod = stripe_post(
        "products",
        {
            "name": "Gambit Waffle Cut Plantain Chips, case bag",
            "description": "Case pricing. 3 servings per bag. Free shipping on cases of 6+.",
            "metadata[sku]": "gambit-case-bag",
        },
    )
    case_price = stripe_post(
        "prices",
        {
            "product": case_prod["id"],
            "unit_amount": str(CASE_CENTS),
            "currency": "usd",
        },
    )

    solo_prod = stripe_post(
        "products",
        {
            "name": "Gambit Waffle Cut Plantain Chips, solo bag",
            "description": "Try one chip. Single bag up to 5 before case pricing.",
            "metadata[sku]": "gambit-solo-bag",
        },
    )
    solo_price = stripe_post(
        "prices",
        {
            "product": solo_prod["id"],
            "unit_amount": str(SOLO_CENTS),
            "currency": "usd",
        },
    )

    out = {
        "case_product_id": case_prod["id"],
        "case_price_id": case_price["id"],
        "case_unit_amount_cents": CASE_CENTS,
        "solo_product_id": solo_prod["id"],
        "solo_price_id": solo_price["id"],
        "solo_unit_amount_cents": SOLO_CENTS,
    }
    print(json.dumps(out, indent=2))
    print("\nApps Script Script properties:", file=sys.stderr)
    print("  STRIPE_PRICE_ID      =", case_price["id"], file=sys.stderr)
    print("  STRIPE_PRICE_ID_SOLO =", solo_price["id"], file=sys.stderr)


if __name__ == "__main__":
    main()
