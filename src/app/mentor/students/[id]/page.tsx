'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';
import {
    User, Mail, Phone, MapPin, Briefcase, Calendar,
    FileText, CheckCircle, Clock, ChevronLeft,
    Download, ExternalLink, GraduationCap, Award
} from 'lucide-react';
import LogbookModal from '@/components/LogbookModal';

export default function MentorStudentProfile() {
    const { id } = useParams();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showLogbookModal, setShowLogbookModal] = useState(false);

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

    const handleViewPdf = async (url: string, type?: 'cv' | 'other') => {
        if (!url) return;
        try {
            if (type === 'cv') {
                const proxyUrl = `${process.env.NEXT_PUBLIC_API_URL}/submissions/cv/${student.user._id}/view`;
                window.open(proxyUrl, '_blank');
                return;
            }
            const fullUrl = url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${url}`;
            window.open(fullUrl, '_blank');
        } catch (error) {
            console.error('Error viewing PDF:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading student profile...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Error</h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">{error || 'Student not found'}</p>
                    <button
                        onClick={() => router.back()}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const { student, placement, submissions } = data;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                {/* Back Link */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    Back to Dashboard
                </button>

                {/* Header Profile Section */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        <div className="h-24 w-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-800 shadow-md">
                            {student.profile_picture ? (
                                <img
                                    src={student.profile_picture.startsWith('http') ? student.profile_picture : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/${student.profile_picture}`}
                                    alt=""
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <User className="h-12 w-12 text-gray-400" />
                            )}
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {student.first_name} {student.last_name}
                                </h1>
                                <div className="flex justify-center md:justify-start">
                                    <StatusBadge status={student.status} />
                                </div>
                            </div>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-gray-600 dark:text-gray-400">
                                <span className="flex items-center"><Award className="w-4 h-4 mr-1.5" /> {student.cb_number}</span>
                                <span className="flex items-center"><Mail className="w-4 h-4 mr-1.5" /> {student.user?.email}</span>
                                <span className="flex items-center"><Phone className="w-4 h-4 mr-1.5" /> {student.contact_number}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Details & Preferences */}
                    <div className="lg:col-span-1 space-y-8">
                        {/* Academic Details */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-gray-900 dark:text-gray-100">
                            <h2 className="text-lg font-bold mb-4 flex items-center">
                                <GraduationCap className="w-5 h-5 mr-2 text-blue-600" />
                                Academic Details
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Degree Program</p>
                                    <p className="font-medium">{student.degree}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Level</p>
                                    <p className="font-medium">{student.degree_level}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Availability</p>
                                    <p className="font-medium">{student.availability}</p>
                                </div>
                                {student.batch && (
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Batch</p>
                                        <p className="font-medium">{student.batch}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Preferences */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-gray-900 dark:text-gray-100">
                            <h2 className="text-lg font-bold mb-4 flex items-center">
                                <Briefcase className="w-5 h-5 mr-2 text-indigo-600" />
                                Preferences
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {student.preferences && student.preferences.length > 0 ? (
                                    student.preferences.map((pref: string, index: number) => (
                                        <span key={index} className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">
                                            {pref}
                                        </span>
                                    ))
                                ) : (
                                    <p className="text-gray-500 italic">No preferences set</p>
                                )}
                            </div>
                        </div>

                        {/* Documents Section */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-gray-900 dark:text-gray-100">
                            <h2 className="text-lg font-bold mb-4 flex items-center">
                                <FileText className="w-5 h-5 mr-2 text-green-600" />
                                Submitted Documents
                            </h2>
                            <div className="space-y-3">
                                {submissions.academicMarksheet && (
                                    <button
                                        onClick={() => handleViewPdf(submissions.academicMarksheet.fileUrl)}
                                        className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/10 transition-all group"
                                    >
                                        <div className="flex items-center">
                                            <CheckCircle className="w-5 h-5 mr-3 text-teal-500" />
                                            <div>
                                                <p className="font-medium text-sm text-left">Academic Mentor Marksheet</p>
                                                <p className="text-xs text-gray-500 text-left">
                                                    Submitted: {new Date(submissions.academicMarksheet.submittedDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <Download className="w-4 h-4 text-gray-400 group-hover:text-teal-500" />
                                    </button>
                                )}
                                {student.cv && (
                                    <button
                                        onClick={() => handleViewPdf(student.cv, 'cv')}
                                        className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group"
                                    >
                                        <div className="flex items-center">
                                            <FileText className="w-5 h-5 mr-3 text-red-500" />
                                            <span className="font-medium text-sm">Main CV</span>
                                        </div>
                                        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                                    </button>
                                )}
                                {submissions.marksheet && (
                                    <button
                                        onClick={() => handleViewPdf(submissions.marksheet.fileUrl)}
                                        className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group"
                                    >
                                        <div className="flex items-center">
                                            <CheckCircle className="w-5 h-5 mr-3 text-green-500" />
                                            <span className="font-medium text-sm">Industry Mentor Marksheet</span>
                                        </div>
                                        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                                    </button>
                                )}
                                {submissions.presentation && (
                                    <button
                                        onClick={() => handleViewPdf(submissions.presentation.fileUrl)}
                                        className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group"
                                    >
                                        <div className="flex items-center">
                                            <ExternalLink className="w-5 h-5 mr-3 text-blue-500" />
                                            <span className="font-medium text-sm">Exit Presentation</span>
                                        </div>
                                        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                                    </button>
                                )}\
                                <button
                                    onClick={() => (submissions.logbooks.currentLogbookId || student.status === 'Completed') && setShowLogbookModal(true)}
                                    disabled={!submissions.logbooks.currentLogbookId && student.status !== 'Completed'}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all group ${(submissions.logbooks.currentLogbookId || student.status === 'Completed')
                                        ? 'border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10'
                                        : 'border-gray-100 dark:border-gray-800 opacity-60 cursor-not-allowed'
                                        }`}
                                >
                                    <div className="flex items-center">
                                        <Clock className="w-5 h-5 mr-3 text-orange-500" />
                                        <span className="font-medium text-sm">Approved Logbooks</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                            {submissions.logbooks.approved} / {submissions.logbooks.total}
                                        </span>
                                        {(submissions.logbooks.currentLogbookId || student.status === 'Completed') && (
                                            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                                        )}
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Applications & Placement */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Placement Info (If available) */}
                        {placement ? (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
                                    <h2 className="text-lg font-bold text-blue-900 dark:text-blue-100 flex items-center">
                                        <Briefcase className="w-5 h-5 mr-2" />
                                        Current Placement Details
                                    </h2>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Company</p>
                                        <p className="font-bold text-lg dark:text-white">{placement.company_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Position</p>
                                        <p className="font-bold text-lg dark:text-white">{placement.position}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Mentor</p>
                                        <p className="font-medium dark:text-gray-200">{placement.mentor_name} ({placement.mentor_email})</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                                        <p className="font-medium dark:text-gray-200">
                                            {new Date(placement.start_date).toLocaleDateString()} - {new Date(placement.end_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
                                <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No Placement Details</h3>
                                <p className="text-gray-500 dark:text-gray-400">This student has not been placed in an internship yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Logbook Modal */}
            <LogbookModal
                isOpen={showLogbookModal}
                onClose={() => setShowLogbookModal(false)}
                initialLogbookId={submissions.logbooks.currentLogbookId}
                studentId={student.user?._id || student.user}
                studentName={`${student.first_name} ${student.last_name}`}
            />
        </div>
    );
}
