# 🚛 AgtRoute - מערכת ניהול מסלולי חלוקה חכמה

[![GitHub Pages](https://img.shields.io/badge/Demo-Live-green)](https://gil100.github.io/AgtRoute/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-Ready-orange)](https://gil100.github.io/AgtRoute/)

## 📋 תיאור

AgtRoute היא מערכת מתקדמת לניהול מסלולי חלוקה שבועית, המבוססת על אלגוריתמי אופטימיזציה מוכחים של Logistic AI. המערכת מנהלת 176 לקוחות ב-8 MEGA CLUSTERS עם יעילות מרשימה של 3.02 לקוחות/שעה.

### 🎯 תכונות עיקריות

- **📍 176 לקוחות** - ניהול מלא של כל הלקוחות
- **🔗 8 MEGA CLUSTERS** - אזורים מרוכזים ליעילות מקסימלית
- **📊 יעילות 3.02 לקוחות/שעה** - ביצועים מעולים
- **💰 ROI של 159,640 ₪ שנתי** - חיסכון מוכח
- **📱 PWA מלא** - עובד גם אופליין
- **🗺️ Google Maps Integration** - ניווט מתקדם
- **🌙 מצב לילה** - לנהיגה בטוחה
- **🔊 הוראות קוליות** - ניווט ללא ידיים

## 🚀 התחלה מהירה

### דרישות מקדימות

1. **Google Maps API Key** - נדרש מפתח API של Google Maps
2. **דפדפן מודרני** - Chrome, Firefox, Safari או Edge
3. **חיבור אינטרנט** - לטעינה ראשונית (אחר כך עובד אופליין)

### התקנה

1. **Clone the repository:**
```bash
git clone https://github.com/Gil100/AgtRoute.git
cd AgtRoute
```

2. **הגדר את מפתח Google Maps API:**
   - צור קובץ `config.js` בתיקיית השורש
   - הוסף את המפתח שלך:
```javascript
const GOOGLE_MAPS_API_KEY = 'YOUR_API_KEY_HERE';

if (typeof window !== 'undefined') {
  window.GOOGLE_MAPS_API_KEY = GOOGLE_MAPS_API_KEY;
}
```

3. **פתח את האפליקציה:**
   - פתח את `index.html` בדפדפן
   - או העלה לשרת ופתח דרך HTTPS

### 🌐 גרסה חיה

ניתן לראות את האפליקציה בפעולה: [https://gil100.github.io/AgtRoute/](https://gil100.github.io/AgtRoute/)

**הערה:** הגרסה החיה דורשת מפתח Google Maps API תקין בקובץ config.js

## 📱 שימוש

### ממשק ראשי

1. **בחירת יום** - לחץ על אחד מימי השבוע בראש המסך
2. **מפה אינטראקטיבית** - ראה את כל הלקוחות והמסלולים
3. **רשימת לקוחות** - גלול ברשימה המפורטת
4. **התחל מסלול** - לחץ על כפתור ההתחלה המרכזי

### תכונות מתקדמות

- **חיפוש לקוחות** - חפש לפי שם או כתובת
- **סינון לפי יום** - הצג רק לקוחות של יום מסוים
- **ייצוא נתונים** - הורד את הנתונים בפורמט JSON/CSV
- **מצב אופליין** - עובד גם ללא חיבור לאינטרנט

## 🏗️ ארכיטקטורה

### מבנה הפרויקט
```
AgtRoute/
├── index.html              # קובץ ראשי
├── config.js              # הגדרות (לא בגיט)
├── manifest.json          # PWA manifest
├── sw.js                  # Service Worker
├── assets/
│   ├── css/              # קבצי עיצוב
│   ├── js/               # קבצי JavaScript
│   ├── data/             # נתוני JSON
│   └── icons/            # אייקונים
└── docs/                 # תיעוד
```

### טכנולוגיות

- **Frontend:** Vanilla JavaScript ES6+
- **Maps:** Google Maps JavaScript API
- **PWA:** Service Worker + Web App Manifest
- **Styling:** CSS3 with CSS Variables
- **Data:** JSON (clients, routes, clusters)

## 📊 ביצועים

- **כיסוי:** 100% של 176 לקוחות
- **יעילות:** 3.02 לקוחות/שעה
- **ניצולת:** 97% מזמן העבודה
- **חיסכון:** 25.1% בעלויות תפעול

### MEGA CLUSTERS

| Cluster | לקוחות | מרחק | יעילות |
|---------|--------|-------|---------|
| מושב שרונה | 8 | 0.3 ק"מ | 3.9 |
| שדה אילן | 11 | 6.1 ק"מ | 3.4 |
| אחיהוד | 9 | 58.2 ק"מ | 2.1 |
| כפר יהושע | 8 | 48.4 ק"מ | 2.4 |

## 🔧 פיתוח

### הרצה לוקלית

1. השתמש בשרת HTTP פשוט:
```bash
# Python
python -m http.server 8000

# Node.js
npx http-server -p 8000

# PHP
php -S localhost:8000
```

2. פתח בדפדפן: `http://localhost:8000`

### בדיקת תקינות

הרץ את סקריפט הבדיקה:
```bash
node healthCheck.js
```

## 🐛 פתרון בעיות

### שגיאות נפוצות

1. **"Google Maps API error"**
   - וודא שיש לך מפתח API תקין
   - בדוק שהמפתח מוגדר ב-config.js
   - וודא שה-API מופעל ב-Google Cloud Console

2. **"Failed to load resource: config.js"**
   - צור את קובץ config.js עם המפתח שלך

3. **"Service Worker registration failed"**
   - וודא שאתה מריץ דרך HTTPS או localhost

## 🤝 תרומה

תרומות יתקבלו בברכה! אנא:

1. Fork את הפרויקט
2. צור branch חדש (`git checkout -b feature/AmazingFeature`)
3. Commit השינויים (`git commit -m 'Add some AmazingFeature'`)
4. Push ל-branch (`git push origin feature/AmazingFeature`)
5. פתח Pull Request

## 📄 רישיון

הפרויקט תחת רישיון MIT - ראה קובץ [LICENSE](LICENSE) לפרטים.

## 🙏 תודות

- **Logistic AI** - האלגוריתמים המתקדמים
- **Google Maps** - שירותי המפות
- **PWA** - יכולות אופליין

## 📞 יצירת קשר

- **GitHub:** [Gil100](https://github.com/Gil100)
- **Project Link:** [https://github.com/Gil100/AgtRoute](https://github.com/Gil100/AgtRoute)

---

<p align="center">
  Made with ❤️ for logistics optimization
</p>
