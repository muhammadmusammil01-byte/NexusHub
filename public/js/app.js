// Main Application JavaScript
const API_URL = window.location.origin + '/api';
let currentUser = null;
let currentProject = null;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadMarketplace();
});

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        fetch(`${API_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Not authenticated');
        })
        .then(data => {
            currentUser = data.user;
            window.currentUser = currentUser;
            updateUIForAuth(true);
        })
        .catch(() => {
            localStorage.removeItem('token');
            updateUIForAuth(false);
        });
    } else {
        updateUIForAuth(false);
    }
}

// Update UI based on authentication
function updateUIForAuth(isAuthenticated) {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const navMenu = document.getElementById('nav-menu');

    if (isAuthenticated) {
        authButtons.classList.add('hidden');
        userMenu.classList.remove('hidden');
        navMenu.classList.remove('hidden');
    } else {
        authButtons.classList.remove('hidden');
        userMenu.classList.add('hidden');
        navMenu.classList.add('hidden');
        showPage('login');
    }
}

// Handle login
function handleLogin(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);

    fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            window.currentUser = currentUser;
            showNotification('Login successful!', 'success');
            updateUIForAuth(true);
            showPage('marketplace');
        } else {
            showNotification(data.error || 'Login failed', 'error');
        }
    })
    .catch(error => {
        showNotification('Login failed: ' + error.message, 'error');
    });
}

// Handle registration
function handleRegister(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);

    fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            localStorage.setItem('token', data.token);
            currentUser = data.user;
            window.currentUser = currentUser;
            showNotification('Registration successful!', 'success');
            updateUIForAuth(true);
            showPage('marketplace');
        } else {
            showNotification(data.error || 'Registration failed', 'error');
        }
    })
    .catch(error => {
        showNotification('Registration failed: ' + error.message, 'error');
    });
}

// Logout
function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    window.currentUser = null;
    updateUIForAuth(false);
    showNotification('Logged out successfully', 'success');
}

// Show specific page
function showPage(pageName) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.add('hidden'));
    
    const targetPage = document.getElementById(`${pageName}-page`);
    if (targetPage) {
        targetPage.classList.remove('hidden');
    }

    // Load page-specific data
    switch(pageName) {
        case 'marketplace':
            loadMarketplace();
            break;
        case 'certificates':
            loadCertificates();
            break;
        case 'escrow':
            loadTransactions();
            break;
    }
}

// Load marketplace projects
function loadMarketplace() {
    fetch(`${API_URL}/marketplace`)
    .then(response => response.json())
    .then(data => {
        displayProjects(data.projects);
    })
    .catch(error => {
        console.error('Failed to load marketplace:', error);
    });
}

// Display projects
function displayProjects(projects) {
    const grid = document.getElementById('projects-grid');
    grid.innerHTML = '';

    projects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'glass-panel p-6 rounded-2xl project-card content-protected';
        card.innerHTML = `
            <div class="mb-4">
                <h3 class="text-xl font-bold text-white mb-2">${escapeHtml(project.title)}</h3>
                <p class="text-gray-300 text-sm mb-2">${escapeHtml(project.center_name || 'Unknown Center')}</p>
                <p class="text-gray-400 text-sm line-clamp-3">${escapeHtml(project.description)}</p>
            </div>
            <div class="flex flex-wrap gap-2 mb-4">
                ${(project.technology_stack || []).map(tech => 
                    `<span class="px-2 py-1 bg-purple-500/30 text-purple-200 text-xs rounded">${escapeHtml(tech)}</span>`
                ).join('')}
            </div>
            <div class="flex justify-between items-center">
                <span class="text-2xl font-bold text-purple-300">$${project.price}</span>
                <button onclick="viewProject('${project.id}')" class="glass-button-primary px-4 py-2 rounded-lg text-white text-sm">
                    View Details
                </button>
            </div>
            <div class="mt-2 text-xs text-gray-400">
                Views: ${project.views_count || 0} | Rating: ${(project.avg_rating || 0).toFixed(1)} ⭐
            </div>
        `;
        grid.appendChild(card);
    });
}

// View project details
function viewProject(projectId) {
    if (!currentUser) {
        showNotification('Please login to view project details', 'info');
        showPage('login');
        return;
    }

    fetch(`${API_URL}/marketplace/${projectId}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => response.json())
    .then(data => {
        currentProject = data.project;
        window.currentProject = currentProject;
        showProjectModal(data.project);
    })
    .catch(error => {
        showNotification('Failed to load project details', 'error');
    });
}

// Show project modal
function showProjectModal(project) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="glass-panel p-8 rounded-2xl max-w-2xl w-full max-h-screen overflow-y-auto content-protected">
            <h2 class="text-3xl font-bold text-white mb-4">${escapeHtml(project.title)}</h2>
            <p class="text-gray-300 mb-4">${escapeHtml(project.description)}</p>
            <div class="mb-4">
                <h4 class="text-white font-semibold mb-2">Technologies:</h4>
                <div class="flex flex-wrap gap-2">
                    ${(project.technology_stack || []).map(tech => 
                        `<span class="px-3 py-1 bg-purple-500/30 text-purple-200 rounded">${escapeHtml(tech)}</span>`
                    ).join('')}
                </div>
            </div>
            <div class="mb-4">
                <p class="text-2xl font-bold text-purple-300">Price: $${project.price}</p>
            </div>
            <div class="text-xs text-gray-400 mb-4">
                Watermark: ${escapeHtml(project.dynamic_watermark || '')}
            </div>
            <div class="flex space-x-4">
                <button onclick="purchaseProject('${project.id}')" class="glass-button-primary px-6 py-3 rounded-lg text-white flex-1">
                    Purchase Project
                </button>
                <button onclick="closeModal()" class="glass-button px-6 py-3 rounded-lg text-white">
                    Close
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
}

