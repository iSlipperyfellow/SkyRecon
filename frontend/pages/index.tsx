import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { isAuthenticated } from '@/lib/auth';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-blue-600">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-4">SkyRecon</h1>
        <p className="text-xl text-blue-100">Multi-Drone Debris Detection System</p>
      </div>
    </div>
  );
}
