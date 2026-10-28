#!/usr/bin/env python3
"""One-off helper: create placeholder products + Payment Links (requires STRIPE_SECRET_KEY)."""
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
    catalog = [
        ("classic", "Classic Blend", 1299),
        ("spicy", "Spicy Stack", 1299),
        ("house", "House Special", 1499),
    ]
    products = []
    for slug, title, cents in catalog:
        prod = stripe_post(
            "products",
            {
                "name": f"Gambit Chips, {title}",
                "description": "Placeholder listing. Artwork and story coming soon.",
                "metadata[slug]": slug,
                "metadata[status]": "placeholder",
            },
        )
        price = stripe_post(
            "prices",
            {"product": prod["id"], "unit_amount": str(cents), "currency": "usd"},
        )
        link = stripe_post(
            "payment_links",
            {
                "line_items[0][price]": price["id"],
                "line_items[0][quantity]": "1",
                "allow_promotion_codes": "true",
                "billing_address_collection": "auto",
            },
        )
        products.append(
            {
                "slug": slug,
                "title": title,
                "amount_cents": cents,
                "payment_link_url": link["url"],
            }
        )
    out_path = os.path.join(os.path.dirname(__file__), "..", "stripe-config.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump({"products": products}, f, indent=2)
    print("Wrote stripe-config.json. Copy payment_link_url values into index.html")


if __name__ == "__main__":
    main()
