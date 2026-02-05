'use client';

import { useState, useEffect } from 'react';
import { getParkById } from '@/src/app/actions';
import type { Park } from '@/src/app/actions';
import Link from 'next/link';
import { MapPin, Clock, Power, TreePine, Droplet, Edit, LoaderCircle } from 'lucide-react';
import { notFound } from 'next/navigation';

export default function ParkDetailPage({ params }: { params: { id: string } }) {
  const [park, setPark] = useState<Park | null>(null);
  const [loading, setLoading] = useState(true);

  const id = parseInt(params.id);
  if (isNaN(id)) {
    notFound();
  }

  useEffect(() => {
    getParkById(id).then(p => {
      if (p) setPark(p);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoaderCircle className="animate-spin text-gray-500" size={48} />
        <p className="ml-4 text-lg">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (!park) {
    notFound();
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          {/* Card thông tin chung */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{park.name}</h1>
                <p className="text-gray-500 mt-1">{park.description || 'Chưa có mô tả.'}</p>
              </div>
              <Link href={`/admin/parks/${id}/edit`} className="flex items-center gap-2 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">
                <Edit size={16} /> Sửa
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-6 text-sm border-t pt-6">
              <div className="flex items-center gap-3">
                <Power className={park.is_open_now ? "text-green-500" : "text-red-500"} size={24} />
                <div>
                  <p className="text-gray-500">Trạng thái</p>
                  <p className="font-semibold text-base">{park.is_open_now ? 'Đang hoạt động' : 'Đóng cửa'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="text-gray-500" size={24} />
                <div>
                  <p className="text-gray-500">Giờ mở cửa</p>
                  <p className="font-semibold text-base">{park.opening_time?.substring(0,5) ?? 'N/A'} - {park.closing_time?.substring(0,5) ?? 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="text-gray-500" size={24} />
                <div>
                  <p className="text-gray-500">Tọa độ</p>
                  <p className="font-semibold text-base">{park.lat?.toFixed(5)}, {park.lon?.toFixed(5)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <TreePine className="text-green-600" size={24} />
                <div>
                  <p className="text-gray-500">Số lượng cây xanh</p>
                  <p className="font-semibold text-base">{park.tree_count}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Droplet className="text-blue-600" size={24} />
                <div>
                  <p className="text-gray-500">Số lượng nhà vệ sinh</p>
                  <p className="font-semibold text-base">{park.toilet_count}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
