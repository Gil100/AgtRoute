/**
 * Navigation UI Manager - ממשק ניווט מתקדם לנהג
 */

class NavigationUIManager {
    constructor() {
        this.isNavigating = false;
        this.currentRoute = null;
        this.currentClientIndex = 0;
        this.voiceEnabled = false;
        this.nightMode = false;
        this.speechSynthesis = null;
        this.routeData = null;
        
        this.init();
    }

    init() {
        this.setupSpeechSynthesis();
        this.setupEventListeners();
        console.log('🧭 NavigationUIManager initialized successfully');
    }

    setupSpeechSynthesis() {
        if ('speechSynthesis' in window) {
            this.speechSynthesis = window.speechSynthesis;
        }
    }

    setupEventListeners() {
        // Voice toggle
        const voiceToggle = document.getElementById('nav-voice-toggle');
        if (voiceToggle) {
            voiceToggle.addEventListener('click', () => this.toggleVoice());
        }

        // Night mode toggle  
        const nightToggle = document.getElementById('nav-night-toggle');
        if (nightToggle) {
            nightToggle.addEventListener('click', () => this.toggleNightMode());
        }
    }

    toggleVoice() {
        this.voiceEnabled = !this.voiceEnabled;
        this.showToast(
            this.voiceEnabled ? '🔊 הוראות קוליות הופעלו' : '🔇 הוראות קוליות כובו', 
            'info'
        );
    }

    toggleNightMode() {
        this.nightMode = !this.nightMode;
        document.body.classList.toggle('night-mode', this.nightMode);
        this.showToast(
            this.nightMode ? '🌙 מצב לילה הופעל' : '☀️ מצב יום הופעל', 
            'info'
        );
    }

    speak(text) {
        if (!this.voiceEnabled || !this.speechSynthesis) return;
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'he-IL';
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        
        this.speechSynthesis.speak(utterance);
    }

    showToast(message, type = 'info') {
        // Use AnimationManager if available
        if (window.animationManager && typeof window.animationManager.showToast === 'function') {
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
            
            setTimeout(() => {
                toast.style.transform = 'translateX(0)';
            }, 100);
            
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
}

// Export for use in other modules
window.NavigationUIManager = NavigationUIManager;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.navigationUIManager = new NavigationUIManager();
});