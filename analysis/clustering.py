"""Cluster digital watch products into price ranges with K-Means.

Run from this folder after installing requirements:
    pip install -r requirements.txt
    python clustering.py
"""

from __future__ import annotations

import argparse
import getpass
import json
import os
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
import requests
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

DEFAULT_OUTPUT = Path(__file__).resolve().parent / "cluster_results.json"
DEFAULT_API_URL = "http://119.59.102.161:3098/api/products"


def load_products(api_url: str, token: str) -> pd.DataFrame:
    """Read priced digital watches through the authenticated product API."""
    response = requests.get(
        api_url,
        params={"page": 1, "limit": 100},
        headers={"Authorization": f"Bearer {token}"},
        timeout=15,
    )
    response.raise_for_status()
    payload = response.json()
    items = payload.get("items", []) if isinstance(payload, dict) else payload
    products = pd.DataFrame(items)
    if products.empty:
        return products
    products["price"] = pd.to_numeric(products.get("price"), errors="coerce")
    products["monthly_sales"] = (
        pd.to_numeric(products["monthly_sales"], errors="coerce").fillna(0)
        if "monthly_sales" in products.columns
        else 0
    )
    return products.loc[products["price"] > 0, ["id", "name", "category", "price", "monthly_sales"]].copy()


def get_login_token(api_url: str) -> str:
    """Authenticate to obtain JWT token."""
    token = os.getenv("CLUSTERING_AUTH_TOKEN")
    if token:
        return token

    print("=== Digital Watch AI/ML Clustering Login ===")
    username = input("Username [admin]: ").strip() or "admin"
    password = getpass.getpass("Password: ")
    login_url = api_url.rsplit("/products", 1)[0] + "/auth/login"
    response = requests.post(
        login_url,
        json={"username": username, "password": password},
        timeout=15,
    )
    response.raise_for_status()
    token = response.json().get("token")
    if not token:
        raise ValueError("Login succeeded but did not return an authentication token.")
    return token


def cluster_products(products: pd.DataFrame, requested_clusters: int = 3) -> tuple[pd.DataFrame, list[dict]]:
    """Assign each digital watch to low, medium, or high price clusters using K-Means."""
    if len(products) < 2:
        raise ValueError("At least two products with a price greater than 0 are required.")

    cluster_count = min(requested_clusters, len(products))
    values = products[["price"]].astype(float)
    scaled_values = StandardScaler().fit_transform(values)
    model = KMeans(n_clusters=cluster_count, random_state=42, n_init=10)
    products = products.copy()
    products["raw_cluster"] = model.fit_predict(scaled_values)

    ordered_clusters = sorted(
        range(cluster_count), key=lambda index: float(model.cluster_centers_[index][0])
    )
    label_names = ["low", "medium", "high"][:cluster_count]
    cluster_mapping = {
        raw_cluster: label_names[order_index]
        for order_index, raw_cluster in enumerate(ordered_clusters)
    }
    products["cluster"] = products["raw_cluster"].map(cluster_mapping)

    summaries = []
    for label in label_names:
        cluster_rows = products.loc[products["cluster"] == label]
        if cluster_rows.empty:
            continue
        summaries.append({
            "cluster": label,
            "product_count": int(len(cluster_rows)),
            "average_price": round(float(cluster_rows["price"].mean()), 2),
            "min_price": round(float(cluster_rows["price"].min()), 2),
            "max_price": round(float(cluster_rows["price"].max()), 2),
            "average_monthly_sales": round(float(cluster_rows["monthly_sales"].mean()), 2),
            "total_monthly_sales": int(cluster_rows["monthly_sales"].sum()),
        })

    return products, summaries


def publish_results(api_url: str, token: str, result: dict) -> None:
    """Publish the cluster assignments to the backend database."""
    clusters_url = api_url.rsplit("/products", 1)[0] + "/clusters"
    response = requests.post(
        clusters_url,
        json={"products": result["products"]},
        headers={"Authorization": f"Bearer {token}"},
        timeout=15,
    )
    response.raise_for_status()
    print("✅ Cluster results successfully published to backend database!")


def main() -> None:
    parser = argparse.ArgumentParser(description="K-Means Digital Watch Price Clustering")
    parser.add_argument("--api-url", default=DEFAULT_API_URL, help="Backend /api/products URL")
    parser.add_argument("--clusters", type=int, default=3, help="Number of clusters (default: 3)")
    parser.add_argument("--no-publish", action="store_true", help="Do not send results to backend")
    args = parser.parse_args()

    token = get_login_token(args.api_url)
    products = load_products(args.api_url, token)
    if products.empty:
        print("No products found to cluster.")
        return

    print(f"Loaded {len(products)} digital watches. Running K-Means...")
    clustered, summaries = cluster_products(products, args.clusters)

    result = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "clusters": summaries,
        "products": [
            {
                "id": str(row["id"]),
                "name": str(row["name"]),
                "price": float(row["price"]),
                "monthly_sales": int(row["monthly_sales"]),
                "cluster": str(row["cluster"]),
            }
            for _, row in clustered.iterrows()
        ],
    }

    with open(DEFAULT_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    print(f"Results saved to {DEFAULT_OUTPUT}")

    if not args.no_publish:
        publish_results(args.api_url, token, result)


if __name__ == "__main__":
    main()
