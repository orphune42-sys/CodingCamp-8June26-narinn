const STORAGE_KEYS = {
  transactions: "expenseTransactions",
  name: "pd_userName",
  theme: "pd_theme",
  todos: "pd_todos",
  links: "pd_links",
  timerMinutes: "pd_timerMinutes",
};

const CATEGORY_COLORS = {
  Food: "#D9A33E",
  Transport: "#4A7C8C",
  Fun: "#B45A8A",
  Education: "#00503D",
  Fashion: "#000055",
};


const CATEGORIES = ["Food", "Transport", "Fun", "Education", "Fashion"];
const transactionForm = document.getElementById("transactionForm");
const itemNameInput = document.getElementById("itemName");
const amountInput = document.getElementById("amount");
const categorySelect = document.getElementById("category");

const nameError = document.getElementById("nameError");
const amountError = document.getElementById("amountError");
const categoryError = document.getElementById("categoryError");

const transactionList = document.getElementById("transactionList");
const emptyState = document.getElementById("emptyState");
const countBadge = document.getElementById("countBadge");
const totalBalanceEl = document.getElementById("totalBalance");

const chartCanvas = document.getElementById("spendingChart");
const chartEmpty = document.getElementById("chartEmpty");
const categorySummary = document.getElementById("categorySummary");

let spendingChart = null;
let transactions = [];

//data transaksi from storage lokal
function loadTransactions() {
  const saved = localStorage.getItem(STORAGE_KEYS.transactions);
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions));
}

//format angka to mata uang
function formatCurrency(value) {
  return "$" + value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

//bagian error
function validateForm() {
  let isValid = true;

  const nameValue = itemNameInput.value.trim();
  const amountValue = parseFloat(amountInput.value);
  const categoryValue = categorySelect.value;

  if (nameValue === "") {
    showError(itemNameInput, nameError);
    isValid = false;
  } else {
    hideError(itemNameInput, nameError);
  }

  if (isNaN(amountValue) || amountValue <= 0) {
    showError(amountInput, amountError);
    isValid = false;
  } else {
    hideError(amountInput, amountError);
  }

  if (categoryValue === "") {
    showError(categorySelect, categoryError);
    isValid = false;
  } else {
    hideError(categorySelect, categoryError);
  }

  return isValid;
}

function showError(inputEl, errorEl) {
  inputEl.classList.add("invalid");
  errorEl.classList.add("visible");
}

function hideError(inputEl, errorEl) {
  inputEl.classList.remove("invalid");
  errorEl.classList.remove("visible");
}

function addTransaction(name, amount, category) {
  transactions.push({
    id: Date.now(),
    name: name,
    amount: amount,
    category: category,
  });
  saveTransactions();
  renderExpenseSection();
}

//hapus transaksi
function deleteTransaction(id) {
  transactions = transactions.filter((item) => item.id !== id);
  saveTransactions();
  renderExpenseSection();
}

function renderTransactionList() {
  transactionList.innerHTML = "";

  if (transactions.length === 0) {
    transactionList.appendChild(emptyState);
    emptyState.style.display = "block";
    countBadge.textContent = "0";
    return;
  }

  emptyState.style.display = "none";
  countBadge.textContent = String(transactions.length);

  // tampilkan transaksi terbaru
  const sortedTransactions = [...transactions].slice().reverse();

  sortedTransactions.forEach((transaction) => {
    const item = document.createElement("div");
    item.className = "transaction-item";

    const dot = document.createElement("span");
    dot.className = "category-dot " + transaction.category;

    const info = document.createElement("div");
    info.className = "transaction-info";

    const name = document.createElement("p");
    name.className = "transaction-name";
    name.textContent = transaction.name;

    const category = document.createElement("p");
    category.className = "transaction-category";
    category.textContent = transaction.category;

    info.appendChild(name);
    info.appendChild(category);

    const amount = document.createElement("span");
    amount.className = "transaction-amount";
    amount.textContent = formatCurrency(transaction.amount);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.type = "button";
    deleteBtn.setAttribute("aria-label", "Delete transaction");
    deleteBtn.textContent = "×";
    deleteBtn.addEventListener("click", () => {
      deleteTransaction(transaction.id);
    });

    item.appendChild(dot);
    item.appendChild(info);
    item.appendChild(amount);
    item.appendChild(deleteBtn);

    transactionList.appendChild(item);
  });
}

function renderTotalBalance() {
  const total = transactions.reduce((sum, item) => sum + item.amount, 0);
  totalBalanceEl.textContent = formatCurrency(total);
}

function getCategoryTotals() {
  const totals = {};
  CATEGORIES.forEach((category) => {
    totals[category] = 0;
  });

  transactions.forEach((transaction) => {
    if (totals[transaction.category] !== undefined) {
      totals[transaction.category] += transaction.amount;
    }
  });

  return totals;
}

function getChartBorderColor() {
  return document.body.classList.contains("dark-mode") ? "#1B2A22" : "#FFFFFF";
}

function renderChart() {
  const totals = getCategoryTotals();
  const totalAmount = Object.values(totals).reduce((a, b) => a + b, 0);

  if (totalAmount === 0) {
    chartCanvas.style.display = "none";
    chartEmpty.style.display = "block";

    if (spendingChart) {
      spendingChart.destroy();
      spendingChart = null;
    }
    return;
  }

  chartCanvas.style.display = "block";
  chartEmpty.style.display = "none";

  const labels = CATEGORIES;
  const data = CATEGORIES.map((category) => totals[category]);
  const colors = CATEGORIES.map((category) => CATEGORY_COLORS[category]);

  if (spendingChart) {
    spendingChart.data.datasets[0].data = data;
    spendingChart.data.datasets[0].borderColor = getChartBorderColor();
    spendingChart.update();
  } else {
    spendingChart = new Chart(chartCanvas, {
      type: "pie",
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: colors,
            borderColor: getChartBorderColor(),
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const value = context.parsed;
                return context.label + ": " + formatCurrency(value);
              },
            },
          },
        },
      },
    });
  }
}

