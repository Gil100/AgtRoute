/**
 * AgtRoute - Map Manager
 * Handles Google Maps integration, markers, and clustering
 */

class MapManager {
  constructor() {
    this.map = null;
    this.markers = [];
    this.clusters = [];
    this.infoWindow = null;
    this.directionsService = null;
    this.directionsRenderer = null;
    this.currentRoute = null;
    this.currentDay = 'all';
    this.searchResults = [];
    
    // Map configuration
    this.config = {
      center: { lat: 32.7254465, lng: 35.4669505 }, // מושב שרונה
      zoom: 10,
      mapTypeId: 'roadmap',
      styles: this.getMapStyles(),
      gestureHandling: 'cooperative',
      zoomControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      mapTypeControl: false
    };
    
    this.init();
  }
  
  /**
   * Initialize map
   */
  async init() {
    try {
      await this.loadGoogleMapsAPI();
      this.createMap();
      this.setupEventListeners();
      console.log('🗺️ Map Manager initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Map Manager:', error);
      this.showMapError();
    }
  }
  
  /**
   * Load Google Maps API with proper configuration
   */
  async loadGoogleMapsAPI() {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        console.log('✅ Google Maps API already loaded');
        resolve();
        return;
      }
      
      // Check if loading is already in progress
      if (window.googleMapsLoading) {
        console.log('🔄 Google Maps API loading in progress...');
        window.googleMapsLoading.then(resolve).catch(reject);
        return;
      }
      
