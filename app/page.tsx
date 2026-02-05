import { getParks } from '../src/app/actions';
import ClientMap from '../src/components/ClientMap';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const parks = await getParks();

  return (
    // Thay đổi ở đây: đảm bảo main chiếm hết chiều cao còn lại
    <main className="flex-grow h-full">
      <ClientMap initialParks={parks} />
    </main>
  );
}