function renderCategorySummary() {
  const totals = getCategoryTotals();
  const totalAmount = Object.values(totals).reduce((a, b) => a + b, 0);

  categorySummary.innerHTML = "";

  CATEGORIES.forEach((category) => {
    const amount = totals[category];
    const percent = totalAmount === 0 ? 0 : (amount / totalAmount) * 100;

    const row = document.createElement("div");
    row.className = "category-summary-item";

    const dot = document.createElement("span");
    dot.className = "category-dot " + category;

    const name = document.createElement("span");
    name.className = "category-summary-name";
    name.textContent = category;

    const amountEl = document.createElement("span");
    amountEl.className = "category-summary-amount";
    amountEl.textContent = formatCurrency(amount);

    const percentEl = document.createElement("span");
    percentEl.className = "category-summary-percent";
    percentEl.textContent = percent.toFixed(1) + "%";

    row.appendChild(dot);
    row.appendChild(name);
    row.appendChild(amountEl);
    row.appendChild(percentEl);

    categorySummary.appendChild(row);
  });
}

function renderExpenseSection() {
  renderTransactionList();
  renderTotalBalance();
  renderChart();
  renderCategorySummary();
}

transactionForm.addEventListener("submit", function (event) {
  event.preventDefault();

  if (!validateForm()) {
    return;
  }

  const name = itemNameInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const category = categorySelect.value;

  addTransaction(name, amount, category);

  transactionForm.reset();
  itemNameInput.focus();
});

const dateText = document.getElementById("dateText");
const timeText = document.getElementById("timeText");
const greetingText = document.getElementById("greetingText");
const greetingName = document.getElementById("greetingName");
const userNameInput = document.getElementById("userNameInput");


function getGreetingByHour(hour) {
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 18) return "Good afternoon";
  if (hour >= 18 && hour < 22) return "Good evening";
  return "Good night";
}

// Update jam, tanggal, dan sapaan setiap detik
function updateClockAndGreeting() {
  const now = new Date();

  dateText.textContent = now.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  timeText.textContent = now.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const greeting = getGreetingByHour(now.getHours());
  const savedName = localStorage.getItem(STORAGE_KEYS.name) || "";

  greetingText.firstChild.textContent = greeting;
  greetingName.textContent = savedName ? ", " + savedName : "!";
}

function loadUserName() {
  const savedName = localStorage.getItem(STORAGE_KEYS.name) || "";
  userNameInput.value = savedName;
}

userNameInput.addEventListener("input", function () {
  localStorage.setItem(STORAGE_KEYS.name, userNameInput.value.trim());
  updateClockAndGreeting();
});

