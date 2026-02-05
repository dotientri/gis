import Link from 'next/link';
import { Map, TreePine } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2 text-2xl font-bold text-gray-800">
            <TreePine className="text-green-600" size={28} />
            <span>ParkManager</span>
          </Link>
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-1 text-gray-600 hover:text-green-600 transition-colors">
              <Map size={20} />
              <span>Bản đồ</span>
            </Link>
            <Link href="/admin/parks" className="text-gray-600 hover:text-green-600 transition-colors">
              Quản lý
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
