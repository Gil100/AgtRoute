/**
 * AgtRoute - Main Application Controller
 * Manages app initialization, routing, and global state
 */

class AgtRouteApp {
  constructor() {
    this.currentDay = 'all';
    this.currentView = 'map';
    this.isLoading = false;
    this.clientData = null;
    this.routeData = null;
    this.clusterData = null;
    this.isOnline = navigator.onLine;
    
    // Initialize app
    this.init();
  }
  
  /**
   * Initialize the application
   */
  async init() {
    try {
      this.showLoading(true);
      
      // Initialize components
      await this.initializeData();
      this.initializeEventListeners();
      this.initializeServiceWorker();
      this.initializePWA();
      
      // Initialize managers
      window.mapManager = new MapManager();
      window.dataManager = new DataManager();
      window.routeManager = new RouteManager();
      
      // Load initial data
      await this.loadInitialData();
      
      // Set initial view
      this.setActiveDay('all');
      this.updateUI();
      
      this.showLoading(false);
      console.log('✅ AgtRoute initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize AgtRoute:', error);
      this.showError('שגיאה בטעינת האפליקציה');
    }
  }
  
  /**
   * Initialize data loading
   */
  async initializeData() {
    try {
      // Load client data
      this.clientData = await this.loadJSON('./assets/data/clients.json');
      
      // Load route data
      this.routeData = await this.loadJSON('./assets/data/routes.json');
      
      // Load cluster data
      this.clusterData = await this.loadJSON('./assets/data/clusters.json');
      
      console.log('📊 Data loaded:', {
        clients: this.clientData?.length || 0,
        routes: this.routeData?.length || 0,
        clusters: this.clusterData?.length || 0
      });
      
    } catch (error) {
      console.error('❌ Failed to load data:', error);
      throw new Error('נכשל בטעינת נתונים');
    }
  }
  
