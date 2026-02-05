'use client'; // Đánh dấu đây là một Client Component

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import type { Park } from '../app/actions';

// Component này chỉ tồn tại để tải Map component ở phía client
export default function ClientMap({ initialParks }: { initialParks: Park[] }) {
  // Logic dynamic import được di chuyển vào đây
  const Map = useMemo(() => dynamic(() => import('./Map'), {
    ssr: false,
    loading: () => <p>Loading map...</p>
  }), []);

  return <Map initialParks={initialParks} />;
}
