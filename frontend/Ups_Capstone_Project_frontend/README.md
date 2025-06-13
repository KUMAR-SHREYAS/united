# UPS Capstone Project

A React-based dashboard for uploading United Parcel Service (UPS) packaging labels (image or PDF), extracting metadata via OCR, and providing analytics and CSV export features.

## Features
- **Authentication**: Secure login page for users
- **File Upload**: Upload UPS label images or PDFs for OCR
- **OCR & Metadata Extraction**: Extract and display label metadata
- **Dashboard**: View uploaded files and extracted metadata
- **CSV Download**: Download metadata as CSV
- **Analytics**: Embedded Power BI dashboard for data analytics

## Project Structure
```
ups-capstone-project/
  src/
    components/
      LoginPage.jsx
      UploadPage.jsx
      DashboardPage.jsx
      AnalyticsPage.jsx
      ProtectedRoute.jsx
    utils/
      auth.js
      api.js
      csv.js
    App.jsx
    index.js
  public/
    index.html
  package.json
  README.md
```

## Getting Started
1. Clone the repo
2. Run `npm install`
3. Run `npm start` to launch the app

---

You can now proceed to add the code for each component as described in the plan. 