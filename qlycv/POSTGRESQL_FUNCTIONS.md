# PostgreSQL Functions Reference

This document contains the exact PostgreSQL function definitions created in the database.

## Function 1: `tim_cong_vien_gan_nhat()`

```sql
CREATE OR REPLACE FUNCTION tim_cong_vien_gan_nhat(
    vi_do FLOAT,
    kinh_do FLOAT,
    ban_kinh_km FLOAT DEFAULT 10
) RETURNS TABLE (
    id BIGINT,
    ten VARCHAR,
    mo_ta TEXT,
    dien_tich FLOAT,
    diem_danh_gia FLOAT,
    tong_danh_gia INT,
    khoang_cach_km FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cv.id,
        cv.ten,
        cv.mo_ta,
        cv.dien_tich,
        cv.diem_danh_gia,
        cv.tong_danh_gia,
        (ST_Distance(
            cv.dia_diem::geography,
            ST_Point(kinh_do, vi_do)::geography
        ) / 1000)::FLOAT AS khoang_cach_km
    FROM cong_vien cv
    WHERE
        cv.trang_thai = TRUE
        AND ST_DWithin(
            cv.dia_diem::geography,
            ST_Point(kinh_do, vi_do)::geography,
            ban_kinh_km * 1000
        )
    ORDER BY khoang_cach_km ASC;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### Function Details

**Purpose:** Find parks within a search radius, sorted by distance

**Parameters:**

- `vi_do FLOAT`: Latitude (North/South coordinate)
- `kinh_do FLOAT`: Longitude (East/West coordinate)
- `ban_kinh_km FLOAT`: Search radius in kilometers (defaults to 10)

**Return Columns:**

- `id`: Park ID
- `ten`: Park name
- `mo_ta`: Park description
- `dien_tich`: Park area (km²)
- `diem_danh_gia`: Average rating
- `tong_danh_gia`: Total approved ratings
- `khoang_cach_km`: Distance from search point (kilometers)

**Key Features:**

- Uses `ST_DWithin()` to filter parks within radius
- Uses `ST_Distance()` to calculate exact distance
- Converts distance from meters to kilometers (`/ 1000`)
- Uses `geography` type for accurate Earth surface calculations
- `IMMUTABLE` flag indicates function always returns same result for same inputs
- Results sorted by distance (closest first)
- Only includes active parks (`trang_thai = TRUE`)

**Example:**

```sql
SELECT * FROM tim_cong_vien_gan_nhat(21.0285, 105.8542, 5);
```

---

## Function 2: `cap_nhat_diem_danh_gia()`

```sql
CREATE OR REPLACE FUNCTION cap_nhat_diem_danh_gia()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE cong_vien
    SET
        diem_danh_gia = COALESCE(
            (SELECT AVG(dg.diem)::FLOAT
             FROM danh_gia dg
             WHERE dg.cong_vien_id = NEW.cong_vien_id
             AND dg.duyet_cap = TRUE),
            0.0
        ),
        tong_danh_gia = (
            SELECT COUNT(*)
            FROM danh_gia dg
            WHERE dg.cong_vien_id = NEW.cong_vien_id
            AND dg.duyet_cap = TRUE
        ),
        ngay_cap_nhat = CURRENT_TIMESTAMP
    WHERE id = NEW.cong_vien_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Trigger Definition

```sql
DROP TRIGGER IF EXISTS trigger_cap_nhat_diem_danh_gia ON danh_gia;
CREATE TRIGGER trigger_cap_nhat_diem_danh_gia
AFTER INSERT OR UPDATE ON danh_gia
FOR EACH ROW
EXECUTE FUNCTION cap_nhat_diem_danh_gia();
```

### Trigger Details

**Purpose:** Automatically recalculate park ratings statistics when ratings are added or modified

**Triggered By:**

- `AFTER INSERT ON danh_gia`: When new ratings are added
- `AFTER UPDATE ON danh_gia`: When existing ratings are modified

**Actions Taken:**

1. **Update Average Rating** (`diem_danh_gia`):
   - Calculates AVG of diem from all approved ratings
   - Uses COALESCE to default to 0.0 if no ratings exist
   - Cast to FLOAT for decimal averages

2. **Update Rating Count** (`tong_danh_gia`):
   - Counts total number of approved ratings
   - Only counts where `duyet_cap = TRUE`

3. **Update Timestamp** (`ngay_cap_nhat`):
   - Sets to CURRENT_TIMESTAMP automatically

**Scope:**

- Only processes approved ratings (`duyet_cap = TRUE`)
- Only updates the specific park referenced in the rating (`WHERE id = NEW.cong_vien_id`)
- Runs for each new/modified rating row

---

## Function 3: `cap_nhat_thoi_gian()`

```sql
CREATE OR REPLACE FUNCTION cap_nhat_thoi_gian()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ngay_cap_nhat = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Trigger Definitions

```sql
-- Trigger for cong_vien (Parks)
DROP TRIGGER IF EXISTS trigger_cap_nhat_thoi_gian_cong_vien ON cong_vien;
CREATE TRIGGER trigger_cap_nhat_thoi_gian_cong_vien
BEFORE UPDATE ON cong_vien
FOR EACH ROW
EXECUTE FUNCTION cap_nhat_thoi_gian();

