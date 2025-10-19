// Sample inventory data
let inventory = [
    { id: 1, name: "Rice 10kg", quantity: 5, category: "Grains", expiryDate: "2023-12-15", status: "normal", salesRate: 2.5 },
    { id: 2, name: "Oil 2L", quantity: 2, category: "Cooking", expiryDate: "2023-11-20", status: "low", salesRate: 1.2 },
    { id: 3, name: "Eggs 1 dozen", quantity: 12, category: "Dairy", expiryDate: "2023-11-05", status: "normal", salesRate: 3.0 },
    { id: 4, name: "Milk 1L", quantity: 0, category: "Dairy", expiryDate: "2023-11-03", status: "out", salesRate: 4.5 },
    { id: 5, name: "Flour 5kg", quantity: 8, category: "Grains", expiryDate: "2024-02-10", status: "normal", salesRate: 1.8 },
    { id: 6, name: "Sugar 2kg", quantity: 3, category: "Grains", expiryDate: "2024-05-15", status: "low", salesRate: 1.5 },
    { id: 7, name: "Bread", quantity: 15, category: "Bakery", expiryDate: "2023-11-04", status: "expiring", salesRate: 5.2 },
    { id: 8, name: "Tomatoes", quantity: 25, category: "Vegetables", expiryDate: "2023-11-06", status: "normal", salesRate: 8.0 },
    { id: 9, name: "Potatoes", quantity: 30, category: "Vegetables", expiryDate: "2023-11-25", status: "normal", salesRate: 6.5 },
    { id: 10, name: "Onions", quantity: 1, category: "Vegetables", expiryDate: "2023-11-08", status: "low", salesRate: 4.2 },
    { id: 11, name: "Butter 500g", quantity: 6, category: "Dairy", expiryDate: "2023-11-12", status: "normal", salesRate: 2.0 },
    { id: 12, name: "Cheese 200g", quantity: 0, category: "Dairy", expiryDate: "2023-11-02", status: "out", salesRate: 3.1 }
];

// DOM Elements
const inventoryGrid = document.getElementById('inventoryGrid');
const addItemBtn = document.getElementById('addItemBtn');
const syncBtn = document.getElementById('syncBtn');
const addItemModal = document.getElementById('addItemModal');
const closeAddModal = document.getElementById('closeAddModal');
const cancelAdd = document.getElementById('cancelAdd');
const confirmAdd = document.getElementById('confirmAdd');
const voiceInput = document.getElementById('voiceInput');
const reorderModal = document.getElementById('reorderModal');
const closeReorderModal = document.getElementById('closeReorderModal');
const cancelReorder = document.getElementById('cancelReorder');
const confirmReorder = document.getElementById('confirmReorder');
const reorderList = document.getElementById('reorderList');
const syncAnimation = document.getElementById('syncAnimation');
const syncProgressBar = document.getElementById('syncProgressBar');
const toastContainer = document.getElementById('toastContainer');
const currentDateEl = document.getElementById('currentDate');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Set current date
    const now = new Date();
    currentDateEl.textContent = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    // Render inventory
    renderInventory();
    
    // Initialize charts
    initCharts();
    
    // Show initial alerts
    setTimeout(showInitialAlerts, 1000);
    
    // Check for reorder suggestions
    setTimeout(checkReorderSuggestions, 2000);
});

// Render inventory grid
function renderInventory() {
    inventoryGrid.innerHTML = '';
    
    inventory.forEach(item => {
        const card = document.createElement('div');
        card.className = 'inventory-card';
        
        // Calculate days until depletion
        const daysUntilDepletion = Math.ceil(item.quantity / item.salesRate);
        
        // Determine prediction bar class and width
        let predictionClass = 'prediction-normal';
        let predictionWidth = Math.min(100, (item.quantity / (item.salesRate * 7)) * 100);
        
        if (daysUntilDepletion <= 2) {
            predictionClass = 'prediction-critical';
        } else if (daysUntilDepletion <= 5) {
            predictionClass = 'prediction-low';
        }
        
        card.innerHTML = `
            <div class="card-header">
                <div class="item-name">${item.name}</div>
                <div class="status-badge status-${item.status}">${getStatusText(item.status)}</div>
            </div>
            <div class="item-details">
                <div class="detail-row">
                    <div class="detail-label">Quantity:</div>
                    <div class="detail-value">${item.quantity}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Category:</div>
                    <div class="detail-value">${item.category}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Expiry:</div>
                    <div class="detail-value">${formatDate(item.expiryDate)}</div>
                </div>
            </div>
            <div class="prediction-bar">
                <div class="prediction-fill ${predictionClass}" style="width: ${predictionWidth}%"></div>
            </div>
            <div class="prediction-text">
                ${getPredictionText(item)}
            </div>
            <div class="card-actions">
                <button class="btn btn-outline btn-small update-btn" data-id="${item.id}">Update</button>
                <button class="btn btn-outline btn-small reorder-btn" data-id="${item.id}">Reorder</button>
            </div>
        `;
        
        inventoryGrid.appendChild(card);
    });
    
    // Add event listeners to update buttons
    document.querySelectorAll('.update-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemId = parseInt(this.getAttribute('data-id'));
            updateItemQuantity(itemId);
        });
    });
    
    // Add event listeners to reorder buttons
    document.querySelectorAll('.reorder-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemId = parseInt(this.getAttribute('data-id'));
            showReorderModal([itemId]);
        });
    });
    
    // Update stats
    updateStats();
}

