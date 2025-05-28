/**
 * AgtRoute - Utility Functions
 * פונקציות עזר מתקדמות למערכת ניהול המסלולים
 * Version: 1.0.0
 * Author: Logistic AI System
 */

class Utils {
    constructor() {
        this.initialized = false;
        this.debugMode = false;
        this.init();
    }

    init() {
        this.setupGlobalUtilities();
        this.setupDateTimeUtilities();
        this.setupGeolocationUtilities();
        this.setupStorageUtilities();
        this.setupValidationUtilities();
        this.setupFormattingUtilities();
        this.initialized = true;
        console.log('🔧 Utils initialized successfully!');
    }

    // GLOBAL UTILITIES
    setupGlobalUtilities() {
        // Add global helper methods to window
        if (typeof window !== 'undefined') {
            window.utils = this;
            window.log = this.log.bind(this);
            window.formatCurrency = this.formatCurrency.bind(this);
            window.formatDate = this.formatDate.bind(this);
            window.formatTime = this.formatTime.bind(this);
        }
    }

    log(message, type = 'info') {
        if (!this.debugMode && type === 'debug') return;
        
        const timestamp = new Date().toLocaleTimeString('he-IL');
        const prefix = `[${timestamp}] AgtRoute:`;
        
        switch (type) {
            case 'error':
                console.error(`${prefix} ❌`, message);
                break;
            case 'warn':
                console.warn(`${prefix} ⚠️`, message);
                break;
            case 'success':
                console.log(`${prefix} ✅`, message);
                break;
            case 'debug':
                console.debug(`${prefix} 🔍`, message);
                break;
            default:
                console.log(`${prefix} ℹ️`, message);
        }
    }

    enableDebugMode() {
        this.debugMode = true;
        this.log('Debug mode enabled', 'debug');
    }

    disableDebugMode() {
        this.debugMode = false;
    }

    // DATE AND TIME UTILITIES
    setupDateTimeUtilities() {
        this.hebrewDays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
        this.hebrewMonths = [
            'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
            'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
        ];
    }

    getCurrentDate() {
        return new Date();
    }

    formatDate(date, format = 'dd/mm/yyyy') {
        if (!date) return '';
        
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const dayName = this.hebrewDays[d.getDay()];
        const monthName = this.hebrewMonths[d.getMonth()];

        switch (format) {
            case 'dd/mm/yyyy':
                return `${day}/${month}/${year}`;
            case 'hebrew':
                return `יום ${dayName}, ${day} ב${monthName} ${year}`;
            case 'short':
                return `${day}/${month}`;
            case 'long':
                return `${dayName}, ${day} ב${monthName} ${year}`;
            default:
                return d.toLocaleDateString('he-IL');
        }
    }

    formatTime(time, format = '24h') {
        if (!time) return '';
        
        const t = typeof time === 'string' ? new Date(`1970-01-01T${time}`) : new Date(time);
        
        if (format === '12h') {
            return t.toLocaleTimeString('he-IL', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
            });
        }
        
        return t.toLocaleTimeString('he-IL', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
    }

    formatDuration(minutes) {
        if (!minutes || minutes < 0) return '0 דקות';
        
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        
        if (hours === 0) return `${mins} דקות`;
        if (mins === 0) return `${hours} שעות`;
        return `${hours} שעות ו-${mins} דקות`;
    }

    addTimeToDate(date, timeString) {
        const baseDate = new Date(date);
        const [hours, minutes] = timeString.split(':').map(Number);
        baseDate.setHours(hours, minutes, 0, 0);
        return baseDate;
    }

