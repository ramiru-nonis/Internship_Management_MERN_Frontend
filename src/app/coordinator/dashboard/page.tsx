'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import StatsCard from '@/components/StatsCard';
import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';
import { Users, Briefcase, FileText, TrendingUp, Search, Filter } from 'lucide-react';
import Link from 'next/link';

export default function CoordinatorDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');

        if (!token || !user) {
            router.push('/login');
            return; // loging out if no token or user
        }

        const userData = JSON.parse(user);
        if (userData.role !== 'coordinator' && userData.role !== 'admin') {
            router.push('/login');
            return;
        }

        fetchDashboardData();
    }, [statusFilter, searchTerm]);

    const fetchDashboardData = async () => {
        try {
            const params: any = {};
            if (statusFilter !== 'all') params.status = statusFilter;
            if (searchTerm) params.search = searchTerm;

            const [statsRes, studentsRes] = await Promise.all([
                api.get('/coordinator/dashboard'),
                api.get('/coordinator/students', { params }),
            ]);

            setStats(statsRes.data);
            // Filter out staff (Coordinator/Admin) from the dashboard view
            setStudents(studentsRes.data.filter((s: any) =>
                !['Coordinator', 'Admin'].includes(s.status)
            ));
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCardClick = (status?: string) => {
        if (status) {
            router.push(`/coordinator/students?status=${status}`);
        } else {
            router.push('/coordinator/students');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">


            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Coordinator Dashboard</h1>
                    <p className="text-gray-600 mt-2 dark:text-gray-400">Manage students, internships, and applications</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div onClick={() => handleCardClick()} className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]">
                        <StatsCard
                            title="Total Students"
                            value={stats?.totalStudents || 0}
                            icon={Users}
                            color="blue"
                        />
                    </div>
                    <div onClick={() => handleCardClick('intern')} className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]">
                        <StatsCard
                            title="Students with Internships"
                            value={stats?.studentsWithInternships || 0}
                            icon={TrendingUp}
                            color="green"
                        />
                    </div>
                    <Link href="/coordinator/jobs" className="transition-transform hover:scale-[1.02] active:scale-[0.98]">
                        <StatsCard
                            title="Active Job Posts"
                            value={stats?.totalJobs || 0}
                            icon={Briefcase}
                            color="purple"
                        />
                    </Link>
                    <Link href="/coordinator/jobs" className="transition-transform hover:scale-[1.02] active:scale-[0.98]">
                        <StatsCard
                            title="Expired Posts"
                            value={stats?.expiredPosts || 0}
                            icon={FileText}
                            color="orange"
                        />
                    </Link>
                </div>
                <Link href="/coordinator/mentors" className="transition-transform hover:scale-[1.02] active:scale-[0.98]">
                    <StatsCard
                        title="Academic Mentors"
                        value="Manage"
                        icon={Users}
                        color="pink"
                    />
                </Link>
            </div>

            {/* Status Breakdown */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Student Status Breakdown</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div
                        onClick={() => handleCardClick('non-intern')}
                        className="text-center p-4 bg-gray-50 rounded-lg cursor-pointer transition-all hover:bg-gray-100 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <p className="text-2xl font-bold text-gray-900">{stats?.statusBreakdown?.nonIntern || 0}</p>
                        <p className="text-sm text-gray-600 mt-1">Non-Intern</p>
                    </div>
                    <div
                        onClick={() => handleCardClick('intern')}
                        className="text-center p-4 bg-blue-50 rounded-lg cursor-pointer transition-all hover:bg-blue-100 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <p className="text-2xl font-bold text-blue-600">{stats?.statusBreakdown?.intern || 0}</p>
                        <p className="text-sm text-gray-600 mt-1">Intern</p>
                    </div>
                    <div
                        onClick={() => handleCardClick('Completed')}
                        className="text-center p-4 bg-green-50 rounded-lg cursor-pointer transition-all hover:bg-green-100 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <p className="text-2xl font-bold text-green-600">{stats?.statusBreakdown?.completed || 0}</p>
                        <p className="text-sm text-gray-600 mt-1">Completed</p>
                    </div>
                </div>
            </div>

            {/* Students List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-gray-900">Students</h2>
                    <Link
                        href="/coordinator/students"
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                        View All →
                    </Link>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or CB number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                        >
                            <option value="all">All Statuses</option>
                            <option value="non-intern">Non-Intern</option>
                            <option value="intern">Intern</option>
                            <option value="Completed">Completed</option>
                        </select>
                    </div>
                </div>

                {/* Students Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Student
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    CB Number
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Degree
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {students.slice(0, 5).map(student => (
                                <tr key={student._id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {student.first_name} {student.last_name}
                                            </p>
                                            <p className="text-sm text-gray-500">{student.user?.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {student.cb_number}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {student.degree}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <StatusBadge status={student.status} type="student" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        </div >
    );
}