// Get status text
function getStatusText(status) {
    switch(status) {
        case 'normal': return 'Normal';
        case 'low': return 'Low Stock';
        case 'expiring': return 'Expiring Soon';
        case 'out': return 'Out of Stock';
        default: return 'Unknown';
    }
}

// Format date
function formatDate(dateString) {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Get prediction text
function getPredictionText(item) {
    if (item.quantity === 0) {
        return "Out of stock";
    }
    
    const days = Math.ceil(item.quantity / item.salesRate);
    return `Will last ${days} day${days !== 1 ? 's' : ''}`;
}

// Update stats
function updateStats() {
    const totalItems = inventory.length;
    const lowStockItems = inventory.filter(item => item.status === 'low').length;
    const expiringItems = inventory.filter(item => item.status === 'expiring').length;
    const outOfStockItems = inventory.filter(item => item.status === 'out').length;
    
    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('lowStockItems').textContent = lowStockItems;
    document.getElementById('expiringItems').textContent = expiringItems;
    document.getElementById('outOfStockItems').textContent = outOfStockItems;
}

// Initialize charts
function initCharts() {
    // Prediction Chart
    const predictionCtx = document.getElementById('predictionChart').getContext('2d');
    const predictionChart = new Chart(predictionCtx, {
        type: 'bar',
        data: {
            labels: inventory.map(item => item.name),
            datasets: [{
                label: 'Days Until Depletion',
                data: inventory.map(item => Math.ceil(item.quantity / item.salesRate)),
                backgroundColor: inventory.map(item => {
                    const days = Math.ceil(item.quantity / item.salesRate);
                    if (days <= 2) return '#ef4444';
                    if (days <= 5) return '#f59e0b';
                    return '#10b981';
                }),
                borderColor: inventory.map(item => {
                    const days = Math.ceil(item.quantity / item.salesRate);
                    if (days <= 2) return '#dc2626';
                    if (days <= 5) return '#d97706';
                    return '#059669';
                }),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Stock Depletion Prediction'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Days'
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
    
    // Status Chart
    const statusCtx = document.getElementById('statusChart').getContext('2d');
    const statusChart = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
            labels: ['Normal Stock', 'Low Stock', 'Expiring Soon', 'Out of Stock'],
            datasets: [{
                data: [
                    inventory.filter(item => item.status === 'normal').length,
                    inventory.filter(item => item.status === 'low').length,
                    inventory.filter(item => item.status === 'expiring').length,
                    inventory.filter(item => item.status === 'out').length
                ],
                backgroundColor: [
                    '#10b981',
                    '#ef4444',
                    '#f59e0b',
                    '#64748b'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                title: {
                    display: true,
                    text: 'Inventory Status Distribution'
                }
            }
        }
    });
}

// Show initial alerts
function showInitialAlerts() {
    // Show low stock alerts
    inventory.filter(item => item.status === 'low').forEach(item => {
        showToast('warning', 'Low Stock Alert', `${item.name} is running low - only ${item.quantity} left`);
    });
    
    // Show expiring alerts
    inventory.filter(item => item.status === 'expiring').forEach(item => {
        showToast('warning', 'Expiry Alert', `${item.name} is expiring soon on ${formatDate(item.expiryDate)}`);
    });
    
    // Show out of stock alerts
    inventory.filter(item => item.status === 'out').forEach(item => {
        showToast('danger', 'Out of Stock', `${item.name} is out of stock`);
    });
}

// Check for reorder suggestions
function checkReorderSuggestions() {
    const lowStockItems = inventory.filter(item => 
        item.status === 'low' || item.status === 'out'
    );
    
    if (lowStockItems.length > 0) {
        setTimeout(() => {
            showReorderModal(lowStockItems.map(item => item.id));
        }, 3000);
    }
}

// Show reorder modal
function showReorderModal(itemIds) {
    const itemsToReorder = inventory.filter(item => itemIds.includes(item.id));
    
    reorderList.innerHTML = '';
    itemsToReorder.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.name} - Suggested quantity: ${Math.ceil(item.salesRate * 7)}`;
        reorderList.appendChild(li);
    });
    
    reorderModal.classList.add('show');
}

// Update item quantity
function updateItemQuantity(itemId) {
    const item = inventory.find(item => item.id === itemId);
    if (!item) return;
    
    const newQuantity = prompt(`Enter new quantity for ${item.name}:`, item.quantity);
    if (newQuantity !== null && !isNaN(newQuantity) && newQuantity >= 0) {
        const oldQuantity = item.quantity;
        item.quantity = parseInt(newQuantity);
        
        // Update status based on new quantity
        updateItemStatus(item);
        
        // Re-render inventory
        renderInventory();
        
        // Show update confirmation
        showToast('info', 'Inventory Updated', 
            `${item.name} quantity changed from ${oldQuantity} to ${newQuantity}`);
    }
}

// Update item status based on quantity and expiry
function updateItemStatus(item) {
    const today = new Date();
    const expiryDate = new Date(item.expiryDate);
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    
    if (item.quantity === 0) {
        item.status = 'out';
    } else if (item.quantity <= 3) {
        item.status = 'low';
    } else if (daysUntilExpiry <= 3) {
        item.status = 'expiring';
    } else {
        item.status = 'normal';
    }
}

// Show toast notification
function showToast(type, title, message) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'danger') icon = '⚠️';
    if (type === 'warning') icon = '🔔';
    
    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">&times;</button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Show toast with animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 5000);
    
    // Close button event
    toast.querySelector('.toast-close').addEventListener('click', function() {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    });
}

// Event Listeners
addItemBtn.addEventListener('click', function() {
    addItemModal.classList.add('show');
    voiceInput.focus();
});

closeAddModal.addEventListener('click', function() {
    addItemModal.classList.remove('show');
});

cancelAdd.addEventListener('click', function() {
    addItemModal.classList.remove('show');
});

confirmAdd.addEventListener('click', function() {
    const command = voiceInput.value.trim();
    if (command) {
        processVoiceCommand(command);
        addItemModal.classList.remove('show');
        voiceInput.value = '';
    }
});

// Process voice command (simulated)
function processVoiceCommand(command) {
    // Simple command parsing for demo
    const parts = command.toLowerCase().split(' ');
    const action = parts[0];
    const quantity = parseInt(parts[1]);
    const itemName = parts.slice(2).join(' ');
    
    if (action === 'add' && !isNaN(quantity) && itemName) {
        // Check if item already exists
        const existingItem = inventory.find(item => 
            item.name.toLowerCase().includes(itemName) || 
            itemName.includes(item.name.toLowerCase())
        );
        
        if (existingItem) {
            // Update existing item
            const oldQuantity = existingItem.quantity;
            existingItem.quantity += quantity;
            updateItemStatus(existingItem);
            renderInventory();
            showToast('info', 'Inventory Updated', 
                `Added ${quantity} to ${existingItem.name}. New quantity: ${existingItem.quantity}`);
        } else {
            // Add new item
            const newId = Math.max(...inventory.map(item => item.id)) + 1;
            const newItem = {
                id: newId,
                name: itemName.charAt(0).toUpperCase() + itemName.slice(1),
                quantity: quantity,
                category: 'General',
                expiryDate: '2023-12-31',
                status: quantity > 3 ? 'normal' : 'low',
                salesRate: 2.0
            };
            
            inventory.push(newItem);
            renderInventory();
            showToast('success', 'New Item Added', 
                `Added ${newItem.name} with quantity ${quantity}`);
        }
    } else {
        showToast('danger', 'Command Error', 'Could not process voice command. Please use format: "Add [quantity] [item name]"');
    }
}

syncBtn.addEventListener('click', function() {
    // Show sync animation
    syncAnimation.classList.add('show');
    
    // Simulate sync progress
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        syncProgressBar.style.width = `${progress}%`;
        
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                syncAnimation.classList.remove('show');
                showToast('success', 'Sync Complete', 'All devices have been synchronized');
            }, 500);
        }
    }, 200);
});

closeReorderModal.addEventListener('click', function() {
    reorderModal.classList.remove('show');
});

cancelReorder.addEventListener('click', function() {
    reorderModal.classList.remove('show');
});

confirmReorder.addEventListener('click', function() {
    // In a real app, this would place an order with vendors
    showToast('success', 'Order Placed', 'Your reorder has been submitted to vendors');
    reorderModal.classList.remove('show');
});