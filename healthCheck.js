// AgtRoute - System Health Check
// בדיקת תקינות מערכת

console.log('🔍 Starting AgtRoute System Health Check...\n');

// רשימת קבצים קריטיים
const criticalFiles = {
  'HTML': ['index.html'],
  'CSS': [
    'assets/css/main.css',
    'assets/css/components.css', 
    'assets/css/mobile.css',
    'assets/css/animations.css',
    'assets/css/navigationUI.css'
  ],
  'JavaScript': [
    'assets/js/app.js',
    'assets/js/dataManager.js',
    'assets/js/mapManager.js',
    'assets/js/routeManager.js',
    'assets/js/utils.js',
    'assets/js/navigationUI.js',
    'assets/js/googleMapsIntegration.js'
  ],
  'Data': [
    'assets/data/clients.json',
    'assets/data/routes.json',
    'assets/data/clusters.json'
  ],
  'PWA': [
    'manifest.json',
    'sw.js'
  ],
  'Config': [
    'config.js',
    '.gitignore'
  ]
};

let totalFiles = 0;
let missingFiles = 0;

// בדיקת קבצים
console.log('📁 Checking critical files:\n');

for (const [category, files] of Object.entries(criticalFiles)) {
  console.log(`${category}:`);
  
  for (const file of files) {
    totalFiles++;
    
    // בסביבת דפדפן, נבדוק באמצעות fetch
    if (typeof window !== 'undefined') {
      fetch(file, { method: 'HEAD' })
        .then(response => {
          if (response.ok) {
            console.log(`  ✅ ${file}`);
          } else {
            console.log(`  ❌ ${file} - Status: ${response.status}`);
            missingFiles++;
          }
        })
        .catch(error => {
          console.log(`  ❌ ${file} - Error: ${error.message}`);
          missingFiles++;
        });
    } else {
      // בסביבת Node.js
      const fs = require('fs');
      const path = require('path');
      
      try {
        if (fs.existsSync(path.join(__dirname, file))) {
          console.log(`  ✅ ${file}`);
        } else {
          console.log(`  ❌ ${file} - File not found`);
          missingFiles++;
        }
      } catch (error) {
        console.log(`  ❌ ${file} - Error: ${error.message}`);
        missingFiles++;
      }
    }
  }
  console.log('');
}

// סיכום
setTimeout(() => {
  console.log('\n📊 Health Check Summary:');
  console.log(`Total files checked: ${totalFiles}`);
  console.log(`Files found: ${totalFiles - missingFiles}`);
  console.log(`Missing files: ${missingFiles}`);
  
  if (missingFiles === 0) {
    console.log('\n✅ System is healthy! All critical files are present.');
  } else {
    console.log('\n⚠️ Warning: Some critical files are missing.');
    console.log('Please check the files marked with ❌ above.');
  }
  
  // בדיקת תכונות נוספות
  console.log('\n🔧 Feature Check:');
  
  if (typeof window !== 'undefined') {
    // בדיקות דפדפן
    console.log(`  ${window.google && window.google.maps ? '✅' : '❌'} Google Maps API`);
    console.log(`  ${window.GOOGLE_MAPS_API_KEY ? '✅' : '❌'} API Key configured`);
    console.log(`  ${'serviceWorker' in navigator ? '✅' : '❌'} Service Worker support`);
    console.log(`  ${window.localStorage ? '✅' : '❌'} Local Storage`);
    console.log(`  ${window.speechSynthesis ? '✅' : '❌'} Speech Synthesis`);
    console.log(`  ${navigator.geolocation ? '✅' : '❌'} Geolocation API`);
  }
  
  console.log('\n🎉 Health check completed!');
}, 1000);
