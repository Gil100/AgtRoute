/**
 * Google Maps Integration Manager - AgtRoute
 * מנוע אינטגרציה מתקדם עם Google Maps APIs
 * שלב 5.1: Google Maps Integration Manager
 */

class GoogleMapsIntegrationManager {
    constructor() {
        // Google Maps core objects
        this.map = null;
        this.directionsService = null;
        this.directionsRenderer = null;
        this.distanceMatrix = null;
        this.geocoder = null;
        this.placesService = null;
        
        // GPS & Navigation
        this.watchId = null;
        this.driverPosition = null;
        this.driverMarker = null;
        this.isNavigating = false;
        
        // Markers system
        this.warehouseMarker = null;
        this.clientMarkers = [];
        this.clusterMarkers = [];
        this.markerClusterer = null;
        
        // Route management
        this.currentRoute = null;
        this.routeWaypoints = [];
        this.routeProgress = 0;
        this.activeDay = 1;
        
        // Performance metrics
        this.performanceMetrics = {
            totalDistance: 0,
            totalTime: 0,
            fuelConsumption: 0,
            averageSpeed: 0,
            visitedClients: 0,
            remainingClients: 0,
            efficiency: 0
        };
        
        // Business data - MEGA CLUSTERS from Logistic AI
        this.warehouse = {
            name: 'מחסן מושב שרונה',
            coordinates: { lat: 32.7254465, lng: 35.4669505 },
            address: 'מושב שרונה, ישראל',
            phone: '04-123-4567'
        };
        
        this.megaClusters = [
            { id: 'moshav_sharona', name: 'מושב שרונה', efficiency: 3.9, clients: 8, distance: 0.3, day: 1 },
            { id: 'sde_ilan', name: 'שדה אילן', efficiency: 3.4, clients: 11, distance: 6.1, day: 1 },
            { id: 'kfar_yehoshua', name: 'כפר יהושע', efficiency: 2.4, clients: 8, distance: 48.4, day: 1 },
            { id: 'ahihud', name: 'אחיהוד', efficiency: 2.1, clients: 9, distance: 58.2, day: 2 },
            { id: 'hayogev', name: 'היוגב', efficiency: 2.3, clients: 7, distance: 40.1, day: 2 },
            { id: 'derech_oz', name: 'מדרך עוז', efficiency: 2.1, clients: 6, distance: 39.5, day: 2 },
            { id: 'emek', name: 'עמקה', efficiency: 1.8, clients: 8, distance: 69.3, day: 3 },
            { id: 'parzon', name: 'פרזון', efficiency: 2.2, clients: 6, distance: 36.0, day: 5 }
        ];
        
        // Event system
        this.eventListeners = new Map();
        this.lastPosition = null;
        
        console.log('🚀 GoogleMapsIntegrationManager initialized');
        this.init();
    }
    
    /**
     * Main initialization
     */
    async init() {
        try {
            console.log('📍 Starting Google Maps Integration...');
            
            await this.loadGoogleMapsAPI();
            await this.initializeMap();
            await this.setupServices();
            await this.createMarkers();
            await this.startGPSTracking();
            
            console.log('✅ Google Maps Integration ready!');
            this.fireEvent('ready', { manager: this });
            
        } catch (error) {
            console.error('❌ Google Maps Integration error:', error);
            this.fireEvent('error', { error });
        }
    }
    
