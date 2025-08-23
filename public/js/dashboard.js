// Dashboard JavaScript
class EvolutionGHLDashboard {
    constructor() {
        this.socket = null;
        this.currentInstance = null;
        this.charts = {};
        this.init();
    }

    init() {
        this.setupSocketConnection();
        this.setupEventListeners();
        this.setupTabs();
        this.loadInstances();
        this.loadStats();
        this.setupCharts();
    }

    setupSocketConnection() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.updateConnectionStatus(true);
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.updateConnectionStatus(false);
        });

        this.socket.on('qrcode-update', (data) => {
            this.displayQRCode(data.qrcode);
        });

        this.socket.on('connection-update', (data) => {
            this.handleConnectionUpdate(data);
        });

        this.socket.on('new-message', (data) => {
            this.handleNewMessage(data);
        });

        this.socket.on('message-update', (data) => {
            this.handleMessageUpdate(data);
        });
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = button.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Instance name input
        document.getElementById('instance-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.generateQR();
            }
        });
    }

    setupTabs() {
        // Initialize first tab as active
        this.switchTab('instances');
    }

    switchTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });

        // Remove active state from all tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active', 'border-blue-500', 'text-blue-600');
            button.classList.add('border-transparent', 'text-gray-500');
        });

        // Show selected tab content
        document.getElementById(`${tabName}-tab`).classList.remove('hidden');

        // Activate selected tab button
        const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
        activeButton.classList.add('active', 'border-blue-500', 'text-blue-600');
        activeButton.classList.remove('border-transparent', 'text-gray-500');

        // Load tab-specific data
        switch (tabName) {
            case 'messages':
                this.loadMessages();
                break;
            case 'analytics':
                this.updateCharts();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    async generateQR() {
        const instanceName = document.getElementById('instance-name').value.trim();
        
        if (!instanceName) {
            this.showToast('Por favor ingresa un nombre para la instancia', 'error');
            return;
        }

        try {
            this.showLoading(true);
            
            const response = await fetch(`/api/qr/instance/${instanceName}`);
            const data = await response.json();

            if (data.success) {
                if (data.connected) {
                    this.showConnectionSuccess(data.phoneNumber);
                } else if (data.qrCode) {
                    this.displayQRCode(data.qrCode);
                    this.currentInstance = instanceName;
                    this.socket.emit('subscribe-instance', instanceName);
                }
            } else {
                this.showToast(data.error || 'Error generando QR code', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showToast('Error de conexión', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    displayQRCode(qrCode) {
        const container = document.getElementById('qr-container');
        const image = document.getElementById('qr-image');
        
        image.src = qrCode;
        container.classList.remove('hidden');
        
        document.getElementById('connection-status').classList.add('hidden');
    }

    showConnectionSuccess(phoneNumber) {
        const container = document.getElementById('qr-container');
        const statusDiv = document.getElementById('connection-status');
        const phoneSpan = document.getElementById('phone-number');
        
        container.classList.add('hidden');
        phoneSpan.textContent = phoneNumber;
        statusDiv.classList.remove('hidden');
        
        this.showToast('¡WhatsApp conectado exitosamente!', 'success');
        this.loadInstances();
    }

    handleConnectionUpdate(data) {
        if (data.instance === this.currentInstance) {
            if (data.state === 'open') {
                this.showConnectionSuccess(data.phoneNumber || 'Conectado');
            }
        }
        this.loadInstances();
    }

    handleNewMessage(data) {
        this.updateStats();
        this.addMessageToList(data);
        this.showToast(`Nuevo mensaje de ${data.from}`, 'info');
    }

    handleMessageUpdate(data) {
        console.log('Message status updated:', data);
    }

    async loadInstances() {
        try {
            const response = await fetch('/api/qr/instances');
            const data = await response.json();

            if (data.success) {
                this.renderInstancesList(data.instances);
            }
        } catch (error) {
            console.error('Error loading instances:', error);
        }
    }

    renderInstancesList(instances) {
        const container = document.getElementById('instances-list');
        
        if (instances.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-mobile-alt text-3xl mb-2"></i>
                    <p>No hay instancias configuradas</p>
                </div>
            `;
            return;
        }

        container.innerHTML = instances.map(instance => `
            <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <div class="w-3 h-3 rounded-full mr-3 ${this.getStatusColor(instance.currentStatus)}"></div>
                        <div>
                            <h4 class="font-medium text-gray-900">${instance.name}</h4>
                            <p class="text-sm text-gray-500">Estado: ${this.getStatusText(instance.currentStatus)}</p>
                            ${instance.phone_number ? `<p class="text-sm text-gray-600">📱 ${instance.phone_number}</p>` : ''}
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        ${instance.currentStatus === 'open' ? `
                            <button onclick="dashboard.disconnectInstance('${instance.name}')" 
                                    class="text-red-600 hover:text-red-800">
                                <i class="fas fa-unlink"></i>
                            </button>
                        ` : `
                            <button onclick="dashboard.connectInstance('${instance.name}')" 
                                    class="text-green-600 hover:text-green-800">
                                <i class="fas fa-link"></i>
                            </button>
                        `}
                        <button onclick="dashboard.deleteInstance('${instance.name}')" 
                                class="text-red-600 hover:text-red-800">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    getStatusColor(status) {
        switch (status) {
            case 'open': return 'bg-green-500';
            case 'connecting': return 'bg-yellow-500';
            case 'close': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    }

    getStatusText(status) {
        switch (status) {
            case 'open': return 'Conectado';
            case 'connecting': return 'Conectando...';
            case 'close': return 'Desconectado';
            default: return 'Desconocido';
        }
    }

    async connectInstance(instanceName) {
        try {
            document.getElementById('instance-name').value = instanceName;
            await this.generateQR();
        } catch (error) {
            console.error('Error connecting instance:', error);
        }
    }

    async disconnectInstance(instanceName) {
        if (!confirm(`¿Estás seguro de desconectar la instancia ${instanceName}?`)) return;

        try {
            const response = await fetch(`/api/qr/disconnect/${instanceName}`, {
                method: 'POST'
            });
            const data = await response.json();

            if (data.success) {
                this.showToast('Instancia desconectada', 'success');
                this.loadInstances();
            } else {
                this.showToast(data.error || 'Error desconectando instancia', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showToast('Error de conexión', 'error');
        }
    }

    async deleteInstance(instanceName) {
        if (!confirm(`¿Estás seguro de eliminar la instancia ${instanceName}? Esta acción no se puede deshacer.`)) return;

        try {
            const response = await fetch(`/api/qr/instance/${instanceName}`, {
                method: 'DELETE'
            });
            const data = await response.json();

            if (data.success) {
                this.showToast('Instancia eliminada', 'success');
                this.loadInstances();
            } else {
                this.showToast(data.error || 'Error eliminando instancia', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showToast('Error de conexión', 'error');
        }
    }

    async refreshInstances() {
        this.showLoading(true);
        await this.loadInstances();
        this.showLoading(false);
        this.showToast('Lista actualizada', 'success');
    }

    async loadMessages() {
        try {
            const response = await fetch('/api/dashboard/messages');
            const data = await response.json();

            if (data.success) {
                this.renderMessagesList(data.messages);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    renderMessagesList(messages) {
        const container = document.getElementById('messages-list');
        
        if (messages.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-comments text-3xl mb-2"></i>
                    <p>No hay mensajes recientes</p>
                </div>
            `;
            return;
        }

        container.innerHTML = messages.map(message => `
            <div class="border-l-4 ${message.direction === 'inbound' ? 'border-blue-500' : 'border-green-500'} pl-4 py-3">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center">
                        <span class="font-medium">${message.whatsapp_number}</span>
                        <span class="ml-2 px-2 py-1 text-xs rounded-full ${
                            message.direction === 'inbound' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }">
                            ${message.direction === 'inbound' ? 'Entrante' : 'Saliente'}
                        </span>
                        ${message.ai_analysis ? `
                            <span class="ml-2 px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                                ${message.ai_analysis.intent || 'IA'}
                            </span>
                        ` : ''}
                    </div>
                    <span class="text-sm text-gray-500">${this.formatDate(message.created_at)}</span>
                </div>
                <p class="text-gray-700">${message.message_text}</p>
            </div>
        `).join('');
    }

    addMessageToList(messageData) {
        // Add new message to the top of the list
        const container = document.getElementById('messages-list');
        if (container) {
            const messageHtml = `
                <div class="border-l-4 border-blue-500 pl-4 py-3 bg-blue-50">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center">
                            <span class="font-medium">${messageData.from}</span>
                            <span class="ml-2 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Entrante</span>
                            <span class="ml-2 px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                                ${messageData.analysis?.intent || 'IA'}
                            </span>
                            <span class="ml-2 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Nuevo</span>
                        </div>
                        <span class="text-sm text-gray-500">Ahora</span>
                    </div>
                    <p class="text-gray-700">${messageData.message}</p>
                </div>
            `;
            container.insertAdjacentHTML('afterbegin', messageHtml);
        }
    }

    async loadStats() {
        try {
            const response = await fetch('/api/dashboard/stats');
            const data = await response.json();

            if (data.success) {
                document.getElementById('messages-today').textContent = data.stats.messagesToday || 0;
                document.getElementById('active-contacts').textContent = data.stats.activeContacts || 0;
                document.getElementById('ai-responses').textContent = data.stats.aiResponses || 0;
                document.getElementById('synced-messages').textContent = data.stats.syncedMessages || 0;
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    updateStats() {
        this.loadStats();
    }

    setupCharts() {
        // Messages Chart
        const messagesCtx = document.getElementById('messages-chart');
        if (messagesCtx) {
            this.charts.messages = new Chart(messagesCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Mensajes',
                        data: [],
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        // Sentiment Chart
        const sentimentCtx = document.getElementById('sentiment-chart');
        if (sentimentCtx) {
            this.charts.sentiment = new Chart(sentimentCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Positivo', 'Neutral', 'Negativo'],
                    datasets: [{
                        data: [0, 0, 0],
                        backgroundColor: [
                            'rgb(34, 197, 94)',
                            'rgb(156, 163, 175)',
                            'rgb(239, 68, 68)'
                        ]
                    }]
                },
                options: {
                    responsive: true
                }
            });
        }
    }

    async updateCharts() {
        try {
            const response = await fetch('/api/dashboard/analytics');
            const data = await response.json();

            if (data.success) {
                // Update messages chart
                if (this.charts.messages && data.analytics.messages) {
                    this.charts.messages.data.labels = data.analytics.messages.labels;
                    this.charts.messages.data.datasets[0].data = data.analytics.messages.data;
                    this.charts.messages.update();
                }

                // Update sentiment chart
                if (this.charts.sentiment && data.analytics.sentiment) {
                    this.charts.sentiment.data.datasets[0].data = [
                        data.analytics.sentiment.positive,
                        data.analytics.sentiment.neutral,
                        data.analytics.sentiment.negative
                    ];
                    this.charts.sentiment.update();
                }
            }
        } catch (error) {
            console.error('Error updating charts:', error);
        }
    }

    loadSettings() {
        // Load current settings from localStorage or API
        const settings = JSON.parse(localStorage.getItem('evolution-ghl-settings') || '{}');
        
        document.getElementById('auto-responses').value = settings.autoResponses || 'enabled';
        document.getElementById('ai-model').value = settings.aiModel || 'gpt-4';
        document.getElementById('language').value = settings.language || 'es';
    }

    async saveSettings() {
        const settings = {
            autoResponses: document.getElementById('auto-responses').value,
            aiModel: document.getElementById('ai-model').value,
            language: document.getElementById('language').value
        };

        try {
            const response = await fetch('/api/dashboard/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });

            const data = await response.json();
            
            if (data.success) {
                localStorage.setItem('evolution-ghl-settings', JSON.stringify(settings));
                this.showToast('Configuración guardada', 'success');
            } else {
                this.showToast(data.error || 'Error guardando configuración', 'error');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showToast('Error de conexión', 'error');
        }
    }

    updateConnectionStatus(connected) {
        const statusElement = document.querySelector('.connection-status');
        if (statusElement) {
            statusElement.className = `w-3 h-3 rounded-full mr-2 connection-status ${
                connected ? 'bg-green-500' : 'bg-red-500'
            }`;
        }
    }

    showLoading(show) {
        // Implement loading state
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            button.disabled = show;
        });
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            info: 'bg-blue-500',
            warning: 'bg-yellow-500'
        };

        toast.className = `${colors[type]} text-white px-4 py-2 rounded-md shadow-lg transform transition-all duration-300 translate-x-full`;
        toast.textContent = message;

        container.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                container.removeChild(toast);
            }, 300);
        }, 3000);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Initialize dashboard
const dashboard = new EvolutionGHLDashboard();