const timerDisplay = document.getElementById("timerDisplay");
const ringProgress = document.getElementById("ringProgress");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const resetBtn = document.getElementById("resetBtn");
const timerMinutesInput = document.getElementById("timerMinutes");

const RING_CIRCUMFERENCE = 2 * Math.PI * 90; // r = 90

let sessionMinutes = 25;
let remainingSeconds = sessionMinutes * 60;
let timerInterval = null;
let isRunning = false;

function renderTimerDisplay() {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const minutesStr = String(minutes).padStart(2, "0");
  const secondsStr = String(seconds).padStart(2, "0");
  timerDisplay.textContent = minutesStr + ":" + secondsStr;
}

function renderTimerRing() {
  const totalSeconds = sessionMinutes * 60;
  const fraction = totalSeconds === 0 ? 0 : remainingSeconds / totalSeconds;
  const offset = RING_CIRCUMFERENCE * (1 - fraction);
  ringProgress.style.strokeDashoffset = String(offset);
}

function startTimer() {
  if (isRunning) return;

  if (remainingSeconds <= 0) {
    remainingSeconds = sessionMinutes * 60;
  }

  isRunning = true;
  timerInterval = setInterval(function () {
    remainingSeconds--;

    if (remainingSeconds <= 0) {
      remainingSeconds = 0;
      renderTimerDisplay();
      renderTimerRing();
      stopTimer();
      return;
    }

    renderTimerDisplay();
    renderTimerRing();
  }, 1000);
}

function stopTimer() {
  isRunning = false;
  clearInterval(timerInterval);
  timerInterval = null;
}

function resetTimer() {
  stopTimer();
  remainingSeconds = sessionMinutes * 60;
  renderTimerDisplay();
  renderTimerRing();
}

function applySessionMinutes() {
  let value = parseInt(timerMinutesInput.value, 10);

  if (isNaN(value) || value < 1) {
    value = 25;
  }
  if (value > 120) {
    value = 120;
  }

  sessionMinutes = value;
  timerMinutesInput.value = value;
  localStorage.setItem(STORAGE_KEYS.timerMinutes, String(value));

  if (!isRunning) {
    remainingSeconds = sessionMinutes * 60;
    renderTimerDisplay();
    renderTimerRing();
  }
}

function loadSessionMinutes() {
  const saved = localStorage.getItem(STORAGE_KEYS.timerMinutes);
  if (saved) {
    sessionMinutes = parseInt(saved, 10) || 25;
  }
  timerMinutesInput.value = sessionMinutes;
  remainingSeconds = sessionMinutes * 60;
}

startBtn.addEventListener("click", startTimer);
stopBtn.addEventListener("click", stopTimer);
resetBtn.addEventListener("click", resetTimer);
timerMinutesInput.addEventListener("change", applySessionMinutes);


const todoForm = document.getElementById("todoForm");
const todoInput = document.getElementById("todoInput");
const todoList = document.getElementById("todoList");
const todoEmpty = document.getElementById("todoEmpty");

let todos = [];

function loadTodos() {
  const saved = localStorage.getItem(STORAGE_KEYS.todos);
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEYS.todos, JSON.stringify(todos));
}

function renderTodos() {
  todoList.innerHTML = "";

  if (todos.length === 0) {
    todoList.appendChild(todoEmpty);
    todoEmpty.style.display = "block";
    return;
  }

  todoEmpty.style.display = "none";

  todos.forEach(function (todo) {
    const li = document.createElement("li");
    li.className = "todo-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "todo-checkbox";
    checkbox.checked = todo.done;
    checkbox.addEventListener("change", function () {
      toggleTodoDone(todo.id);
    });

    const text = document.createElement("span");
    text.className = "todo-text" + (todo.done ? " done" : "");
    text.textContent = todo.text;

    text.addEventListener("dblclick", function () {
      startEditTodo(li, todo);
    });

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "icon-btn";
    editBtn.setAttribute("aria-label", "Edit task");
    editBtn.textContent = "✎";
    editBtn.addEventListener("click", function () {
      startEditTodo(li, todo);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "icon-btn delete-icon";
    deleteBtn.setAttribute("aria-label", "Delete task");
    deleteBtn.textContent = "×";
    deleteBtn.addEventListener("click", function () {
      deleteTodo(todo.id);
    });

    li.appendChild(checkbox);
    li.appendChild(text);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);

    todoList.appendChild(li);
  });
}

function startEditTodo(li, todo) {
  const editInput = document.createElement("input");
  editInput.type = "text";
  editInput.className = "todo-edit-input";
  editInput.value = todo.text;
  editInput.maxLength = 100;

  const oldText = li.querySelector(".todo-text");
  li.replaceChild(editInput, oldText);
  editInput.focus();
  editInput.select();

  function saveEdit() {
    const newText = editInput.value.trim();
    if (newText !== "") {
      todo.text = newText;
      saveTodos();
    }
    renderTodos();
  }

  editInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      saveEdit();
    } else if (event.key === "Escape") {
      renderTodos();
    }
  });

  editInput.addEventListener("blur", saveEdit);
}

