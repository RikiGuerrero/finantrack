// Elementos del DOM
const form = document.getElementById('form');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const typeSelect = document.getElementById('type');
const transactionList = document.getElementById('transaction-list');
const balanceDisplay = document.getElementById('balance');
const categorySelect = document.getElementById('category');
const filterType = document.getElementById('filter-type');
const filterCategory = document.getElementById('filter-category');
const loginScreen = document.getElementById('login-screen');
const loginBtn = document.getElementById('login-btn');
const usernameInput = document.getElementById('username-input');

let currentUser = '';

// Mostrar/ocultar pantalla de login
function toggleApp(show) {
	const header = document.querySelector('header');
	const main = document.querySelector('main');

	if (show) {
		loginScreen.classList.add('hidden');
		header.style.display = 'block';
		main.style.display = 'block';
	} else {
		loginScreen.classList.remove('hidden');
		header.style.display = 'none';
		main.style.display = 'none';
	}
}

// Manejar el login
function handleLogin() {
	const username = usernameInput.value.trim();

	if (!username) {
		usernameInput.style.borderColor = '#ef4444';
		usernameInput.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
		return;
	}

	localStorage.setItem('finantrack_user', username);

	const header = document.querySelector('header h1');
	header.textContent = `FinanTrack - ${username}`;

	const stored = localStorage.getItem(`finantrack_transactions_${username}`);
	if (stored) {
		transactions = JSON.parse(stored);
	} else {
		transactions = [];
	}
	applyFilters();
	updateBalance();
	updateCharts();

	toggleApp(true);
	showMessage(`Bienvenido, ${username}! 🎉`, 'success');
}

loginBtn.addEventListener('click', handleLogin);

usernameInput.addEventListener('keypress', (e) => {
	if (e.key === 'Enter') {
		handleLogin();
	}
});

usernameInput.addEventListener('input', () => {
	usernameInput.style.borderColor = '';
	usernameInput.style.boxShadow = '';
});

// Manejar el logout
function handleLogout() {
	localStorage.removeItem('finantrack_user');
	currentUser = '';
	usernameInput.value = '';
	transactions = [];
	toggleApp(false);
}

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
	logoutBtn.addEventListener('click', handleLogout);
}

// Lista de transacciones
let transactions = [];

// Añadir transacción
function addTransaction(description, amount, type, category) {
	const transaction = {
		id: Date.now(), // Id único
		description,
		amount: Number(amount),
		type,
		category
	};

	transactions.push(transaction);
	saveTransactions();
	applyFilters();
	updateBalance();
	updateCharts();
}

// Mostrar transacción (render)
function renderTransaction(transaction, shouldPrepend = true) {
	const li = document.createElement('li');
	li.classList.add('transaction-item', transaction.type, `cat-${transaction.category}`);
	li.dataset.id = transaction.id;

	li.innerHTML = ` 
		<span>
			<strong>${transaction.description}</strong><br>
			<small>${transaction.category}</small>
		</span>
		<span>${transaction.amount.toFixed(2)} €</span>
		<button class="delete-btn">🗑️</button>
	`;
	if (shouldPrepend) {
		transactionList.prepend(li); // Para nuevas transacciones
	} else {
		transactionList.append(li); // Para cargar transacciones antiguas
	}
}

// Actualizar balance total
function updateBalance() {
	const income = transactions
		.filter(t => t.type === 'income')
		.reduce((sum, t) => sum + t.amount, 0);
	
	const expense = transactions
		.filter(t => t.type === 'expense')
		.reduce((sum, t) => sum + t.amount, 0);
	
	const balance = income - expense;
	balanceDisplay.textContent = `${balance.toFixed(2)} €`;
}

// Captura del formulario
form.addEventListener('submit', (e) => {
	e.preventDefault();

	const description = descriptionInput.value.trim();
	const amount = amountInput.value.trim();
	const type = typeSelect.value;
	const category = categorySelect.value;

	if (!description || !amount || isNaN(amount) || !category) {
		showMessage('Por favor, completa todos los campos correctamente.', 'error');
		return;
	}

	addTransaction(description, amount, type, category);
	showMessage('Transacción añadida correctamente 🎉', 'success');
	// Limpiar campos
	descriptionInput.value = '';
	amountInput.value = '';
	categorySelect.selectedIndex = 0;
});

// Mostrar mensajes de éxito o error
function showMessage(text, type = 'success') {
	const message = document.getElementById('form-message');
	message.textContent = text;
	message.className = type === 'success' ? 'success' : 'error';
	message.style.display = 'block';

	setTimeout(() => {
		message.style.display = 'none';
	}, 3000);
}

// Escuchar clicks en la lista (delegación de eventos)
transactionList.addEventListener('click', (e) => {
	if (e.target.classList.contains('delete-btn')) {
		const li = e.target.closest('li');
		const id = Number(li.dataset.id);
		deleteTransaction(id);
	}
});

// Escuchar cambios en los filtros
filterType.addEventListener('change', applyFilters);
filterCategory.addEventListener('change', applyFilters);

// Función para eliminar una transacción
function deleteTransaction(id) {
	transactions = transactions.filter(t => t.id !== id);
	saveTransactions();
	applyFilters();
	updateBalance();
	updateCharts();
	showMessage('Transacción eliminada correctamente 🗑️', 'success');
}

