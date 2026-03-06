# 🌳 GIS Park Management Tool

**Công cụ quản lý công viên GIS** - A comprehensive command-line tool for managing parks, trees, and geographic data.

## Features

### 🏞️ Parks Management

- **List parks** with filtering by district and status
- **View detailed** park information
- **Import parks** from CSV files
- **Export parks** to CSV, JSON, or GeoJSON formats

### 🌳 Trees Management

- **Track trees** in parks with detailed attributes
- **View tree statistics** by species and status
- **Monitor tree health** and maintenance

### 🗺️ Geographic Analysis

- **Find nearby parks** based on GPS coordinates
- **Calculate distances** between parks
- **Geographic queries** and spatial analysis

### 📊 Statistics & Reports

- **System overview** with key metrics
- **Top-rated parks** ranking
- **District-by-district analysis**
- **Comprehensive reporting** tools

### 💾 Data Management

- **Data validation** and integrity checks
- **Backup** and restore functionality
- **Data cleanup** utilities
- **Bulk operations**

---

## Installation

### 1. Prerequisites

- Python 3.8+
- Django project installed
- PostgreSQL/SQLite database configured

### 2. Install Required Packages

Add to your `requirements.txt`:

```
click>=8.0.0
tabulate>=0.9.0
```

Or install directly:

```bash
pip install click tabulate
```

### 3. Make the Tool Executable (Linux/Mac)

```bash
chmod +x gis_tool.py
```

---

## Usage

### General Command Structure

```bash
python gis_tool.py [COMMAND] [SUBCOMMAND] [OPTIONS]
```

### Quick Start

#### 1️⃣ Check System Status

```bash
python gis_tool.py utils check-db
```

#### 2️⃣ List All Parks

```bash
python gis_tool.py parks list
```

#### 3️⃣ View Park Details

```bash
python gis_tool.py parks detail 1
```

#### 4️⃣ Find Parks Near Your Location

```bash
python gis_tool.py geo nearby --latitude 21.0285 --longitude 105.8542 --radius 5
```

#### 5️⃣ View System Statistics

```bash
python gis_tool.py stats overview
```

---

## Command Reference

### 🏞️ PARKS Management

#### List Parks

```bash
python gis_tool.py parks list [OPTIONS]

Options:
  -d, --district TEXT          Filter by district name
  -s, --status TEXT            Filter by status (hoat_dong, tam_dong, etc.)
  -l, --limit INTEGER          Number of parks to display (default: 10)
  -o, --output [table|json]    Output format
```

**Examples:**

```bash
# List first 20 parks in table format
python gis_tool.py parks list --limit 20

# List active parks in Binh Thanh district
python gis_tool.py parks list --district "Binh Thanh" --status hoat_dong

# Export as JSON
python gis_tool.py parks list --output json --limit 100
```

#### View Park Details

```bash
python gis_tool.py parks detail PARK_ID
```

**Example:**

```bash
python gis_tool.py parks detail 1
```

#### Import Parks from CSV

```bash
python gis_tool.py parks import-csv FILE_PATH [OPTIONS]

Options:
  --update    Update existing parks instead of skipping
```

**CSV Format Required:**

```csv
code,name,district,address,area,green_area,manager,phone,email,year,description,coordinates,free_entry
PARK001,Park Name,District Name,Address,10000,5000,Manager,0123456789,email@example.com,2010,Description,"[21.0285, 105.8542]",true
```

**Example:**

```bash
python gis_tool.py parks import-csv parks_data.csv
python gis_tool.py parks import-csv parks_data.csv --update
```

#### Export Parks Data

```bash
python gis_tool.py parks export OUTPUT_FILE [OPTIONS]

Options:
  -f, --format [csv|geojson|json]   Output format
  -d, --district TEXT                Filter by district
```

**Examples:**

