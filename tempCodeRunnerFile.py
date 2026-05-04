from flask import Flask, render_template, request, jsonify
import sqlite3
import os
from datetime import datetime

app = Flask(__name__)
DB_PATH = "finance.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            amount REAL NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
            category TEXT NOT NULL,
            date TEXT NOT NULL,
            note TEXT
        )
    """)
    conn.commit()
    conn.close()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/transactions", methods=["GET"])
def get_transactions():
    month = request.args.get("month")
    conn = get_db()
    if month:
        rows = conn.execute(
            "SELECT * FROM transactions WHERE strftime('%Y-%m', date) = ? ORDER BY date DESC",
            (month,)
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM transactions ORDER BY date DESC"
        ).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route("/api/transactions", methods=["POST"])
def add_transaction():
    data = request.json
    conn = get_db()
    conn.execute(
        "INSERT INTO transactions (title, amount, type, category, date, note) VALUES (?, ?, ?, ?, ?, ?)",
        (data["title"], float(data["amount"]), data["type"], data["category"], data["date"], data.get("note", ""))
    )
    conn.commit()
    conn.close()
    return jsonify({"status": "ok"}), 201

@app.route("/api/transactions/<int:txn_id>", methods=["DELETE"])
def delete_transaction(txn_id):
    conn = get_db()
    conn.execute("DELETE FROM transactions WHERE id = ?", (txn_id,))
    conn.commit()
    conn.close()
    return jsonify({"status": "deleted"})

@app.route("/api/summary", methods=["GET"])
def get_summary():
    month = request.args.get("month")
    conn = get_db()
    if month:
        rows = conn.execute(
            "SELECT type, category, SUM(amount) as total FROM transactions WHERE strftime('%Y-%m', date) = ? GROUP BY type, category",
            (month,)
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT type, category, SUM(amount) as total FROM transactions GROUP BY type, category"
        ).fetchall()
    conn.close()

    income = 0
    expenses = 0
    by_category = {}
    for r in rows:
        if r["type"] == "income":
            income += r["total"]
        else:
            expenses += r["total"]
            by_category[r["category"]] = by_category.get(r["category"], 0) + r["total"]

    return jsonify({
        "income": income,
        "expenses": expenses,
        "balance": income - expenses,
        "by_category": by_category
    })

if __name__ == "__main__":
    init_db()
    app.run(debug=True)