    /**
     * Load Google Maps API
     */
    async loadGoogleMapsAPI() {
        return new Promise((resolve, reject) => {
            if (window.google && window.google.maps) {
                resolve();
                return;
            }
            
            window.initGoogleMaps = resolve;
            
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=geometry,places&callback=initGoogleMaps&language=he&region=IL`;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    /**
     * Initialize map
     */
    async initializeMap() {
        const mapOptions = {
            center: this.warehouse.coordinates,
            zoom: 8,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            styles: this.getMapStyles(),
            gestureHandling: 'greedy',
            zoomControl: true,
            mapTypeControl: false,
            scaleControl: true,
            streetViewControl: false,
            rotateControl: false,
            fullscreenControl: true
        };
        
        const mapElement = document.getElementById('map');
        if (!mapElement) {
            throw new Error('Map element not found');
        }
        
        this.map = new google.maps.Map(mapElement, mapOptions);
        
        // Mobile optimization
        if (window.innerWidth <= 768) {
            this.map.setOptions({
                zoomControl: false,
                fullscreenControl: false
            });
        }
        
        console.log('🗺️ Map initialized successfully');
    }
    
    /**
     * Setup Google Maps services
     */
    async setupServices() {
        this.directionsService = new google.maps.DirectionsService();
        this.directionsRenderer = new google.maps.DirectionsRenderer({
            suppressMarkers: true,
            polylineOptions: {
                strokeColor: '#2196F3',
                strokeWeight: 4,
                strokeOpacity: 0.8
            }
        });
        this.directionsRenderer.setMap(this.map);
        
        this.distanceMatrix = new google.maps.DistanceMatrixService();
        this.geocoder = new google.maps.Geocoder();
        this.placesService = new google.maps.places.PlacesService(this.map);
        
        console.log('🔧 Google Maps services configured');
    }
    
    /**
     * Create all markers
     */
    async createMarkers() {
        this.createWarehouseMarker();
        await this.createMegaClusterMarkers();
        await this.createClientMarkers();
        this.createDriverMarker();
        
        console.log('📍 All markers created successfully');
    }
    
    /**
     * Create warehouse marker
     */
    createWarehouseMarker() {
        this.warehouseMarker = new google.maps.Marker({
            position: this.warehouse.coordinates,
            map: this.map,
            title: this.warehouse.name,
            icon: {
                url: 'assets/icons/warehouse.png',
                scaledSize: new google.maps.Size(40, 40),
                anchor: new google.maps.Point(20, 40)
            },
            zIndex: 1000
        });
        
        const infoWindow = new google.maps.InfoWindow({
            content: this.createWarehouseInfoContent()
        });
        
        this.warehouseMarker.addListener('click', () => {
            infoWindow.open(this.map, this.warehouseMarker);
        });
    }
    
    /**
     * Create MEGA CLUSTER markers
     */
    async createMegaClusterMarkers() {
        for (const cluster of this.megaClusters) {
            const position = await this.getClusterPosition(cluster);
            
            const marker = new google.maps.Marker({
                position: position,
                map: this.map,
                title: `${cluster.name} - ${cluster.clients} לקוחות`,
                icon: this.getClusterIcon(cluster.efficiency),
                zIndex: 500
            });
            
            const infoWindow = new google.maps.InfoWindow({
                content: this.createClusterInfoContent(cluster)
            });
            
            marker.addListener('click', () => {
                infoWindow.open(this.map, marker);
            });
            
            this.clusterMarkers.push({ marker, cluster, infoWindow });
        }
    }
    
    /**
     * Create client markers (load from JSON)
     */
    async createClientMarkers() {
        try {
            const clientsData = await this.loadClientsData();
            
            for (const client of clientsData.clients || []) {
                const marker = new google.maps.Marker({
                    position: { lat: client.coordinates?.lat || 0, lng: client.coordinates?.lng || 0 },
                    map: this.map,
                    title: client.name,
                    icon: this.getClientIcon(client.type),
                    zIndex: 100
                });
                
                const infoWindow = new google.maps.InfoWindow({
                    content: this.createClientInfoContent(client)
                });
                
                marker.addListener('click', () => {
                    infoWindow.open(this.map, marker);
                });
                
                this.clientMarkers.push({ marker, client, infoWindow });
            }
            
        } catch (error) {
            console.error('Error loading client markers:', error);
        }
    }
    
    /**
     * Create driver marker
     */
    createDriverMarker() {
        this.driverMarker = new google.maps.Marker({
            map: this.map,
            title: 'מיקום הנהג',
            icon: {
                url: 'assets/icons/driver.png',
                scaledSize: new google.maps.Size(30, 30),
                anchor: new google.maps.Point(15, 15)
            },
            zIndex: 2000,
            visible: false
        });
    }
    
    /**
     * Start GPS tracking
     */
    async startGPSTracking() {
        if (!navigator.geolocation) {
            console.warn('⚠️ Geolocation not supported');
            return;
        }
        
        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
        };
        
        this.watchId = navigator.geolocation.watchPosition(
            (position) => this.handlePositionUpdate(position),
            (error) => this.handleGeolocationError(error),
            options
        );
        
        console.log('📡 GPS tracking started');
    }
    
    /**
     * Handle position updates
     */
    handlePositionUpdate(position) {
        const newPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        
        this.driverPosition = newPosition;
        
        if (this.driverMarker) {
            this.driverMarker.setPosition(newPosition);
            this.driverMarker.setVisible(true);
        }
        
        this.updatePerformanceMetrics(position);
        this.checkProximityAlerts(newPosition);
        
        this.fireEvent('positionUpdate', { position: newPosition, data: position });
    }
    
    /**
     * Handle geolocation errors
     */
    handleGeolocationError(error) {
        console.error('GPS Error:', error);
        this.fireEvent('gpsError', { error });
    }
    
    /**
     * Calculate MEGA-CLUSTER-FIRST route
     */
    async calculateMegaClusterRoute(selectedDay = 1) {
        try {
            console.log(`🎯 Calculating MEGA-CLUSTER-FIRST route for day ${selectedDay}...`);
            
            const dayMegaClusters = this.getMegaClustersForDay(selectedDay);
            dayMegaClusters.sort((a, b) => b.efficiency - a.efficiency);
            
            const waypoints = [];
            for (const cluster of dayMegaClusters) {
                const position = await this.getClusterPosition(cluster);
                waypoints.push({
                    location: position,
                    stopover: true
                });
            }
            
            const request = {
                origin: this.warehouse.coordinates,
                destination: this.warehouse.coordinates,
                waypoints: waypoints,
                optimizeWaypoints: true,
                travelMode: google.maps.TravelMode.DRIVING,
                unitSystem: google.maps.UnitSystem.METRIC,
                region: 'IL'
            };
            
            const result = await new Promise((resolve, reject) => {
                this.directionsService.route(request, (result, status) => {
                    if (status === 'OK') {
                        resolve(result);
                    } else {
                        reject(new Error(`Directions failed: ${status}`));
                    }
                });
            });
            
            this.directionsRenderer.setDirections(result);
            this.updateRouteMetrics(result);
            
            console.log('✅ MEGA-CLUSTER-FIRST route calculated');
            this.fireEvent('routeCalculated', { route: result, day: selectedDay });
            
            return result;
            
        } catch (error) {
            console.error('❌ Route calculation error:', error);
            throw error;
        }
    }
    
    /**
     * Get MEGA CLUSTERS for specific day
     */
    getMegaClustersForDay(day) {
        return this.megaClusters.filter(cluster => cluster.day === day);
    }
    
    /**
     * Get cluster position (approximate for now)
     */
    async getClusterPosition(cluster) {
        const approximatePositions = {
            'moshav_sharona': { lat: 32.7254465, lng: 35.4669505 },
            'sde_ilan': { lat: 32.7400, lng: 35.5200 },
            'kfar_yehoshua': { lat: 32.6900, lng: 35.1600 },
            'ahihud': { lat: 32.9800, lng: 35.1000 },
            'hayogev': { lat: 32.6200, lng: 35.3400 },
            'emek': { lat: 33.0200, lng: 35.1200 },
            'derech_oz': { lat: 32.6000, lng: 35.3200 },
            'parzon': { lat: 32.5800, lng: 35.2800 }
        };
        
        return approximatePositions[cluster.id] || this.warehouse.coordinates;
    }
    
    /**
     * Get cluster icon based on efficiency
     */
    getClusterIcon(efficiency) {
        let iconUrl = 'assets/icons/cluster-bronze.png';
        let size = 25;
        
        if (efficiency >= 3.0) {
            iconUrl = 'assets/icons/cluster-gold.png';
            size = 35;
        } else if (efficiency >= 2.0) {
            iconUrl = 'assets/icons/cluster-silver.png';
            size = 30;
        }
        
        return {
            url: iconUrl,
            scaledSize: new google.maps.Size(size, size),
            anchor: new google.maps.Point(size/2, size/2)
        };
    }
    
    /**
     * Get client icon based on type
     */
    getClientIcon(type) {
        const iconMap = {
            'קיבוץ': 'assets/icons/kibbutz.png',
            'משק': 'assets/icons/farm.png',
            'רפת': 'assets/icons/dairy.png'
        };
        
        return {
            url: iconMap[type] || 'assets/icons/client-default.png',
            scaledSize: new google.maps.Size(20, 20),
            anchor: new google.maps.Point(10, 20)
        };
    }
    
    /**
     * Load clients data from JSON
     */
    async loadClientsData() {
        try {
            const response = await fetch('assets/data/clients.json');
            return await response.json();
        } catch (error) {
            console.error('Error loading clients data:', error);
            return { clients: [] };
        }
    }
    
    /**
     * Update performance metrics
     */
    updatePerformanceMetrics(position) {
        if (!this.lastPosition) {
            this.lastPosition = position;
            return;
        }
        
        const distance = this.calculateDistance(
            this.lastPosition.coords,
            position.coords
        );
        
        const timeDiff = (position.timestamp - this.lastPosition.timestamp) / 1000;
        const speed = timeDiff > 0 ? (distance / timeDiff) * 3.6 : 0;
        
        this.performanceMetrics.totalDistance += distance;
        this.performanceMetrics.totalTime += timeDiff;
        this.performanceMetrics.averageSpeed = this.performanceMetrics.totalTime > 0 ? 
            (this.performanceMetrics.totalDistance / this.performanceMetrics.totalTime) * 3.6 : 0;
        this.performanceMetrics.fuelConsumption = this.performanceMetrics.totalDistance * 0.08;
        
        this.lastPosition = position;
        this.fireEvent('metricsUpdate', { metrics: this.performanceMetrics });
    }
    
    /**
     * Check proximity alerts
     */
    checkProximityAlerts(currentPosition) {
        const alertRadius = 500; // meters
        
        for (const clientMarker of this.clientMarkers) {
            const clientPos = clientMarker.marker.getPosition();
            if (!clientPos) continue;
            
            const distance = this.calculateDistance(
                { latitude: currentPosition.lat, longitude: currentPosition.lng },
                { latitude: clientPos.lat(), longitude: clientPos.lng() }
            );
            
            if (distance <= alertRadius) {
                this.fireEvent('proximityAlert', { 
                    client: clientMarker.client, 
                    distance: distance 
                });
            }
        }
    }
    
    /**
     * Calculate distance between two points
     */
    calculateDistance(pos1, pos2) {
        const R = 6371000; // Earth's radius in meters
        const dLat = (pos2.latitude - pos1.latitude) * Math.PI / 180;
        const dLng = (pos2.longitude - pos1.longitude) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(pos1.latitude * Math.PI / 180) * Math.cos(pos2.latitude * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    
    /**
     * Create info window content
     */
    createWarehouseInfoContent() {
        return `
            <div class="info-window warehouse-info">
                <h3>🏢 ${this.warehouse.name}</h3>
                <p><strong>כתובת:</strong> ${this.warehouse.address}</p>
                <p><strong>טלפון:</strong> ${this.warehouse.phone}</p>
                <div class="warehouse-stats">
                    <div class="stat">
                        <span class="label">לקוחות היום:</span>
                        <span class="value">${this.performanceMetrics.remainingClients}</span>
                    </div>
                </div>
                <button onclick="agtRouteApp?.navigationToWarehouse()" class="btn-navigate">
                    🧭 נווט למחסן
                </button>
            </div>
        `;
    }
    
    createClusterInfoContent(cluster) {
        return `
            <div class="info-window cluster-info">
                <h3>📍 ${cluster.name}</h3>
                <div class="cluster-stats">
                    <div class="stat">
                        <span class="label">לקוחות:</span>
                        <span class="value">${cluster.clients}</span>
                    </div>
                    <div class="stat">
                        <span class="label">יעילות:</span>
                        <span class="value">${cluster.efficiency}</span>
                    </div>
                </div>
                <button onclick="agtRouteApp?.focusOnCluster('${cluster.id}')" class="btn-focus">
                    🎯 התמקד
                </button>
            </div>
        `;
    }
    
    createClientInfoContent(client) {
        return `
            <div class="info-window client-info">
                <h3>🏛️ ${client.name || 'לקוח'}</h3>
                <p><strong>סוג:</strong> ${client.type || 'לא מוגדר'}</p>
                <p><strong>כתובת:</strong> ${client.address || 'לא מוגדר'}</p>
                <button onclick="agtRouteApp?.navigateToClient('${client.id}')" class="btn-navigate">
                    🧭 נווט
                </button>
            </div>
        `;
    }
    
    /**
     * Get map styles
     */
    getMapStyles() {
        return [
            {
                "featureType": "administrative",
                "elementType": "labels.text.fill",
                "stylers": [{"color": "#444444"}]
            },
            {
                "featureType": "landscape",
                "elementType": "all",
                "stylers": [{"color": "#f2f2f2"}]
            },
            {
                "featureType": "poi",
                "elementType": "all",
                "stylers": [{"visibility": "off"}]
            },
            {
                "featureType": "road",
                "elementType": "all",
                "stylers": [{"saturation": -100}, {"lightness": 45}]
            }
        ];
    }
    
    /**
     * Event system
     */
    addEventListener(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }
    
    fireEvent(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Event callback error for ${event}:`, error);
                }
            });
        }
    }
    
    /**
     * Public API methods
     */
    focusOnCluster(clusterId) {
        const clusterMarker = this.clusterMarkers.find(item => item.cluster.id === clusterId);
        if (clusterMarker) {
            this.map.setCenter(clusterMarker.marker.getPosition());
            this.map.setZoom(12);
        }
    }
    
    navigateToClient(clientId) {
        console.log(`Navigate to client: ${clientId}`);
        // Implementation for navigation
    }
    
    navigationToWarehouse() {
        this.map.setCenter(this.warehouse.coordinates);
        this.map.setZoom(15);
    }
    
    // Cleanup
    destroy() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
        }
        this.eventListeners.clear();
    }
}

// Export for use in other modules
window.GoogleMapsIntegrationManager = GoogleMapsIntegrationManager;