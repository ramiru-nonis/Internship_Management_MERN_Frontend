'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Users, GraduationCap, ArrowRight, User } from 'lucide-react';

export default function MentorDashboard() {
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchAssignedStudents();
    }, []);

    const fetchAssignedStudents = async () => {
        try {
            const res = await api.get('/mentor/students');
            setStudents(res.data);
        } catch (error) {
            console.error('Error fetching assigned students:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mentor Dashboard</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Manage and track your assigned students</p>
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Assigned Students</h3>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{students.length}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Students</h2>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {students.length > 0 ? (
                            students.map((student) => (
                                <div
                                    key={student._id}
                                    className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-between group cursor-pointer"
                                    onClick={() => router.push(`/mentor/student/${student._id}`)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                                            {student.profile_picture ? (
                                                <img
                                                    src={student.profile_picture.startsWith('http') ? student.profile_picture : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/${student.profile_picture}`}
                                                    alt=""
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <User className="h-6 w-6 text-gray-400" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                                {student.first_name} {student.last_name}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-0.5">
                                                <GraduationCap className="w-3.5 h-3.5 mr-1" />
                                                {student.cb_number} • {student.degree}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${student.status === 'intern' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                                student.status === 'Completed' ? 'bg-green-50 text-green-700 border border-green-100' :
                                                    'bg-gray-50 text-gray-700 border border-gray-100'
                                            }`}>
                                            {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                                        </span>
                                        <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-12 text-center">
                                <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">No students assigned to you yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
