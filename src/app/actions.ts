'use server';

import { Pool } from 'pg';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// --- INTERFACES ---
export interface Park {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  is_open_now?: boolean;
  opening_time: string | null;
  closing_time: string | null;
  lat: number | null;
  lon: number | null;
  geom_point: { type: 'Point'; coordinates: [number, number] };
  tree_count: number;
  toilet_count: number;
  distance?: number;
}

// --- HÀM TÍNH TOÁN TRẠNG THÁI ---
function calculateParkStatus(park: Park): Park {
  const now = new Date();
  const vietnamTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const currentMinutes = vietnamTime.getHours() * 60 + vietnamTime.getMinutes();
  let isOpen = false;
  if (park.is_active) {
    if (!park.opening_time || !park.closing_time) {
      isOpen = true;
    } else {
      const [openH, openM] = park.opening_time.split(':').map(Number);
      const [closeH, closeM] = park.closing_time.split(':').map(Number);
      const openMinutes = openH * 60 + openM;
      const closeMinutes = closeH * 60 + closeM;
      if (openMinutes <= closeMinutes) isOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
      else isOpen = currentMinutes >= openMinutes || currentMinutes < closeMinutes;
    }
  }
  return { ...park, is_open_now: isOpen };
}

// --- CÁC HÀM CRUD ---
export async function getParks(): Promise<Park[]> {
  const client = await pool.connect();
  try {
    const result = await client.query<Park>(`SELECT *, ST_AsGeoJSON(geom_point)::json as geom_point FROM "Park" ORDER BY id DESC`);
    return result.rows.map(calculateParkStatus);
  } finally {
    client.release();
  }
}

// *** NÂNG CẤP: Bỏ giới hạn tìm kiếm ***
export async function getNearbyParks(lat: number, lon: number): Promise<Park[]> {
  const client = await pool.connect();
  try {
    const result = await client.query<Park>(`
      SELECT *, ST_AsGeoJSON(p.geom_point)::json as geom_point,
      ST_Distance(p.geom_point::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as distance
      FROM "Park" p
      ORDER BY distance ASC;
    `, [lon, lat]);
    return result.rows.map(calculateParkStatus);
  } finally {
    client.release();
  }
}

export async function getParkById(id: number): Promise<Park | null> {
  const client = await pool.connect();
  try {
    const result = await client.query<Park>('SELECT *, ST_AsGeoJSON(geom_point)::json as geom_point FROM "Park" WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return calculateParkStatus(result.rows[0]);
  } finally {
    client.release();
  }
}

export async function savePark(formData: FormData) {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO "Park" (name, description, geom_point, lat, lon, opening_time, closing_time, is_active, tree_count, toilet_count) 
       VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, $6, $7, $8, $9, $10, $11)`,
      [
        formData.get('name'), formData.get('description'),
        parseFloat(formData.get('lon') as string), parseFloat(formData.get('lat') as string),
        parseFloat(formData.get('lat') as string), parseFloat(formData.get('lon') as string),
        formData.get('opening_time') || null,
        formData.get('closing_time') || null,
        formData.get('is_active') === 'on',
        parseInt(formData.get('tree_count') as string) || 0,
        parseInt(formData.get('toilet_count') as string) || 0,
      ]
    );
    revalidatePath('/');
  } finally {
    client.release();
  }
}

export async function updatePark(id: number, formData: FormData) {
  const client = await pool.connect();
  try {
    await client.query(
      `UPDATE "Park" SET 
        name = $1, description = $2, is_active = $3, opening_time = $4, closing_time = $5, tree_count = $6, toilet_count = $7 
      WHERE id = $8`,
      [
        formData.get('name'), formData.get('description'),
        formData.get('is_active') === 'on',
        formData.get('opening_time') || null,
        formData.get('closing_time') || null,
        parseInt(formData.get('tree_count') as string) || 0,
        parseInt(formData.get('toilet_count') as string) || 0,
        id
      ]
    );
    revalidatePath('/');
  } finally {
    client.release();
  }
}

export async function deletePark(id: number) {
  const client = await pool.connect();
  try {
    await client.query('DELETE FROM "Park" WHERE id = $1', [id]);
    revalidatePath('/');
  } finally {
    client.release();
  }
}
