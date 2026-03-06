# GIS Desktop Application - Complete User Guide

## 🖥️ Professional Desktop Application

A fully-featured PyQt5 desktop application for managing parks, trees, and geographic data with an intuitive graphical interface.

---

## ✨ Features

### 🏞️ Parks Management

- **List View** - View all parks in an organized table
- **Search & Filter** - Search by name, filter by district
- **Add Parks** - Create new parks with full details
- **Edit Parks** - Modify park information
- **Delete Parks** - Remove parks from system
- **Export** - Export parks to CSV format
- **Bulk Import** - Import parks from CSV files

### 🌳 Trees Management

- **Tree Inventory** - View all trees with details
- **Filter by Park** - See trees in specific park
- **Tree Details** - Species, height, diameter, status, planting date
- **Statistics** - Tree distribution by species

### 📊 Statistics Dashboard

- **System Overview** - Total parks, trees, users
- **District Analysis** - Parks and trees per district
- **Performance Metrics** - Average ratings by district
- **Real-time Updates** - Live data refresh

### 💾 Data Management

- **Import CSV** - Bulk import parks data
- **Export CSV** - Export parks to spreadsheet
- **JSON Backup** - Create database backups
- **Data Validation** - Check data integrity
- **Cleanup Tools** - Remove old/outdated data

### 🎨 User Interface

- **Modern Design** - Clean, professional interface
- **Tabbed Navigation** - Easy access to features
- **Color-coded** - Status and importance indicators
- **Responsive** - Works on different screen sizes
- **Keyboard Shortcuts** - Fast navigation

---

## 🚀 Installation

### 1. Install Python Dependencies

```bash
# Install PyQt5 for GUI
pip install PyQt5

# Or install all dependencies
pip install -r requirements_full.txt
```

### 2. Ensure Django Setup

Make sure your Django project is properly configured:

```bash
python manage.py migrate
```

---

## ▶️ Running the Application

### Windows

```bash
# Simple launcher
.\run_desktop_app.bat

# Or run directly
python gis_desktop_app.py
```

### Linux/Mac

```bash
python gis_desktop_app.py
```

---

## 📖 User Guide

### Main Window Overview

The application opens with three main tabs:

#### 1️⃣ Parks Tab (🏞️)

**Search & Filter**

- Type in the search box to find parks by name
- Use district dropdown to filter by location
- Refresh button to reload data

**Available Actions**

- **➕ Add Park** - Create a new park
- **✏️ Edit** - Modify selected park
- **🗑️ Delete** - Remove selected park
- **🔄 Refresh** - Reload data from database
- **📤 Export** - Save parks to CSV file

**Park Information Displayed**

- Park ID
- Park Name
- District
- Park Type
- Total Area (m²)
- Rating (0-5.0)
- Number of Reviews
- Status (Active, Closed, etc.)

#### 2️⃣ Trees Tab (🌳)

**Filter By Park**

- Select park from dropdown to view its trees
- "All Parks" to see all trees in system

**Tree Information**

- Tree ID
- Species Name
- Park Location
- Height (meters)
- Diameter (centimeters)
- Health Status
- Planting Date

#### 3️⃣ Statistics Tab (📊)

**Dashboard Cards**
-📊 Total Parks - Count of all parks

- ✅ Active Parks - Currently operating parks
- 🌳 Total Trees - All trees in system
- 👥 Users - Registered users

**District Analysis Table**

- District Name
- Number of Parks
- Number of Trees
- Average Rating

---

## 🎯 Common Tasks

### Add a New Park

1. Click **Parks** tab
2. Click **➕ Add Park** button
3. Fill in park details:
   - Park Name (required)
   - Code (optional)
   - Address
   - District
   - Park Type
   - Area in m²
   - Coordinates (Latitude/Longitude)
   - Contact phone & email
   - Manager information
   - Open 24/7 checkbox
   - Free Entry checkbox
4. Click **Save**

### Search for Parks

1. Go to **Parks** tab
2. Type park name in search box
3. Matching parks appear in table
4. Or use district filter dropdown

### View Park Details