// Filtrar y renderizar
function applyFilters() {
	const type = filterType.value;
	const category = filterCategory.value;

	let filtered = transactions;

	if (type !== 'all') {
		filtered = filtered.filter(t => t.type === type);
	}

	if (category !== 'all') {
		filtered = filtered.filter(t => t.category === category);
	}

	transactionList.innerHTML = ' ';
	filtered.forEach(renderTransaction);
}

// Función que vuelve a renderizar las transacciones
function renderAllTransactions() {
	transactionList.innerHTML = '';
	transactions
		.sort((a, b) => b.id - a.id)
		.forEach(transaction => renderTransaction(transaction, false));
}

// Guarda las transacciones al actualizar
function saveTransactions() {
	const currentUser = localStorage.getItem('finantrack_user');
	if (currentUser) {
		localStorage.setItem(`finantrack_transactions_${currentUser}`, JSON.stringify(transactions));
	}
}

// Carga las transacciones al iniciar
window.addEventListener('DOMContentLoaded', () => {
	const storedUser = localStorage.getItem('finantrack_user');

	if (storedUser) {
		const header = document.querySelector('header h1');
		header.textContent = `FinanTrack - ${storedUser}`;
		toggleApp(true);
		const stored = localStorage.getItem(`finantrack_transactions_${storedUser}`);
		if (stored) {
			transactions = JSON.parse(stored);
		} else {
			transactions = [];
		}
	} else {
		toggleApp(false);
		transactions = [];
	}

	initCharts();
	applyFilters();
	updateBalance();
	updateCharts();
});

// Gráficos
let typeChart, categoryChart;

function initCharts() {
	const ctx1 = document.getElementById('chart-type').getContext('2d');
	const ctx2 = document.getElementById('chart-category').getContext('2d');

	typeChart = new Chart(ctx1, {
		type: 'doughnut',
		data: {
			labels: ['Ingresos', 'Gastos'],
			datasets: [{
				data: [0, 0],
				backgroundColor: ['#198754', '#dc3545']
			}]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: { position: 'bottom' }
			}
		}
	});
	categoryChart = new Chart(ctx2, {
		type: 'bar',
		data: {
			labels: ['Vivienda', 'Transporte', 'Alimentación', 'Salud', 'Educación', 'Entretenimiento', 'Compras', 'Servicios', 'Inversiones', 'Ahorro', 'Deudas', 'Impuestos', 'Seguros', 'Trabajo', 'Regalos', 'Otros'],
			datasets: [{
				label: 'Total por categoría (€)',
				data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
				backgroundColor: [
					'#8b5cf6', '#6b7280', '#f59e0b', '#ec4899', '#3b82f6', '#f97316',
					'#06b6d4', '#84cc16', '#10b981', '#22c55e', '#ef4444', '#991b1b',
					'#6366f1', '#059669', '#db2777', '#64748b'
				]
			}]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			scales: {
				x: {
					ticks: {
						maxRotation: 45,
						minRotation: 45,
						font: {
							size: 10
						}
					}
				},
				y: {
					beginAtZero: true,
					ticks: {
						font: {
							size: 11
						}
					}
				}
			},
			plugins: {
				legend: {
					display: false
				}
			}
		}
	});
}

function updateCharts() {
	const income = transactions
	.filter(t => t.type === 'income')
	.reduce((sum, t) => sum + t.amount, 0);
	
	const expense = transactions
	.filter(t => t.type === 'expense')
	.reduce((sum, t) => sum + t.amount, 0);
	
	typeChart.data.datasets[0].data = [income, expense];
	typeChart.update();
	
	const categories = ['Vivienda', 'Transporte', 'Alimentación', 'Salud', 'Educación', 'Entretenimiento', 'Compras', 'Servicios', 'Inversiones', 'Ahorro', 'Deudas', 'Impuestos', 'Seguros', 'Trabajo', 'Regalos', 'Otros'];
	const totals = categories.map(cat =>
		transactions
		.filter(t => t.category === cat)
		.reduce((sum, t) => sum + t.amount, 0)
	);
	
	categoryChart.data.datasets[0].data = totals;
	categoryChart.update();
}

// Exportar a JSON

document.getElementById('export-json').addEventListener('click', () => {
	const dataStr = JSON.stringify(transactions, null, 2);
	const blob = new Blob([dataStr], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');

	a.href = url;
	a.download = 'finantrack_transactions.json';
	a.click();
	URL.revokeObjectURL(url);
});

// Exportar a CSV
document.getElementById('export-csv').addEventListener('click', () => {
	if (transactions.length === 0) {
		showMessage('No hay transacciones para exportar.', 'error');
		return;
	}

	const headers = ['ID', 'Descripción', 'Cantidad', 'Tipo', 'Categoría'];
	const rows = transactions.map(t => [
		t.id,
		`"${t.description}"`,
		t.amount.toFixed(2),
		t.type,
		t.category
	]);

	const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');

	const blob = new Blob([csvContent], { type: 'text/csv' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');

	a.href = url;
	a.download = 'finantrack_transactions.csv';
	a.click();
	URL.revokeObjectURL(url);
});