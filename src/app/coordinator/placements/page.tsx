'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import api from '@/lib/api';
import { FileText, User, Calendar, Mail, Building } from 'lucide-react';

export default function CoordinatorPlacements() {
    const router = useRouter();
    const [placements, setPlacements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlacement, setSelectedPlacement] = useState<any>(null);

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

        fetchPlacements();
    }, []);

    const fetchPlacements = async () => {
        try {
            const res = await api.get('/coordinator/placements');
            setPlacements(res.data);
        } catch (error) {
            console.error('Error fetching placements:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading placement forms...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">


            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Placement Forms</h1>
                    <p className="text-gray-600 mt-2 dark:text-gray-400">Review student placement submissions</p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {placements.map((placement) => (
                        <div
                            key={placement._id}
                            onClick={() => setSelectedPlacement(placement)}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-md transition-shadow"
                        >
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                                {placement.student?.first_name} {placement.student?.last_name}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{placement.student?.cb_number}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                                            <Building className="h-4 w-4 mr-2" />
                                            <span className="font-medium mr-2 text-gray-700 dark:text-gray-300">Company:</span>
                                            {placement.company_name}
                                        </div>


                                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                                            <Calendar className="h-4 w-4 mr-2" />
                                            <span className="font-medium mr-2 text-gray-700 dark:text-gray-300">Duration:</span>
                                            {new Date(placement.start_date).toLocaleDateString()} - {new Date(placement.end_date).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col justify-center border-l border-gray-100 dark:border-gray-700 pl-6">
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Submitted on</div>
                                    <div className="font-medium text-gray-900 dark:text-white">
                                        {new Date(placement.submittedDate || placement.createdAt).toLocaleDateString()}
                                    </div>

                                </div>
                            </div>
                        </div>
                    ))}
                    {placements.length === 0 && (
                        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                            No placement forms submitted yet
                        </div>
                    )}
                </div>
            </div>

            {/* Placement Detail Modal */}
            {selectedPlacement && (
                <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Placement Details</h2>
                            <button
                                onClick={() => setSelectedPlacement(null)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Student Info */}
                            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
                                    {selectedPlacement.student?.first_name?.[0]}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                                        {selectedPlacement.student?.first_name} {selectedPlacement.student?.last_name}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400">{selectedPlacement.student?.cb_number} | {selectedPlacement.student?.contact_number}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{selectedPlacement.student?.user?.email}</p>
                                </div>
                            </div>

                            {/* Internship Details */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Internship Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Company</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{selectedPlacement.company_name}</p>
                                    </div>
                                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Job Title/Role</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{selectedPlacement.placement_job_title || selectedPlacement.position}</p>
                                    </div>
                                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Start Date</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{new Date(selectedPlacement.start_date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">End Date</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{new Date(selectedPlacement.end_date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Company & Mentor Details */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Supervisor / Mentor</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <span className="text-gray-600 dark:text-gray-400">Name</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{selectedPlacement.mentor_name}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <span className="text-gray-600 dark:text-gray-400">Email</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{selectedPlacement.mentor_email}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <span className="text-gray-600 dark:text-gray-400">Phone</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{selectedPlacement.mentor_phone}</span>
                                    </div>
                                    <div className="flex justify-between items-start p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <span className="text-gray-600 dark:text-gray-400 whitespace-nowrap mr-4">Address</span>
                                        <span className="font-medium text-gray-900 dark:text-white text-right">{selectedPlacement.company_address}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            {selectedPlacement.description && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Description / Plan</h3>
                                    <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-sm leading-relaxed">
                                        {selectedPlacement.description}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                            <button
                                onClick={() => setSelectedPlacement(null)}
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