// Purchase project (create escrow transaction)
function purchaseProject(projectId) {
    if (currentUser.role !== 'Student') {
        showNotification('Only students can purchase projects', 'error');
        return;
    }

    const transactionRef = `TXN-${Date.now()}`;
    
    fetch(`${API_URL}/escrow/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
            project_id: projectId,
            payment_method: 'card',
            transaction_ref: transactionRef
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.transaction) {
            showNotification('Purchase successful! Funds held in escrow.', 'success');
            closeModal();
            showPage('escrow');
        } else {
            showNotification(data.error || 'Purchase failed', 'error');
        }
    })
    .catch(error => {
        showNotification('Purchase failed: ' + error.message, 'error');
    });
}

// Load certificates
function loadCertificates() {
    if (!currentUser) return;

    fetch(`${API_URL}/certificates/my-certificates`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => response.json())
    .then(data => {
        displayCertificates(data.certificates);
    })
    .catch(error => {
        console.error('Failed to load certificates:', error);
    });
}

// Display certificates
function displayCertificates(certificates) {
    const grid = document.getElementById('certificates-grid');
    grid.innerHTML = '';

    if (certificates.length === 0) {
        grid.innerHTML = '<p class="text-white text-center col-span-full">No certificates yet</p>';
        return;
    }

    certificates.forEach(cert => {
        const card = document.createElement('div');
        card.className = 'glass-panel p-6 rounded-2xl certificate-card';
        card.innerHTML = `
            <h3 class="text-xl font-bold text-white mb-2">${escapeHtml(cert.project_title)}</h3>
            <p class="text-gray-300 mb-2">${escapeHtml(cert.center_name)}</p>
            <p class="text-sm text-gray-400 mb-4">Issued: ${new Date(cert.issue_date).toLocaleDateString()}</p>
            <p class="text-xs text-purple-300 mb-4">Code: ${escapeHtml(cert.certificate_code)}</p>
            <button onclick="viewCertificate('${cert.id}')" class="glass-button-primary px-4 py-2 rounded-lg text-white w-full">
                View Certificate
            </button>
        `;
        grid.appendChild(card);
    });
}

// Load transactions
function loadTransactions() {
    if (!currentUser) return;

    fetch(`${API_URL}/escrow/my-transactions`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => response.json())
    .then(data => {
        displayTransactions(data.transactions);
    })
    .catch(error => {
        console.error('Failed to load transactions:', error);
    });
}

// Display transactions
function displayTransactions(transactions) {
    const list = document.getElementById('transactions-list');
    list.innerHTML = '';

    if (transactions.length === 0) {
        list.innerHTML = '<p class="text-white text-center">No transactions yet</p>';
        return;
    }

    transactions.forEach(tx => {
        const card = document.createElement('div');
        card.className = 'glass-panel p-6 rounded-2xl';
        
        const statusColors = {
            'pending': 'text-yellow-300',
            'held': 'text-blue-300',
            'released': 'text-green-300',
            'refunded': 'text-red-300'
        };

        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="text-xl font-bold text-white mb-2">${escapeHtml(tx.project_title)}</h3>
                    <p class="text-gray-300 mb-1">Amount: $${tx.amount}</p>
                    <p class="text-sm ${statusColors[tx.status] || 'text-gray-400'}">
                        Status: ${tx.status.toUpperCase()}
                    </p>
                    <p class="text-xs text-gray-500 mt-2">
                        ${new Date(tx.created_at).toLocaleString()}
                    </p>
                </div>
                ${tx.status === 'held' && currentUser.role === 'CenterAdmin' ? 
                    `<button onclick="releaseFunds('${tx.id}')" class="glass-button-primary px-4 py-2 rounded-lg text-white">
                        Issue Certificate & Release
                    </button>` : ''}
            </div>
        `;
        list.appendChild(card);
    });
}

// Release funds and issue certificate
function releaseFunds(transactionId) {
    const certificateCode = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const qrData = JSON.stringify({
        certificate_code: certificateCode,
        issue_date: new Date().toISOString()
    });

    fetch(`${API_URL}/escrow/${transactionId}/release`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
            certificate_code: certificateCode,
            qr_data: qrData
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.certificate) {
            showNotification('Certificate issued and funds released!', 'success');
            loadTransactions();
        } else {
            showNotification(data.error || 'Failed to release funds', 'error');
        }
    })
    .catch(error => {
        showNotification('Failed to release funds: ' + error.message, 'error');
    });
}

// Search projects
function searchProjects() {
    const search = document.getElementById('search-input').value;
    const tech = document.getElementById('tech-filter').value;
    const minPrice = document.getElementById('min-price').value;

    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (tech) params.append('technology', tech);
    if (minPrice) params.append('min_price', minPrice);

    fetch(`${API_URL}/marketplace?${params.toString()}`)
    .then(response => response.json())
    .then(data => {
        displayProjects(data.projects);
    })
    .catch(error => {
        console.error('Search failed:', error);
    });
}

// Close modal
function closeModal() {
    const modal = document.querySelector('.fixed.inset-0');
    if (modal) {
        modal.remove();
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions available globally
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.logout = logout;
window.showPage = showPage;
window.viewProject = viewProject;
window.purchaseProject = purchaseProject;
window.searchProjects = searchProjects;
window.closeModal = closeModal;
window.showNotification = showNotification;
window.releaseFunds = releaseFunds;
