const financeManager = {
    transactions: [],
    customers: {},

    // Add a new transaction
    addTransaction: function(customer, description, amount, type) {
        const transaction = {
            id: Date.now(),
            date: new Date().toLocaleDateString(),
            customer: customer,
            description: description,
            amount: parseFloat(amount),
            type: type
        };

        // Add the transaction to the global transactions list
        this.transactions.push(transaction);

        // Add the transaction to the specific customer's list
        if (!this.customers[customer]) {
            this.customers[customer] = [];
        }
        this.customers[customer].push(transaction);

        // Update the dashboard and render the transactions
        this.updateDashboard();
        this.renderTransactions();
        this.viewCustomerTransactions();
    },

    // Remove a transaction
    removeTransaction: function(id) {
        const index = this.transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            const transaction = this.transactions[index];
            this.transactions.splice(index, 1);

            // Remove the transaction from the customer's history
            this.customers[transaction.customer] = this.customers[transaction.customer].filter(t => t.id !== id);

            // Update the dashboard and re-render the transactions
            this.updateDashboard();
            this.renderTransactions();
            this.viewCustomerTransactions();
        }
    },

    // Update the financial summary in the dashboard
    updateDashboard: function() {
        let gstPending = 0;
        let paidGst = 0;
        let unpaidBills = 0;
        let paidBills = 0;
        let receivables = 0;

        this.transactions.forEach(transaction => {
            switch (transaction.type) {
                case 'GST':
                    gstPending += transaction.amount;
                    break;
                case 'Paid GST':
                    paidGst += transaction.amount;
                    break;
                case 'Bill':
                    unpaidBills += 1;
                    break;
                case 'Paid Bill':
                    paidBills += 1;
                    break;
                case 'Income':
                    receivables += transaction.amount;
                    break;
            }
        });

        // Update the financial summary display
        document.getElementById('gst-amount').textContent = `$${gstPending.toFixed(2)}`;
        document.getElementById('paid-gst-amount').textContent = `$${paidGst.toFixed(2)}`;
        document.getElementById('bills-count').textContent = unpaidBills;
        document.getElementById('paid-bills-count').textContent = paidBills;
        document.getElementById('receivables-amount').textContent = `$${receivables.toFixed(2)}`;
    },

    // Render all transactions in the global transaction table
    renderTransactions: function() {
        const tbody = document.getElementById('transactions-body');
        tbody.innerHTML = '';

        this.transactions.forEach(transaction => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${transaction.date}</td>
                <td>${transaction.customer}</td>
                <td>${transaction.description}</td>
                <td>$${transaction.amount.toFixed(2)}</td>
                <td>${transaction.type}</td>
                <td>
                    <button onclick="financeManager.removeTransaction(${transaction.id})">
                        Remove
                    </button>
                </td>
            `;
        });
    },

    // Render the selected customer's transactions
    viewCustomerTransactions: function() {
        const customer = document.getElementById('customer-select').value;
        const tbody = document.getElementById('customer-body');
        tbody.innerHTML = '';

        if (customer && this.customers[customer]) {
            this.customers[customer].forEach(transaction => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${transaction.date}</td>
                    <td>${transaction.description}</td>
                    <td>$${transaction.amount.toFixed(2)}</td>
                    <td>${transaction.type}</td>
                `;
            });
        }
    },

    // Populate customer names in the dropdown dynamically
    updateCustomerSelect: function() {
        const customerSelect = document.getElementById('customer-select');
        customerSelect.innerHTML = `<option value="">Select Customer</option>`; // Reset the select list

        Object.keys(this.customers).forEach(customer => {
            const option = document.createElement('option');
            option.value = customer;
            option.textContent = customer;
            customerSelect.appendChild(option);
        });
    }
};

// Add a new transaction (called when the "Add Transaction" button is clicked)
function addNewTransaction() {
    const customer = document.getElementById('customer-name').value.trim();
    const description = document.getElementById('transaction-description').value.trim();
    const amount = document.getElementById('transaction-amount').value.trim();
    const type = document.getElementById('transaction-type').value;

    if (customer && description && amount && !isNaN(amount)) {
        financeManager.addTransaction(customer, description, amount, type);

        // Update customer dropdown with new customer
        financeManager.updateCustomerSelect();

        // Reset form fields
        document.getElementById('customer-name').value = '';
        document.getElementById('transaction-description').value = '';
        document.getElementById('transaction-amount').value = '';
    } else {
        alert('Please fill out all fields correctly.');
    }
}

// Automatically update the customer transaction history when a customer is selected
function viewCustomerTransactions() {
    financeManager.viewCustomerTransactions();
}