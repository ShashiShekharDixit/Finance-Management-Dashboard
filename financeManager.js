// DOM Elements
const transactionsBody = document.getElementById("transactions-body");
const customerSelect = document.getElementById("customer-select");
const customerBody = document.getElementById("customer-body");

// Financial summary elements
const gstAmountElement = document.getElementById("gst-amount");
const paidGstAmountElement = document.getElementById("paid-gst-amount");
const unpaidBillsCountElement = document.getElementById("bills-count");
const paidBillsCountElement = document.getElementById("paid-bills-count");
const receivablesAmountElement = document.getElementById("receivables-amount");

// Load saved transactions on page load
document.addEventListener("DOMContentLoaded", () => {
    loadTransactions();
    updateFinancialSummary();
});

// Add a new transaction
function addNewTransaction() {
    const customerName = document.getElementById("customer-name").value.trim();
    const description = document.getElementById("transaction-description").value.trim();
    const amount = parseFloat(document.getElementById("transaction-amount").value);
    const type = document.getElementById("transaction-type").value;

    if (!customerName || !description || isNaN(amount)) {
        alert("Please fill in all fields.");
        return;
    }

    const transaction = {
        date: new Date().toLocaleDateString(),
        customer: customerName,
        description: description,
        amount: amount.toFixed(2),
        type: type,
    };

    // Save transaction and refresh the table
    saveTransaction(transaction);
    displayTransaction(transaction);
    updateCustomerSelect(customerName);

    // Update financial summary
    updateFinancialSummary();

    // Clear form inputs
    document.getElementById("customer-name").value = "";
    document.getElementById("transaction-description").value = "";
    document.getElementById("transaction-amount").value = "";
    document.getElementById("transaction-type").value = "Income";
}

// Save a transaction to Local Storage
function saveTransaction(transaction) {
    const transactions = JSON.parse(localStorage.getItem("transactions")) || [];
    transactions.push(transaction);
    localStorage.setItem("transactions", JSON.stringify(transactions));
}

// Load transactions from Local Storage
function loadTransactions() {
    const transactions = JSON.parse(localStorage.getItem("transactions")) || [];
    transactions.forEach((transaction) => {
        displayTransaction(transaction);
        updateCustomerSelect(transaction.customer);
    });
}

// Display a transaction in the main table
function displayTransaction(transaction) {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${transaction.date}</td>
        <td>${transaction.customer}</td>
        <td>${transaction.description}</td>
        <td>$${transaction.amount}</td>
        <td>${transaction.type}</td>
        <td>
            <button class="remove-btn" onclick="removeTransaction(this)">Remove</button>
        </td>
    `;
    transactionsBody.appendChild(row);
}

// Update the customer dropdown menu
function updateCustomerSelect(customer) {
    if (![...customerSelect.options].some((option) => option.value === customer)) {
        const option = document.createElement("option");
        option.value = customer;
        option.textContent = customer;
        customerSelect.appendChild(option);
    }
}

// View transactions for the selected customer
function viewCustomerTransactions() {
    const selectedCustomer = customerSelect.value;
    customerBody.innerHTML = ""; // Clear the customer table

    if (!selectedCustomer) return;

    const transactions = JSON.parse(localStorage.getItem("transactions")) || [];
    const customerTransactions = transactions.filter(
        (transaction) => transaction.customer === selectedCustomer
    );

    customerTransactions.forEach((transaction) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${transaction.date}</td>
            <td>${transaction.description}</td>
            <td>$${transaction.amount}</td>
            <td>${transaction.type}</td>
        `;
        customerBody.appendChild(row);
    });
}

// Remove a transaction
function removeTransaction(button) {
    const row = button.parentElement.parentElement;
    const customer = row.children[1].textContent;
    const description = row.children[2].textContent;
    const amount = parseFloat(row.children[3].textContent.replace("$", ""));
    const type = row.children[4].textContent;

    // Remove transaction from the table
    row.remove();

    // Remove transaction from Local Storage
    const transactions = JSON.parse(localStorage.getItem("transactions")) || [];
    const updatedTransactions = transactions.filter(
        (t) =>
            !(t.customer === customer && t.description === description && t.amount == amount && t.type === type)
    );
    localStorage.setItem("transactions", JSON.stringify(updatedTransactions));

    // Refresh customer transactions if viewing
    viewCustomerTransactions();

    // Update financial summary
    updateFinancialSummary();
}

// Update the financial summary
function updateFinancialSummary() {
    const transactions = JSON.parse(localStorage.getItem("transactions")) || [];
    let pendingGst = 0,
        paidGst = 0,
        unpaidBills = 0,
        paidBills = 0,
        totalReceivables = 0;

    transactions.forEach((transaction) => {
        switch (transaction.type) {
            case "GST":
                pendingGst += parseFloat(transaction.amount);
                break;
            case "Paid GST":
                paidGst += parseFloat(transaction.amount);
                break;
            case "Bill":
                unpaidBills += 1;
                totalReceivables += parseFloat(transaction.amount);
                break;
            case "Paid Bill":
                paidBills += 1;
                break;
            case "Income":
                totalReceivables += parseFloat(transaction.amount);
                break;
            default:
                break;
        }
    });

    gstAmountElement.textContent = `${pendingGst.toFixed(2)}`;
    paidGstAmountElement.textContent = `${paidGst.toFixed(2)}`;
    unpaidBillsCountElement.textContent = unpaidBills;
    paidBillsCountElement.textContent = paidBills;
    receivablesAmountElement.textContent = `${totalReceivables.toFixed(2)}`;
}
