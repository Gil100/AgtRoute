/**
 * AgtRoute - Route Manager
 * מנהל מסלולים מתקדם לאופטימיזציה ותכנון
 * Version: 1.0.0
 * Author: Logistic AI System
 */

class RouteManager {
    constructor() {
        this.routes = new Map();
        this.activeRoute = null;
        this.routeHistory = [];
        this.optimizationSettings = {
            algorithm: 'mega-cluster-first',
            maxHoursPerDay: 12,
            visitDuration: 15, // minutes
            startTime: '06:00',
            maxDaysPerWeek: 5
        };
        this.megaClusters = new Map();
        this.routeCache = new Map();
        
        this.initializeRouteManager();
    }

    initializeRouteManager() {
        console.log('🛣️ Initializing Route Manager...');
        this.loadRouteSettings();
        this.setupEventListeners();
        this.initializeOptimizationEngine();
    }

    loadRouteSettings() {
        const savedSettings = localStorage.getItem('agtroute_optimization_settings');
        if (savedSettings) {
            this.optimizationSettings = { ...this.optimizationSettings, ...JSON.parse(savedSettings) };
        }
    }

    saveRouteSettings() {
        localStorage.setItem('agtroute_optimization_settings', JSON.stringify(this.optimizationSettings));
    }

    setupEventListeners() {
        // Route optimization controls
        const optimizeBtn = document.getElementById('optimize-routes');
        if (optimizeBtn) {
            optimizeBtn.addEventListener('click', () => this.optimizeAllRoutes());
        }

        // Route generation controls
        const generateBtn = document.getElementById('generate-daily-routes');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateDailyRoutes());
        }

        // Route settings
        const settingsBtn = document.getElementById('route-settings');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showRouteSettings());
        }

        // Navigation controls
        const navBtns = document.querySelectorAll('.route-nav-btn');
        navBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleRouteNavigation(e));
        });
    }

    initializeOptimizationEngine() {
        console.log('🧠 Initializing Optimization Engine...');
        this.identifyMegaClusters();
        this.loadRouteHistory();
    }

    // MEGA CLUSTER IDENTIFICATION
    identifyMegaClusters() {
        if (!window.dataManager || !window.dataManager.clients) return;

        const clients = window.dataManager.clients;
        const clusterMap = new Map();

        // Group clients by location (lat/lng with tolerance)
        clients.forEach(client => {
            if (!client.Latitude || !client.Longitude) return;

            const key = this.generateLocationKey(client.Latitude, client.Longitude);
            if (!clusterMap.has(key)) {
                clusterMap.set(key, []);
            }
            clusterMap.get(key).push(client);
        });

        // Identify MEGA CLUSTERS (5+ clients in same location)
        this.megaClusters.clear();
        clusterMap.forEach((clients, key) => {
            if (clients.length >= 5) {
                const clusterName = clients[0]['עיר ומדינה'] || `Cluster-${key}`;
                this.megaClusters.set(key, {
                    name: clusterName,
                    clients: clients,
                    count: clients.length,
                    efficiency: this.calculateClusterEfficiency(clients),
                    priority: this.calculateClusterPriority(clients)
                });
            }
        });

        console.log(`🎯 Identified ${this.megaClusters.size} MEGA CLUSTERS`);
        this.displayMegaClusters();
    }

    generateLocationKey(lat, lng, tolerance = 0.001) {
        // Round coordinates to create location keys
        const roundedLat = Math.round(lat / tolerance) * tolerance;
        const roundedLng = Math.round(lng / tolerance) * tolerance;
        return `${roundedLat.toFixed(3)}_${roundedLng.toFixed(3)}`;
    }

    calculateClusterEfficiency(clients) {
        // Calculate clients per hour based on visit duration and travel time
        const visitTime = this.optimizationSettings.visitDuration;
        const travelTime = 5; // Minimal travel within cluster
        const timePerClient = visitTime + travelTime;
        return Math.round((60 / timePerClient) * 100) / 100; // clients per hour
    }

    calculateClusterPriority(clients) {
        // Priority based on efficiency and client count
        const efficiency = this.calculateClusterEfficiency(clients);
        const count = clients.length;
        return Math.round(efficiency * count * 10) / 10;
    }

    // ROUTE OPTIMIZATION ALGORITHMS
    async optimizeAllRoutes() {
        console.log('🚀 Starting Route Optimization...');
        this.showLoadingState('Optimizing routes...');

        try {
            const optimizedRoutes = await this.runOptimizationAlgorithm();
            this.routes = optimizedRoutes;
            this.displayOptimizedRoutes();
            this.saveRoutesToHistory();
            this.showSuccessMessage('Routes optimized successfully!');
        } catch (error) {
            console.error('Optimization failed:', error);
            this.showErrorMessage('Route optimization failed. Please try again.');
        } finally {
            this.hideLoadingState();
        }
    }

    async runOptimizationAlgorithm() {
        const algorithm = this.optimizationSettings.algorithm;
        
        switch (algorithm) {
            case 'mega-cluster-first':
                return await this.megaClusterFirstOptimization();
            case 'nearest-neighbor':
                return await this.nearestNeighborOptimization();
            case 'genetic-algorithm':
                return await this.geneticAlgorithmOptimization();
            default:
                return await this.megaClusterFirstOptimization();
        }
    }

    async megaClusterFirstOptimization() {
        console.log('🎯 Running MEGA-CLUSTER-FIRST optimization...');
        
        const routes = new Map();
        const usedClients = new Set();
        let currentDay = 1;

        // Phase 1: Assign MEGA CLUSTERS
        const sortedClusters = Array.from(this.megaClusters.values())
            .sort((a, b) => b.priority - a.priority);

        for (const cluster of sortedClusters) {
            if (currentDay > this.optimizationSettings.maxDaysPerWeek) break;

            const route = this.createRoute(currentDay, cluster.name);
            route.clients = [...cluster.clients];
            route.efficiency = cluster.efficiency;
            route.estimatedHours = this.calculateRouteHours(route.clients);

            if (route.estimatedHours <= this.optimizationSettings.maxHoursPerDay) {
                routes.set(`day-${currentDay}`, route);
                cluster.clients.forEach(client => usedClients.add(client));
                currentDay++;
            }
        }

        // Phase 2: Assign remaining clients
        const remainingClients = window.dataManager.clients.filter(client => !usedClients.has(client));
        await this.assignRemainingClients(routes, remainingClients, currentDay);

        return routes;
    }

    async assignRemainingClients(routes, remainingClients, startDay) {
        const clientsPerDay = Math.ceil(remainingClients.length / (this.optimizationSettings.maxDaysPerWeek - startDay + 1));
        
        let currentDay = startDay;
        let dayClientCount = 0;

        for (const client of remainingClients) {
            if (currentDay > this.optimizationSettings.maxDaysPerWeek) break;

            let route = routes.get(`day-${currentDay}`);
            if (!route) {
                route = this.createRoute(currentDay, `Mixed Route ${currentDay}`);
                routes.set(`day-${currentDay}`, route);
            }

            route.clients.push(client);
            dayClientCount++;

            // Move to next day if current day is full
            if (dayClientCount >= clientsPerDay) {
                route.estimatedHours = this.calculateRouteHours(route.clients);
                route.efficiency = this.calculateRouteEfficiency(route);
                currentDay++;
                dayClientCount = 0;
            }
        }

        // Calculate final metrics for all routes
        routes.forEach(route => {
            route.estimatedHours = this.calculateRouteHours(route.clients);
            route.efficiency = this.calculateRouteEfficiency(route);
        });
    }

    createRoute(day, name) {
        return {
            id: `route-${day}-${Date.now()}`,
            day: day,
            name: name,
            clients: [],
            status: 'planned',
            estimatedHours: 0,
            efficiency: 0,
            startTime: this.optimizationSettings.startTime,
            createdAt: new Date().toISOString()
        };
    }

    calculateRouteHours(clients) {
        const visitMinutes = clients.length * this.optimizationSettings.visitDuration;
        const travelMinutes = clients.length * 10; // Estimated travel time
        return Math.round((visitMinutes + travelMinutes) / 60 * 100) / 100;
    }

    calculateRouteEfficiency(route) {
        if (route.estimatedHours === 0) return 0;
        return Math.round((route.clients.length / route.estimatedHours) * 100) / 100;
    }

    // DAILY ROUTE GENERATION
    generateDailyRoutes() {
        console.log('📅 Generating Daily Routes...');
        
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        // Generate routes for current week
        for (let i = 1; i <= 5; i++) {
            this.generateDayRoute(i);
        }

        this.displayDailyRoutes();
    }

    generateDayRoute(dayNumber) {
        const routeKey = `day-${dayNumber}`;
        const existingRoute = this.routes.get(routeKey);

        if (existingRoute) {
            // Update existing route
            this.optimizeDayRoute(existingRoute);
        } else {
            // Create new route
            const newRoute = this.createEmptyDayRoute(dayNumber);
            this.routes.set(routeKey, newRoute);
        }
    }

    createEmptyDayRoute(dayNumber) {
        const dayNames = ['', 'ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];
        return this.createRoute(dayNumber, `יום ${dayNames[dayNumber]}`);
    }

    optimizeDayRoute(route) {
        // Apply local optimization to existing route
        route.clients = this.optimizeClientOrder(route.clients);
        route.estimatedHours = this.calculateRouteHours(route.clients);
        route.efficiency = this.calculateRouteEfficiency(route);
        route.updatedAt = new Date().toISOString();
    }

    optimizeClientOrder(clients) {
        // Simple nearest neighbor for now
        if (clients.length <= 2) return clients;

        const optimized = [clients[0]];
        const remaining = clients.slice(1);

        while (remaining.length > 0) {
            const current = optimized[optimized.length - 1];
            let nearestIndex = 0;
            let nearestDistance = this.calculateDistance(current, remaining[0]);

            for (let i = 1; i < remaining.length; i++) {
                const distance = this.calculateDistance(current, remaining[i]);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestIndex = i;
                }
            }

            optimized.push(remaining[nearestIndex]);
            remaining.splice(nearestIndex, 1);
        }

        return optimized;
    }

    calculateDistance(client1, client2) {
        // Haversine formula for distance calculation
        const R = 6371; // Earth's radius in km
        const dLat = (client2.Latitude - client1.Latitude) * Math.PI / 180;
        const dLon = (client2.Longitude - client1.Longitude) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(client1.Latitude * Math.PI / 180) * Math.cos(client2.Latitude * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    // NAVIGATION AND ROUTE FOLLOWING
    handleRouteNavigation(event) {
        const action = event.target.dataset.action;
        const routeId = event.target.dataset.routeId;

        switch (action) {
            case 'start-route':
                this.startRoute(routeId);
                break;
            case 'pause-route':
                this.pauseRoute(routeId);
                break;
            case 'complete-route':
                this.completeRoute(routeId);
                break;
            case 'view-route':
                this.viewRoute(routeId);
                break;
        }
    }

    startRoute(routeId) {
        const route = this.getRouteById(routeId);
        if (!route) return;

        route.status = 'active';
        route.startedAt = new Date().toISOString();
        this.activeRoute = route;

        // Notify map manager to show route
        if (window.mapManager) {
            window.mapManager.showRoute(route);
        }

        this.updateRouteDisplay(route);
        this.startRouteTracking(route);
    }

    pauseRoute(routeId) {
        const route = this.getRouteById(routeId);
        if (!route) return;

        route.status = 'paused';
        route.pausedAt = new Date().toISOString();

        this.updateRouteDisplay(route);
        this.pauseRouteTracking();
    }

    completeRoute(routeId) {
        const route = this.getRouteById(routeId);
        if (!route) return;

        route.status = 'completed';
        route.completedAt = new Date().toISOString();
        route.actualHours = this.calculateActualHours(route);

        this.updateRouteDisplay(route);
        this.saveRouteResults(route);
        
        if (this.activeRoute === route) {
            this.activeRoute = null;
        }
    }

    viewRoute(routeId) {
        const route = this.getRouteById(routeId);
        if (!route) return;

        this.showRouteDetails(route);
        
        // Show route on map
        if (window.mapManager) {
            window.mapManager.showRoute(route);
        }
    }

    // ROUTE TRACKING AND MONITORING
    startRouteTracking(route) {
        console.log(`🚗 Starting route tracking: ${route.name}`);
        
        // Track progress and update ETA
        this.routeTrackingInterval = setInterval(() => {
            this.updateRouteProgress(route);
        }, 30000); // Update every 30 seconds
    }

    pauseRouteTracking() {
        if (this.routeTrackingInterval) {
            clearInterval(this.routeTrackingInterval);
            this.routeTrackingInterval = null;
        }
    }

    updateRouteProgress(route) {
        if (route.status !== 'active') return;

        // Calculate current progress
        const completedClients = route.clients.filter(client => client.visited);
        const progress = (completedClients.length / route.clients.length) * 100;

        route.progress = Math.round(progress);
        route.remainingClients = route.clients.length - completedClients.length;
        route.estimatedCompletion = this.calculateEstimatedCompletion(route);

        this.updateRouteProgressDisplay(route);
    }

    calculateEstimatedCompletion(route) {
        const remainingTime = route.remainingClients * this.optimizationSettings.visitDuration;
        const currentTime = new Date();
        const completionTime = new Date(currentTime.getTime() + remainingTime * 60000);
        return completionTime.toISOString();
    }

    calculateActualHours(route) {
        if (!route.startedAt || !route.completedAt) return 0;
        
        const start = new Date(route.startedAt);
        const end = new Date(route.completedAt);
        const hours = (end - start) / (1000 * 60 * 60);
        return Math.round(hours * 100) / 100;
    }

    // DISPLAY AND UI METHODS
    displayMegaClusters() {
        const container = document.getElementById('mega-clusters-list');
        if (!container) return;

        const clustersArray = Array.from(this.megaClusters.values())
            .sort((a, b) => b.priority - a.priority);

        container.innerHTML = clustersArray.map(cluster => `
            <div class="cluster-card mega-cluster" data-cluster="${cluster.name}">
                <div class="cluster-header">
                    <h4>${cluster.name}</h4>
                    <span class="cluster-badge mega">${cluster.count} לקוחות</span>
                </div>
                <div class="cluster-metrics">
                    <div class="metric">
                        <span class="label">יעילות:</span>
                        <span class="value">${cluster.efficiency} לקוח/שעה</span>
                    </div>
                    <div class="metric">
                        <span class="label">עדיפות:</span>
                        <span class="value priority-${this.getPriorityLevel(cluster.priority)}">${cluster.priority}</span>
                    </div>
                </div>
                <div class="cluster-actions">
                    <button class="btn btn-sm btn-primary" onclick="routeManager.viewCluster('${cluster.name}')">
                        צפה בלקוחות
                    </button>
                </div>
            </div>
        `).join('');
    }

    displayOptimizedRoutes() {
        const container = document.getElementById('optimized-routes');
        if (!container) return;

        const routesArray = Array.from(this.routes.values())
            .sort((a, b) => a.day - b.day);

        container.innerHTML = routesArray.map(route => `
            <div class="route-card ${route.status}" data-route="${route.id}">
                <div class="route-header">
                    <h4>יום ${route.day}: ${route.name}</h4>
                    <span class="route-status ${route.status}">${this.getStatusText(route.status)}</span>
                </div>
                <div class="route-metrics">
                    <div class="metric">
                        <span class="label">לקוחות:</span>
                        <span class="value">${route.clients.length}</span>
                    </div>
                    <div class="metric">
                        <span class="label">זמן משוער:</span>
                        <span class="value">${route.estimatedHours} שעות</span>
                    </div>
                    <div class="metric">
                        <span class="label">יעילות:</span>
                        <span class="value">${route.efficiency} לקוח/שעה</span>
                    </div>
                </div>
                <div class="route-actions">
                    <button class="btn btn-sm btn-primary" data-action="view-route" data-route-id="${route.id}">
                        צפה במסלול
                    </button>
                    <button class="btn btn-sm btn-success" data-action="start-route" data-route-id="${route.id}">
                        התחל מסלול
                    </button>
                </div>
            </div>
        `).join('');
    }

    showRouteDetails(route) {
        const modal = document.getElementById('route-details-modal');
        if (!modal) return;

        const content = modal.querySelector('.modal-content');
        content.innerHTML = `
            <div class="modal-header">
                <h3>${route.name}</h3>
                <button class="close-btn" onclick="this.closest('.modal').style.display='none'">&times;</button>
            </div>
            <div class="modal-body">
                <div class="route-summary">
                    <div class="summary-item">
                        <label>סטטוס:</label>
                        <span class="status ${route.status}">${this.getStatusText(route.status)}</span>
                    </div>
                    <div class="summary-item">
                        <label>לקוחות:</label>
                        <span>${route.clients.length}</span>
                    </div>
                    <div class="summary-item">
                        <label>זמן משוער:</label>
                        <span>${route.estimatedHours} שעות</span>
                    </div>
                    <div class="summary-item">
                        <label>יעילות:</label>
                        <span>${route.efficiency} לקוח/שעה</span>
                    </div>
                </div>
                <div class="clients-list">
                    <h4>רשימת לקוחות:</h4>
                    ${route.clients.map((client, index) => `
                        <div class="client-item ${client.visited ? 'visited' : ''}">
                            <span class="client-number">${index + 1}</span>
                            <span class="client-name">${client['שם לקוח']}</span>
                            <span class="client-location">${client['עיר ומדינה']}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="this.closest('.modal').style.display='none'">סגור</button>
                <button class="btn btn-primary" data-action="start-route" data-route-id="${route.id}">התחל מסלול</button>
            </div>
        `;

        modal.style.display = 'block';
    }

    // UTILITY METHODS
    getRouteById(routeId) {
        for (const route of this.routes.values()) {
            if (route.id === routeId) return route;
        }
        return null;
    }

    getPriorityLevel(priority) {
        if (priority >= 50) return 'high';
        if (priority >= 25) return 'medium';
        return 'low';
    }

    getStatusText(status) {
        const statusTexts = {
            'planned': 'מתוכנן',
            'active': 'פעיל',
            'paused': 'מושהה',
            'completed': 'הושלם'
        };
        return statusTexts[status] || status;
    }

    showLoadingState(message) {
        // Show loading spinner and message
        const loadingEl = document.getElementById('loading-overlay');
        if (loadingEl) {
            loadingEl.querySelector('.loading-message').textContent = message;
            loadingEl.style.display = 'flex';
        }
    }

    hideLoadingState() {
        const loadingEl = document.getElementById('loading-overlay');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    }

    showSuccessMessage(message) {
        this.showToast(message, 'success');
    }

    showErrorMessage(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info') {
        // Create and show toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-message">${message}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
        `;

        const container = document.getElementById('toast-container') || document.body;
        container.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }

    // PERSISTENCE METHODS
    saveRoutesToHistory() {
        const routeData = {
            routes: Array.from(this.routes.entries()),
            timestamp: new Date().toISOString(),
            megaClusters: Array.from(this.megaClusters.entries())
        };

        this.routeHistory.unshift(routeData);
        
        // Keep only last 10 optimizations
        if (this.routeHistory.length > 10) {
            this.routeHistory = this.routeHistory.slice(0, 10);
        }

        localStorage.setItem('agtroute_history', JSON.stringify(this.routeHistory));
    }

    loadRouteHistory() {
        const savedHistory = localStorage.getItem('agtroute_history');
        if (savedHistory) {
            this.routeHistory = JSON.parse(savedHistory);
        }
    }

    saveRouteResults(route) {
        const results = JSON.parse(localStorage.getItem('agtroute_results') || '[]');
        results.push({
            routeId: route.id,
            name: route.name,
            clients: route.clients.length,
            estimatedHours: route.estimatedHours,
            actualHours: route.actualHours,
            efficiency: route.efficiency,
            completedAt: route.completedAt
        });

        localStorage.setItem('agtroute_results', JSON.stringify(results));
    }

    // PUBLIC API METHODS
    getActiveRoute() {
        return this.activeRoute;
    }

    getAllRoutes() {
        return Array.from(this.routes.values());
    }

    getMegaClusters() {
        return Array.from(this.megaClusters.values());
    }

    getRouteStatistics() {
        const routes = this.getAllRoutes();
        const totalClients = routes.reduce((sum, route) => sum + route.clients.length, 0);
        const totalHours = routes.reduce((sum, route) => sum + route.estimatedHours, 0);
        const avgEfficiency = routes.length > 0 ? 
            routes.reduce((sum, route) => sum + route.efficiency, 0) / routes.length : 0;

        return {
            totalRoutes: routes.length,
            totalClients,
            totalHours: Math.round(totalHours * 100) / 100,
            avgEfficiency: Math.round(avgEfficiency * 100) / 100,
            megaClustersCount: this.megaClusters.size
        };
    }
}

// Initialize Route Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window !== 'undefined') {
        window.routeManager = new RouteManager();
        console.log('✅ Route Manager initialized successfully!');
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RouteManager;
}