1. Select park in table
2. Double-click to edit
3. Or right-click for menu options

### Export Parks Data

1. Go to **Parks** tab
2. Click **📤 Export** button
3. Choose location and filename
4. CSV file is created with all parks

### Import Parks from CSV

**File Format Required:**

```csv
code,name,district,address,area,green_area,manager,phone,email,year,description,coordinates,free_entry
PARK001,Park Name,District,123 Street,10000,5000,Manager,0123456789,email@example.com,2010,Description,"[21.03, 105.85]",true
```

**Steps:**

1. Use **File → Import Parks (CSV)**
2. Select your CSV file
3. System creates parks from file
4. Check statistics to verify import

### Create Database Backup

1. Click **File → Backup Database (JSON)**
2. Choose save location
3. JSON file contains:
   - All parks with coordinates and area
   - All trees with species and location
   - Timestamp of backup
   - Metadata

### Validate Data

1. Click **Tools → Validate Data**
2. System checks for:
   - Missing coordinates
   - Invalid ratings
   - Data consistency
3. Results shown with errors (❌) and warnings (⚠️)

### Clean Up Old Data

1. Click **Tools → Cleanup Old Data**
2. Enter number of days (default: 30)
3. Ratings older than this are deleted
4. Confirmation shown

---

## 🎨 Interface Elements

### Buttons & Colors

- **Green Buttons** - Actions (Add, Edit, Save)
- **Blue Buttons** - Utility (Refresh, Export)
- **Red Buttons** - Destructive (Delete)
- **Gray Buttons** - Cancel/Close

### Table Colors

- **White** - Standard data rows
- **Light Gray** - Selected row
- **Green Header** - Column names

### Status Indicators

- ✅ Success - Green checkmark
- ❌ Error - Red X
- ⚠️ Warning - Yellow warning sign
- ℹ️ Info - Blue info icon

---

## 📊 Data Fields by Section

### Park Information

**Basic Fields**

- Name (required)
- Code (unique identifier)
- Address
- District (Quận/Huyện)
- Park Type (Loại công viên)

**Geographic**

- Latitude (-90 to 90)
- Longitude (-180 to 180)
- Total Area (m²)
- Green Space Area (m²)
- Water Area (m²)

**Operational**

- Manager Organization
- Phone Number
- Email Address
- Open 24/7 (checkbox)
- Free Entry (checkbox)
- Established Year

**System Status**

- Overall Rating (0-5)
- Number of Reviews
- Verification Status
- Last Updated

### Trees Information

- Species Name
- Park Location
- Height (meters)
- Diameter (centimeters)
- Crown Radius (meters)
- Health Status (Good/Fair/Poor/Dead)
- Last Pruning Date
- Planting Date

### Statistics

All displayed in real-time dashboard with:

- System totals
- District breakdown
- Performance metrics

---

## ⚙️ Settings & Configuration

### Database Configuration

The app uses Django's configured database:

- PostgreSQL (recommended)
- SQLite (default)
- MySQL (supported)

Configuration in `settings.py`

### User Roles

The system supports different user roles:

- **Admin** - Full access
- **Manager** - Park management
- **Viewer** - Read-only access

### Permissions

Managed through Django's admin interface at `/admin/`

---

## 🔒 Data Safety

### Features

- **Confirmation Dialogs** - Before delete operations
- **Backup Support** - Regular backups available
- **Data Validation** - Prevents invalid entries
- **Error Handling** - Graceful error recovery

### Best Practices

1. **Regular Backups**

   ```bash
   File → Backup Database (JSON)
   ```

2. **Validate Periodically**

   ```bash
   Tools → Validate Data
   ```

3. **Archive Old Data**
   ```bash
   Tools → Cleanup Old Data
   ```

---

## 🐛 Troubleshooting

### Application Won't Start

**Problem**: "ModuleNotFoundError: No module named 'PyQt5'"

**Solution**:

```bash
pip install PyQt5 -q
```

**Problem**: Django configuration error

**Solution**:

1. Check `settings.py` exists
2. Run: `python manage.py migrate`
3. Restart application

