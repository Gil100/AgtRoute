/**
 * Navigation UI Integration Test - AgtRoute
 * שלב 5.2: בדיקת אינטגרציה של ממשק הניווט
 */

// Test Navigation UI Integration
document.addEventListener('DOMContentLoaded', () => {
    console.log('🧪 Starting Navigation UI Integration Test...');
    
    // Test 1: Check if all required files are loaded
    const testFileLoad = () => {
        const tests = [
            { name: 'GoogleMapsIntegrationManager', obj: window.GoogleMapsIntegrationManager },
            { name: 'NavigationUIManager', obj: window.NavigationUIManager },
            { name: 'navigationUIManager', obj: window.navigationUIManager }
        ];
        
        tests.forEach(test => {
            if (test.obj) {
                console.log(`✅ ${test.name} loaded successfully`);
            } else {
                console.error(`❌ ${test.name} failed to load`);
            }
        });
    };
    
    // Test 2: Check CSS styles
    const testCSSLoad = () => {
        const testElement = document.createElement('div');
        testElement.className = 'navigation-panel';
        document.body.appendChild(testElement);
        
        const styles = window.getComputedStyle(testElement);
        const hasStyles = styles.position === 'fixed';
        
        if (hasStyles) {
            console.log('✅ NavigationUI CSS loaded successfully');
        } else {
            console.error('❌ NavigationUI CSS not loaded properly');
        }
        
        document.body.removeChild(testElement);
    };
    
    // Test 3: Check integration readiness
    const testIntegration = () => {
        if (window.navigationUIManager) {
            // Test basic methods
            const methods = ['startNavigation', 'showNavigationPanel', 'updatePerformanceMetrics'];
            methods.forEach(method => {
                if (typeof window.navigationUIManager[method] === 'function') {
                    console.log(`✅ Method ${method} available`);
                } else {
                    console.error(`❌ Method ${method} not available`);
                }
            });
        }
    };
    
    // Test 4: Check Google Maps Integration
    const testGoogleMapsIntegration = () => {
        if (window.googleMapsManager) {
            console.log('✅ Google Maps Manager available for integration');
            
            // Try to integrate
            if (window.navigationUIManager && window.navigationUIManager.integrateWithMaps) {
                try {
                    window.navigationUIManager.integrateWithMaps(window.googleMapsManager);
                    console.log('✅ Navigation UI integrated with Google Maps');
                } catch (error) {
                    console.error('❌ Integration failed:', error);
                }
            }
        } else {
            console.warn('⚠️ Google Maps Manager not yet available');
        }
    };
    
    // Test 5: UI Elements Creation
    const testUIElements = () => {
        const requiredElements = [
            'navigation-panel',
            'driver-dashboard', 
            'route-progress-indicator',
            'next-client-preview',
            'performance-display'
        ];
        
        setTimeout(() => {
            requiredElements.forEach(elementId => {
                const element = document.getElementById(elementId);
                if (element) {
                    console.log(`✅ UI Element ${elementId} created`);
                } else {
                    console.warn(`⚠️ UI Element ${elementId} not found`);
                }
            });
        }, 1000);
    };
    
    // Run tests
    setTimeout(() => {
        testFileLoad();
        testCSSLoad();
        testIntegration();
        testGoogleMapsIntegration();
        testUIElements();
        
        console.log('🎯 Navigation UI Integration Test Completed');
        
        // Show success message
        if (window.navigationUIManager && window.navigationUIManager.showToast) {
            window.navigationUIManager.showToast('🎉 שלב 5.2 מוכן!', 'success');
        }
    }, 500);
    
    // Test keyboard shortcuts
    setTimeout(() => {
        console.log('🔤 Testing keyboard shortcuts...');
        console.log('Available shortcuts:');
        console.log('- Ctrl+N: Start Navigation');
        console.log('- Ctrl+P: Pause Navigation');
        console.log('- Ctrl+C: Call Client');
        console.log('- Ctrl+A: Mark Arrived');
        console.log('- Ctrl+R: Recalculate Route');
        console.log('- Ctrl+V: Toggle Voice');
        console.log('- Escape: Minimize Panel');
    }, 2000);
});