function addTodo(text) {
  todos.push({
    id: Date.now(),
    text: text,
    done: false,
  });
  saveTodos();
  renderTodos();
}

function toggleTodoDone(id) {
  const todo = todos.find(function (item) {
    return item.id === id;
  });
  if (todo) {
    todo.done = !todo.done;
    saveTodos();
    renderTodos();
  }
}

function deleteTodo(id) {
  todos = todos.filter(function (item) {
    return item.id !== id;
  });
  saveTodos();
  renderTodos();
}

todoForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const value = todoInput.value.trim();
  if (value === "") return;

  addTodo(value);
  todoForm.reset();
  todoInput.focus();
});

//link
const linkForm = document.getElementById("linkForm");
const linkNameInput = document.getElementById("linkName");
const linkUrlInput = document.getElementById("linkUrl");
const linkGrid = document.getElementById("linkGrid");
const linkEmpty = document.getElementById("linkEmpty");

let quickLinks = [];

function loadLinks() {
  const saved = localStorage.getItem(STORAGE_KEYS.links);
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveLinks() {
  localStorage.setItem(STORAGE_KEYS.links, JSON.stringify(quickLinks));
}

function renderLinks() {
  linkGrid.innerHTML = "";

  if (quickLinks.length === 0) {
    linkGrid.appendChild(linkEmpty);
    linkEmpty.style.display = "block";
    return;
  }

  linkEmpty.style.display = "none";

  quickLinks.forEach(function (link) {
    const item = document.createElement("div");
    item.className = "link-item";

    const openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.className = "link-open-btn";
    openBtn.textContent = link.name;
    openBtn.addEventListener("click", function () {
      window.open(link.url, "_blank");
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "icon-btn delete-icon";
    deleteBtn.setAttribute("aria-label", "Delete link");
    deleteBtn.textContent = "x";
    deleteBtn.addEventListener("click", function () {
      deleteLink(link.id);
    });

    item.appendChild(openBtn);
    item.appendChild(deleteBtn);
    linkGrid.appendChild(item);
  });
}

function addLink(name, url) {
  let finalUrl = url.trim();
  if (!/^https?:\/\//i.test(finalUrl)) {
    finalUrl = "https://" + finalUrl;
  }

  quickLinks.push({
    id: Date.now(),
    name: name.trim(),
    url: finalUrl,
  });

  saveLinks();
  renderLinks();
}

function deleteLink(id) {
  quickLinks = quickLinks.filter(function (item) {
    return item.id !== id;
  });

  saveLinks();
  renderLinks();
}

linkForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const name = linkNameInput.value.trim();
  const url = linkUrlInput.value.trim();

  if (name === "" || url === "") return;
  addLink(name, url);
  linkForm.reset();
  linkNameInput.focus();
});

//tema
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

function applyTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark-mode");
    themeIcon.textContent = "☀️";
  } else {
    document.body.classList.remove("dark-mode");
    themeIcon.textContent = "🌙";
  }
  localStorage.setItem(STORAGE_KEYS.theme, theme);

  if (spendingChart) {
    spendingChart.data.datasets[0].borderColor = getChartBorderColor();
    spendingChart.update();
  }
}

function loadTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme) || "light";
  applyTheme(savedTheme);
}

themeToggle.addEventListener("click", function () {
  const isDark = document.body.classList.contains("dark-mode");
  applyTheme(isDark ? "light" : "dark");
});


transactions = loadTransactions();
renderExpenseSection();

loadUserName();
updateClockAndGreeting();
setInterval(updateClockAndGreeting, 1000);

loadSessionMinutes();
renderTimerDisplay();
renderTimerRing();

todos = loadTodos();
renderTodos();

quickLinks = loadLinks();
renderLinks();

loadTheme();
Done
