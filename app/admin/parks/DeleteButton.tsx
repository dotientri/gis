'use client';

import { useTransition } from 'react';
import { deletePark } from '@/src/app/actions';
import { Trash2 } from 'lucide-react';

export default function DeleteButton({ id }: { id: number }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm('Bạn có chắc chắn muốn xóa công viên này không?')) {
      startTransition(async () => {
        await deletePark(id);
      });
    }
  };

  return (
    <button onClick={handleDelete} disabled={isPending} className="text-gray-500 hover:text-red-600 disabled:text-gray-300" title="Xóa">
      {isPending ? "..." : <Trash2 size={18} />}
    </button>
  );
}
