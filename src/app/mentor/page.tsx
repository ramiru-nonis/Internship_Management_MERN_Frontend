'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaUserGraduate, FaClipboardList, FaSignOutAlt, FaSearch } from 'react-icons/fa';
import api from '@/lib/api';

interface Student {
    _id: string;
    first_name: string;
    last_name: string;
    cb_number: string;
    status: string;
}

interface Mentor {
    _id: string;
    first_name: string;
    last_name: string;
}

export default function MentorDashboard() {
    const router = useRouter();
    const [mentor, setMentor] = useState<Mentor | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await api.get('/academic-mentor/dashboard');
                setMentor(res.data.mentor);
                setStudents(res.data.students);
                setLoading(false);
            } catch (error) {
                console.error(error);
                alert('Failed to load dashboard');
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    const filteredStudents = students.filter(s =>
        (s.first_name + ' ' + s.last_name + ' ' + s.cb_number).toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center bg-gray-50 min-h-screen">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 font-outfit">
            {/* Top Navbar */}
            <nav className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 z-30">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                        <FaUserGraduate className="text-xl" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">NextStep</h1>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Academic Mentor</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right mr-4 hidden md:block">
                        <p className="text-sm font-bold text-gray-900">{mentor?.first_name} {mentor?.last_name}</p>
                        <p className="text-xs text-gray-500">Academic Mentor</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Logout"
                    >
                        <FaSignOutAlt className="text-xl" />
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="bg-white border-b border-gray-100 py-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {mentor?.first_name}!</h2>
                    <p className="text-gray-500">Monitor and support your {students.length} assigned students.</p>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto p-6">
                {/* Controls */}
                <div className="mb-8 relative max-w-md">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search assigned students..."
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Students Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
                            <div
                                key={student._id}
                                onClick={() => router.push(`/mentor/student/${student._id}`)}
                                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                        <FaClipboardList className="text-2xl" />
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${student.status === 'Completed' ? 'bg-green-50 text-green-700' :
                                        student.status === 'intern' ? 'bg-blue-50 text-blue-700' :
                                            'bg-gray-50 text-gray-600'
                                        }`}>
                                        {student.status}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                                    {student.first_name} {student.last_name}
                                </h3>
                                <p className="text-sm text-gray-500 font-medium">{student.cb_number}</p>

                                <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center">
                                    <span className="text-xs text-blue-600 font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                                        View Details →
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                            <p className="text-gray-400">No students found.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
