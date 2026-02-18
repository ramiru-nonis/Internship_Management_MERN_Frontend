'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';
import { Briefcase, FileText, ClipboardList, User, TrendingUp, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function StudentDashboard() {
    const router = useRouter();
    const [student, setStudent] = useState<any>(null);
    const [stats, setStats] = useState({
        totalApplications: 0,
        activeApplications: 0,
        placementSubmitted: false,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        fetchStudentData();
    }, []);

    const fetchStudentData = async () => {
        try {
            const [profileRes, applicationsRes] = await Promise.all([
                api.get('/students/profile'),
                api.get('/students/applications'),
            ]);

            setStudent(profileRes.data);
            const placementStatuses = ['approved', 'hired', 'Hired', 'Completed', 'intern'];
            setStats({
                totalApplications: applicationsRes.data.length,
                activeApplications: applicationsRes.data.filter((app: any) =>
                    app.status !== 'Rejected'
                ).length,
                placementSubmitted: placementStatuses.includes(profileRes.data.status),
            });
        } catch (error) {
            console.error('Error fetching student data:', error);
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
                        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
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
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Welcome back, {student?.first_name}!
                    </h1>
                    <p className="text-gray-600 mt-2 dark:text-gray-400">
                        Track your internship journey and manage your applications
                    </p>
                </div>

                {/* Status Card */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 mb-8 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium mb-2">Current Status</p>
                            <div className="bg-white/20 backdrop-blur-sm inline-block px-4 py-2 rounded-lg">
                                <span className="text-white font-bold text-lg">{student?.status}</span>
                            </div>
                        </div>
                        <TrendingUp className="h-16 w-16 text-blue-200" />
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Applications</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalApplications}</p>
                            </div>
                            <div className="p-4 bg-blue-100 rounded-full">
                                <FileText className="h-8 w-8 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Active Applications</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.activeApplications}</p>
                            </div>
                            <div className="p-4 bg-green-100 rounded-full">
                                <Briefcase className="h-8 w-8 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Placement Form</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                    {stats.placementSubmitted ? 'Submitted' : 'Not Submitted'}
                                </p>
                            </div>
                            <div className={`p-4 rounded-full ${stats.placementSubmitted ? 'bg-green-100' : 'bg-orange-100'}`}>
                                <ClipboardList className={`h-8 w-8 ${stats.placementSubmitted ? 'text-green-600' : 'text-orange-600'}`} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Link
                        href="/student/internships"
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all group"
                    >
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                                <Briefcase className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white">Browse Jobs</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Find internships</p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        href="/student/applications"
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all group"
                    >
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                                <FileText className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white">My Applications</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Track status</p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        href="/student/placement"
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all group"
                    >
                        <div className="flex items-center space-x-4">
                            <div className={`p-3 rounded-lg transition-colors ${stats.placementSubmitted ? 'bg-green-100 group-hover:bg-green-200' : 'bg-purple-100 group-hover:bg-purple-200'}`}>
                                <ClipboardList className={`h-6 w-6 ${stats.placementSubmitted ? 'text-green-600' : 'text-purple-600'}`} />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                    {stats.placementSubmitted ? 'Placement Form' : 'Placement Form'}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {stats.placementSubmitted ? 'View details' : 'Submit details'}
                                </p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        href="/student/profile"
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all group"
                    >
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                                <User className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white">My Profile</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Update info</p>
                            </div>
                        </div>
                    </Link>



                    {/* Logbook Quick Action */}
                    <Link
                        href="/student/logbook"
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all group"
                    >
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                                <BookOpen className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white">Logbook</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Weekly entries</p>
                            </div>
                        </div>
                    </Link>

                    {/* Final Submission Quick Action */}
                    <Link
                        href="/student/final-submission"
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all group"
                    >
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                                <TrendingUp className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white">Final Submission</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Marksheet & PPT</p>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Final Documents (Consolidated Logbook) */}
                {student?.status === 'Completed' && student?.finalConsolidatedLogbookUrl && (
                    <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-emerald-200 dark:border-emerald-900/50 p-6">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center space-x-4 text-center md:text-left">
                                <div className="p-4 bg-emerald-100 rounded-full">
                                    <BookOpen className="h-8 w-8 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Your Consolidated Logbook is ready!</h3>
                                    <p className="text-gray-600 dark:text-gray-400">Download your complete, signed internship record as a single PDF.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => window.open(student.finalConsolidatedLogbookUrl, '_blank')}
                                className="w-full md:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-200 dark:shadow-none flex items-center justify-center gap-2"
                            >
                                <FileText className="h-5 w-5" />
                                Download Combined PDF
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
