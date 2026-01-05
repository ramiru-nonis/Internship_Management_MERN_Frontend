'use client';

import { useRouter } from 'next/navigation';
import { LogOut, Users, Shield } from 'lucide-react';

export default function AdminDashboard() {
    const router = useRouter();

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push('/login');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-blue-600">NextStep <span className="text-gray-500 text-sm font-normal">Admin</span></h1>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-8">System Overview</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-700">Total Students</h3>
                            <Users className="text-blue-500" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">--</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-700">Total Coordinators</h3>
                            <Shield className="text-green-500" />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">--</p>
                    </div>
                </div>

                <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800">
                    <p>Admin features are currently limited in this migration preview.</p>
                </div>
            </main>
        </div>
    );
}
