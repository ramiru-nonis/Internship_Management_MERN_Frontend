'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import api from '@/lib/api';
import { User, Briefcase, Calendar } from 'lucide-react';

export default function CoordinatorApplications() {
    const router = useRouter();
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');

        if (!token || !user) {
            router.push('/login');
            return;
        }

        const userData = JSON.parse(user);
        if (userData.role !== 'coordinator' && userData.role !== 'admin') {
            router.push('/login');
            return;
        }

        const delaySearch = setTimeout(() => {
            fetchApplications();
        }, 500);

        return () => clearTimeout(delaySearch);
    }, [search]);

    const fetchApplications = async () => {
        try {
            const params: any = {};
            if (search) params.search = search;

            const res = await api.get('/coordinator/applications', { params });
            setApplications(res.data);
        } catch (error) {
            console.error('Error fetching applications:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">

                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading applications...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">


            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
                    <p className="text-gray-600 mt-2">Track student applications</p>
                </div>

                {/* Search Bar */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by student, CB number, company, or title..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Internship</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied Date</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {applications.map((app) => (
                                    <tr key={app._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                    <User className="h-4 w-4" />
                                                </div>
                                                <div className="ml-3">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {app.student?.first_name} {app.student?.last_name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">{app.student?.cb_number}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{app.internship?.title}</div>
                                                    <div className="text-sm text-gray-500">{app.internship?.company_name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm text-gray-500">
                                                <Calendar className="h-4 w-4 mr-2" />
                                                {new Date(app.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {applications.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                                            No applications found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

