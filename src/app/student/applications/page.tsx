'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import api from '@/lib/api';
import { Briefcase, Calendar, MapPin, Building, FileText } from 'lucide-react';
import Link from 'next/link';

export default function ApplicationHistoryPage() {
    const router = useRouter();
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [studentId, setStudentId] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        fetchStudentProfile();
    }, []);

    const fetchStudentProfile = async () => {
        try {
            const res = await api.get('/students/profile');
            if (res.data && res.data._id) {
                setStudentId(res.data._id);
                fetchApplications(res.data._id);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            setLoading(false);
        }
    };

    const fetchApplications = async (id: string) => {
        try {
            const res = await api.get(`/applications/student/${id}`);
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
                        <p className="mt-4 text-gray-600">Loading history...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">


            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Application History</h1>
                    <p className="text-gray-600 mt-2 dark:text-gray-400">Track your internship applications</p>
                </div>

                <div className="space-y-6">
                    {applications.map((app) => (
                        <div key={app._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{app.internship?.title || 'Unknown Position'}</h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${app.status === 'Accepted' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' :
                                            app.status === 'Rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200' :
                                                app.status === 'Reviewed' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200' :
                                                    'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                                            }`}>
                                            {app.status}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                                        <div className="flex items-center">
                                            <Building className="h-4 w-4 mr-2" />
                                            {app.internship?.company_name || 'Unknown Company'}
                                        </div>
                                        <div className="flex items-center">
                                            <Calendar className="h-4 w-4 mr-2" />
                                            Applied: {new Date(app.createdAt).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center">
                                            <FileText className="h-4 w-4 mr-2" />
                                            Type: {app.apply_type === 'custom_cv' ? 'Custom CV' : 'Profile CV'}
                                        </div>
                                    </div>

                                    {app.notes && (
                                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300">
                                            <span className="font-semibold">Coordinator Notes:</span> {app.notes}
                                        </div>
                                    )}
                                </div>

                                {app.internship && (
                                    <Link
                                        href={`/student/internships/${app.internship._id}`}
                                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
                                    >
                                        View Job Details &rarr;
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}

                    {applications.length === 0 && (
                        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No applications yet</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">Start applying for internships to see them here.</p>
                            <Link
                                href="/student/internships"
                                className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Browse Internships
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
