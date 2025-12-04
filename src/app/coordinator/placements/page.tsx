'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { FileText, User, Calendar, Mail, Building } from 'lucide-react';

export default function CoordinatorPlacements() {
    const router = useRouter();
    const [placements, setPlacements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
            <div className="min-h-screen bg-gray-50">
                <Navbar />
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
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Placement Forms</h1>
                    <p className="text-gray-600 mt-2">Review student placement submissions</p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {placements.map((placement) => (
                        <div key={placement._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">
                                                {placement.student?.first_name} {placement.student?.last_name}
                                            </h3>
                                            <p className="text-sm text-gray-500">{placement.student?.cb_number}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center text-gray-600">
                                            <Building className="h-4 w-4 mr-2" />
                                            <span className="font-medium mr-2">Company:</span>
                                            {placement.company_name}
                                        </div>


                                        <div className="flex items-center text-gray-600">
                                            <Calendar className="h-4 w-4 mr-2" />
                                            <span className="font-medium mr-2">Duration:</span>
                                            {new Date(placement.start_date).toLocaleDateString()} - {new Date(placement.end_date).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col justify-center border-l border-gray-100 pl-6">
                                    <div className="text-sm text-gray-500 mb-1">Submitted on</div>
                                    <div className="font-medium text-gray-900">
                                        {new Date(placement.submittedDate || placement.createdAt).toLocaleDateString()}
                                    </div>
                                    <div className="mt-2">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Status: Submitted
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {placements.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
                            No placement forms submitted yet
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
