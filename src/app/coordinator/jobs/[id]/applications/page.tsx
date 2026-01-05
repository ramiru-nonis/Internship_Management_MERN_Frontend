'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

import api from '@/lib/api';
import { Search, Filter, FileText, User, Briefcase, Calendar, Download, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function JobApplicationsPage() {
    const router = useRouter();
    const params = useParams();
    const [applications, setApplications] = useState<any[]>([]);
    const [job, setJob] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');

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

        fetchJobAndApplications();
    }, [statusFilter]);

    const fetchJobAndApplications = async () => {
        try {
            // Fetch Job Details
            const jobRes = await api.get(`/internships/${params.id}`);
            setJob(jobRes.data);

            // Fetch Applications
            const appParams: any = { internship: params.id };
            if (statusFilter !== 'all') appParams.status = statusFilter;

            // Note: We might need to adjust the backend to filter by internship ID if the main endpoint supports it.
            // Currently /coordinator/applications returns ALL. 
            // Let's assume we can filter or we fetch all and filter client side if backend doesn't support it yet.
            // Ideally backend should support ?internship=ID
            const res = await api.get('/coordinator/applications', { params: appParams });

            // Filter client-side just in case backend ignores internship param
            const filteredApps = res.data.filter((app: any) => app.internship?._id === params.id || app.internship === params.id);
            setApplications(filteredApps);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadAll = async () => {
        setDownloading(true);
        try {
            const response = await api.post('/applications/download-cvs', {
                internshipId: params.id
            }, {
                responseType: 'blob'
            });

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Applications_${job.title}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error downloading CVs:', error);
            alert('Failed to download CVs');
        } finally {
            setDownloading(false);
        }
    };



    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">

                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading applications...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">


            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Link
                    href="/coordinator/jobs"
                    className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Jobs
                </Link>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Applications for {job?.title}</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">{applications.length} total applications</p>
                    </div>
                    <button
                        onClick={handleDownloadAll}
                        disabled={downloading || applications.length === 0}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {downloading ? (
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        ) : (
                            <Download className="h-5 w-5 mr-2" />
                        )}
                        Download All CVs
                    </button>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
                    <div className="flex items-center">
                        <div className="relative w-64">
                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                            >
                                <option value="all">All Statuses</option>
                                <option value="Applied">Applied</option>
                                <option value="Reviewed">Reviewed</option>
                                <option value="Accepted">Accepted</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Applied Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">CV</th>

                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {applications.map((app) => (
                                    <tr key={app._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                    <User className="h-4 w-4" />
                                                </div>
                                                <div className="ml-3">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {app.student?.first_name} {app.student?.last_name}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">{app.student?.cb_number}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                <Calendar className="h-4 w-4 mr-2" />
                                                {new Date(app.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {(app.cv || (app.student && app.student.cv)) ? (
                                                <a
                                                    href={(app.cv || app.student.cv)?.startsWith('http') ? (app.cv || app.student.cv) : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/${app.cv || app.student.cv}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center"
                                                >
                                                    <FileText className="h-4 w-4 mr-1" />
                                                    View CV
                                                </a>
                                            ) : (
                                                <span className="text-gray-400 dark:text-gray-500">No CV</span>
                                            )}
                                        </td>

                                    </tr>
                                ))}
                                {applications.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
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
