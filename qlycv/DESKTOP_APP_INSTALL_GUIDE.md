# 🖥️ GIS Desktop Application - Launch & Install Guide

## 📌 Quick Start

### Option 1: Tkinter Version (Recommended - No Extra Installation)

```bash
.\start_desktop_app.bat
```

This is the **lightweight version** that uses Python's built-in Tkinter library. No additional installations needed!

---

## 🎯 What You Get

A **professional desktop application** with:

✅ **Parks Management**

- View all parks in organized tables
- Search and filter by name/district
- Add, edit, delete parks
- CSV import/export

✅ **Trees Management**

- Complete tree inventory
- Filter by park
- View species, height, diameter, health status

✅ **Statistics Dashboard**

- System overview (total parks, trees, users)
- District breakdown
- Performance metrics
- Real-time data updates

✅ **Data Management**

- Import parks from CSV files
- Export data to CSV
- Backup database to JSON
- Data validation tools
- Cleanup old data

✅ **Professional UI**

- Clean, intuitive interface
- Multiple tabs for organization
- Responsive tables
- Search and filtering
- Color-coded status indicators

---

## 🚀 Installation & Running

### Windows

#### 1. Quick Launch (Easiest)

Simply double-click:

```
start_desktop_app.bat
```

#### 2. Manual Run

```bash
python gis_desktop_app_lite.py
```

### Linux/Mac

```bash
python gis_desktop_app_lite.py
```

---

## 📱 Application Interface

### Main Window Tabs

#### 🏞️ Parks Tab

- **Left Panel**: Search, filter by district, action buttons
- **Main Area**: Table showing all parks with details:
  - Park ID
  - Park Name
  - District
  - Type
  - Area (m²)
  - Rating (0-5)
  - Review Count
  - Status

**Commands**:

- ➕ **Add Park** - Create new park
- ✏️ **Edit** - Modify selected park
- 🗑️ **Delete** - Remove park
- 🔄 **Refresh** - Reload data
- 📤 **Export** - Save to CSV

#### 🌳 Trees Tab

- Filter by park
- View all trees with:
  - ID
  - Species
  - Park location
  - Height
  - Diameter
  - Status
  - Planted date

#### 📊 Statistics Tab

- **Dashboard Cards**:
  - Total Parks
  - Active Parks
  - Total Trees
  - Total Users
- **District Table**:
  - District name
  - Parks count
  - Trees count
  - Average rating

---

## 🎮 How to Use

### Adding a Park

1. Go to **Parks tab**
2. Click **➕ Add Park**
3. Fill in park details:
   - Park Name (required)
   - Code, Address, District
   - Park Type, Status
   - Area, Coordinates
   - Contact info
   - Description
   - Checkboxes: Open 24/7, Free Entry
4. Click **Save**

### Searching Parks

1. Type in the search box at top of Parks tab
2. Parks are filtered in real-time
3. Or use District dropdown to filter

### Editing Parks

1. Double-click on any park row
2. Or: Select park + click **✏️ Edit**
3. Modify any fields
4. Click **Save**

### Deleting Parks

1. Select park in table
2. Click **🗑️ Delete**
3. Confirm deletion

### Importing Parks

1. **File → Import Parks (CSV)**
2. Select your CSV file
3. System creates parks automatically

**CSV Format Required**:

```csv
code,name,district,address,area,green_area,manager,phone,email,year,description,coordinates,free_entry
```

Example:

```csv
PARK001,Beautiful Park,District 1,123 Main St,5000,2500,City Admin,0123456789,admin@park.com,2015,Nice park,"[21.03, 105.85]",true
```

### Exporting Data

1. Go to **Parks tab**
2. Click **📤 Export**
3. Choose save location
4. CSV file created with all parks

### Creating Backup

1. **File → Backup Database (JSON)**
2. Choose save location
3. JSON backup created with:
   - All parks data
   - All trees data
   - Timestamp
   - Metadata

### Data Validation

1. **Tools → Validate Data**
2. System checks for:
   - Missing coordinates
   - Invalid ratings
   - Data inconsistencies

---

## 🔧 File Descriptions

### Available Applications

1. **gis_desktop_app_lite.py** ⭐ (Recommended)
   - Lightweight Tkinter-based GUI
   - No external dependencies (uses built-in Tkinter)
   - Works immediately
   - Professional interface

2. **gis_desktop_app.py**
   - PyQt5-based version (more advanced)
   - Requires: `pip install PyQt5`
   - More features and polish

3. **gis_tool.py**
   - Command-line CLI tool
   - Run: `python gis_tool.py --help`

### Launch Scripts

- **start_desktop_app.bat** - Windows launcher for Tkinter app
- **run_desktop_app.bat** - Alternative launcher

---

## 💾 File Formats

### CSV Import Template

```csv
code,name,district,address,area,green_area,manager,phone,email,year,description,coordinates,free_entry
PARK001,Park One,Quận 1,123 Street,10000,5000,Manager A,0123456789,example@example.com,2015,Beautiful public park,"[10.777, 106.699]",true
PARK002,Park Two,Quận 2,456 Avenue,15000,8000,Manager B,0987654321,example2@example.com,2018,Waterfront park,"[10.803, 106.747]",true
```

**Important**:

- Coordinates must be in format: `[latitude, longitude]`
- Free entry must be: `true` or `false`
- CSV must be UTF-8 encoded