    calculateTimeDifference(startTime, endTime) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const diffMs = end - start;
        return Math.round(diffMs / (1000 * 60)); // Return minutes
    }

    isWorkingDay(date) {
        const day = new Date(date).getDay();
        return day >= 1 && day <= 5; // Monday to Friday
    }

    getWorkingDays(startDate, endDate) {
        const days = [];
        const current = new Date(startDate);
        const end = new Date(endDate);

        while (current <= end) {
            if (this.isWorkingDay(current)) {
                days.push(new Date(current));
            }
            current.setDate(current.getDate() + 1);
        }

        return days;
    }

    // GEOLOCATION UTILITIES
    setupGeolocationUtilities() {
        this.EARTH_RADIUS_KM = 6371;
        this.ISRAEL_BOUNDS = {
            north: 33.3,
            south: 29.5,
            east: 35.9,
            west: 34.2
        };
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        // Haversine formula for calculating distance between two points
        const dLat = this.toRadians(lat2 - lat1);
        const dLng = this.toRadians(lng2 - lng1);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return this.EARTH_RADIUS_KM * c;
    }

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    toDegrees(radians) {
        return radians * (180 / Math.PI);
    }

    isValidCoordinates(lat, lng) {
        return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    }

    isInIsrael(lat, lng) {
        return lat >= this.ISRAEL_BOUNDS.south && 
               lat <= this.ISRAEL_BOUNDS.north &&
               lng >= this.ISRAEL_BOUNDS.west && 
               lng <= this.ISRAEL_BOUNDS.east;
    }

    generateLocationKey(lat, lng, precision = 3) {
        const roundedLat = Number(lat.toFixed(precision));
        const roundedLng = Number(lng.toFixed(precision));
        return `${roundedLat}_${roundedLng}`;
    }

    calculateBounds(points, padding = 0.01) {
        if (!points || points.length === 0) return null;

        const lats = points.map(p => p.lat || p.Latitude);
        const lngs = points.map(p => p.lng || p.Longitude);

        return {
            north: Math.max(...lats) + padding,
            south: Math.min(...lats) - padding,
            east: Math.max(...lngs) + padding,
            west: Math.min(...lngs) - padding
        };
    }

    calculateCenter(points) {
        if (!points || points.length === 0) return null;

        const sumLat = points.reduce((sum, p) => sum + (p.lat || p.Latitude), 0);
        const sumLng = points.reduce((sum, p) => sum + (p.lng || p.Longitude), 0);

        return {
            lat: sumLat / points.length,
            lng: sumLng / points.length
        };
    }

    // STORAGE UTILITIES
    setupStorageUtilities() {
        this.STORAGE_PREFIX = 'agtroute_';
        this.STORAGE_VERSION = '1.0';
    }

    setStorage(key, value, expiry = null) {
        try {
            const item = {
                value: value,
                timestamp: Date.now(),
                expiry: expiry ? Date.now() + expiry : null,
                version: this.STORAGE_VERSION
            };
            localStorage.setItem(this.STORAGE_PREFIX + key, JSON.stringify(item));
            return true;
        } catch (error) {
            this.log(`Storage error: ${error.message}`, 'error');
            return false;
        }
    }

    getStorage(key, defaultValue = null) {
        try {
            const itemStr = localStorage.getItem(this.STORAGE_PREFIX + key);
            if (!itemStr) return defaultValue;

            const item = JSON.parse(itemStr);
            
            // Check expiry
            if (item.expiry && Date.now() > item.expiry) {
                this.removeStorage(key);
                return defaultValue;
            }

            // Check version compatibility
            if (item.version !== this.STORAGE_VERSION) {
                this.log(`Storage version mismatch for ${key}`, 'warn');
                return defaultValue;
            }

            return item.value;
        } catch (error) {
            this.log(`Storage retrieval error: ${error.message}`, 'error');
            return defaultValue;
        }
    }

    removeStorage(key) {
        try {
            localStorage.removeItem(this.STORAGE_PREFIX + key);
            return true;
        } catch (error) {
            this.log(`Storage removal error: ${error.message}`, 'error');
            return false;
        }
    }

    clearStorage() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.STORAGE_PREFIX)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            this.log(`Storage clear error: ${error.message}`, 'error');
            return false;
        }
    }

    getStorageSize() {
        let total = 0;
        for (let key in localStorage) {
            if (key.startsWith(this.STORAGE_PREFIX)) {
                total += localStorage[key].length;
            }
        }
        return total;
    }

    // VALIDATION UTILITIES
    setupValidationUtilities() {
        this.validators = {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            phone: /^0[2-9][0-9]{7,8}$/,
            hebrew: /^[\u0590-\u05FF\s\d\-\(\)]+$/,
            coordinates: {
                lat: (val) => val >= -90 && val <= 90,
                lng: (val) => val >= -180 && val <= 180
            }
        };
    }

    validate(value, type, options = {}) {
        if (value === null || value === undefined) {
            return options.required ? false : true;
        }

        switch (type) {
            case 'email':
                return this.validators.email.test(value);
            case 'phone':
                return this.validators.phone.test(value.replace(/\D/g, ''));
            case 'hebrew':
                return this.validators.hebrew.test(value);
            case 'coordinates':
                return this.validators.coordinates.lat(value.lat) && 
                       this.validators.coordinates.lng(value.lng);
            case 'time':
                return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value);
            case 'positive':
                return Number(value) > 0;
            case 'range':
                const num = Number(value);
                return num >= options.min && num <= options.max;
            default:
                return true;
        }
    }

    sanitizeInput(value, type = 'text') {
        if (!value) return '';

        switch (type) {
            case 'text':
                return String(value).trim();
            case 'number':
                return Number(value) || 0;
            case 'phone':
                return value.replace(/\D/g, '');
            case 'email':
                return String(value).toLowerCase().trim();
            case 'hebrew':
                return String(value).replace(/[^\u0590-\u05FF\s\d\-\(\)]/g, '');
            default:
                return value;
        }
    }

    // FORMATTING UTILITIES
    setupFormattingUtilities() {
        this.currencyFormatter = new Intl.NumberFormat('he-IL', {
            style: 'currency',
            currency: 'ILS'
        });

        this.numberFormatter = new Intl.NumberFormat('he-IL');
    }

    formatCurrency(amount, currency = 'ILS') {
        if (isNaN(amount)) return '₪0';
        
        if (currency === 'ILS') {
            return this.currencyFormatter.format(amount);
        }
        
        return new Intl.NumberFormat('he-IL', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    formatNumber(number, decimals = 0) {
        if (isNaN(number)) return '0';
        
        return new Intl.NumberFormat('he-IL', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(number);
    }

    formatPercentage(value, decimals = 1) {
        if (isNaN(value)) return '0%';
        
        return new Intl.NumberFormat('he-IL', {
            style: 'percent',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(value / 100);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    truncateText(text, maxLength, suffix = '...') {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength - suffix.length) + suffix;
    }

    capitalizeFirst(text) {
        if (!text) return '';
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    // ARRAY AND OBJECT UTILITIES
    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = item[key];
            if (!groups[group]) {
                groups[group] = [];
            }
            groups[group].push(item);
            return groups;
        }, {});
    }

    sortBy(array, key, direction = 'asc') {
        return [...array].sort((a, b) => {
            let aVal = a[key];
            let bVal = b[key];
            
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }
            
            if (direction === 'asc') {
                return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            } else {
                return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
            }
        });
    }

    filterBy(array, filters) {
        return array.filter(item => {
            return Object.keys(filters).every(key => {
                const filterValue = filters[key];
                const itemValue = item[key];
                
                if (filterValue === null || filterValue === undefined) return true;
                if (typeof filterValue === 'string') {
                    return String(itemValue).toLowerCase().includes(filterValue.toLowerCase());
                }
                
                return itemValue === filterValue;
            });
        });
    }

    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj);
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const cloned = {};
            Object.keys(obj).forEach(key => {
                cloned[key] = this.deepClone(obj[key]);
            });
            return cloned;
        }
    }

    mergeObjects(...objects) {
        return objects.reduce((merged, obj) => {
            return { ...merged, ...obj };
        }, {});
    }

    // DOM UTILITIES
    createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        Object.keys(attributes).forEach(key => {
            if (key === 'className') {
                element.className = attributes[key];
            } else if (key === 'innerHTML') {
                element.innerHTML = attributes[key];
            } else if (key === 'textContent') {
                element.textContent = attributes[key];
            } else {
                element.setAttribute(key, attributes[key]);
            }
        });
        
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else {
                element.appendChild(child);
            }
        });
        
        return element;
    }

    findElement(selector, parent = document) {
        return parent.querySelector(selector);
    }

    findElements(selector, parent = document) {
        return Array.from(parent.querySelectorAll(selector));
    }

    addClass(element, className) {
        if (element && className) {
            element.classList.add(className);
        }
    }

    removeClass(element, className) {
        if (element && className) {
            element.classList.remove(className);
        }
    }

    toggleClass(element, className) {
        if (element && className) {
            element.classList.toggle(className);
        }
    }

    // EXPORT UTILITIES
    exportToCSV(data, filename = 'export.csv') {
        if (!data || data.length === 0) return;
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => 
                `"${String(row[header] || '').replace(/"/g, '""')}"`
            ).join(','))
        ].join('\n');
        
        this.downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
    }

    exportToJSON(data, filename = 'export.json') {
        const jsonContent = JSON.stringify(data, null, 2);
        this.downloadFile(jsonContent, filename, 'application/json');
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // PERFORMANCE UTILITIES
    debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    throttle(func, delay) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, delay);
            }
        };
    }

    measurePerformance(name, func) {
        const start = performance.now();
        const result = func();
        const end = performance.now();
        this.log(`${name} took ${(end - start).toFixed(2)} milliseconds`, 'debug');
        return result;
    }

    // ERROR HANDLING
    handleError(error, context = 'Unknown') {
        const errorInfo = {
            message: error.message,
            stack: error.stack,
            context: context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        this.log(`Error in ${context}: ${error.message}`, 'error');
        
        // Store error for debugging
        const errors = this.getStorage('errors', []);
        errors.push(errorInfo);
        this.setStorage('errors', errors.slice(-50)); // Keep last 50 errors
        
        return errorInfo;
    }

    getLastErrors(count = 10) {
        return this.getStorage('errors', []).slice(-count);
    }

    clearErrors() {
        this.removeStorage('errors');
    }

    // NETWORK UTILITIES
    async fetchWithRetry(url, options = {}, maxRetries = 3) {
        let lastError;
        
        for (let i = 0; i <= maxRetries; i++) {
            try {
                const response = await fetch(url, options);
                if (response.ok) {
                    return response;
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            } catch (error) {
                lastError = error;
                if (i < maxRetries) {
                    await this.delay(Math.pow(2, i) * 1000); // Exponential backoff
                }
            }
        }
        
        throw lastError;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    isOnline() {
        return navigator.onLine;
    }

    // PUBLIC API
    getVersion() {
        return this.STORAGE_VERSION;
    }

    getUtilityInfo() {
        return {
            version: this.STORAGE_VERSION,
            initialized: this.initialized,
            debugMode: this.debugMode,
            storageSize: this.formatFileSize(this.getStorageSize()),
            platform: navigator.platform,
            language: navigator.language
        };
    }
}

// Initialize Utils when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window !== 'undefined') {
        window.utils = new Utils();
        console.log('🔧 Utils initialized and available globally!');
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}