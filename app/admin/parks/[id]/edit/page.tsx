'use client';

import { useState, useEffect, useTransition } from 'react';
import { getParkById, updatePark } from '@/src/app/actions';
import type { Park } from '@/src/app/actions';
import Link from 'next/link';
import { notFound, useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';

export default function EditParkPage({ params }: { params: { id: string } }) {
  const [park, setPark] = useState<Park | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const id = parseInt(params.id);
  if (isNaN(id)) notFound();

  useEffect(() => {
    getParkById(id).then(p => {
      if (p) setPark(p);
      setLoading(false);
    });
  }, [id]);

  // *** SỬA LỖI: Client chủ động điều hướng ***
  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      try {
        await updatePark(id, formData);
        // Sau khi server cập nhật xong, ra lệnh cho trình duyệt
        // làm mới dữ liệu và chuyển về trang quản lý.
        router.refresh();
        router.push('/admin/parks');
      } catch (err) {
        alert('Cập nhật thất bại!');
        console.error(err);
      }
    });
  };

  if (loading) return <div className="flex justify-center items-center min-h-[60vh]"><LoaderCircle className="animate-spin" /></div>;
  if (!park) notFound();

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Chỉnh sửa: {park.name}</h1>
          <form action={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium">Tên Công Viên</label>
              <input type="text" id="name" name="name" defaultValue={park.name} required className="mt-1 block w-full p-2 border rounded-md"/>
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium">Mô Tả</label>
              <textarea id="description" name="description" defaultValue={park.description ?? ''} rows={4} className="mt-1 block w-full p-2 border rounded-md"/>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="tree_count" className="block text-sm font-medium">Số lượng cây xanh</label>
                <input type="number" id="tree_count" name="tree_count" defaultValue={park.tree_count} min="0" className="mt-1 block w-full p-2 border rounded-md"/>
              </div>
              <div>
                <label htmlFor="toilet_count" className="block text-sm font-medium">Số lượng nhà vệ sinh</label>
                <input type="number" id="toilet_count" name="toilet_count" defaultValue={park.toilet_count} min="0" className="mt-1 block w-full p-2 border rounded-md"/>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="opening_time" className="block text-sm font-medium">Giờ mở cửa</label>
                <input type="time" id="opening_time" name="opening_time" defaultValue={park.opening_time ?? ''} className="mt-1 block w-full p-2 border rounded-md"/>
              </div>
              <div>
                <label htmlFor="closing_time" className="block text-sm font-medium">Giờ đóng cửa</label>
                <input type="time" id="closing_time" name="closing_time" defaultValue={park.closing_time ?? ''} className="mt-1 block w-full p-2 border rounded-md"/>
              </div>
            </div>
            <div className="flex items-start">
              <input id="is_active" name="is_active" type="checkbox" defaultChecked={park.is_active} className="h-4 w-4 rounded"/>
              <div className="ml-3 text-sm">
                <label htmlFor="is_active" className="font-medium">Cho phép hoạt động</label>
                <p className="text-gray-500">Bỏ chọn nếu công viên đang tạm đóng cửa để bảo trì.</p>
              </div>
            </div>
            <div className="flex justify-end gap-4 pt-4 border-t">
              <Link href="/admin/parks" className="bg-white py-2 px-4 border rounded-md">Hủy</Link>
              <button type="submit" disabled={isPending} className="py-2 px-4 rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400">
                {isPending ? 'Đang lưu...' : 'Lưu Thay Đổi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