### JSON Backup Format

```json
{
  "timestamp": "2026-03-05T10:30:00.000000",
  "parks": [
    {
      "id": 1,
      "name": "Park Name",
      "code": "PARK001",
      "coordinates": [10.777, 106.699]
    }
  ],
  "trees": [
    {
      "id": 1,
      "park_id": 1
    }
  ]
}
```

---

## 🎯 Common Tasks

### Task: Import 50 Parks

1. Prepare CSV file with parks
2. **File → Import Parks (CSV)**
3. Select file
4. System creates all parks
5. Go to Parks tab to verify

### Task: Find Parks in District

1. Go to Parks tab
2. Click District dropdown
3. Select your district
4. Table filters automatically

### Task: Create Backup Before Changes

1. **File → Backup Database**
2. Save to safe location
3. Proceed with changes
4. Can restore later if needed

### Task: Generate Report

1. Go to **Statistics tab**
2. View all metrics
3. **Export Parks** to CSV
4. Open in Excel for detailed reports

---

## ⚙️ Configuration

### Database Setup

The app uses Django's configured database. Ensure:

```bash
python manage.py migrate
```

### User Roles

Access controlled through Django admin:

- Admin - Full access
- Manager - Park management
- Viewer - Read-only

---

## 🐛 Troubleshooting

### App Won't Start

**Problem**: "ModuleNotFoundError: No module named 'tkinter'"

**Solution**: Tkinter usually comes with Python. Try:

```bash
# Windows
python -m pip install tk

# Linux (Ubuntu/Debian)
sudo apt-get install python3-tk

# macOS
brew install python-tk
```

### Database Connection Error

**Problem**: "cannot open database file"

**Solution**:

1. Ensure Django is configured
2. Run: `python manage.py migrate`
3. Restart app

### Empty Tables

**Problem**: Tables show no data

**Solution**:

1. Add test data through Django admin
2. Or import parks via CSV
3. Click **🔄 Refresh** button

### Import Fails

**Problem**: CSV import error

**Solution**:

1. Check CSV format matches template
2. Ensure coordinates format: `[lat, lng]`
3. Check file encoding is UTF-8
4. Verify required columns exist

---

## 📊 System Requirements

- **OS**: Windows 7+, macOS 10.12+, Linux
- **Python**: 3.8+
- **RAM**: 512MB minimum
- **Storage**: 100MB
- **Display**: 1024x768 minimum

---

## 🌟 Features Summary

| Feature          | Tkinter (Lite) | PyQt5        |
| ---------------- | -------------- | ------------ |
| Parks Management | ✅             | ✅           |
| Trees Viewing    | ✅             | ✅           |
| Statistics       | ✅             | ✅           |
| Import/Export    | ✅             | ✅           |
| Backup/Restore   | ✅             | ✅           |
| Professional UI  | ✅             | ✅✅         |
| Charts           | ⏳             | ✅           |
| Lightweight      | ✅✅           | ✅           |
| Installation     | Easy           | Requires pip |

**Recommended**: Start with **Tkinter version** for quick setup!

---

## 📚 Documentation

- **DESKTOP_APP_GUIDE.md** - Complete user guide
- **GIS_TOOL_README.md** - CLI tool documentation
- **GIS_TOOL_QUICKREF.md** - Quick command reference

---

## 🎓 Advanced Usage

### Custom CSV Import

Use the sample template in `sample_parks_data.csv`:

```bash
File → Import Parks (CSV) → Select sample_parks_data.csv
```

### Data Analysis in Excel

1. **File → Export Parks (CSV)**
2. Open in Excel
3. Create pivot tables
4. Generate charts
5. Perform analysis

### Regular Maintenance

**Weekly**:

```bash
Tools → Validate Data
```

**Monthly**:

```bash
File → Backup Database (JSON)
```

**Quarterly**:

```bash
Tools → Validate Data
Tools → Cleanup Old Data
```

---

## 📞 Support

### Getting Help

1. Hover over buttons for tooltips
2. Check menu options
3. Read documentation
4. Check error messages for hints

### Common Questions

**Q: Can I use this on Mac/Linux?**
A: Yes! Use: `python gis_desktop_app_lite.py`

**Q: How do I backup my data?**
A: File → Backup Database (JSON)

**Q: Can multiple users use it?**
A: Yes, it shares the Django database

**Q: How large can datasets be?**
A: Works with 1000+ parks, limited by available RAM

---

## 🎉 Getting Started

1. **Run the app**:

   ```bash
   .\start_desktop_app.bat
   ```

2. **Check your data**:
   - Go to Parks tab
   - Statistics tab shows overview

3. **Add/Edit parks**:
   - ➕ Add Park or ✏️ Edit button
   - Fill in details
   - Save

4. **Import bulk data**:
   - Prepare CSV file
   - File → Import Parks
   - Select file

5. **Create backup**:
   - File → Backup Database
   - Save JSON file

---

## Version Info

- **Version**: 1.0.0
- **Built with**: Python 3.8+, Django 4.1+, Tkinter
- **Last Updated**: March 2026
- **Status**: Production Ready ✅

---

**🚀 Ready to manage your parks!**

Choose one launcher:

- **Windows**: `.\start_desktop_app.bat`
- **Linux/Mac**: `python gis_desktop_app_lite.py`