-- Trigger for nguoi_dung (Users)
DROP TRIGGER IF EXISTS trigger_cap_nhat_thoi_gian_nguoi_dung ON nguoi_dung;
CREATE TRIGGER trigger_cap_nhat_thoi_gian_nguoi_dung
BEFORE UPDATE ON nguoi_dung
FOR EACH ROW
EXECUTE FUNCTION cap_nhat_thoi_gian();

-- Trigger for cay_xanh (Trees)
DROP TRIGGER IF EXISTS trigger_cap_nhat_thoi_gian_cay_xanh ON cay_xanh;
CREATE TRIGGER trigger_cap_nhat_thoi_gian_cay_xanh
BEFORE UPDATE ON cay_xanh
FOR EACH ROW
EXECUTE FUNCTION cap_nhat_thoi_gian();
```

### Trigger Details

**Purpose:** Automatically update modification timestamp whenever records are changed

**Applied To Tables:**

1. `cong_vien` (Parks) - Parks table
2. `nguoi_dung` (Users) - Users table
3. `cay_xanh` (Trees) - Trees Table

**Triggered By:**

- `BEFORE UPDATE`: Executes before any UPDATE statement on the table

**Action:**

- Sets `NEW.ngay_cap_nhat` to `CURRENT_TIMESTAMP` (database server time)
- Ensures timestamp is always current, even if not explicitly set in updates

**Why BEFORE and not AFTER:**

- `BEFORE` mode allows modification of the NEW record before it's written
- This ensures the timestamp is set before the actual database update
- Works regardless of whether the application sets the timestamp

---

## SQL Testing Guide

### Test Function 1: Find Nearest Parks

```sql
-- Find all active parks within 5km of Central Hanoi
SELECT * FROM tim_cong_vien_gan_nhat(21.0285, 105.8542, 5);

-- Find parks near a different location
SELECT * FROM tim_cong_vien_gan_nhat(21.0328, 105.8047, 10)
WHERE khoang_cach_km < 2;

-- Sort by rating instead of distance
SELECT * FROM tim_cong_vien_gan_nhat(21.0285, 105.8542, 5)
ORDER BY diem_danh_gia DESC;
```

### Test Function 2: Rating Updates

```sql
-- Add a new rating
INSERT INTO danh_gia (cong_vien_id, nguoi_dung_id, diem, duyet_cap)
VALUES (1, 1, 5, TRUE);

-- Check that park ratings updated automatically
SELECT id, ten, diem_danh_gia, tong_danh_gia, ngay_cap_nhat
FROM cong_vien
WHERE id = 1;

-- Approve more ratings for the same park
UPDATE danh_gia
SET duyet_cap = TRUE
WHERE cong_vien_id = 1;

-- Park rating should update again
SELECT diem_danh_gia, tong_danh_gia FROM cong_vien WHERE id = 1;
```

### Test Function 3: Timestamp Updates

```sql
-- Insert a park
INSERT INTO cong_vien (ten, mo_ta, dia_diem, dien_tich, trang_thai)
VALUES ('Test Park', 'Test', ST_GeomFromText('POINT(105.8542 21.0285)', 4326), 1.0, TRUE);

-- Check initial timestamp
SELECT id, ten, ngay_cap_nhat FROM cong_vien WHERE ten = 'Test Park';

-- Wait a few seconds, then update
UPDATE cong_vien SET mo_ta = 'Updated description' WHERE ten = 'Test Park';

-- Timestamp should have changed automatically
SELECT id, ten, ngay_cap_nhat FROM cong_vien WHERE ten = 'Test Park';
```

### Verify Triggers Exist

```sql
-- List all triggers in the database
SELECT * FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- Check specific triggers
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE 'trigger_cap_nhat%';
```

---

## Function Performance Notes

1. **`tim_cong_vien_gan_nhat()`**
   - Uses spatial index on `dia_diem` for O(log n) lookup
   - `IMMUTABLE` flag allows query optimization
   - Geography type adds slight overhead but ensures accuracy

2. **`cap_nhat_diem_danh_gia()`**
   - Two subqueries per rating insert/update (for AVG and COUNT)
   - Should add index on `danh_gia(cong_vien_id, duyet_cap)` for performance
   - Watch for performance with high rating volume

3. **`cap_nhat_thoi_gian()`**
   - Minimal overhead (just timestamp assignment)
   - Applies to 3 tables via triggers

---

## Recommended Indexes

For optimal performance, ensure these indexes exist:

```sql
-- For tim_cong_vien_gan_nhat function
CREATE INDEX idx_cong_vien_dia_diem ON cong_vien USING GIST(dia_diem);
CREATE INDEX idx_cong_vien_trang_thai ON cong_vien(trang_thai);

-- For cap_nhat_diem_danh_gia trigger
CREATE INDEX idx_danh_gia_cong_vien_duyet ON danh_gia(cong_vien_id, duyet_cap);
```

These should already be created by the migrations.