### Data Not Loading

**Problem**: Tables are empty

**Solution**:

1. Click **🔄 Refresh** button
2. Check database connection
3. Ensure data exists in database

### Slow Performance

**Problem**: Application responds slowly

**Solution**:

1. Close other applications
2. Clear old data: `Tools → Cleanup Old Data`
3. Validate data integrity
4. Restart application

### Import Errors

**Problem**: CSV import fails

**Solution**:

1. Check CSV format (see template above)
2. Verify all required columns present
3. Check for encoding: UTF-8 required
4. Validate coordinates format: [lat, lng]

---

## 📊 Reports & Analysis

### Available Reports

1. **System Overview**
   - Quick metrics dashboard
   - District summary

2. **Park Analysis**
   - Top-rated parks
   - Largest parks by area
   - Parks by status
   - Parks by district

3. **Tree Statistics**
   - Trees per park
   - Species distribution
   - Health status breakdown

---

## 🎓 Advanced Usage

### Batch Operations

**Import Multiple Files**

1. File → Import Parks (CSV)
2. Select first file
3. Repeat for additional files
4. System merges without duplicates

**Export for Analysis**

1. Go to Parks tab
2. Export → Save as parks.csv
3. Open in Excel/LibreOffice
4. Perform pivot tables and analysis

### Custom Filtering

Click any column header to:

- Sort ascending/descending
- Hide/show columns
- Resize columns
- Freeze header row

### Keyboard Shortcuts

| Shortcut | Action               |
| -------- | -------------------- |
| F5       | Refresh all data     |
| Ctrl+A   | Add new park         |
| Ctrl+E   | Export data          |
| Ctrl+B   | Create backup        |
| Del      | Delete selected item |
| Esc      | Cancel dialog        |

---

## 📞 Support

### Getting Help

1. **Hover over buttons** - Tooltips show descriptions
2. **Right-click on items** - Context menu options
3. **Check status bar** - Messages at bottom

### Common Questions

**Q: How do I edit park coordinates?**
A: Edit → Select park → Modify Latitude/Longitude

**Q: Can I import parks without all fields?**
A: Yes, optional fields can be empty

**Q: How large can backup files be?**
A: Limited by available disk space, typically <100MB for normal datasets

**Q: Can multiple users use the app?**
A: Yes, it uses shared database, but not concurrent editing

---

## 🔄 Updates & Maintenance

### Regular Tasks

**Daily**

- Check inbound user reviews
- Monitor park conditions

**Weekly**

- Validate data integrity
- Check tree health reports
- Review park statistics

**Monthly**

- Create backup: File → Backup Database
- Cleanup old data: Tools → Cleanup
- Generate district reports

**Quarterly**

- Full database validation
- Performance optimization
- Feature updates

---

## 📝 Tips & Tricks

✅ **Tip 1**: Use CSV import for bulk operations
✅ **Tip 2**: Create backups before major changes
✅ **Tip 3**: Validate data after imports
✅ **Tip 4**: Use the Statistics tab for quick overview
✅ **Tip 5**: Export regularly for external analysis
✅ **Tip 6**: Keep search box clear to see all parks

---

## 📋 System Requirements

- **OS**: Windows 7+, macOS 10.12+, Linux
- **Python**: 3.8+
- **RAM**: 512MB minimum (1GB recommended)
- **Storage**: 100MB for application + database
- **Display**: 1024x768 minimum (1920x1080 recommended)

---

## Version Info

- **Application**: GIS Desktop App v1.0
- **Built with**: PyQt5 5.15+
- **Django Version**: 4.1+
- **Last Updated**: March 2026

---

## License & Attribution

Created for GIS course assignment
© 2026 - All rights reserved

---

## 🌟 Feature Highlights

✨ **Modern PyQt5 Interface**
✨ **Real-time Data Sync**
✨ **Advanced Search & Filter**
✨ **Comprehensive Reporting**
✨ **Easy Backup & Recovery**
✨ **Batch Operations**
✨ **Professional Design**

---

**Ready to manage your parks like a pro!** 🚀
