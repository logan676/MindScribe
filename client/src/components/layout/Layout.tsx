import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export function Layout() {
  // TODO: Get user from auth context
  const user = {
    name: 'Dr. Evelyn Reed',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Evelyn',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
