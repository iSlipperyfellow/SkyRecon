import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getUserRole } from '@/lib/auth';

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles: string[];
    redirectTo?: string;
}

export default function RoleGuard({ children, allowedRoles, redirectTo = '/dashboard' }: RoleGuardProps) {
    const router = useRouter();
    const [authorized, setAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        const role = getUserRole();
        if (role && allowedRoles.includes(role)) {
            setAuthorized(true);
        } else {
            setAuthorized(false);
            // Prevent redirect loop if already on redirectTo
            if (router.pathname !== redirectTo) {
                router.replace(redirectTo);
            }
        }
    }, [allowedRoles, redirectTo, router]);

    // Render nothing while checking or if unauthorized
    if (!authorized) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900">
                <div className="text-white flex flex-col items-center p-8 bg-surface rounded-lg border border-white/10">
                    <div className="w-12 h-12 text-danger mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold mb-2">Access Denied</h2>
                    <p className="text-textMuted mb-4">Your role does not have permission to view this page.</p>
                    <div className="bg-black/50 p-4 rounded text-sm font-mono mb-6 text-left w-full">
                        <p>Current Role: <span className="text-warning">{getUserRole() || 'None (Not Logged In)'}</span></p>
                        <p>Required Roles: <span className="text-success">{allowedRoles.join(', ')}</span></p>
                    </div>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="btn btn-primary w-full"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
