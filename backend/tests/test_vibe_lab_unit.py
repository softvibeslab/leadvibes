from vibe_lab import normalize_group_row, score_group


def test_normalize_group_excludes_honeypot():
    row = {
        "group": "Anti-spam honeypot. DO NOT CLICK",
        "link": "https://chat.whatsapp.com/example",
        "type": "Spammer Honeypot",
        "platform": "WhatsApp",
        "notes": "AI will report bots",
    }

    normalized = normalize_group_row(row, "superlist.xlsx")

    assert normalized["is_excluded"] is True
    assert normalized["exclusion_reason"] == "honeypot/spam trap"
    assert normalized["score"] == 0


def test_normalize_group_classifies_buy_sell():
    row = {
        "group": "Active Ladie's Sales",
        "link": "https://chat.whatsapp.com/example",
        "type": "Buy\\Sell",
        "platform": "Whatsapp",
        "full": "",
    }

    normalized = normalize_group_row(row, "superlist.xlsx")

    assert normalized["segment"] == "buy_sell"
    assert normalized["platform"] == "WhatsApp"
    assert normalized["best_offer_type"] == "voucher"
    assert normalized["score"] >= 80


def test_score_group_caps_at_one_hundred():
    assert score_group("WhatsApp", "business", False, "Good signal business group", False) == 100
