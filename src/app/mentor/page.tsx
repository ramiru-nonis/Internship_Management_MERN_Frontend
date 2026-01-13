'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaUserGraduate, FaClipboardList, FaSignOutAlt } from 'react-icons/fa';

interface Student {
    _id: string;
    first_name: string;
    last_name: string;
    cb_number: string;
    status: string;
}

interface Mentor {
    first_name: string;
    last_name: string;
}

export default function MentorDashboard() {
    const router = useRouter();
    const [mentor, setMentor] = useState<Mentor | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    useEffect(() => {
        const fetchDashboard = async () => {
            const token = localStorage.getItem('token');
            const role = localStorage.getItem('role');

            if (!token || role !== 'academic_mentor') {
                router.push('/login');
                return;
            }

            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/academic-mentor/dashboard`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (res.ok) {
                    const data = await res.json();
                    setMentor(data.mentor);
                    setStudents(data.students);
                } else {
                    if (res.status === 401) {
                        localStorage.clear();
                        router.push('/login');
                    }
                }
            } catch (error) {
                console.error('Error fetching dashboard:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, [router]);

    const handleLogout = () => {
        localStorage.clear();
        router.push('/login');
    };

    const handleStudentClick = (studentId: string) => {
        // Navigate to detailed student view (reusing student profile component if possible, or new one)
        // For now, let's just log or set selected
        // ideally we route to /mentor/student/[id]
        router.push(`/mentor/student/${studentId}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-outfit">
            {/* Navbar */}
            <nav className="bg-white shadow-sm border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                                <FaUserGraduate className="text-white text-sm" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                Mentor Portal
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-gray-600 text-sm">
                                Welcome, {mentor?.first_name}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                            >
                                <FaSignOutAlt />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Your Assigned Students</h1>
                    <p className="text-gray-500 mt-1">Manage and review your students' progress</p>
                </div>

                {students.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaUserGraduate className="text-gray-400 text-2xl" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Assigned</h3>
                        <p className="text-gray-500 max-w-md mx-auto">
                            You haven't been assigned any students yet. Once the coordinator assigns students to you, they will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {students.map((student) => (
                            <div
                                key={student._id}
                                onClick={() => handleStudentClick(student._id)}
                                className="group bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-purple-100 transition-all cursor-pointer relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-12 -mt-12 group-hover:bg-purple-100 transition-colors" />

                                <div className="relative flex items-start gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-50 rounded-full flex items-center justify-center border-2 border-white shadow-sm font-bold text-purple-600 text-lg">
                                        {student.first_name[0]}{student.last_name[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                                            {student.first_name} {student.last_name}
                                        </h3>
                                        <p className="text-sm text-gray-500 mb-1">{student.cb_number}</p>
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${student.status === 'intern' ? 'bg-green-50 text-green-700' :
                                            student.status === 'Completed' ? 'bg-blue-50 text-blue-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${student.status === 'intern' ? 'bg-green-500' :
                                                student.status === 'Completed' ? 'bg-blue-500' :
                                                    'bg-gray-500'
                                                }`} />
                                            {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between text-sm">
                                    <span className="text-gray-500 group-hover:text-purple-600 transition-colors flex items-center gap-2">
                                        View Profile & Submissions
                                    </span>
                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
