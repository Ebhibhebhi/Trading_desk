import json
from pathlib import Path

CONFIG_FILE = Path(__file__).parent.parent / "config.json"

DEFAULT_CONFIG: dict = {
    "thresholds": {
        "buy": 0.65,
        "watch": 0.40,
    },
    "region": "los angeles",
    "max_events": 50,
    "days_ahead": 90,
}


def load_config() -> dict:
    if CONFIG_FILE.exists():
        with open(CONFIG_FILE) as f:
            return json.load(f)
    return DEFAULT_CONFIG.copy()


def save_config(config: dict) -> dict:
    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f, indent=2)
    return config
