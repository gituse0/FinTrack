// ======================
// SECTION SWITCHING
// ======================
function showSection(section) {
  document.querySelectorAll(".section").forEach(sec => {
    sec.classList.remove("active");
  });

  document.getElementById(`section-${section}`).classList.add("active");

  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.remove("active");
  });

  event.target.classList.add("active");
}

// ======================
// ADD TRANSACTION
// ======================
async function submitTransaction() {
  const title = document.getElementById("f-title").value;
  const amount = document.getElementById("f-amount").value;
  const type = document.getElementById("f-type").value;
  const category = document.getElementById("f-category").value;
  const date = document.getElementById("f-date").value;
  const note = document.getElementById("f-note").value;

  if (!title || !amount || !date) {
    document.getElementById("form-msg").innerText = "Fill all required fields!";
    return;
  }

  await fetch("/api/transactions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title,
      amount,
      type,
      category,
      date,
      note
    })
  });

  document.getElementById("form-msg").innerText = "Transaction added!";
  
  clearForm();
  loadAll();
}

// ======================
// CLEAR FORM
// ======================
function clearForm() {
  document.getElementById("f-title").value = "";
  document.getElementById("f-amount").value = "";
  document.getElementById("f-date").value = "";
  document.getElementById("f-note").value = "";
}

// ======================
// LOAD TRANSACTIONS
// ======================
async function loadTransactions(month = "") {
  let url = "/api/transactions";
  if (month) url += `?month=${month}`;

  const res = await fetch(url);
  const data = await res.json();

  renderTransactions(data);
}

// ======================
// RENDER TABLE
// ======================
function renderTransactions(data) {
  const tbody = document.getElementById("txnTableBody");
  tbody.innerHTML = "";

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-row">No transactions yet.</td></tr>`;
    return;
  }

  data.forEach(txn => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${txn.date}</td>
      <td>${txn.title}</td>
      <td>${txn.category}</td>
      <td><span class="badge badge-${txn.type}">${txn.type}</span></td>
      <td class="amount-${txn.type}">$${txn.amount}</td>
      <td><button class="delete-btn" onclick="deleteTxn(${txn.id})">✕</button></td>
    `;

    tbody.appendChild(row);
  });
}

// ======================
// DELETE
// ======================
async function deleteTxn(id) {
  await fetch(`/api/transactions/${id}`, {
    method: "DELETE"
  });

  loadAll();
}

// ======================
// LOAD SUMMARY
// ======================
async function loadSummary(month = "") {
  let url = "/api/summary";
  if (month) url += `?month=${month}`;

  const res = await fetch(url);
  const data = await res.json();

  document.getElementById("income").innerText = `$${data.income}`;
  document.getElementById("expenses").innerText = `$${data.expenses}`;
  document.getElementById("balance").innerText = `$${data.balance}`;

  updateCharts(data);
}

// ======================
// CHARTS (Chart.js)
// ======================
let pieChart, barChart;

function updateCharts(data) {
  const categories = Object.keys(data.by_category);
  const values = Object.values(data.by_category);

  // PIE CHART
  const pieCtx = document.getElementById("pieChart").getContext("2d");

  if (pieChart) pieChart.destroy();

  pieChart = new Chart(pieCtx, {
    type: "pie",
    data: {
      labels: categories,
      datasets: [{
        data: values
      }]
    }
  });

  // BAR CHART
  const barCtx = document.getElementById("barChart").getContext("2d");

  if (barChart) barChart.destroy();

  barChart = new Chart(barCtx, {
    type: "bar",
    data: {
      labels: ["Income", "Expenses"],
      datasets: [{
        data: [data.income, data.expenses]
      }]
    }
  });
}

// ======================
// MONTH FILTER
// ======================
document.getElementById("monthFilter").addEventListener("change", (e) => {
  const month = e.target.value;
  loadTransactions(month);
  loadSummary(month);
});

function clearMonth() {
  document.getElementById("monthFilter").value = "";
  loadAll();
}

// ======================
// LOAD EVERYTHING
// ======================
function loadAll() {
  loadTransactions();
  loadSummary();
}

// ======================
// INIT
// ======================
loadAll();
