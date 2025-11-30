'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';
import { Calendar, MapPin, Briefcase, FileText, Download } from 'lucide-react';

export default function ApplicationsPage() {
    const router = useRouter();
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const response = await api.get('/students/applications');
            setApplications(response.data);
        } catch (error) {
            console.error('Error fetching applications:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredApplications = applications.filter(app => {
        if (filter === 'all') return true;
        return app.status === filter;
    });

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
                    <p className="text-gray-600 mt-2">Track the status of your internship applications</p>
                </div>

                {/* Filter */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                    <div className="flex flex-wrap gap-2">
                        {['all', 'Applied', 'Shortlisted', 'Contacted', 'Sent to Company', 'Rejected'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === status
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {status === 'all' ? 'All' : status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Applications List */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading applications...</p>
                        </div>
                    </div>
                ) : filteredApplications.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 text-lg">No applications found</p>
                        <p className="text-gray-500 text-sm mt-2">
                            {filter === 'all' ? 'Start applying to internships!' : `No applications with status "${filter}"`}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredApplications.map(application => (
                            <div key={application._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                                            {application.internship.title}
                                        </h3>
                                        <p className="text-lg text-gray-600 font-medium">
                                            {application.internship.company_name}
                                        </p>
                                    </div>
                                    <StatusBadge status={application.status} type="application" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Briefcase className="h-4 w-4 mr-2" />
                                        <span>{application.internship.category}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <MapPin className="h-4 w-4 mr-2" />
                                        <span>{application.internship.location}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Calendar className="h-4 w-4 mr-2" />
                                        <span>Applied: {new Date(application.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                {application.notes && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                        <p className="text-sm font-medium text-blue-900 mb-1">Coordinator Notes:</p>
                                        <p className="text-sm text-blue-800">{application.notes}</p>
                                    </div>
                                )}

                                {application.cv && (
                                    <div className="flex items-center space-x-2">
                                        <Download className="h-4 w-4 text-gray-600" />
                                        <a
                                            href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/${application.cv}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            View Submitted CV
                                        </a>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
