import { getParks } from './actions';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';

export default async function Home() {
  const parks = await getParks();

  const Map = useMemo(() => dynamic(() => import('../components/Map'), {
    ssr: false,
    loading: () => <p>Loading map...</p>
  }), []);


  return (
    <main className="h-screen">
      <Map initialParks={parks} />
    </main>
  );
}
