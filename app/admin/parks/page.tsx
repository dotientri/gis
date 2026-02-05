import { getParks } from '@/src/app/actions';
import Link from 'next/link';
import DeleteButton from './DeleteButton';
import { Edit, Power, PowerOff, PlusCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ParksAdminPage() {
  const parks = await getParks();

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Quản lý Công viên</h1>
          <Link href="/" className="flex items-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg shadow hover:bg-green-700 transition-colors">
            <PlusCircle size={20} />
            <span>Thêm từ Bản đồ</span>
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase">Tên Công viên</th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-center text-xs font-bold uppercase">Cây xanh</th>
                <th className="px-6 py-3 text-center text-xs font-bold uppercase">Nhà vệ sinh</th>
                <th className="px-6 py-3 text-center text-xs font-bold uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {parks.map((park) => (
                <tr key={park.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-gray-900">{park.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    {park.is_open_now 
                      ? <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><Power size={14}/> Mở cửa</span> 
                      : <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><PowerOff size={14}/> Đã đóng</span>}
                  </td>
                  <td className="px-6 py-4 text-center text-sm">{park.tree_count}</td>
                  <td className="px-6 py-4 text-center text-sm">{park.toilet_count}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center gap-4">
                      <Link href={`/admin/parks/${park.id}/edit`} className="text-gray-500 hover:text-yellow-600" title="Sửa chi tiết">
                        <Edit size={18} />
                      </Link>
                      <DeleteButton id={park.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
