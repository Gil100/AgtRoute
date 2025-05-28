showToast) {
            window.animationManager.showToast(message, type);
        } else {
            // Fallback toast implementation
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            toast.textContent = message;
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : type === 'warning' ? '#ff9800' : '#2196f3'};
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                z-index: 10000;
                font-weight: 500;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transform: translateX(100%);
                transition: transform 0.3s ease;
            `;
            
            document.body.appendChild(toast);
            
            // Slide in
            setTimeout(() => {
                toast.style.transform = 'translateX(0)';
            }, 100);
            
            // Remove after 3 seconds
            setTimeout(() => {
                toast.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }, 3000);
        }
    }
    
    /**
     * Integration with Google Maps Manager
     */
    integrateWithMaps(googleMapsManager) {
        this.googleMapsManager = googleMapsManager;
        
        // Listen to position updates
        googleMapsManager.addEventListener('positionUpdate', (data) => {
            this.handlePositionUpdate(data);
        });
        
        // Listen to route calculation
        googleMapsManager.addEventListener('routeCalculated', (data) => {
            this.handleRouteCalculated(data);
        });
        
        // Listen to proximity alerts
        googleMapsManager.addEventListener('proximityAlert', (data) => {
            this.handleProximityAlert(data);
        });
        
        // Listen to metrics updates
        googleMapsManager.addEventListener('metricsUpdate', (data) => {
            this.handleMetricsUpdate(data);
        });
    }
    
    /**
     * Handle position updates from GPS
     */
    handlePositionUpdate(data) {
        const position = data.position;
        
        // Update current location display
        const locationElement = document.getElementById('current-location');
        if (locationElement && position) {
            // Reverse geocode to get address (simplified)
            locationElement.textContent = `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`;
        }
        
        // Update speed if available
        if (data.data && data.data.coords && data.data.coords.speed) {
            const speedElement = document.getElementById('current-speed');
            if (speedElement) {
                const speedKmh = Math.round(data.data.coords.speed * 3.6);
                speedElement.textContent = speedKmh;
            }
        }
    }
    
    /**
     * Handle route calculation completion
     */
    handleRouteCalculated(data) {
        this.currentRoute = data.route;
        this.processRouteData(data.route);
        
        this.showToast('🗺️ מסלול חושב בהצלחה!', 'success');
    }
    
    /**
     * Handle proximity alerts
     */
    handleProximityAlert(data) {
        const client = data.client;
        const distance = Math.round(data.distance);
        
        this.showToast(`📍 מתקרב ל${client.name || 'לקוח'} - ${distance}מ'`, 'info');
        
        // Update arrival notification
        this.updateArrivalNotification(client, distance);
    }
    
    /**
     * Handle metrics updates
     */
    handleMetricsUpdate(data) {
        const metrics = data.metrics;
        
        // Update performance metrics in dashboard
        this.updatePerformanceMetrics(metrics);
    }
    
    /**
     * Update performance metrics display
     */
    updatePerformanceMetrics(metrics) {
        // Update efficiency rating
        const efficiencyElement = document.getElementById('efficiency-rating');
        if (efficiencyElement && metrics.efficiency) {
            efficiencyElement.textContent = metrics.efficiency.toFixed(1);
        }
        
        // Update fuel consumption
        const fuelElement = document.getElementById('fuel-consumption');
        if (fuelElement && metrics.fuelConsumption) {
            fuelElement.textContent = metrics.fuelConsumption.toFixed(1);
        }
        
        // Update total distance
        const distanceElement = document.getElementById('total-distance-metric');
        if (distanceElement && metrics.totalDistance) {
            const distanceKm = (metrics.totalDistance / 1000).toFixed(1);
            distanceElement.textContent = `${distanceKm} ק"מ`;
        }
        
        // Update average speed
        const speedElement = document.getElementById('avg-speed-metric');
        if (speedElement && metrics.averageSpeed) {
            speedElement.textContent = `${Math.round(metrics.averageSpeed)} קמ"ש`;
        }
    }
    
    /**
     * Update arrival notification
     */
    updateArrivalNotification(client, distance) {
        const destName = document.getElementById('dest-name');
        const destDistance = document.getElementById('dest-distance');
        
        if (destName) {
            destName.textContent = client.name || 'לקוח';
        }
        
        if (destDistance) {
            destDistance.textContent = `${distance}מ'`;
        }
        
        // Calculate ETA
        const eta = this.calculateETA(distance);
        const etaElement = document.getElementById('dest-eta');
        if (etaElement && eta) {
            etaElement.textContent = `הגעה בעוד ${eta}`;
        }
    }
    
    /**
     * Calculate ETA based on distance and current conditions
     */
    calculateETA(distanceMeters) {
        // Simple calculation - can be improved with real traffic data
        const avgSpeedKmh = 40; // Average speed in city
        const distanceKm = distanceMeters / 1000;
        const timeHours = distanceKm / avgSpeedKmh;
        const timeMinutes = Math.round(timeHours * 60);
        
        if (timeMinutes < 1) {
            return 'פחות מדקה';
        } else if (timeMinutes < 60) {
            return `${timeMinutes} דקות`;
        } else {
            const hours = Math.floor(timeMinutes / 60);
            const minutes = timeMinutes % 60;
            return `${hours}:${minutes.toString().padStart(2, '0')} שעות`;
        }
    }
    
    /**
     * Mobile optimization methods
     */
    optimizeForMobile() {
        if (window.innerWidth <= 768) {
            // Adjust navigation panel for mobile
            if (this.navigationPanel) {
                this.navigationPanel.classList.add('mobile-optimized');
            }
            
            // Adjust dashboard for mobile
            if (this.driverDashboard) {
                this.driverDashboard.classList.add('mobile-compact');
            }
            
            // Adjust next client preview
            if (this.nextClientCard) {
                this.nextClientCard.classList.add('mobile-bottom');
            }
        }
    }
    
    /**
     * Handle orientation change
     */
    handleOrientationChange() {
        setTimeout(() => {
            this.optimizeForMobile();
            
            // Recalculate layout
            if (this.isNavigating) {
                this.adjustLayoutForOrientation();
            }
        }, 100);
    }
    
    adjustLayoutForOrientation() {
        const isLandscape = window.innerWidth > window.innerHeight;
        
        if (isLandscape) {
            document.body.classList.add('landscape-mode');
            document.body.classList.remove('portrait-mode');
        } else {
            document.body.classList.add('portrait-mode');
            document.body.classList.remove('landscape-mode');
        }
    }
    
    /**
     * Accessibility features
     */
    setupAccessibility() {
        // Add ARIA labels
        this.addAriaLabels();
        
        // Setup focus management
        this.setupFocusManagement();
        
        // Setup high contrast mode detection
        this.setupHighContrastMode();
    }
    
    addAriaLabels() {
        // Add ARIA labels to important elements
        const elements = [
            { id: 'nav-voice-toggle', label: 'הפעל/כבה הוראות קוליות' },
            { id: 'nav-night-toggle', label: 'מצב לילה' },
            { id: 'start-navigation', label: 'התחל ניווט' },
            { id: 'call-client', label: 'התקשר ללקוח' },
            { id: 'arrived-client', label: 'סמן כהגעה' }
        ];
        
        elements.forEach(item => {
            const element = document.getElementById(item.id);
            if (element) {
                element.setAttribute('aria-label', item.label);
            }
        });
    }
    
    setupFocusManagement() {
        // Ensure proper focus order
        const focusableElements = this.navigationPanel?.querySelectorAll(
            'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements) {
            focusableElements.forEach((element, index) => {
                element.setAttribute('tabindex', index + 1);
            });
        }
    }
    
    setupHighContrastMode() {
        // Detect high contrast mode
        if (window.matchMedia('(prefers-contrast: high)').matches) {
            document.body.classList.add('high-contrast');
        }
        
        // Listen for changes
        window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
            document.body.classList.toggle('high-contrast', e.matches);
        });
    }
    
    /**
     * Performance monitoring
     */
    monitorPerformance() {
        // Monitor frame rate
        this.frameRateMonitor();
        
        // Monitor memory usage
        this.memoryMonitor();
        
        // Monitor battery (if available)
        this.batteryMonitor();
    }
    
    frameRateMonitor() {
        let lastTime = performance.now();
        let frameCount = 0;
        
        const checkFPS = () => {
            const currentTime = performance.now();
            frameCount++;
            
            if (currentTime - lastTime >= 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                
                // Log performance warning if FPS drops below 30
                if (fps < 30) {
                    console.warn(`⚠️ Low FPS detected: ${fps}`);
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            if (this.isNavigating) {
                requestAnimationFrame(checkFPS);
            }
        };
        
        if (this.isNavigating) {
            requestAnimationFrame(checkFPS);
        }
    }
    
    memoryMonitor() {
        if ('memory' in performance) {
            const memInfo = performance.memory;
            const usedMB = Math.round(memInfo.usedJSHeapSize / 1048576);
            const limitMB = Math.round(memInfo.jsHeapSizeLimit / 1048576);
            
            // Warn if memory usage is high
            if (usedMB > limitMB * 0.8) {
                console.warn(`⚠️ High memory usage: ${usedMB}MB / ${limitMB}MB`);
            }
        }
    }
    
    batteryMonitor() {
        if ('getBattery' in navigator) {
            navigator.getBattery().then((battery) => {
                const updateBatteryInfo = () => {
                    const level = Math.round(battery.level * 100);
                    
                    // Show warning for low battery
                    if (level < 20 && battery.charging === false) {
                        this.showToast(`🔋 סוללה חלשה: ${level}%`, 'warning');
                    }
                };
                
                battery.addEventListener('levelchange', updateBatteryInfo);
                battery.addEventListener('chargingchange', updateBatteryInfo);
                
                updateBatteryInfo();
            });
        }
    }
    
    /**
     * Initialize all components
     */
    initializeComplete() {
        // Setup responsive behavior
        this.optimizeForMobile();
        
        // Setup accessibility
        this.setupAccessibility();
        
        // Monitor performance
        this.monitorPerformance();
        
        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            this.handleOrientationChange();
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.optimizeForMobile();
        });
        
        console.log('✅ NavigationUIManager fully initialized');
    }
    
    /**
     * Cleanup method
     */
    destroy() {
        // Stop navigation if active
        if (this.isNavigating) {
            this.stopNavigation();
        }
        
        // Cancel speech synthesis
        if (this.speechSynthesis) {
            this.speechSynthesis.cancel();
        }
        
        // Remove event listeners
        window.removeEventListener('orientationchange', this.handleOrientationChange);
        window.removeEventListener('resize', this.optimizeForMobile);
        
        // Remove UI elements
        [this.navigationPanel, this.driverDashboard, this.routeProgress, 
         this.nextClientCard, this.performanceDisplay].forEach(element => {
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        
        console.log('🧹 NavigationUIManager cleaned up');
    }
}

// Export for use in other modules
window.NavigationUIManager = NavigationUIManager;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Navigation UI Manager
    window.navigationUIManager = new NavigationUIManager();
    window.navigationUIManager.initializeComplete();
    
    // Integrate with Google Maps Manager when available
    if (window.googleMapsManager) {
        window.navigationUIManager.integrateWithMaps(window.googleMapsManager);
    } else {
        // Wait for Google Maps Manager to be ready
        document.addEventListener('googleMapsReady', () => {
            if (window.googleMapsManager) {
                window.navigationUIManager.integrateWithMaps(window.googleMapsManager);
            }
        });
    }
});