      // Create loading promise
      window.googleMapsLoading = new Promise((res, rej) => {
        // Get API key from config
        const config = window.GOOGLE_MAPS_CONFIG || {
          apiKey: 'AIzaSyBI0FlEj7JPf1ectus8HUL7BwlC1rouv1E',
          libraries: ['geometry', 'places'],
          language: 'he',
          region: 'IL'
        };
        
        // Validate API key
        if (!config.apiKey || config.apiKey.includes('Dummy')) {
          console.error('❌ Invalid Google Maps API key');
          rej(new Error('Invalid or missing Google Maps API key'));
          return;
        }
        
        // Create callback function
        window.initGoogleMapsCallback = () => {
          delete window.initGoogleMapsCallback;
          delete window.googleMapsLoading;
          console.log('✅ Google Maps API loaded successfully');
          res();
        };
        
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${config.apiKey}&libraries=${config.libraries.join(',')}&language=${config.language}&region=${config.region}&callback=initGoogleMapsCallback`;
        script.async = true;
        script.defer = true;
        
        script.onerror = () => {
          delete window.initGoogleMapsCallback;
          delete window.googleMapsLoading;
          console.error('❌ Failed to load Google Maps API script');
          rej(new Error('Failed to load Google Maps API script'));
        };
        
        // Add timeout
        setTimeout(() => {
          if (window.initGoogleMapsCallback) {
            delete window.initGoogleMapsCallback;
            delete window.googleMapsLoading;
            rej(new Error('Google Maps API loading timeout'));
          }
        }, 15000); // 15 seconds timeout
        
        document.head.appendChild(script);
      });
      
      window.googleMapsLoading.then(resolve).catch(reject);
    });
  }
  
  /**
   * Create map instance
   */
  createMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
      throw new Error('Map container not found');
    }
    
    this.map = new google.maps.Map(mapContainer, this.config);
    
    // Initialize services
    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer({
      draggable: true,
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: '#2196F3',
        strokeWeight: 4,
        strokeOpacity: 0.8
      }
    });
    
    this.directionsRenderer.setMap(this.map);
    
    // Create info window
    this.infoWindow = new google.maps.InfoWindow();
    
    // Add warehouse marker
    this.addWarehouseMarker();
    
    console.log('🏭 Map created with warehouse marker');
  }
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Map controls
    const zoomInBtn = document.querySelector('.zoom-in');
    const zoomOutBtn = document.querySelector('.zoom-out');
    const centerBtn = document.querySelector('.center-map');
    const layerBtn = document.querySelector('.toggle-layer');
    
    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', () => this.zoomIn());
    }
    
    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', () => this.zoomOut());
    }
    
    if (centerBtn) {
      centerBtn.addEventListener('click', () => this.centerOnWarehouse());
    }
    
    if (layerBtn) {
      layerBtn.addEventListener('click', () => this.toggleLayer());
    }
    
    // Directions renderer events
    this.directionsRenderer.addListener('directions_changed', () => {
      this.onDirectionsChanged();
    });
    
    // Map click event
    this.map.addListener('click', (e) => {
      this.onMapClick(e);
    });
  }
  
  /**
   * Add warehouse marker
   */
  addWarehouseMarker() {
    const warehouseMarker = new google.maps.Marker({
      position: this.config.center,
      map: this.map,
      title: 'מחסן ראשי - מושב שרונה',
      icon: {
        url: './assets/icons/warehouse.svg',
        scaledSize: new google.maps.Size(40, 40),
        anchor: new google.maps.Point(20, 40)
      },
      zIndex: 1000
    });
    
    warehouseMarker.addListener('click', () => {
      this.infoWindow.setContent(this.createWarehouseInfoContent());
      this.infoWindow.open(this.map, warehouseMarker);
    });
    
    this.warehouseMarker = warehouseMarker;
  }
  
  /**
   * Load data
   */
  async loadData(clientData, clusterData) {
    try {
      this.clientData = clientData || [];
      this.clusterData = clusterData || [];
      
      this.clearMarkers();
      this.addClientMarkers();
      this.addClusterMarkers();
      
      console.log(`📍 Loaded ${this.clientData.length} clients and ${this.clusterData.length} clusters`);
      
    } catch (error) {
      console.error('❌ Failed to load map data:', error);
    }
  }
  
  /**
   * Add client markers
   */
  addClientMarkers() {
    if (!this.clientData) return;
    
    this.clientData.forEach((client, index) => {
      const marker = new google.maps.Marker({
        position: { lat: client.latitude, lng: client.longitude },
        map: this.map,
        title: client.name,
        icon: this.getClientIcon(client),
        zIndex: 100
      });
      
      marker.addListener('click', () => {
        this.showClientInfo(client, marker);
      });
      
      // Store client data in marker
      marker.clientData = client;
      marker.markerId = `client-${index}`;
      
      this.markers.push(marker);
    });
  }
  
  /**
   * Add cluster markers
   */
  addClusterMarkers() {
    if (!this.clusterData) return;
    
    this.clusterData.forEach((cluster, index) => {
      const marker = new google.maps.Marker({
        position: { lat: cluster.latitude, lng: cluster.longitude },
        map: this.map,
        title: `${cluster.name} (${cluster.clientCount} לקוחות)`,
        icon: this.getClusterIcon(cluster),
        zIndex: 200
      });
      
      marker.addListener('click', () => {
        this.showClusterInfo(cluster, marker);
      });
      
      // Store cluster data in marker
      marker.clusterData = cluster;
      marker.markerId = `cluster-${index}`;
      
      this.clusters.push(marker);
    });
  }
  
  /**
   * Get client icon
   */
  getClientIcon(client) {
    const dayColors = {
      'sunday': '#FF6B6B',
      'monday': '#4ECDC4', 
      'tuesday': '#45B7D1',
      'wednesday': '#96CEB4',
      'thursday': '#FECA57',
      'default': '#74B9FF'
    };
    
    const color = dayColors[client.day] || dayColors.default;
    
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 0.8,
      strokeColor: '#FFFFFF',
      strokeWeight: 2,
      scale: 8
    };
  }
  
  /**
   * Get cluster icon
   */
  getClusterIcon(cluster) {
    const size = Math.min(Math.max(cluster.clientCount * 5, 20), 50);
    
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: '#2196F3',
      fillOpacity: 0.9,
      strokeColor: '#FFFFFF',
      strokeWeight: 3,
      scale: size,
      labelOrigin: new google.maps.Point(0, 0)
    };
  }
  
  /**
   * Show client info
   */
  showClientInfo(client, marker) {
    const content = `
      <div class="info-window client-info">
        <div class="info-header">
          <h3>${client.name}</h3>
          <span class="day-badge day-${client.day}">${this.getDayName(client.day)}</span>
        </div>
        <div class="info-content">
          <p><strong>כתובת:</strong> ${client.address}</p>
          <p><strong>טלפון:</strong> ${client.phone || 'לא זמין'}</p>
          <p><strong>זמן ביקור:</strong> ${client.visitTime || '15 דקות'}</p>
          <p><strong>מרחק מהמחסן:</strong> ${client.distanceFromWarehouse || 'לא חושב'}</p>
        </div>
        <div class="info-actions">
          <button onclick="window.mapManager.showRoute('${client.id}')" class="btn btn-primary btn-sm">
            הצג מסלול
          </button>
          <button onclick="window.mapManager.centerOnClient('${client.id}')" class="btn btn-secondary btn-sm">
            מרכז מפה
          </button>
        </div>
      </div>
    `;
    
    this.infoWindow.setContent(content);
    this.infoWindow.open(this.map, marker);
  }
  
  /**
   * Show cluster info
   */
  showClusterInfo(cluster, marker) {
    const clientsList = cluster.clients ? 
      cluster.clients.map(client => `<li>${client.name}</li>`).join('') : 
      '<li>אין נתונים</li>';
      
    const content = `
      <div class="info-window cluster-info">
        <div class="info-header">
          <h3>${cluster.name}</h3>
          <span class="cluster-badge">${cluster.clientCount} לקוחות</span>
        </div>
        <div class="info-content">
          <p><strong>יעילות:</strong> ${cluster.efficiency || 'לא חושב'} לקוחות/שעה</p>
          <p><strong>זמן ביקור כולל:</strong> ${cluster.totalTime || 'לא חושב'}</p>
          <div class="clients-list">
            <strong>לקוחות באזור:</strong>
            <ul>${clientsList}</ul>
          </div>
        </div>
        <div class="info-actions">
          <button onclick="window.mapManager.showClusterRoute('${cluster.id}')" class="btn btn-primary btn-sm">
            הצג מסלול אזור
          </button>
          <button onclick="window.mapManager.centerOnCluster('${cluster.id}')" class="btn btn-secondary btn-sm">
            מרכז מפה
          </button>
        </div>
      </div>
    `;
    
    this.infoWindow.setContent(content);
    this.infoWindow.open(this.map, marker);
  }
  
  /**
   * Create warehouse info content
   */
  createWarehouseInfoContent() {
    return `
      <div class="info-window warehouse-info">
        <div class="info-header">
          <h3>מחסן ראשי</h3>
          <span class="warehouse-badge">נקודת מוצא</span>
        </div>
        <div class="info-content">
          <p><strong>מיקום:</strong> מושב שרונה</p>
          <p><strong>שעות פעילות:</strong> 06:00-18:00</p>
          <p><strong>ימי עבודה:</strong> ראשון-חמישי</p>
        </div>
      </div>
    `;
  }
  
  /**
   * Filter by day
   */
  filterByDay(day) {
    this.currentDay = day;
    
    this.markers.forEach(marker => {
      const client = marker.clientData;
      if (client) {
        const shouldShow = day === 'all' || client.day === day;
        marker.setVisible(shouldShow);
      }
    });
    
    this.clusters.forEach(marker => {
      const cluster = marker.clusterData;
      if (cluster) {
        const shouldShow = day === 'all' || cluster.day === day;
        marker.setVisible(shouldShow);
      }
    });
    
    console.log(`🗓️ Map filtered by day: ${day}`);
  }
  
  /**
   * Highlight search results
   */
  highlightSearchResults(query) {
    this.clearHighlights();
    
    if (!query) return;
    
    this.searchResults = [];
    const searchLower = query.toLowerCase();
    
    this.markers.forEach(marker => {
      const client = marker.clientData;
      if (client && (
        client.name.toLowerCase().includes(searchLower) ||
        client.address.toLowerCase().includes(searchLower)
      )) {
        this.highlightMarker(marker);
        this.searchResults.push(marker);
      }
    });
    
    console.log(`🔍 Found ${this.searchResults.length} search results`);
  }
  
  /**
   * Clear highlights
   */
  clearHighlights() {
    this.markers.forEach(marker => {
      this.unhighlightMarker(marker);
    });
    this.searchResults = [];
  }
  
  /**
   * Highlight marker
   */
  highlightMarker(marker) {
    const client = marker.clientData;
    if (client) {
      marker.setIcon({
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#FFD700',
        fillOpacity: 1,
        strokeColor: '#FF6B35',
        strokeWeight: 4,
        scale: 12
      });
    }
  }
  
  /**
   * Unhighlight marker
   */
  unhighlightMarker(marker) {
    const client = marker.clientData;
    if (client) {
      marker.setIcon(this.getClientIcon(client));
    }
  }
  
  /**
   * Show route to client
   */
  async showRoute(clientId) {
    const client = this.findClientById(clientId);
    if (!client) return;
    
    const request = {
      origin: this.config.center,
      destination: { lat: client.latitude, lng: client.longitude },
      travelMode: google.maps.TravelMode.DRIVING,
      unitSystem: google.maps.UnitSystem.METRIC,
      region: 'IL'
    };
    
    try {
      const result = await this.directionsService.route(request);
      this.directionsRenderer.setDirections(result);
      
      const route = result.routes[0];
      const leg = route.legs[0];
      
      console.log(`🛣️ Route to ${client.name}: ${leg.distance.text}, ${leg.duration.text}`);
      
    } catch (error) {
      console.error('❌ Failed to calculate route:', error);
    }
  }
  
  /**
   * Show cluster route
   */
  async showClusterRoute(clusterId) {
    const cluster = this.findClusterById(clusterId);
    if (!cluster || !cluster.clients) return;
    
    // Create waypoints for all clients in cluster
    const waypoints = cluster.clients.map(client => ({
      location: { lat: client.latitude, lng: client.longitude },
      stopover: true
    }));
    
    const request = {
      origin: this.config.center,
      destination: this.config.center,
      waypoints: waypoints,
      travelMode: google.maps.TravelMode.DRIVING,
      unitSystem: google.maps.UnitSystem.METRIC,
      optimizeWaypoints: true,
      region: 'IL'
    };
    
    try {
      const result = await this.directionsService.route(request);
      this.directionsRenderer.setDirections(result);
      
      console.log(`🗺️ Cluster route for ${cluster.name} with ${waypoints.length} stops`);
      
    } catch (error) {
      console.error('❌ Failed to calculate cluster route:', error);
    }
  }
  
  /**
   * Center on client
   */
  centerOnClient(clientId) {
    const client = this.findClientById(clientId);
    if (client) {
      this.map.setCenter({ lat: client.latitude, lng: client.longitude });
      this.map.setZoom(15);
    }
  }
  
  /**
   * Center on cluster
   */
  centerOnCluster(clusterId) {
    const cluster = this.findClusterById(clusterId);
    if (cluster) {
      this.map.setCenter({ lat: cluster.latitude, lng: cluster.longitude });
      this.map.setZoom(13);
    }
  }
  
  /**
   * Center on warehouse
   */
  centerOnWarehouse() {
    this.map.setCenter(this.config.center);
    this.map.setZoom(12);
    
    // Add bounce animation to warehouse marker
    if (this.warehouseMarker) {
      this.warehouseMarker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(() => {
        this.warehouseMarker.setAnimation(null);
      }, 2000);
    }
  }
  
  /**
   * Zoom in
   */
  zoomIn() {
    const currentZoom = this.map.getZoom();
    this.map.setZoom(currentZoom + 1);
  }
  
  /**
   * Zoom out
   */
  zoomOut() {
    const currentZoom = this.map.getZoom();
    this.map.setZoom(currentZoom - 1);
  }
  
  /**
   * Toggle layer
   */
  toggleLayer() {
    const currentType = this.map.getMapTypeId();
    const newType = currentType === 'roadmap' ? 'satellite' : 'roadmap';
    this.map.setMapTypeId(newType);
  }
  
  /**
   * Handle resize
   */
  handleResize() {
    if (this.map) {
      google.maps.event.trigger(this.map, 'resize');
    }
  }
  
  /**
   * Refresh map
   */
  refresh() {
    if (this.map) {
      this.handleResize();
      this.filterByDay(this.currentDay);
    }
  }
  
  /**
   * Clear markers
   */
  clearMarkers() {
    this.markers.forEach(marker => marker.setMap(null));
    this.clusters.forEach(marker => marker.setMap(null));
    this.markers = [];
    this.clusters = [];
  }
  
  /**
   * Find client by ID
   */
  findClientById(clientId) {
    return this.clientData?.find(client => client.id === clientId);
  }
  
  /**
   * Find cluster by ID
   */
  findClusterById(clusterId) {
    return this.clusterData?.find(cluster => cluster.id === clusterId);
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
   * Get map styles
   */
  getMapStyles() {
    return [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'transit',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      }
    ];
  }
  
  /**
   * Show map error
   */
  showMapError() {
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
      mapContainer.innerHTML = `
        <div class="map-error">
          <div class="error-icon">🗺️</div>
          <h3>שגיאה בטעינת המפה</h3>
          <p>לא ניתן לטעון את Google Maps. אנא בדוק את החיבור לאינטרנט ונסה שוב.</p>
          <button onclick="location.reload()" class="btn btn-primary">רענן דף</button>
        </div>
      `;
    }
  }
  
  /**
   * Event handlers
   */
  onDirectionsChanged() {
    const directions = this.directionsRenderer.getDirections();
    if (directions) {
      this.currentRoute = directions;
      console.log('🛣️ Route updated');
    }
  }
  
  onMapClick(event) {
    this.infoWindow.close();
  }
  
  /**
   * Advanced Features - Route Optimization Integration
   */
  
  /**
   * Calculate distance matrix for optimization
   */
  async calculateDistanceMatrix(origins, destinations) {
    const service = new google.maps.DistanceMatrixService();
    
    return new Promise((resolve, reject) => {
      service.getDistanceMatrix({
        origins: origins,
        destinations: destinations,
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
        region: 'IL',
        language: 'he'
      }, (response, status) => {
        if (status === 'OK') {
          resolve(response);
        } else {
          reject(new Error(`Distance Matrix failed: ${status}`));
        }
      });
    });
  }
  
  /**
   * Show daily route with optimized order
   */
  async showDailyRoute(day, clients) {
    if (!clients || clients.length === 0) return;
    
    // Create waypoints from clients
    const waypoints = clients.map(client => ({
      location: { lat: client.latitude, lng: client.longitude },
      stopover: true
    }));
    
    // If too many waypoints, optimize in batches
    if (waypoints.length > 23) { // Google Maps limit is 25 waypoints total
      await this.showOptimizedBatchRoute(waypoints);
      return;
    }
    
    const request = {
      origin: this.config.center,
      destination: this.config.center,
      waypoints: waypoints,
      travelMode: google.maps.TravelMode.DRIVING,
      unitSystem: google.maps.UnitSystem.METRIC,
      optimizeWaypoints: true,
      region: 'IL'
    };
    
    try {
      const result = await this.directionsService.route(request);
      this.directionsRenderer.setDirections(result);
      
      // Show route info
      this.showRouteInfo(result, day);
      
      console.log(`🗓️ Daily route for ${day} with ${clients.length} clients`);
      
    } catch (error) {
      console.error('❌ Failed to show daily route:', error);
      this.showRouteError(error.message);
    }
  }
  
  /**
   * Show optimized batch route for large client lists
   */
  async showOptimizedBatchRoute(waypoints) {
    const batchSize = 20;
    const batches = [];
    
    for (let i = 0; i < waypoints.length; i += batchSize) {
      batches.push(waypoints.slice(i, i + batchSize));
    }
    
    // Show first batch with full route
    if (batches.length > 0) {
      const request = {
        origin: this.config.center,
        destination: this.config.center,
        waypoints: batches[0],
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true,
        region: 'IL'
      };
      
      try {
        const result = await this.directionsService.route(request);
        this.directionsRenderer.setDirections(result);
        
        console.log(`🚛 Showing batch route: ${batches[0].length} stops (${batches.length} total batches)`);
        
      } catch (error) {
        console.error('❌ Failed to show batch route:', error);
      }
    }
  }
  
  /**
   * Show route information panel
   */
  showRouteInfo(result, day) {
    const route = result.routes[0];
    let totalDistance = 0;
    let totalDuration = 0;
    
    route.legs.forEach(leg => {
      totalDistance += leg.distance.value;
      totalDuration += leg.duration.value;
    });
    
    const distanceKm = (totalDistance / 1000).toFixed(1);
    const durationHours = Math.floor(totalDuration / 3600);
    const durationMinutes = Math.floor((totalDuration % 3600) / 60);
    
    // Update map info panel
    const mapInfo = document.querySelector('.map-info');
    if (mapInfo) {
      mapInfo.innerHTML = `
        <div class="route-summary">
          <h4>מסלול ${this.getDayName(day)}</h4>
          <div class="route-stats">
            <div class="stat">
              <span class="stat-value">${distanceKm}</span>
              <span class="stat-label">ק"מ</span>
            </div>
            <div class="stat">
              <span class="stat-value">${durationHours}:${durationMinutes.toString().padStart(2, '0')}</span>
              <span class="stat-label">שעות נסיעה</span>
            </div>
            <div class="stat">
              <span class="stat-value">${route.legs.length}</span>
              <span class="stat-label">לקוחות</span>
            </div>
          </div>
          <button onclick="window.mapManager.clearRoute()" class="btn btn-outline btn-sm">נקה מסלול</button>
        </div>
      `;
    }
  }
  
  /**
   * Clear current route
   */
  clearRoute() {
    this.directionsRenderer.setDirections({ routes: [] });
    this.currentRoute = null;
    
    // Clear map info
    const mapInfo = document.querySelector('.map-info');
    if (mapInfo) {
      mapInfo.innerHTML = `
        <div class="map-info-default">
          <p>בחר יום או לקוח להצגת מסלול</p>
        </div>
      `;
    }
    
    console.log('🗑️ Route cleared');
  }
  
  /**
   * Show route error
   */
  showRouteError(message) {
    const mapInfo = document.querySelector('.map-info');
    if (mapInfo) {
      mapInfo.innerHTML = `
        <div class="route-error">
          <div class="error-icon">⚠️</div>
          <p>שגיאה בחישוב מסלול</p>
          <small>${message}</small>
        </div>
      `;
    }
  }
  
  /**
   * Fit map to show all markers
   */
  fitToMarkers() {
    if (this.markers.length === 0) return;
    
    const bounds = new google.maps.LatLngBounds();
    
    // Include warehouse
    bounds.extend(this.config.center);
    
    // Include all visible markers
    this.markers.forEach(marker => {
      if (marker.getVisible()) {
        bounds.extend(marker.getPosition());
      }
    });
    
    this.clusters.forEach(marker => {
      if (marker.getVisible()) {
        bounds.extend(marker.getPosition());
      }
    });
    
    this.map.fitBounds(bounds);
    
    // Ensure minimum zoom level
    google.maps.event.addListenerOnce(this.map, 'bounds_changed', () => {
      if (this.map.getZoom() > 15) {
        this.map.setZoom(15);
      }
    });
  }
  
  /**
   * Export map as image (screenshot)
   */
  async exportMapImage() {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const mapDiv = document.getElementById('map');
      
      // Note: This is a simplified version. 
      // For production, use html2canvas or similar library
      console.log('📸 Map export functionality needs html2canvas library');
      
      return null;
    } catch (error) {
      console.error('❌ Failed to export map:', error);
      return null;
    }
  }
  
  /**
   * Get current map bounds
   */
  getCurrentBounds() {
    if (!this.map) return null;
    
    const bounds = this.map.getBounds();
    return {
      north: bounds.getNorthEast().lat(),
      south: bounds.getSouthWest().lat(),
      east: bounds.getNorthEast().lng(),
      west: bounds.getSouthWest().lng()
    };
  }
  
  /**
   * Get map statistics
   */
  getMapStats() {
    const visibleClients = this.markers.filter(m => m.getVisible()).length;
    const visibleClusters = this.clusters.filter(m => m.getVisible()).length;
    
    return {
      totalClients: this.markers.length,
      visibleClients: visibleClients,
      totalClusters: this.clusters.length,
      visibleClusters: visibleClusters,
      currentDay: this.currentDay,
      hasActiveRoute: !!this.currentRoute,
      searchResults: this.searchResults.length
    };
  }
  
  /**
   * Toggle marker animations
   */
  toggleMarkerAnimations(enabled = true) {
    const animation = enabled ? google.maps.Animation.BOUNCE : null;
    
    this.markers.forEach(marker => {
      if (marker.getVisible()) {
        marker.setAnimation(animation);
        
        // Stop animation after 2 seconds
        if (enabled) {
          setTimeout(() => {
            marker.setAnimation(null);
          }, 2000);
        }
      }
    });
  }
  
  /**
   * Advanced cluster visualization
   */
  updateClusterVisualization() {
    this.clusters.forEach(marker => {
      const cluster = marker.clusterData;
      if (!cluster) return;
      
      // Create cluster circle overlay
      const circle = new google.maps.Circle({
        strokeColor: this.getClusterColor(cluster.efficiency),
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: this.getClusterColor(cluster.efficiency),
        fillOpacity: 0.2,
        map: this.map,
        center: marker.getPosition(),
        radius: cluster.radius || 1000 // meters
      });
      
      // Store circle reference
      if (!marker.clusterCircle) {
        marker.clusterCircle = circle;
      }
    });
  }
  
  /**
   * Get cluster color based on efficiency
   */
  getClusterColor(efficiency) {
    if (efficiency >= 3.0) return '#FFD700'; // זהב
    if (efficiency >= 2.0) return '#C0C0C0'; // כסף  
    if (efficiency >= 1.5) return '#CD7F32'; // ברונזה
    return '#808080'; // אפור
  }
  
  /**
   * Cleanup method
   */
  destroy() {
    this.clearMarkers();
    this.clearRoute();
    
    if (this.infoWindow) {
      this.infoWindow.close();
    }
    
    if (this.map) {
      // Remove event listeners if needed
      google.maps.event.clearInstanceListeners(this.map);
    }
    
    console.log('🧹 Map Manager destroyed');
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MapManager;
}
