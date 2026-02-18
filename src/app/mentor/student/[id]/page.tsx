'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';
import {
    User, Mail, Phone, MapPin, Briefcase, Calendar,
    FileText, CheckCircle, Clock, ChevronLeft,
    ExternalLink, GraduationCap, Award
} from 'lucide-react';

export default function MentorStudentProfile() {
    const { id } = useParams();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchStudentProfile();
    }, [id]);

    const fetchStudentProfile = async () => {
        try {
            const res = await api.get(`/mentor/students/${id}`);
            setData(res.data);
        } catch (err: any) {
            console.error('Error fetching student profile:', err);
            setError(err.response?.data?.message || 'Failed to load student profile');
        } finally {
            setLoading(false);
        }
    };

    const handleViewPdf = async (url: string) => {
        if (!url) return;
        try {
            const fullUrl = url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${url}`;
            window.open(fullUrl, '_blank');
        } catch (error) {
            console.error('Error viewing PDF:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
                <div className="text-center max-w-sm">
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl mb-4">
                        <FileText className="w-12 h-12 text-red-600 mx-auto" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Unavailable</h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">{error || 'This student may not be assigned to you.'}</p>
                    <button
                        onClick={() => router.push('/mentor/dashboard')}
                        className="mt-6 w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const { student, applications, placement, submissions } = data;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <button
                    onClick={() => router.back()}
                    className="flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-colors font-medium"
                >
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    Back
                </button>

                {/* Profile Header */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 mb-8">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                        <div className="h-32 w-32 rounded-3xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl">
                            {student.profile_picture ? (
                                <img
                                    src={student.profile_picture.startsWith('http') ? student.profile_picture : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/${student.profile_picture}`}
                                    alt=""
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <User className="h-16 w-16 text-gray-400" />
                            )}
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                                <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                                    {student.first_name} {student.last_name}
                                </h1>
                                <div className="flex justify-center md:justify-start">
                                    <StatusBadge status={student.status} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-gray-600 dark:text-gray-400">
                                <div className="flex items-center gap-2">
                                    <Award className="w-5 h-5 text-blue-500" />
                                    <span className="font-medium">{student.cb_number}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="w-5 h-5 text-indigo-500" />
                                    <span className="font-medium truncate">{student.user?.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="w-5 h-5 text-green-500" />
                                    <span className="font-medium">{student.contact_number}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-8">
                        {/* Academic Summary */}
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                            <h2 className="text-xl font-bold mb-6 flex items-center text-gray-900 dark:text-white">
                                <GraduationCap className="w-6 h-6 mr-3 text-blue-600" />
                                Academic Data
                            </h2>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Program</p>
                                    <p className="font-bold text-gray-900 dark:text-gray-100">{student.degree}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Availability</p>
                                    <p className="font-bold text-gray-900 dark:text-gray-100">{student.availability}</p>
                                </div>
                                {student.batch && (
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Current Year/Batch</p>
                                        <p className="font-bold text-gray-900 dark:text-gray-100">{student.batch}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Logbook Status */}
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-xl p-8 text-white">
                            <div className="flex items-center justify-between mb-6">
                                <Clock className="w-8 h-8 opacity-50" />
                                <span className="text-xs font-bold uppercase tracking-widest opacity-70">Weekly Progress</span>
                            </div>
                            <div className="text-center">
                                <div className="text-6xl font-black mb-2">{submissions.logbooks.approved}</div>
                                <p className="text-blue-100 font-bold uppercase tracking-widest text-xs">
                                    Logbooks Approved
                                </p>
                                <div className="mt-6 pt-6 border-t border-white/10">
                                    <p className="text-sm opacity-80">Total submitted: {submissions.logbooks.total}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Current Placement */}
                        {placement ? (
                            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                                <div className="px-8 py-6 bg-blue-50 dark:bg-blue-900/10 border-b border-gray-100 dark:border-gray-700">
                                    <h2 className="text-xl font-bold text-blue-900 dark:text-blue-100 flex items-center">
                                        <Briefcase className="w-6 h-6 mr-3" />
                                        Industry Placement
                                    </h2>
                                </div>
                                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Organization</p>
                                        <p className="font-black text-xl text-gray-900 dark:text-white">{placement.company_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Role</p>
                                        <p className="font-black text-xl text-gray-900 dark:text-white">{placement.position}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Industry Mentor</p>
                                        <p className="font-bold text-gray-900 dark:text-white">{placement.mentor_name}</p>
                                        <p className="text-sm text-gray-500">{placement.mentor_email}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Duration</p>
                                        <p className="font-bold text-gray-900 dark:text-white">
                                            {new Date(placement.start_date).toLocaleDateString()} - {new Date(placement.end_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-8 rounded-3xl flex items-center gap-6">
                                <div className="p-4 bg-amber-100 dark:bg-amber-900/30 rounded-2xl">
                                    <Briefcase className="w-8 h-8 text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100">No active placement</h3>
                                    <p className="text-amber-700 dark:text-amber-400/80">The student hasn't submitted a placement form or started their internship yet.</p>
                                </div>
                            </div>
                        )}

                        {/* Recent Documents */}
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                            <h2 className="text-xl font-bold mb-8 flex items-center text-gray-900 dark:text-white">
                                <FileText className="w-6 h-6 mr-3 text-green-600" />
                                Professional Documents
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {student.cv && (
                                    <button
                                        onClick={() => handleViewPdf(student.cv)}
                                        className="flex items-center justify-between p-5 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50/50 transition-all group"
                                    >
                                        <div className="flex items-center">
                                            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl mr-4">
                                                <FileText className="w-6 h-6 text-red-600" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-gray-900 dark:text-white">Curriculum Vitae</p>
                                                <p className="text-xs text-gray-500">Professional CV</p>
                                            </div>
                                        </div>
                                        <ExternalLink className="w-5 h-5 text-gray-300 group-hover:text-blue-600" />
                                    </button>
                                )}
                                {submissions.marksheet && (
                                    <button
                                        onClick={() => handleViewPdf(submissions.marksheet.fileUrl)}
                                        className="flex items-center justify-between p-5 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-green-500 hover:bg-green-50/50 transition-all group"
                                    >
                                        <div className="flex items-center">
                                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl mr-4">
                                                <CheckCircle className="w-6 h-6 text-green-600" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-gray-900 dark:text-white">Final Marksheet</p>
                                                <p className="text-xs text-gray-500">Graded Submission</p>
                                            </div>
                                        </div>
                                        <ExternalLink className="w-5 h-5 text-gray-300 group-hover:text-green-600" />
                                    </button>
                                )}
                                {student.finalConsolidatedLogbookUrl && (
                                    <button
                                        onClick={() => handleViewPdf(student.finalConsolidatedLogbookUrl)}
                                        className="flex items-center justify-between p-5 rounded-2xl border border-emerald-100 dark:border-emerald-700/50 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group lg:col-span-2"
                                    >
                                        <div className="flex items-center">
                                            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl mr-4">
                                                <Award className="w-6 h-6 text-emerald-600" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-gray-900 dark:text-white">Consolidated Logbook</p>
                                                <p className="text-xs text-gray-500">Combined Record PDF (All Months)</p>
                                            </div>
                                        </div>
                                        <ExternalLink className="w-5 h-5 text-gray-300 group-hover:text-emerald-600" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
