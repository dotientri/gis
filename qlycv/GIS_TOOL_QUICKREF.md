# GIS Tool - Quick Reference Guide

## 🚀 Getting Started

### 1. Installation

```bash
# Windows
setup_tool.bat

# Linux/Mac
chmod +x setup_tool.sh
./setup_tool.sh
```

### 2. First Command

```bash
python gis_tool.py --help
```

---

## 📋 Most Common Commands

### Check System Status

```bash
python gis_tool.py utils check-db
```

### List Parks

```bash
python gis_tool.py parks list --limit 10
```

### Find Parks Near Me

```bash
python gis_tool.py geo nearby --latitude 21.0285 --longitude 105.8542 --radius 5
```

### View Statistics

```bash
python gis_tool.py stats overview
```

### Import Parks

```bash
python gis_tool.py parks import-csv sample_parks_data.csv
```

### Export Data

```bash
python gis_tool.py parks export parks.csv --format csv
python gis_tool.py parks export parks.geojson --format geojson
```

---

## 🌳 Park Management

| Command                   | Purpose                    |
| ------------------------- | -------------------------- |
| `parks list`              | List all parks             |
| `parks detail <ID>`       | Show park details          |
| `parks import-csv <FILE>` | Import from CSV            |
| `parks export <FILE>`     | Export to CSV/JSON/GeoJSON |

---

## 🌍 Geographic Analysis

| Command             | Purpose                      |
| ------------------- | ---------------------------- |
| `geo nearby`        | Find parks near coordinates  |
| `geo distance <ID>` | Find distance to other parks |

---

## 📊 Statistics

| Command                 | Purpose            |
| ----------------------- | ------------------ |
| `stats overview`        | System overview    |
| `stats top-parks`       | Top rated parks    |
| `stats district-report` | District breakdown |

---

## 💾 Data Management

| Command              | Purpose              |
| -------------------- | -------------------- |
| `data validate`      | Check data integrity |
| `data backup <FILE>` | Create backup        |
| `data cleanup`       | Clean old data       |

---

## 🔧 Utilities

| Command             | Purpose                  |
| ------------------- | ------------------------ |
| `utils check-db`    | Test database connection |
| `utils rename`      | Rename a park            |
| `utils set-coords`  | Set park coordinates     |
| `utils help-models` | Show data models         |

---

## 📝 CSV Import Format

Park CSV must have these columns:

- `code` - Unique park code
- `name` - Park name
- `district` - District name
- `address` - Physical address
- `area` - Total area (m²)
- `green_area` - Green area (m²)
- `manager` - Managing organization
- `phone` - Contact phone (optional)
- `email` - Email (optional)
- `year` - Establishment year (optional)
- `description` - Description (optional)
- `coordinates` - [latitude, longitude]
- `free_entry` - true/false

See `sample_parks_data.csv` for example format.

---

## 🎯 Useful Workflows

### Import and Validate

```bash
# 1. Import parks
python gis_tool.py parks import-csv parks_data.csv

# 2. Validate the data
python gis_tool.py data validate

# 3. View statistics
python gis_tool.py stats overview
```

### Backup Before Changes

```bash
# Create timestamped backup
python gis_tool.py data backup "backup_$(date +\%Y\%m\%d).json"
```

### Geographic Analysis

```bash
# Find parks near a location
python gis_tool.py geo nearby --latitude 21.0285 --longitude 105.8542

# Get distance info from a specific park
python gis_tool.py geo distance 1 --within 3
```

### Generate Reports

```bash
# System overview
python gis_tool.py stats overview

# Top 10 parks by rating
python gis_tool.py stats top-parks --limit 10 --sort rating

# District analysis
python gis_tool.py stats district-report
```

---

## ⌨️ Examples by Use Case

### 👤 Admin: Daily Check

```bash
python gis_tool.py utils check-db
python gis_tool.py stats overview
python gis_tool.py data validate
```

### 📊 Data Analyst: Export for Analysis

```bash
python gis_tool.py parks export parks.csv --format csv
python gis_tool.py parks export parks.geojson --format geojson
python gis_tool.py stats district-report
```

### 🗺️ GIS Specialist: Geographic Analysis

```bash
python gis_tool.py geo nearby --latitude 21.0285 --longitude 105.8542
python gis_tool.py geo distance 5 --within 2
python gis_tool.py trees stats 1
```

### 🌳 Park Manager: Park Information

```bash
python gis_tool.py parks detail 1
python gis_tool.py trees list --park-id 1
python gis_tool.py parks list --district "Binh Thanh"
```

---

## 🐛 Troubleshooting

**Python not found**

- Install Python 3.8+ from python.org
- Add Python to PATH

**Module not found errors**

- Run: `pip install click tabulate`
- Reinstall: `pip install -r requirements.txt`

**Database connection error**

- Ensure Django is properly configured
- Check: `python manage.py migrate`
- Test: `python gis_tool.py utils check-db`

**Permission denied (Linux/Mac)**

- Run: `chmod +x gis_tool.py`

---

## 📚 For More Information

- Full documentation: [GIS_TOOL_README.md](GIS_TOOL_README.md)
- Sample data: [sample_parks_data.csv](sample_parks_data.csv)
- Database functions: [POSTGRESQL_FUNCTIONS.md](POSTGRESQL_FUNCTIONS.md)

---

## 💡 Tips

✅ Always backup before bulk operations

```bash
python gis_tool.py data backup backup_$(date +%Y%m%d).json
```

✅ Use filtering for large datasets

```bash
python gis_tool.py parks list --district "Binh Thanh" --limit 20
```

✅ Validate data after import

```bash
python gis_tool.py data validate
```

✅ Export for external analysis

```bash
python gis_tool.py parks export analysis.csv --format csv
```

✅ Regular maintenance

```bash
python gis_tool.py data cleanup --days 90
python gis_tool.py data validate
```

---

## Version Info

**GIS Tool v1.0.0**

- Last Updated: 2026
- Compatible with: Python 3.8+, Django 4.1+
