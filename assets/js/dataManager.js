/**
 * AgtRoute - Advanced Data Manager
 * Handles data operations, filtering, client management and business logic
 * Integrates with proven Logistic AI system algorithms
 */

class DataManager {
  constructor() {
    this.clients = [];
    this.routes = [];
    this.clusters = [];
    this.megaClusters = [];
    this.filteredClients = [];
    this.currentDay = 'all';
    this.searchQuery = '';
    this.sortBy = 'name';
    this.sortOrder = 'asc';
    
    // Business logic properties
    this.warehouseLocation = { lat: 32.7254465, lng: 35.4669505 }; // מושב שרונה
    this.workingHours = 12; // 12 hours max per day
    this.visitDuration = 15; // 15 minutes per client
    this.workingDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
    
    // Statistics cache
    this.stats = {
      totalClients: 0,
      totalTime: 0,
      totalDistance: 0,
      efficiency: 0,
      clustersCount: 0
    };
    
    this.init();
  }
  
  /**
   * Initialize data manager
   */
  init() {
    this.setupEventListeners();
    console.log('📊 Data Manager initialized');
  }
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Sort controls
    const sortSelect = document.querySelector('.sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.setSorting(e.target.value);
      });
    }
    
    // Export buttons
    const exportButtons = document.querySelectorAll('.export-btn');
    exportButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const format = e.target.dataset.format;
        this.exportData(format);
      });
    });
  }
  
  /**
   * Load data with enhanced business logic integration and error handling
   */
  async loadData(clientData, routeData, clusterData) {
    try {
      console.log('📊 Loading data...', { clientData, routeData, clusterData });
      
      // Validate and handle different data structures
      if (clientData?.clients && Array.isArray(clientData.clients)) {
        this.clients = clientData.clients;
        this.megaClusters = clientData.megaClusters || [];
        console.log('✅ Client data loaded from structured format');
      } else if (Array.isArray(clientData)) {
        this.clients = clientData;
        console.log('✅ Client data loaded from array format');
      } else if (clientData) {
        console.warn('⚠️ Unexpected client data format:', typeof clientData);
        this.clients = [];
      } else {
        console.warn('⚠️ No client data provided');
        this.clients = [];
      }
      
      // Validate routes data with fallback
      if (routeData?.dailyRoutes && Array.isArray(routeData.dailyRoutes)) {
        this.routes = routeData.dailyRoutes;
        console.log('✅ Route data loaded from structured format');
      } else if (Array.isArray(routeData)) {
        this.routes = routeData;
        console.log('✅ Route data loaded from array format');
      } else {
        console.warn('⚠️ No valid route data, using fallback data');
        this.routes = this.getFallbackRoutes();
      }
      
      // Validate clusters data
      if (clusterData?.clusterAnalysis?.megaClusters?.clusters) {
        this.clusters = clusterData.clusterAnalysis.megaClusters.clusters;
        console.log('✅ Cluster data loaded from structured format');
      } else if (Array.isArray(clusterData)) {
        this.clusters = clusterData;
        console.log('✅ Cluster data loaded from array format');
      } else {
        console.warn('⚠️ No valid cluster data, using empty array');
        this.clusters = [];
      }
      
      // Process and enrich data with business logic
      await this.processClientData();
      await this.processRouteData();
      await this.processClusterData();
      await this.identifyMegaClusters();
      
      // Calculate advanced statistics
      this.calculateAdvancedStatistics();
      
      // Set initial filtered data
      this.filteredClients = [...this.clients];
      
      // Update UI
      this.renderClientList();
      this.updateStatistics();
      this.updateBusinessInsights();
      
      console.log('📊 Advanced data loaded:', {
        clients: this.clients.length,
        routes: this.routes.length,
        clusters: this.clusters.length,
        megaClusters: this.megaClusters.length
      });
      
    } catch (error) {
      console.error('❌ Failed to load data:', error);
      throw error;
    }
  }
  
  /**
   * Process client data with advanced business logic
   */
  async processClientData() {
    this.clients = this.clients.map((client, index) => {
      const processedClient = {
        ...client,
        id: client.id || `client-${index}`,
        displayName: client.name || 'לקוח ללא שם',
        searchText: this.createSearchText(client),
        status: client.status || 'active',
        visitTime: client.visitTime || client.visitDuration || this.visitDuration,
        priority: client.priority || 'normal',
        day: client.visitDay || client.day || 'sunday',
        
        // Calculate distance from warehouse if coordinates exist
        distanceFromWarehouse: client.latitude && client.longitude ? 
          this.calculateDistance(
            this.warehouseLocation.lat, this.warehouseLocation.lng,
            client.latitude, client.longitude
          ).toFixed(1) + ' ק"מ' : client.distanceFromWarehouse,
        
        // Assign cluster if exists
        cluster: client.cluster || this.findClientCluster(client),
        
        // Calculate efficiency metrics
        efficiency: this.calculateClientEfficiency(client)
      };
      
      return processedClient;
    });
    
    // Sort clients by day and efficiency for optimal routing
    this.clients.sort((a, b) => {
      if (a.day !== b.day) {
        return this.workingDays.indexOf(a.day) - this.workingDays.indexOf(b.day);
      }
      return b.efficiency - a.efficiency;
    });
  }
  
  /**
   * Process route data
   */
  processRouteData() {
    // Make sure routes is an array before processing
    if (!Array.isArray(this.routes)) {
      console.warn('⚠️ Routes data is not an array, using empty array');
      this.routes = [];
      return;
    }
    
    this.routes = this.routes.map((route, index) => ({
      ...route,
      id: route.id || `route-${index}`,
      totalDistance: this.calculateRouteDistance(route),
      totalTime: this.calculateRouteTime(route),
      efficiency: this.calculateRouteEfficiency(route)
    }));
  }
  
  /**
   * Process cluster data
   */
  processClusterData() {
    // Make sure clusters is an array before processing
    if (!Array.isArray(this.clusters)) {
      console.warn('⚠️ Clusters data is not an array, using empty array');
      this.clusters = [];
      return;
    }
    
    this.clusters = this.clusters.map((cluster, index) => ({
      ...cluster,
      id: cluster.id || `cluster-${index}`,
      clientCount: cluster.clients?.length || 0,
      efficiency: this.calculateClusterEfficiency(cluster)
    }));
  }
  
  /**
   * Create search text for client
   */
  createSearchText(client) {
    return [
      client.name,
      client.address,
      client.phone,
      client.notes,
      client.type
    ].filter(Boolean).join(' ').toLowerCase();
  }
  
  /**
   * Filter clients by day
   */
  filterClientsByDay(day) {
    this.currentDay = day;
    this.applyFilters();
    console.log(`📅 Filtered clients by day: ${day}`);
  }
  
  /**
   * Search clients
   */
  searchClients(query) {
    this.searchQuery = query.toLowerCase();
    this.applyFilters();
    console.log(`🔍 Search query: "${query}"`);
  }
  
  /**
   * Apply all filters
   */
  applyFilters() {
    let filtered = [...this.clients];
    
    // Day filter
    if (this.currentDay !== 'all') {
      filtered = filtered.filter(client => client.day === this.currentDay);
    }
    
    // Search filter
    if (this.searchQuery) {
      filtered = filtered.filter(client => 
        client.searchText.includes(this.searchQuery)
      );
    }
    
    // Sort
    filtered = this.sortClients(filtered);
    
    this.filteredClients = filtered;
    this.renderClientList();
    this.updateStatistics();
  }
  
  /**
   * Sort clients
   */
  sortClients(clients) {
    return clients.sort((a, b) => {
      let valueA, valueB;
      
      switch (this.sortBy) {
        case 'name':
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          break;
        case 'day':
          valueA = a.day;
          valueB = b.day;
          break;
        case 'distance':
          valueA = a.distanceFromWarehouse || 0;
          valueB = b.distanceFromWarehouse || 0;
          break;
        case 'time':
          valueA = a.visitTime || 0;
          valueB = b.visitTime || 0;
          break;
        case 'priority':
          const priorityOrder = { 'high': 3, 'normal': 2, 'low': 1 };
          valueA = priorityOrder[a.priority] || 2;
          valueB = priorityOrder[b.priority] || 2;
          break;
        default:
          valueA = a.name;
          valueB = b.name;
      }
      
      if (this.sortOrder === 'desc') {
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
      } else {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      }
    });
  }
  
  /**
   * Set sorting
   */
  setSorting(sortBy, order = null) {
    this.sortBy = sortBy;
    if (order) {
      this.sortOrder = order;
    }
    this.applyFilters();
    console.log(`🔄 Sorted by: ${sortBy} (${this.sortOrder})`);
  }
  
  /**
   * Render client list
   */
  renderClientList() {
    const clientList = document.querySelector('.client-list');
    if (!clientList) return;
    
    if (this.filteredClients.length === 0) {
      clientList.innerHTML = this.renderEmptyState();
      return;
    }
    
    const clientsHTML = this.filteredClients.map(client => 
      this.renderClientCard(client)
    ).join('');
    
    clientList.innerHTML = clientsHTML;
    
    // Add event listeners to client cards
    this.attachClientCardListeners();
  }
  
  /**
   * Render client card
   */
  renderClientCard(client) {
    const priorityIcon = this.getPriorityIcon(client.priority);
    const statusClass = this.getStatusClass(client.status);
    const dayName = this.getDayName(client.day);
    
    return `
      <div class="client-card ${statusClass}" data-client-id="${client.id}">
        <div class="client-header">
          <div class="client-name">
            ${priorityIcon}
            <span>${client.name}</span>
          </div>
          <div class="client-day">
            <span class="day-badge day-${client.day}">${dayName}</span>
          </div>
        </div>
        
        <div class="client-content">
          <div class="client-address">
            <i class="icon-location"></i>
            <span>${client.address}</span>
          </div>
          
          ${client.phone ? `
            <div class="client-phone">
              <i class="icon-phone"></i>
              <span>${client.phone}</span>
            </div>
          ` : ''}
          
          <div class="client-meta">
            <div class="client-time">
              <i class="icon-clock"></i>
              <span>${client.visitTime} דקות</span>
            </div>
            
            ${client.distanceFromWarehouse ? `
              <div class="client-distance">
                <i class="icon-route"></i>
                <span>${client.distanceFromWarehouse}</span>
              </div>
            ` : ''}
          </div>
          
          ${client.notes ? `
            <div class="client-notes">
              <i class="icon-note"></i>
              <span>${client.notes}</span>
            </div>
          ` : ''}
        </div>
        
        <div class="client-actions">
          <button class="btn btn-sm btn-primary show-on-map" data-client-id="${client.id}">
            הצג במפה
          </button>
          <button class="btn btn-sm btn-secondary show-route" data-client-id="${client.id}">
            מסלול
          </button>
          <button class="btn btn-sm btn-outline client-menu" data-client-id="${client.id}">
            ⋮
          </button>
        </div>
      </div>
    `;
  }
  
  /**
   * Render empty state
   */
  renderEmptyState() {
    return `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>אין לקוחות להצגה</h3>
        <p>לא נמצאו לקוחות התואמים לחיפוש או לסינון הנוכחי</p>
        <button class="btn btn-primary clear-filters" onclick="window.dataManager.clearFilters()">
          נקה סינונים
        </button>
      </div>
    `;
  }
  
  /**
   * Attach event listeners to client cards
   */
  attachClientCardListeners() {
    // Show on map buttons
    document.querySelectorAll('.show-on-map').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const clientId = e.target.dataset.clientId;
        this.showClientOnMap(clientId);
      });
    });
    
    // Show route buttons
    document.querySelectorAll('.show-route').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const clientId = e.target.dataset.clientId;
        this.showClientRoute(clientId);
      });
    });
    
    // Client menu buttons
    document.querySelectorAll('.client-menu').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const clientId = e.target.dataset.clientId;
        this.showClientMenu(clientId, e.target);
      });
    });
    
    // Client card click
    document.querySelectorAll('.client-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.client-actions')) {
          const clientId = card.dataset.clientId;
          this.selectClient(clientId);
        }
      });
    });
  }
  
  /**
   * Get priority icon
   */
  getPriorityIcon(priority) {
    const icons = {
      'high': '<i class="icon-priority-high" title="עדיפות גבוהה">⚠️</i>',
      'normal': '',
      'low': '<i class="icon-priority-low" title="עדיפות נמוכה">⬇️</i>'
    };
    return icons[priority] || '';
  }
  
  /**
   * Get status class
   */
  getStatusClass(status) {
    return `status-${status}`;
  }
  
  /**
   * Get day name in Hebrew
   */
  getDayName(day) {
    const dayNames = {
      'sunday': 'ראשון',
      'monday': 'שני',
      'tuesday': 'שלישי',
      'wednesday': 'רביעי',
      'thursday': 'חמישי'
    };
    return dayNames[day] || day;
  }
  
  /**
   * Show client on map
   */
  showClientOnMap(clientId) {
    if (window.mapManager) {
      window.mapManager.centerOnClient(clientId);
    }
    
    // Switch to map view on mobile
    if (window.agtRouteApp) {
      window.agtRouteApp.setActiveView('map');
    }
  }
  
  /**
   * Show client route
   */
  showClientRoute(clientId) {
    if (window.mapManager) {
      window.mapManager.showRoute(clientId);
    }
    
    // Switch to map view
    if (window.agtRouteApp) {
      window.agtRouteApp.setActiveView('map');
    }
  }
  
  /**
   * Show client menu
   */
  showClientMenu(clientId, buttonElement) {
    // Create context menu
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.innerHTML = `
      <div class="context-menu-item" data-action="edit">
        <i class="icon-edit"></i> עריכה
      </div>
      <div class="context-menu-item" data-action="call">
        <i class="icon-phone"></i> התקשר
      </div>
      <div class="context-menu-item" data-action="directions">
        <i class="icon-directions"></i> הוראות הגעה
      </div>
      <div class="context-menu-item" data-action="share">
        <i class="icon-share"></i> שיתוף
      </div>
    `;
    
    // Position menu
    const rect = buttonElement.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = `${rect.bottom + 5}px`;
    menu.style.left = `${rect.left}px`;
    menu.style.zIndex = '1000';
    
    document.body.appendChild(menu);
    
    // Handle menu clicks
    menu.addEventListener('click', (e) => {
      const action = e.target.closest('.context-menu-item')?.dataset.action;
      if (action) {
        this.handleClientAction(clientId, action);
      }
      menu.remove();
    });
    
    // Close menu on outside click
    setTimeout(() => {
      document.addEventListener('click', () => menu.remove(), { once: true });
    }, 100);
  }
  
  /**
   * Handle client action
   */
  handleClientAction(clientId, action) {
    const client = this.getClientById(clientId);
    if (!client) return;
    
    switch (action) {
      case 'edit':
        this.editClient(client);
        break;
      case 'call':
        this.callClient(client);
        break;
      case 'directions':
        this.getDirections(client);
        break;
      case 'share':
        this.shareClient(client);
        break;
    }
  }
  
  /**
   * Select client
   */
  selectClient(clientId) {
    // Remove previous selection
    document.querySelectorAll('.client-card.selected').forEach(card => {
      card.classList.remove('selected');
    });
    
    // Add selection to current client
    const clientCard = document.querySelector(`[data-client-id="${clientId}"]`);
    if (clientCard) {
      clientCard.classList.add('selected');
    }
    
    // Show client details
    this.showClientDetails(clientId);
  }
  
  /**
   * Show client details
   */
  showClientDetails(clientId) {
    const client = this.getClientById(clientId);
    if (!client) return;
    
    const detailsPanel = document.querySelector('.client-details');
    if (detailsPanel) {
      detailsPanel.innerHTML = this.renderClientDetails(client);
      detailsPanel.classList.add('active');
    }
  }
  
  /**
   * Render client details
   */
  renderClientDetails(client) {
    return `
      <div class="client-details-header">
        <h3>${client.name}</h3>
        <button class="btn btn-sm btn-outline close-details">✕</button>
      </div>
      
      <div class="client-details-content">
        <div class="detail-section">
          <h4>פרטי קשר</h4>
          <p><strong>כתובת:</strong> ${client.address}</p>
          ${client.phone ? `<p><strong>טלפון:</strong> ${client.phone}</p>` : ''}
          ${client.email ? `<p><strong>אימייל:</strong> ${client.email}</p>` : ''}
        </div>
        
        <div class="detail-section">
          <h4>פרטי ביקור</h4>
          <p><strong>יום:</strong> ${this.getDayName(client.day)}</p>
          <p><strong>זמן ביקור:</strong> ${client.visitTime} דקות</p>
          <p><strong>עדיפות:</strong> ${client.priority}</p>
        </div>
        
        ${client.notes ? `
          <div class="detail-section">
            <h4>הערות</h4>
            <p>${client.notes}</p>
          </div>
        ` : ''}
        
        <div class="detail-actions">
          <button class="btn btn-primary" onclick="window.dataManager.showClientRoute('${client.id}')">
            הצג מסלול
          </button>
          <button class="btn btn-secondary" onclick="window.dataManager.editClient('${client.id}')">
            עריכה
          </button>
        </div>
      </div>
    `;
  }
  
  /**
   * Update statistics
   */
  updateStatistics() {
    const stats = this.calculateStatistics();
    
    // Update client count
    const clientCountElement = document.querySelector('.client-count');
    if (clientCountElement) {
      clientCountElement.textContent = `${this.filteredClients.length} לקוחות`;
    }
    
    // Update statistics panel
    const statsElements = {
      '.stat-total-clients': stats.totalClients,
      '.stat-filtered-clients': stats.filteredClients,
      '.stat-total-time': stats.totalTime,
      '.stat-total-distance': stats.totalDistance,
      '.stat-efficiency': stats.efficiency
    };
    
    Object.entries(statsElements).forEach(([selector, value]) => {
      const element = document.querySelector(selector);
      if (element) {
        element.textContent = value;
      }
    });
  }
  
  /**
   * Calculate statistics
   */
  calculateStatistics() {
    const totalTime = this.filteredClients.reduce((sum, client) => 
      sum + (client.visitTime || 0), 0
    );
    
    const totalDistance = this.filteredClients.reduce((sum, client) => 
      sum + (parseFloat(client.distanceFromWarehouse) || 0), 0
    );
    
    return {
      totalClients: this.clients.length,
      filteredClients: this.filteredClients.length,
      totalTime: `${totalTime} דקות`,
      totalDistance: `${totalDistance.toFixed(1)} ק"מ`,
      efficiency: totalTime > 0 ? `${(this.filteredClients.length / (totalTime / 60)).toFixed(1)} לקוחות/שעה` : '0'
    };
  }
  
  /**
   * Get filtered client count
   */
  getFilteredClientCount() {
    return this.filteredClients.length;
  }
  
  /**
   * Get client by ID
   */
  getClientById(clientId) {
    return this.clients.find(client => client.id === clientId);
  }
  
  /**
   * Clear filters
   */
  clearFilters() {
    this.currentDay = 'all';
    this.searchQuery = '';
    this.applyFilters();
    
    // Update UI
    document.querySelectorAll('.day-filter, .day-filter-mobile').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.day === 'all') {
        btn.classList.add('active');
      }
    });
    
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
      searchInput.value = '';
    }
  }
  
  /**
   * Refresh data
   */
  refresh() {
    this.applyFilters();
    console.log('🔄 Data refreshed');
  }
  
  /**
   * Export data
   */
  exportData(format) {
    const data = {
      clients: this.filteredClients,
      exportDate: new Date().toISOString(),
      filters: {
        day: this.currentDay,
        search: this.searchQuery
      }
    };
    
    switch (format) {
      case 'json':
        this.downloadJSON(data);
        break;
      case 'csv':
        this.downloadCSV(data.clients);
        break;
      case 'excel':
        this.downloadExcel(data.clients);
        break;
    }
  }
  
  /**
   * Download JSON
   */
  downloadJSON(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    this.downloadBlob(blob, 'agtroute-clients.json');
  }
  
  /**
   * Download CSV
   */
  downloadCSV(clients) {
    const headers = ['שם', 'כתובת', 'טלפון', 'יום', 'זמן ביקור', 'מרחק'];
    const rows = clients.map(client => [
      client.name,
      client.address,
      client.phone || '',
      this.getDayName(client.day),
      client.visitTime,
      client.distanceFromWarehouse || ''
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], {
      type: 'text/csv;charset=utf-8'
    });
    this.downloadBlob(blob, 'agtroute-clients.csv');
  }
  
  /**
   * Download blob
   */
  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  /**
   * Calculate route distance
   */
  calculateRouteDistance(route) {
    return route.clients?.reduce((total, client) => 
      total + (parseFloat(client.distance) || 0), 0
    ) || 0;
  }
  
  /**
   * Calculate route time
   */
  calculateRouteTime(route) {
    return route.clients?.reduce((total, client) => 
      total + (client.visitTime || 15), 0
    ) || 0;
  }
  
  /**
   * Calculate route efficiency
   */
  calculateRouteEfficiency(route) {
    const time = this.calculateRouteTime(route);
    const clientCount = route.clients?.length || 0;
    return time > 0 ? (clientCount / (time / 60)).toFixed(1) : 0;
  }
  
  /**
   * Calculate cluster efficiency
   */
  calculateClusterEfficiency(cluster) {
    const time = cluster.totalTime || 0;
    const clientCount = cluster.clientCount || 0;
    return time > 0 ? (clientCount / (time / 60)).toFixed(1) : 0;
  }
  
  /**
   * Advanced Business Logic Functions
   */
  
  /**
   * Calculate distance between two points using Haversine formula
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  /**
   * Convert degrees to radians
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }
  
  /**
   * Find client cluster based on location
   */
  findClientCluster(client) {
    if (!client.latitude || !client.longitude) return null;
    
    // Check MEGA CLUSTERS first
    for (const cluster of this.megaClusters) {
      if (cluster.center) {
        const distance = this.calculateDistance(
          client.latitude, client.longitude,
          cluster.center.latitude, cluster.center.longitude
        );
        
        if (distance <= (cluster.radius || 5)) { // 5km default radius
          return cluster.name;
        }
      }
    }
    
    // Check regular clusters
    for (const cluster of this.clusters) {
      if (cluster.center) {
        const distance = this.calculateDistance(
          client.latitude, client.longitude,
          cluster.center.latitude, cluster.center.longitude
        );
        
        if (distance <= (cluster.radius || 2)) { // 2km default radius
          return cluster.name;
        }
      }
    }
    
    return null;
  }
  
  /**
   * Calculate client efficiency (clients per hour)
   */
  calculateClientEfficiency(client) {
    const visitTime = client.visitTime || this.visitDuration;
    return visitTime > 0 ? (60 / visitTime).toFixed(1) : 0;
  }
  
  /**
   * Identify MEGA CLUSTERS from client data
   */
  async identifyMegaClusters() {
    const clusters = new Map();
    const clusterThreshold = 5; // Minimum clients for MEGA CLUSTER
    const proximityThreshold = 2; // 2km radius
    
    // Group clients by proximity
    this.clients.forEach(client => {
      if (!client.latitude || !client.longitude) return;
      
      let assigned = false;
      
      // Check existing clusters
      for (const [clusterKey, clusterClients] of clusters) {
        const [lat, lng] = clusterKey.split(',').map(Number);
        const distance = this.calculateDistance(
          client.latitude, client.longitude, lat, lng
        );
        
        if (distance <= proximityThreshold) {
          clusterClients.push(client);
          assigned = true;
          break;
        }
      }
      
      // Create new cluster if not assigned
      if (!assigned) {
        const key = `${client.latitude},${client.longitude}`;
        clusters.set(key, [client]);
      }
    });
    
    // Filter and process MEGA CLUSTERS
    const megaClusters = [];
    let clusterIndex = 1;
    
    for (const [clusterKey, clusterClients] of clusters) {
      if (clusterClients.length >= clusterThreshold) {
        const [centerLat, centerLng] = clusterKey.split(',').map(Number);
        
        const cluster = {
          id: `mega-cluster-${clusterIndex}`,
          name: this.generateClusterName(clusterClients),
          center: { latitude: centerLat, longitude: centerLng },
          clients: clusterClients,
          clientCount: clusterClients.length,
          radius: proximityThreshold,
          efficiency: this.calculateClusterEfficiencyFromClients(clusterClients),
          totalTime: clusterClients.reduce((sum, c) => sum + (c.visitTime || 15), 0),
          distanceFromWarehouse: this.calculateDistance(
            this.warehouseLocation.lat, this.warehouseLocation.lng,
            centerLat, centerLng
          ).toFixed(1)
        };
        
        megaClusters.push(cluster);
        clusterIndex++;
      }
    }
    
    this.megaClusters = [...this.megaClusters, ...megaClusters];
    
    console.log(`🎆 Identified ${megaClusters.length} new MEGA CLUSTERS`);
  }
  
  /**
   * Generate cluster name based on clients
   */
  generateClusterName(clients) {
    // Use most common address component or first client location
    const addresses = clients.map(c => c.address).filter(Boolean);
    if (addresses.length > 0) {
      const commonWords = addresses[0].split(' ');
      for (const word of commonWords) {
        if (word.length > 3 && addresses.filter(addr => addr.includes(word)).length > 1) {
          return word;
        }
      }
      return addresses[0].split(' ')[0];
    }
    return `קבוצת לקוחות`;
  }
  
  /**
   * Calculate cluster efficiency from clients
   */
  calculateClusterEfficiencyFromClients(clients) {
    const totalTime = clients.reduce((sum, c) => sum + (c.visitTime || 15), 0);
    return totalTime > 0 ? (clients.length / (totalTime / 60)).toFixed(1) : 0;
  }
  
  /**
   * Calculate advanced statistics
   */
  calculateAdvancedStatistics() {
    this.stats = {
      totalClients: this.clients.length,
      totalTime: this.clients.reduce((sum, c) => sum + (c.visitTime || 15), 0),
      totalDistance: this.clients.reduce((sum, c) => {
        const dist = parseFloat(c.distanceFromWarehouse) || 0;
        return sum + dist;
      }, 0),
      clustersCount: this.megaClusters.length,
      
      // Day distribution
      dayDistribution: this.calculateDayDistribution(),
      
      // Efficiency metrics
      averageEfficiency: this.calculateAverageEfficiency(),
      
      // MEGA CLUSTER statistics
      megaClusterStats: this.calculateMegaClusterStats()
    };
    
    // Overall efficiency (clients per hour)
    this.stats.efficiency = this.stats.totalTime > 0 ? 
      (this.stats.totalClients / (this.stats.totalTime / 60)).toFixed(1) : 0;
  }
  
  /**
   * Calculate day distribution
   */
  calculateDayDistribution() {
    const distribution = {};
    this.workingDays.forEach(day => {
      distribution[day] = this.clients.filter(c => c.day === day).length;
    });
    return distribution;
  }
  
  /**
   * Calculate average efficiency
   */
  calculateAverageEfficiency() {
    const efficiencies = this.clients.map(c => parseFloat(c.efficiency) || 0);
    const sum = efficiencies.reduce((a, b) => a + b, 0);
    return efficiencies.length > 0 ? (sum / efficiencies.length).toFixed(1) : 0;
  }
  
  /**
   * Calculate MEGA CLUSTER statistics
   */
  calculateMegaClusterStats() {
    if (this.megaClusters.length === 0) return {};
    
    const totalClients = this.megaClusters.reduce((sum, c) => sum + c.clientCount, 0);
    const totalEfficiency = this.megaClusters.reduce((sum, c) => sum + parseFloat(c.efficiency), 0);
    
    return {
      totalClusters: this.megaClusters.length,
      totalClients: totalClients,
      averageSize: (totalClients / this.megaClusters.length).toFixed(1),
      averageEfficiency: (totalEfficiency / this.megaClusters.length).toFixed(1),
      coveragePercentage: ((totalClients / this.clients.length) * 100).toFixed(1)
    };
  }
  
  /**
   * Get business insights
   */
  getBusinessInsights() {
    const insights = [];
    
    // MEGA CLUSTER insights
    if (this.stats.megaClusterStats?.coveragePercentage > 50) {
      insights.push({
        type: 'success',
        title: 'יעילות גבוהה',
        message: `${this.stats.megaClusterStats.coveragePercentage}% מהלקוחות ב-MEGA CLUSTERS יעילים`
      });
    }
    
    // Day balance insights
    const dayDist = this.stats.dayDistribution;
    const maxDay = Math.max(...Object.values(dayDist));
    const minDay = Math.min(...Object.values(dayDist));
    
    if (maxDay > minDay * 2) {
      insights.push({
        type: 'warning',
        title: 'אי איזון בימים',
        message: 'נדרש איזון מחדש של לקוחות בין הימים'
      });
    }
    
    // Efficiency insights
    if (parseFloat(this.stats.efficiency) > 3.0) {
      insights.push({
        type: 'success',
        title: 'יעילות מצוינת',
        message: `${this.stats.efficiency} לקוחות/שעה - רמה מצוינת!`
      });
    } else if (parseFloat(this.stats.efficiency) < 2.0) {
      insights.push({
        type: 'error',
        title: 'יעילות נמוכה',
        message: `${this.stats.efficiency} לקוחות/שעה - נדרש שיפור`
      });
    }
    
    return insights;
  }
  
  /**
   * Update business insights in UI
   */
  updateBusinessInsights() {
    const insights = this.getBusinessInsights();
    const insightsPanel = document.querySelector('.business-insights');
    
    if (insightsPanel && insights.length > 0) {
      insightsPanel.innerHTML = `
        <h4>תובנות עסקיות</h4>
        <div class="insights-list">
          ${insights.map(insight => `
            <div class="insight insight-${insight.type}">
              <div class="insight-title">${insight.title}</div>
              <div class="insight-message">${insight.message}</div>
            </div>
          `).join('')}
        </div>
      `;
    }
  }
  
  /**
   * Get optimal route for day
   */
  getOptimalRouteForDay(day) {
    const dayClients = this.clients.filter(c => c.day === day);
    
    if (dayClients.length === 0) return [];
    
    // Group by clusters first (MEGA-CLUSTER-FIRST algorithm)
    const clusteredClients = [];
    const standaloneClients = [];
    
    dayClients.forEach(client => {
      if (client.cluster) {
        let clusterGroup = clusteredClients.find(g => g.cluster === client.cluster);
        if (!clusterGroup) {
          clusterGroup = { cluster: client.cluster, clients: [], efficiency: 0 };
          clusteredClients.push(clusterGroup);
        }
        clusterGroup.clients.push(client);
      } else {
        standaloneClients.push(client);
      }
    });
    
    // Calculate cluster efficiency
    clusteredClients.forEach(group => {
      const totalTime = group.clients.reduce((sum, c) => sum + (c.visitTime || 15), 0);
      group.efficiency = totalTime > 0 ? (group.clients.length / (totalTime / 60)) : 0;
    });
    
    // Sort clusters by efficiency (highest first)
    clusteredClients.sort((a, b) => b.efficiency - a.efficiency);
    
    // Build optimal route
    const optimalRoute = [];
    
    // Add clustered clients first
    clusteredClients.forEach(group => {
      optimalRoute.push(...group.clients);
    });
    
    // Add standalone clients sorted by distance
    standaloneClients.sort((a, b) => {
      const distA = parseFloat(a.distanceFromWarehouse) || 0;
      const distB = parseFloat(b.distanceFromWarehouse) || 0;
      return distA - distB;
    });
    
    optimalRoute.push(...standaloneClients);
    
    return optimalRoute;
  }
  
  callClient(client) {
    if (client.phone) {
      window.open(`tel:${client.phone}`);
    }
  }
  
  getDirections(client) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${client.latitude},${client.longitude}`;
    window.open(url, '_blank');
  }
  
  shareClient(client) {
    if (navigator.share) {
      navigator.share({
        title: client.name,
        text: `${client.name} - ${client.address}`,
        url: window.location.href
      });
    }
  }

  /**
   * Get fallback routes data
   */
  getFallbackRoutes() {
    return [
      {
        id: 'route-1',
        day: 1,
        name: 'יום ראשון',
        clients: 30,
        estimatedHours: 11.5,
        efficiency: 2.6,
        startTime: '06:00',
        status: 'planned'
      },
      {
        id: 'route-2',
        day: 2,
        name: 'יום שני',
        clients: 24,
        estimatedHours: 10.2,
        efficiency: 2.4,
        startTime: '06:00',
        status: 'planned'
      }
    ];
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataManager;
}
