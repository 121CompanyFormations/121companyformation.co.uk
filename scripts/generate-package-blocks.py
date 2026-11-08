#!/usr/bin/env python3
"""Generate package comparison blocks from live package matrices."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BLOCKS = ROOT / "blocks"

YES = '<span class="cf-yes" aria-label="Included">✓</span>'
NO = '<span class="cf-no" aria-label="Not included">✕</span>'

TIERS4 = [
    "cf-table__tier--bronze",
    "cf-table__tier--gold",
    "cf-table__tier--platinum",
    "cf-table__tier--diamond",
]
TIERS2 = ["cf-table__tier--gold", "cf-table__tier--diamond"]


def cell(flag: str) -> str:
    return YES if flag == "Y" else NO


def titlecase_row(text: str) -> str:
    text = text.strip()
    upperish = sum(1 for c in text if c.isupper()) > len(text) * 0.55
    if text.isupper() or upperish:
        text = text.title()
        for old, new in [
            (" And ", " and "),
            (" Of ", " of "),
            (" To ", " to "),
            (" For ", " for "),
            (" Your ", " your "),
            (" The ", " the "),
            ("Vat", "VAT"),
            ("Llp", "LLP"),
            ("Gbp", "GBP"),
        ]:
            text = text.replace(old, new)
        text = text[0].upper() + text[1:]
    return text


def make_table(feature_head, heads, rows, buys, read_more, tier_classes):
    thead_cells = [f'<th scope="col" class="cf-table__feature-head">{feature_head}</th>']
    for (name, price), tc in zip(heads, tier_classes):
        thead_cells.append(
            f'<th scope="col" class="cf-table__tier {tc}">{name}<br />'
            f'<span class="cf-table__price">{price}</span></th>'
        )
    body = []
    for title, checks in rows:
        tds = "".join(f"<td>{cell(c)}</td>" for c in checks)
        body.append(
            "            <tr>\n"
            f"              <th scope=\"row\">{titlecase_row(title)}</th>\n"
            f"              {tds}\n"
            "            </tr>"
        )
    buy_tds = "".join(
        '<td><a class="cf-btn cf-btn--primary cf-btn--sm" href="javascript:void(0)" '
        f"onclick=\"packagesBuyNow('{b}');\">Buy now</a></td>"
        for b in buys
    )
    more_tds = "".join(
        f'<td><a class="cf-btn cf-btn--outline cf-btn--sm" href="{href}">Read more</a></td>'
        if href
        else "<td></td>"
        for href in read_more
    )
    body.append(
        "            <tr class=\"cf-table__actions\">\n"
        "              <th scope=\"row\"><span class=\"cf-sr-only\">Order</span></th>\n"
        f"              {buy_tds}\n"
        "            </tr>\n"
        "            <tr class=\"cf-table__actions cf-table__actions--secondary\">\n"
        "              <th scope=\"row\"><span class=\"cf-sr-only\">Details</span></th>\n"
        f"              {more_tds}\n"
        "            </tr>"
    )
    thead = "\n              ".join(thead_cells)
    return (
        '      <div class="cf-table-wrap">\n'
        '        <table class="cf-table cf-table--compare">\n'
        "          <thead>\n"
        "            <tr>\n"
        f"              {thead}\n"
        "            </tr>\n"
        "          </thead>\n"
        "          <tbody>\n"
        + "\n".join(body)
        + "\n"
        "          </tbody>\n"
        "        </table>\n"
        "      </div>\n"
        '      <p class="cf-pkg__footnote">*Subject to Companies House workload. '
        "Application can only be submitted after KYC (proof of ID and address).</p>\n"
    )


def expand(rows):
    return [(title, list(pattern)) for title, pattern in rows]


def write_block(name: str, html: str) -> None:
    (BLOCKS / f"{name}.html").write_text(
        f"<!-- Block: {name} -->\n{html.rstrip()}\n", encoding="utf-8"
    )


def feats_from_rows(rows, idx):
    return [(titlecase_row(title), pattern[idx] == "Y") for title, pattern in rows]


def mobile_cards(block_name, packages):
    """Grid-only fragment so it can be nested inside HOME_PACKAGES_MOBILE panels."""
    arts = []
    for p in packages:
        featured = " cf-pkg--featured" if p.get("featured") else ""
        badge = (
            '      <div class="cf-pkg__badge">Popular</div>\n' if p.get("featured") else ""
        )
        lis = []
        for feat, included in p["features"]:
            cls = "" if included else ' class="is-muted"'
            lis.append(f"        <li{cls}>{feat}</li>")
        arts.append(
            f'    <article class="cf-pkg cf-pkg--{p["slug"]}{featured}">\n'
            f"{badge}"
            f'      <h3 class="cf-pkg__name">{p["name"]}</h3>\n'
            f'      <div class="cf-pkg__price">{p["price"]}</div>\n'
            f'      <p class="cf-pkg__note">One-off package fee</p>\n'
            f'      <ul class="cf-pkg__list">\n'
            + "\n".join(lis)
            + "\n"
            f"      </ul>\n"
            f'      <div class="cf-pkg__actions">\n'
            f'        <a class="cf-btn cf-btn--primary cf-btn--block" href="javascript:void(0)" '
            f'onclick="packagesBuyNow(\'{p["buy"]}\');">Buy now</a>\n'
            f'        <a class="cf-btn cf-btn--outline cf-btn--block" href="{p["more"]}">Read more</a>\n'
            f"      </div>\n"
            f"    </article>"
        )
    html = '<div class="cf-pkg-grid">\n' + "\n".join(arts) + "\n</div>\n"
    write_block(block_name, html)


def main():
    lbs_rows = [
        ("Company registration", "YYYY"),
        ("Incorporation including Companies House fee", "YYYY"),
        ("Appointment of company officers and members", "YYYY"),
        ("Share capital set up", "YYYY"),
        ("Issuance of ordinary shares to shareholders", "YYYY"),
        ("Electronic company documents", "YYYY"),
        ("Free admin portal to manage your company’s profile & filings", "YYYY"),
        ("Free business banking referral", "YYYY"),
        ("First year company confirmation statement filing", "NYYY"),
        ("VAT registration", "NNYY"),
        ("First year end accounts and corporation tax", "NNNY"),
        ("First year quarterly VAT returns (optional)", "NNNY"),
    ]
    llp_rows = [
        ("LLP registration typically within 24 business hours", "YYYY"),
        ("Incorporation including Companies House fee", "YYYY"),
        ("Electronic company documents", "YYYY"),
        ("Free admin portal to manage your company’s profile & filings", "YYYY"),
        ("Free business banking referral", "YYYY"),
        ("First year company confirmation statement filing", "NYYY"),
        ("VAT registration", "NNYY"),
        ("First year quarterly VAT returns (optional)", "NNNY"),
    ]
    lbg_rows = [
        ("Company registration", "YYYY"),
        ("Incorporation including Companies House fee", "YYYY"),
        ("Appointment of company officers and members", "YYYY"),
        ("Electronic company documents", "YYYY"),
        ("Free admin portal to manage your company’s profile & filings", "YYYY"),
        ("Free business banking referral", "YYYY"),
        ("First year company confirmation statement filing", "NYYY"),
        ("VAT registration", "NNYY"),
        ("First year end accounts and corporation tax", "NNNY"),
        ("First year quarterly VAT returns (optional)", "NNNY"),
    ]
    intl_rows = [
        ("Company registration (typically within 24 business hours)", "YY"),
        ("Incorporation including Companies House fee", "YY"),
        ("Appointment of company officers and members", "YY"),
        ("Share capital set up", "YY"),
        ("Electronic company documents", "YY"),
        ("Free admin portal to manage your company’s profile & filings", "YY"),
        ("Free referral to OFX multi-currency account (including GBP)", "YY"),
        ("Free referral to GuavaPay", "YY"),
        ("Central London registered office address (first year)", "YY"),
        ("Central London director service address (first year)", "YY"),
        ("First year company confirmation statement filing", "YY"),
        ("Year end accounts & corporation tax return", "NY"),
    ]

    write_block(
        "PACKAGE_PAGE_LBS_Desktop",
        make_table(
            "Company Limited by Shares",
            [
                ("Bronze", "##LBS-PACKAGE_BRONZE_Price#"),
                ("Gold", "##LBS-PACKAGE_GOLD_Price#"),
                ("Platinum", "##LBS-PACKAGE_PLATINUM_Price#"),
                ("Diamond", "##LBS-PACKAGE_DIAMOND_Price#"),
            ],
            expand(lbs_rows),
            ["lbs-bronze", "lbs-gold", "lbs-platinum", "lbs-diamond"],
            ["/lbs-bronze/", "/lbs-gold/", "/lbs-platinum/", "/lbs-diamond/"],
            TIERS4,
        ),
    )
    write_block(
        "PACKAGE_PAGE_LLP_Desktop",
        make_table(
            "Limited Liability Partnership",
            [
                ("Bronze", "##LLP-PACKAGE_BRONZE_Price#"),
                ("Gold", "##LLP-PACKAGE_GOLD_Price#"),
                ("Platinum", "##LLP-PACKAGE_PLATINUM_Price#"),
                ("Diamond", "##LLP-PACKAGE_DIAMOND_Price#"),
            ],
            expand(llp_rows),
            ["llp-bronze", "llp-gold", "llp-platinum", "llp-diamond"],
            [
                "/limited-liability-partnership/",
                "/limited-liability-partnership/",
                "/limited-liability-partnership/",
                "/limited-liability-partnership/",
            ],
            TIERS4,
        ),
    )
    write_block(
        "PACKAGE_PAGE_LBG_Desktop",
        make_table(
            "Company Limited by Guarantee",
            [
                ("Bronze", "##LBG-PACKAGE_BRONZE_Price#"),
                ("Gold", "##LBG-PACKAGE_GOLD_Price#"),
                ("Platinum", "##LBG-PACKAGE_PLATINUM_Price#"),
                ("Diamond", "##LBG-PACKAGE_DIAMOND_Price#"),
            ],
            expand(lbg_rows),
            ["lbg-bronze", "lbg-gold", "lbg-platinum", "lbg-diamond"],
            [
                "/limited-by-guarantee-company/",
                "/limited-by-guarantee-company/",
                "/limited-by-guarantee-company/",
                "/limited-by-guarantee-company/",
            ],
            TIERS4,
        ),
    )
    write_block(
        "PACKAGE_PAGE_INTERNATIONAL_Desktop",
        make_table(
            "International packages",
            [
                ("International", "##INTERNATIONAL-PACKAGE_Price#"),
                ("International Plus", "##INTERNATIONAL-PACKAGE_PLUS_Price#"),
            ],
            expand(intl_rows),
            ["international-package", "international-plus-package"],
            ["/contact-us/", "/contact-us/"],
            TIERS2,
        ),
    )

    mobile_cards(
        "PACKAGE_PAGE_LBS_Mobile",
        [
            {
                "slug": "bronze",
                "name": "Bronze",
                "price": "##LBS-PACKAGE_BRONZE_Price#",
                "buy": "lbs-bronze",
                "more": "/lbs-bronze/",
                "features": feats_from_rows(lbs_rows, 0),
            },
            {
                "slug": "gold",
                "name": "Gold",
                "price": "##LBS-PACKAGE_GOLD_Price#",
                "buy": "lbs-gold",
                "more": "/lbs-gold/",
                "featured": True,
                "features": feats_from_rows(lbs_rows, 1),
            },
            {
                "slug": "platinum",
                "name": "Platinum",
                "price": "##LBS-PACKAGE_PLATINUM_Price#",
                "buy": "lbs-platinum",
                "more": "/lbs-platinum/",
                "features": feats_from_rows(lbs_rows, 2),
            },
            {
                "slug": "diamond",
                "name": "Diamond",
                "price": "##LBS-PACKAGE_DIAMOND_Price#",
                "buy": "lbs-diamond",
                "more": "/lbs-diamond/",
                "features": feats_from_rows(lbs_rows, 3),
            },
        ],
    )
    mobile_cards(
        "PACKAGE_PAGE_LLP_Mobile",
        [
            {
                "slug": "bronze",
                "name": "Bronze",
                "price": "##LLP-PACKAGE_BRONZE_Price#",
                "buy": "llp-bronze",
                "more": "/limited-liability-partnership/",
                "features": feats_from_rows(llp_rows, 0),
            },
            {
                "slug": "gold",
                "name": "Gold",
                "price": "##LLP-PACKAGE_GOLD_Price#",
                "buy": "llp-gold",
                "more": "/limited-liability-partnership/",
                "featured": True,
                "features": feats_from_rows(llp_rows, 1),
            },
            {
                "slug": "platinum",
                "name": "Platinum",
                "price": "##LLP-PACKAGE_PLATINUM_Price#",
                "buy": "llp-platinum",
                "more": "/limited-liability-partnership/",
                "features": feats_from_rows(llp_rows, 2),
            },
            {
                "slug": "diamond",
                "name": "Diamond",
                "price": "##LLP-PACKAGE_DIAMOND_Price#",
                "buy": "llp-diamond",
                "more": "/limited-liability-partnership/",
                "features": feats_from_rows(llp_rows, 3),
            },
        ],
    )
    mobile_cards(
        "PACKAGE_PAGE_LBG_Mobile",
        [
            {
                "slug": "bronze",
                "name": "Bronze",
                "price": "##LBG-PACKAGE_BRONZE_Price#",
                "buy": "lbg-bronze",
                "more": "/limited-by-guarantee-company/",
                "features": feats_from_rows(lbg_rows, 0),
            },
            {
                "slug": "gold",
                "name": "Gold",
                "price": "##LBG-PACKAGE_GOLD_Price#",
                "buy": "lbg-gold",
                "more": "/limited-by-guarantee-company/",
                "featured": True,
                "features": feats_from_rows(lbg_rows, 1),
            },
            {
                "slug": "platinum",
                "name": "Platinum",
                "price": "##LBG-PACKAGE_PLATINUM_Price#",
                "buy": "lbg-platinum",
                "more": "/limited-by-guarantee-company/",
                "features": feats_from_rows(lbg_rows, 2),
            },
            {
                "slug": "diamond",
                "name": "Diamond",
                "price": "##LBG-PACKAGE_DIAMOND_Price#",
                "buy": "lbg-diamond",
                "more": "/limited-by-guarantee-company/",
                "features": feats_from_rows(lbg_rows, 3),
            },
        ],
    )
    mobile_cards(
        "PACKAGE_PAGE_INTERNATIONAL_Mobile",
        [
            {
                "slug": "gold",
                "name": "International",
                "price": "##INTERNATIONAL-PACKAGE_Price#",
                "buy": "international-package",
                "more": "/contact-us/",
                "features": feats_from_rows(intl_rows, 0),
            },
            {
                "slug": "diamond",
                "name": "International Plus",
                "price": "##INTERNATIONAL-PACKAGE_PLUS_Price#",
                "buy": "international-plus-package",
                "more": "/contact-us/",
                "featured": True,
                "features": feats_from_rows(intl_rows, 1),
            },
        ],
    )
    print("Generated package blocks in", BLOCKS)


if __name__ == "__main__":
    main()