```bash
# Export all parks to CSV
python gis_tool.py parks export parks_export.csv --format csv

# Export to GeoJSON for mapping
python gis_tool.py parks export parks_map.geojson --format geojson

# Export specific district
python gis_tool.py parks export binh_thanh_parks.csv --district "Binh Thanh"
```

---

### 🌳 TREES Management

#### List Trees

```bash
python gis_tool.py trees list [OPTIONS]

Options:
  -p, --park-id INTEGER    Filter by park ID
  -s, --species TEXT       Filter by species name
  -l, --limit INTEGER      Number of trees to display
```

**Examples:**

```bash
# List first 20 trees
python gis_tool.py trees list --limit 20

# List trees in park ID 1
python gis_tool.py trees list --park-id 1

# Find all pine trees
python gis_tool.py trees list --species "Thông"
```

#### View Tree Details

```bash
python gis_tool.py trees detail TREE_ID
```

**Example:**

```bash
python gis_tool.py trees detail 1
```

#### Tree Statistics for a Park

```bash
python gis_tool.py trees stats PARK_ID
```

**Example:**

```bash
python gis_tool.py trees stats 1
```

---

### 🗺️ GEOGRAPHIC Analysis

#### Find Nearby Parks

```bash
python gis_tool.py geo nearby OPTIONS

Options:
  -lat, --latitude FLOAT    Latitude (required)
  -lng, --longitude FLOAT   Longitude (required)
  -r, --radius FLOAT        Search radius in kilometers (default: 5)
  -l, --limit INTEGER       Number of results (default: 10)
```

**Examples:**

```bash
# Find parks within 5km
python gis_tool.py geo nearby --latitude 21.0285 --longitude 105.8542

# Find parks within 10km, show top 15
python gis_tool.py geo nearby --latitude 21.0285 --longitude 105.8542 --radius 10 --limit 15
```

#### Distance Between Parks

```bash
python gis_tool.py geo distance PARK_ID [OPTIONS]

Options:
  -w, --within FLOAT    Find parks within X km
```

**Example:**

```bash
# Find parks within 2km of park ID 1
python gis_tool.py geo distance 1 --within 2
```

---

### 📊 STATISTICS & Reports

#### System Overview

```bash
python gis_tool.py stats overview
```

Shows:

- Total parks
- Active parks
- Total trees
- Registered users
- Average ratings
- Parks by district breakdown

#### Top Parks

```bash
python gis_tool.py stats top-parks [OPTIONS]

Options:
  -l, --limit INTEGER                  Top N parks (default: 10)
  -s, --sort [rating|reviews|area]    Sort by (default: rating)
```

**Examples:**

```bash
# Top 5 parks by rating
python gis_tool.py stats top-parks --limit 5 --sort rating

# Top 10 parks by review count
python gis_tool.py stats top-parks --limit 10 --sort reviews

# Largest parks by area
python gis_tool.py stats top-parks --limit 20 --sort area
```

#### District Report

```bash
python gis_tool.py stats district-report
```

Shows statistics for each district:

- Number of parks
- Number of trees
- Average rating
- Total park area

---

### 💾 DATA Management

#### Validate Data Integrity

```bash
python gis_tool.py data validate
```

Checks for:

- Missing coordinates
- Invalid ratings
- Missing names
- Area inconsistencies

#### Cleanup Old Data

```bash
python gis_tool.py data cleanup [OPTIONS]

Options:
  -d, --days INTEGER    Days to keep (default: 30)
```

**Example:**

```bash
# Delete ratings older than 60 days
python gis_tool.py data cleanup --days 60
```

#### Create Backup

```bash
python gis_tool.py data backup OUTPUT_FILE
```

**Example:**

```bash
python gis_tool.py data backup backup_2024_01_15.json
```

Backups include:

- All parks data
- All trees data
- All ratings data
- Timestamp and metadata

---

### 🔧 UTILITIES

#### Check Database Connection

```bash
python gis_tool.py utils check-db
```

#### Rename a Park