  /**
   * Load JSON file with retry mechanism and fallback data
   */
  async loadJSON(url, retries = 2) {
    for (let i = 0; i <= retries; i++) {
      try {
        console.log(`📄 Loading ${url} (attempt ${i + 1}/${retries + 1})`);
        const response = await fetch(url, {
          cache: 'no-cache',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`✅ Successfully loaded ${url}`);
        return data;
        
      } catch (error) {
        console.error(`❌ Failed to load ${url} (attempt ${i + 1}):`, error);
        
        if (i === retries) {
          // On final failure, return appropriate fallback data
          return this.getFallbackData(url);
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }
  
  /**
   * Get fallback data when JSON loading fails
   */
  getFallbackData(url) {
    console.log(`🔄 Using fallback data for ${url}`);
    
    if (url.includes('clients.json')) {
      return {
        metadata: { totalClients: 0 },
        clients: [],
        megaClusters: []
      };
    } else if (url.includes('routes.json')) {
      return {
        dailyRoutes: [],
        summary: {}
      };
    } else if (url.includes('clusters.json')) {
      return {
        clusterAnalysis: {
          megaClusters: { clusters: [] },
          regularClusters: { clusters: [] }
        }
      };
    }
    return {};
  }
  
  /**
   * Initialize event listeners
   */
  initializeEventListeners() {
    // Day filter buttons
    document.querySelectorAll('.day-filter').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const day = e.target.dataset.day;
        this.setActiveDay(day);
      });
    });
    
    // Mobile day filters
    document.querySelectorAll('.day-filter-mobile').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const day = e.target.dataset.day;
        this.setActiveDay(day);
      });
    });
    
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', () => {
        this.toggleMobileMenu();
      });
    }
    
    // Bottom navigation
    document.querySelectorAll('.bottom-nav-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const view = e.currentTarget.dataset.view;
        this.setActiveView(view);
      });
    });
    
    // Enhanced Bottom Navigation 2.0
    this.initializeBottomNavigation();
    
    // Search functionality
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.handleSearch(e.target.value);
      });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcuts(e);
    });
    
    // Window resize
    window.addEventListener('resize', () => {
      this.handleResize();
    });
    
    // Online/offline status
    window.addEventListener('online', () => {
      this.handleConnectionChange(true);
    });
    
    window.addEventListener('offline', () => {
      this.handleConnectionChange(false);
    });
    
    // Pull to refresh (mobile)
    this.initializePullToRefresh();
  }
  
  /**
   * Set active day filter with enhanced map integration
   */
  setActiveDay(day) {
    this.currentDay = day;
    
    // Update button states
    document.querySelectorAll('.day-filter, .day-filter-mobile').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.day === day) {
        btn.classList.add('active');
      }
    });
    
    // Update map and client list with advanced features
    if (window.mapManager) {
      window.mapManager.filterByDay(day);
      
      // Auto-show daily route if specific day selected
      if (day !== 'all' && this.clientData) {
        const dayClients = this.clientData.clients?.filter(client => 
          client.visitDay === day || client.day === day
        ) || [];
        
        if (dayClients.length > 0) {
          // Add slight delay for smooth UX
          setTimeout(() => {
            window.mapManager.showDailyRoute(day, dayClients);
            
            // Add marker animations for selected day
            setTimeout(() => {
              window.mapManager.toggleMarkerAnimations(true);
            }, 1000);
          }, 500);
        }
      } else {
        // Clear route when showing all days
        window.mapManager.clearRoute();
      }
      
      // Auto-fit map to show relevant markers
      setTimeout(() => {
        window.mapManager.fitToMarkers();
      }, 1200);
    }
    
    if (window.dataManager) {
      window.dataManager.filterClientsByDay(day);
    }
    
    // Update UI elements
    this.updateClientCount();
    this.updateDayStats(day);
    
    // Show day-specific notification
    if (day !== 'all') {
      const dayName = this.getDayName(day);
      const clientCount = this.getClientCountForDay(day);
      this.showNotification(`מציג מסלול יום ${dayName} (${clientCount} לקוחות)`, 'info');
    }
    
    console.log(`📅 Active day set to: ${day}`);
  }
  
  /**
   * Set active view (mobile)
   */
  setActiveView(view) {
    this.currentView = view;
    
    // Update bottom nav states
    document.querySelectorAll('.bottom-nav-item').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.view === view) {
        btn.classList.add('active');
      }
    });
    
    // Handle view-specific logic
    switch (view) {
      case 'map':
        this.showMapView();
        break;
      case 'list':
        this.showListView();
        break;
      case 'routes':
        this.showRoutesView();
        break;
      case 'settings':
        this.showSettingsView();
        break;
    }
    
    console.log(`📱 Active view set to: ${view}`);
  }
  
  /**
   * Handle search input
   */
  handleSearch(query) {
    if (window.dataManager) {
      window.dataManager.searchClients(query);
    }
    
    if (window.mapManager) {
      window.mapManager.highlightSearchResults(query);
    }
    
    console.log(`🔍 Search query: ${query}`);
  }
  
  /**
   * Handle keyboard shortcuts
   */
  handleKeyboardShortcuts(e) {
    // Alt + 1-5 for day filters
    if (e.altKey && e.key >= '1' && e.key <= '5') {
      e.preventDefault();
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
      const day = days[parseInt(e.key) - 1];
      this.setActiveDay(day);
    }
    
    // Alt + A for all days
    if (e.altKey && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      this.setActiveDay('all');
    }
    
    // Escape to close modals
    if (e.key === 'Escape') {
      this.closeModals();
    }
    
    // Ctrl/Cmd + F for search
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      const searchInput = document.querySelector('.search-input');
      if (searchInput) {
        searchInput.focus();
      }
    }
  }
  
  /**
   * Handle window resize
   */
  handleResize() {
    if (window.mapManager) {
      window.mapManager.handleResize();
    }
    
    // Update mobile/desktop view
    this.updateResponsiveLayout();
  }
  
  /**
   * Handle connection change
   */
  handleConnectionChange(isOnline) {
    this.isOnline = isOnline;
    
    // Update UI to show connection status
    const statusIndicator = document.querySelector('.connection-status');
    if (statusIndicator) {
      statusIndicator.textContent = isOnline ? 'מחובר' : 'לא מחובר';
      statusIndicator.className = `connection-status ${isOnline ? 'online' : 'offline'}`;
    }
    
    // Show notification
    this.showNotification(
      isOnline ? 'חזרת להיות מחובר לאינטרנט' : 'אין חיבור לאינטרנט - עובד במצב לא מקוון',
      isOnline ? 'success' : 'warning'
    );
    
    console.log(`🌐 Connection status: ${isOnline ? 'online' : 'offline'}`);
  }
  
  /**
   * Show loading state
   */
  showLoading(show = true) {
    this.isLoading = show;
    const loadingElement = document.querySelector('.loading-screen');
    
    if (loadingElement) {
      if (show) {
        loadingElement.classList.add('active');
      } else {
        loadingElement.classList.remove('active');
      }
    }
  }
  
  /**
   * Show error message
   */
  showError(message) {
    this.showNotification(message, 'error');
  }
  
  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }
  
  /**
   * Update client count display
   */
  updateClientCount() {
    if (window.dataManager) {
      const count = window.dataManager.getFilteredClientCount();
      const countElement = document.querySelector('.client-count');
      if (countElement) {
        countElement.textContent = `${count} לקוחות`;
      }
    }
  }
  
  /**
   * Update UI
   */
  updateUI() {
    this.updateClientCount();
    this.updateResponsiveLayout();
    this.updateConnectionStatus();
  }
  
  /**
   * Update responsive layout
   */
  updateResponsiveLayout() {
    const isMobile = window.innerWidth <= 768;
    document.body.classList.toggle('mobile-layout', isMobile);
    document.body.classList.toggle('desktop-layout', !isMobile);
  }
  
  /**
   * Update connection status
   */
  updateConnectionStatus() {
    this.handleConnectionChange(navigator.onLine);
  }
  
  /**
   * Initialize Service Worker
   */
  async initializeServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('./sw.js');
        console.log('✅ Service Worker registered:', registration);
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
      }
    }
  }
  
  /**
   * Initialize PWA features
   */
  initializePWA() {
    // Install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.showInstallPrompt(e);
    });
    
    // App installed
    window.addEventListener('appinstalled', () => {
      this.showNotification('האפליקציה הותקנה בהצלחה!', 'success');
    });
  }
  
  /**
   * Show install prompt
   */
  showInstallPrompt(e) {
    const installBtn = document.querySelector('.install-btn');
    if (installBtn) {
      installBtn.style.display = 'block';
      installBtn.addEventListener('click', () => {
        e.prompt();
        e.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the install prompt');
          }
          installBtn.style.display = 'none';
        });
      });
    }
  }
  
  /**
   * Initialize pull to refresh
   */
  initializePullToRefresh() {
    let startY = 0;
    let currentY = 0;
    let pullDistance = 0;
    const threshold = 60;
    
    const container = document.querySelector('.main-container');
    if (!container) return;
    
    container.addEventListener('touchstart', (e) => {
      startY = e.touches[0].pageY;
    });
    
    container.addEventListener('touchmove', (e) => {
      currentY = e.touches[0].pageY;
      pullDistance = currentY - startY;
      
      if (pullDistance > 0 && container.scrollTop === 0) {
        e.preventDefault();
        const pullIndicator = document.querySelector('.pull-indicator');
        if (pullIndicator) {
          pullIndicator.style.opacity = Math.min(pullDistance / threshold, 1);
        }
        
        if (pullDistance > threshold) {
          container.classList.add('pulling');
        }
      }
    });
    
    container.addEventListener('touchend', () => {
      if (pullDistance > threshold) {
        this.refreshData();
      }
      
      container.classList.remove('pulling');
      const pullIndicator = document.querySelector('.pull-indicator');
      if (pullIndicator) {
        pullIndicator.style.opacity = 0;
      }
      
      pullDistance = 0;
    });
  }
  
  /**
   * Refresh data
   */
  async refreshData() {
    try {
      this.showLoading(true);
      await this.loadInitialData();
      
      if (window.mapManager) {
        window.mapManager.refresh();
      }
      
      if (window.dataManager) {
        window.dataManager.refresh();
      }
      
      this.showNotification('הנתונים עודכנו בהצלחה', 'success');
      this.showLoading(false);
      
    } catch (error) {
      console.error('Failed to refresh data:', error);
      this.showError('נכשל בעדכון הנתונים');
      this.showLoading(false);
    }
  }
  
  /**
   * Load initial data with enhanced integration
   */
  async loadInitialData() {
    try {
      // Load data into managers with proper client structure
      if (window.dataManager && this.clientData) {
        await window.dataManager.loadData(this.clientData, this.routeData, this.clusterData);
      }
      
      if (window.mapManager && this.clientData) {
        // Ensure proper client data structure for map
        const clientsForMap = this.clientData.clients || this.clientData || [];
        const clustersForMap = this.clusterData?.megaClusters || this.clusterData || [];
        
        await window.mapManager.loadData(clientsForMap, clustersForMap);
        
        // Initialize cluster visualization
        setTimeout(() => {
          window.mapManager.updateClusterVisualization();
        }, 1000);
      }
      
      if (window.routeManager && this.routeData) {
        await window.routeManager.loadData(this.routeData);
      }
      
      // Update header statistics
      this.updateHeaderStatistics();
      
      console.log('✅ Initial data loaded successfully into all managers');
      
    } catch (error) {
      console.error('❌ Failed to load initial data:', error);
      throw error;
    }
  }
  
  /**
   * Show map view
   */
  showMapView() {
    const mapSection = document.querySelector('.map-section');
    const clientSection = document.querySelector('.client-section');
    
    if (mapSection) mapSection.style.display = 'block';
    if (clientSection) clientSection.style.display = 'none';
    
    if (window.mapManager) {
      window.mapManager.resize();
    }
  }
  
  /**
   * Show list view
   */
  showListView() {
    const mapSection = document.querySelector('.map-section');
    const clientSection = document.querySelector('.client-section');
    
    if (mapSection) mapSection.style.display = 'none';
    if (clientSection) clientSection.style.display = 'block';
  }
  
  /**
   * Show routes view
   */
  showRoutesView() {
    // Implementation for routes view
    console.log('📍 Showing routes view');
  }
  
  /**
   * Show settings view
   */
  showSettingsView() {
    // Implementation for settings view
    console.log('⚙️ Showing settings view');
  }
  
  /**
   * Toggle mobile menu
   */
  toggleMobileMenu() {
    const mobileMenu = document.querySelector('.mobile-menu');
    if (mobileMenu) {
      mobileMenu.classList.toggle('active');
    }
  }
  
  /**
   * Close modals
   */
  closeModals() {
    document.querySelectorAll('.modal.active').forEach(modal => {
      modal.classList.remove('active');
    });
  }
  
  /**
   * Initialize Enhanced Bottom Navigation 2.0
   */
  initializeBottomNavigation() {
    // Navigation items
    const navItems = document.querySelectorAll('#bottomNav .nav-item');
    const navFab = document.getElementById('navFab');
    const navMore = document.getElementById('navMore');
    const navMoreMenu = document.getElementById('navMoreMenu');
    const navIndicator = document.getElementById('navIndicator');
    
    // Navigation item click handlers
    navItems.forEach((item, index) => {
      if (!item.classList.contains('nav-more')) {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          const view = item.dataset.view;
          this.setActiveNavigation(view, item, index);
        });
        
        // Add touch feedback
        this.addTouchFeedback(item);
      }
    });
    
    // FAB click handler
    if (navFab) {
      navFab.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleFabAction();
      });
      
      this.addTouchFeedback(navFab);
    }
    
    // More menu handler
    if (navMore && navMoreMenu) {
      navMore.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleMoreMenu();
      });
      
      // More menu items
      navMoreMenu.querySelectorAll('.more-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          const action = item.dataset.action;
          this.handleMoreAction(action);
          this.toggleMoreMenu(false);
        });
      });
    }
    
    // Close more menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!navMore?.contains(e.target) && !navMoreMenu?.contains(e.target)) {
        this.toggleMoreMenu(false);
      }
    });
    
    // Update badges periodically
    this.updateNavigationBadges();
    setInterval(() => this.updateNavigationBadges(), 30000); // Update every 30 seconds
  }
  
  /**
   * Set active navigation item
   */
  setActiveNavigation(view, activeItem, index) {
    // Remove active class from all items
    document.querySelectorAll('#bottomNav .nav-item').forEach(item => {
      item.classList.remove('active');
    });
    
    // Add active class to clicked item
    activeItem.classList.add('active');
    
    // Update indicator position
    this.updateNavigationIndicator(activeItem, index);
    
    // Handle view change
    this.setActiveView(view);
    
    // Add haptic feedback if supported
    this.addHapticFeedback();
    
    console.log(`📱 Navigation changed to: ${view}`);
  }
  
  /**
   * Update navigation indicator
   */
  updateNavigationIndicator(activeItem, index) {
    const indicator = document.getElementById('navIndicator');
    if (indicator && activeItem) {
      const itemRect = activeItem.getBoundingClientRect();
      const navRect = activeItem.closest('.nav-wrapper').getBoundingClientRect();
      
      const left = itemRect.left - navRect.left + (itemRect.width / 2) - 25; // 25px = half of indicator width
      
      indicator.style.left = `${left}px`;
      indicator.classList.add('active');
    }
  }
  
  /**
   * Handle FAB action
   */
  handleFabAction() {
    // Start daily route
    this.startDailyRoute();
    
    // Add visual feedback
    const fab = document.getElementById('navFab');
    if (fab) {
      fab.classList.add('loading');
      setTimeout(() => {
        fab.classList.remove('loading');
      }, 2000);
    }
    
    this.addHapticFeedback('success');
    this.showNotification('מתחיל מסלול יומי...', 'info');
    
    console.log('🚀 Starting daily route');
  }
  
  /**
   * Start daily route
   */
  async startDailyRoute() {
    try {
      if (window.routeManager) {
        await window.routeManager.startDailyRoute(this.currentDay);
      }
      
      // Update FAB state
      const fab = document.getElementById('navFab');
      if (fab) {
        const fabText = fab.querySelector('.fab-text');
        if (fabText) {
          fabText.textContent = 'פעיל';
        }
        fab.classList.add('active');
      }
      
      this.showNotification('המסלול היומי החל בהצלחה!', 'success');
      
    } catch (error) {
      console.error('Failed to start daily route:', error);
      this.showError('נכשל בהתחלת המסלול היומי');
    }
  }
  
  /**
   * Toggle more menu
   */
  toggleMoreMenu(show = null) {
    const moreMenu = document.getElementById('navMoreMenu');
    const moreButton = document.getElementById('navMore');
    
    if (moreMenu && moreButton) {
      const isShown = show !== null ? show : moreMenu.classList.contains('hidden');
      
      if (isShown) {
        moreMenu.classList.remove('hidden');
        moreButton.classList.add('active');
      } else {
        moreMenu.classList.add('hidden');
        moreButton.classList.remove('active');
      }
    }
  }
  
  /**
   * Handle more menu actions
   */
  handleMoreAction(action) {
    switch (action) {
      case 'export':
        this.handleExportAction();
        break;
      case 'analytics':
        this.handleAnalyticsAction();
        break;
      case 'settings':
        this.handleSettingsAction();
        break;
      case 'help':
        this.handleHelpAction();
        break;
      case 'sync':
        this.handleSyncAction();
        break;
      default:
        console.log(`Unknown action: ${action}`);
    }
  }
  
  /**
   * Handle export action
   */
  handleExportAction() {
    if (window.dataManager) {
      window.dataManager.showExportDialog();
    }
    console.log('📤 Export action triggered');
  }
  
  /**
   * Handle analytics action
   */
  handleAnalyticsAction() {
    // Show analytics dashboard
    this.showAnalyticsDashboard();
    console.log('📈 Analytics action triggered');
  }
  
  /**
   * Handle settings action
   */
  handleSettingsAction() {
    // Show settings modal
    this.showSettingsModal();
    console.log('⚙️ Settings action triggered');
  }
  
  /**
   * Handle help action
   */
  handleHelpAction() {
    // Show help modal
    this.showHelpModal();
    console.log('❓ Help action triggered');
  }
  
  /**
   * Handle sync action
   */
  async handleSyncAction() {
    await this.refreshData();
    console.log('🔄 Sync action triggered');
  }
  
  /**
   * Update navigation badges
   */
  updateNavigationBadges() {
    // Map badge - show MEGA CLUSTERS count
    const mapBadge = document.getElementById('mapBadge');
    if (mapBadge) {
      mapBadge.textContent = '8'; // MEGA CLUSTERS count
      mapBadge.className = 'nav-badge info';
    }
    
    // Routes badge - show active days
    const routesBadge = document.getElementById('routesBadge');
    if (routesBadge) {
      routesBadge.textContent = '5'; // Active days
      routesBadge.className = 'nav-badge success';
    }
    
    // Clients badge - show total clients
    const clientsBadge = document.getElementById('clientsBadge');
    if (clientsBadge) {
      clientsBadge.textContent = '176'; // Total clients
      clientsBadge.className = 'nav-badge';
    }
    
    // Progress badge - show completion percentage
    const progressBadge = document.getElementById('progressBadge');
    if (progressBadge) {
      const progress = this.calculateDailyProgress();
      progressBadge.textContent = `${progress}%`;
      progressBadge.className = `nav-badge ${progress >= 80 ? 'success' : progress >= 60 ? 'warning' : 'error'}`;
    }
  }
  
  /**
   * Calculate daily progress
   */
  calculateDailyProgress() {
    // Mock calculation - in real app, this would calculate actual progress
    const hour = new Date().getHours();
    const workHours = Math.max(0, hour - 6); // Work starts at 6 AM
    const maxHours = 12; // 12 hour work day
    return Math.min(100, Math.round((workHours / maxHours) * 100));
  }
  
  /**
   * Add touch feedback to elements
   */
  addTouchFeedback(element) {
    element.classList.add('touch-feedback');
    
    element.addEventListener('touchstart', () => {
      element.classList.add('touching');
    });
    
    element.addEventListener('touchend', () => {
      element.classList.remove('touching');
    });
    
    element.addEventListener('touchcancel', () => {
      element.classList.remove('touching');
    });
  }
  
  /**
   * Add haptic feedback
   */
  addHapticFeedback(type = 'light') {
    if ('vibrate' in navigator) {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(25);
          break;
        case 'success':
          navigator.vibrate([10, 50, 10]);
          break;
        case 'error':
          navigator.vibrate([100, 50, 100]);
          break;
      }
    }
  }
  
  /**
   * Show analytics dashboard
   */
  showAnalyticsDashboard() {
    // Implementation for analytics dashboard
    this.showNotification('מציג דוח אנליטיקה...', 'info');
  }
  
  /**
   * Show settings modal
   */
  showSettingsModal() {
    // Implementation for settings modal
    this.showNotification('פותח הגדרות...', 'info');
  }
  
  /**
   * Show help modal
   */
  showHelpModal() {
    // Implementation for help modal
    this.showNotification('מציג עזרה...', 'info');
  }
  
  /**
   * Get app data
   */
  getData() {
    return {
      clients: this.clientData,
      routes: this.routeData,
      clusters: this.clusterData,
      currentDay: this.currentDay,
      currentView: this.currentView,
      isOnline: this.isOnline
    };
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.agtRouteApp = new AgtRouteApp();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AgtRouteApp;
}