```bash
python gis_tool.py utils rename PARK_ID NEW_NAME
```

**Example:**

```bash
python gis_tool.py utils rename 1 "Tao Duc Park"
```

#### Set Park Coordinates

```bash
python gis_tool.py utils set-coords PARK_ID LATITUDE LONGITUDE
```

**Example:**

```bash
python gis_tool.py utils set-coords 1 21.0285 105.8542
```

#### Show Available Models

```bash
python gis_tool.py utils help-models
```

---

## Examples

### 📝 Complete Workflow Example

#### 1. Import parks from CSV

```bash
python gis_tool.py parks import-csv parks_data.csv
```

#### 2. Validate imported data

```bash
python gis_tool.py data validate
```

#### 3. View import statistics

```bash
python gis_tool.py stats overview
```

#### 4. Export to GeoJSON for visualization

```bash
python gis_tool.py parks export parks_map.geojson --format geojson
```

#### 5. Create backup

```bash
python gis_tool.py data backup backup_$(date +%Y%m%d).json
```

---

### 🗺️ Location-Based Analysis

#### Find parks near a location

```bash
python gis_tool.py geo nearby --latitude 21.0285 --longitude 105.8542 --radius 3
```

#### Calculate distances from a specific park

```bash
python gis_tool.py geo distance 1 --within 5
```

#### View tree distribution in a park

```bash
python gis_tool.py trees stats 1
```

---

### 📊 Generate Reports

#### Get system overview

```bash
python gis_tool.py stats overview
```

#### Find highest-rated parks

```bash
python gis_tool.py stats top-parks --limit 10 --sort rating
```

#### Get district breakdown

```bash
python gis_tool.py stats district-report
```

---

## Troubleshooting

### Database Connection Issues

```bash
python gis_tool.py utils check-db
```

This will test the database connection and show data counts.

### Permission Denied (Linux/Mac)

```bash
chmod +x gis_tool.py
```

### Module Not Found

Ensure all dependencies are installed:

```bash
pip install -r requirements.txt
pip install click tabulate
```

### Django Settings Error

Make sure you're running the tool from the project root directory where `settings.py` is located.

---

## File Formats

### CSV Import Format

Fields required for park import:

- `code`: Unique park code
- `name`: Park name
- `district`: District name
- `address`: Physical address
- `area`: Total area in m²
- `green_area`: Green space area in m²
- `manager`: Managing organization
- `phone`: Contact phone (optional)
- `email`: Contact email (optional)
- `year`: Establishment year (optional)
- `description`: Park description (optional)
- `coordinates`: [latitude, longitude] format
- `free_entry`: true/false

### GeoJSON Output

Features include:

- Geometry: Point with coordinates
- Properties: name, district, address, area, rating, status

### Backup Format

JSON with structure:

```json
{
  "timestamp": "ISO timestamp",
  "parks": [...],
  "trees": [...],
  "ratings": [...],
  "metadata": {...}
}
```

---

## Tips & Best Practices

1. **Regular Backups**: Create regular backups before bulk operations

```bash
python gis_tool.py data backup backup_$(date +%Y%m%d_%H%M%S).json
```

2. **Validate Before Import**: Always validate data format before importing

```bash
python gis_tool.py data validate
```

3. **Use Filtering**: Use district and status filters for large datasets

```bash
python gis_tool.py parks list --district "Binh Thanh" --limit 50
```

4. **Export for Analysis**: Export to CSV or GeoJSON for further analysis

```bash
python gis_tool.py parks export analysis.csv --format csv
```

5. **Regular Cleanup**: Clean up old data periodically

```bash
python gis_tool.py data cleanup --days 90
```

---

## Support & Documentation

For more information about the models and database structure, see [POSTGRESQL_FUNCTIONS.md](POSTGRESQL_FUNCTIONS.md)

---

## Version

**v1.0.0** - 2026

Developed for GIS park management system
