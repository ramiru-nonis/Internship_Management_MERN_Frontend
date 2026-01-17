'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';
import {
    User, Mail, Phone, MapPin, Briefcase, Calendar,
    FileText, CheckCircle, Clock, ChevronLeft,
    Download, ExternalLink, GraduationCap, Award, AlertCircle
} from 'lucide-react';
import LogbookModal from '@/components/LogbookModal';

export default function StudentProfile() {
    const { id } = useParams();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mentors, setMentors] = useState<any[]>([]);
    const [assigning, setAssigning] = useState(false);
    const [showLogbookModal, setShowLogbookModal] = useState(false);

    useEffect(() => {
        fetchStudentProfile();
        fetchMentors();
    }, [id]);

    const fetchMentors = async () => {
        try {
            const res = await api.get('/coordinator/mentors');
            setMentors(res.data);
        } catch (err) {
            console.error('Error fetching mentors:', err);
        }
    };

    const fetchStudentProfile = async () => {
        try {
            const res = await api.get(`/coordinator/students/${id}/profile`);
            setData(res.data);
        } catch (err: any) {
            console.error('Error fetching student profile:', err);
            setError(err.response?.data?.message || 'Failed to load student profile');
        } finally {
            setLoading(false);
        }
    };

    const handleAssignMentor = async (mentorId: string) => {
        setAssigning(true);
        try {
            await api.put(`/coordinator/students/${id}/assign-mentor`, { mentorId });
            alert('Mentor assigned successfully');
            fetchStudentProfile();
        } catch (err) {
            console.error('Error assigning mentor:', err);
            alert('Failed to assign mentor');
        } finally {
            setAssigning(false);
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

    const { student, applications, placement, submissions } = data;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                {/* Back Link */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    Back to Students
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

                        {/* Academic Mentor Assignment */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-gray-900 dark:text-gray-100">
                            <h2 className="text-lg font-bold mb-4 flex items-center">
                                <User className="w-5 h-5 mr-2 text-purple-600" />
                                Academic Mentor
                            </h2>
                            <div className="space-y-4">
                                <select
                                    disabled={assigning || student.status !== 'Completed'}
                                    value={student.academic_mentor?._id || ''}
                                    onChange={(e) => handleAssignMentor(e.target.value)}
                                    className={`w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all ${student.status === 'Completed' ? 'bg-gray-50 dark:bg-gray-900 cursor-pointer' : 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-60'}`}
                                    title={student.status !== 'Completed' ? "Mentors can only be assigned to students who have completed their internship" : ""}
                                >
                                    <option value="">Not Assigned</option>
                                    {mentors.map((mentor) => (
                                        <option key={mentor._id} value={mentor._id}>
                                            {mentor.first_name} {mentor.last_name}
                                        </option>
                                    ))}
                                </select>
                                {student.academic_mentor && (
                                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800/50">
                                        <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                                            {student.academic_mentor.first_name} {student.academic_mentor.last_name}
                                        </p>
                                        <p className="text-xs text-purple-600 dark:text-purple-400">
                                            {student.academic_mentor.email}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
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

                        {/* Academic Mentor Marksheet */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-gray-900 dark:text-gray-100">
                            <h2 className="text-lg font-bold mb-4 flex items-center">
                                <FileText className="w-5 h-5 mr-2 text-teal-600" />
                                Academic Mentor Marksheet
                            </h2>
                            {submissions.marksheet ? (
                                <div className="space-y-3">
                                    <button
                                        onClick={() => handleViewPdf(submissions.marksheet.fileUrl)}
                                        className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/10 transition-all group"
                                    >
                                        <div className="flex items-center">
                                            <CheckCircle className="w-5 h-5 mr-3 text-teal-500" />
                                            <div>
                                                <p className="font-medium text-sm text-left">Marksheet Submitted</p>
                                                <p className="text-xs text-gray-500 text-left">
                                                    {new Date(submissions.marksheet.submittedDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <Download className="w-4 h-4 text-gray-400 group-hover:text-teal-500" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                                    <AlertCircle className="w-5 h-5 mr-3 text-gray-400" />
                                    <span className="text-sm text-gray-500 italic">Marksheet not submitted yet</span>
                                </div>
                            )}
                        </div>

                        {/* Documents Section */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-gray-900 dark:text-gray-100">
                            <h2 className="text-lg font-bold mb-4 flex items-center">
                                <FileText className="w-5 h-5 mr-2 text-green-600" />
                                Submitted Documents
                            </h2>
                            <div className="space-y-3">
                                {student.cv && (
                                    <button
                                        onClick={() => handleViewPdf(student.cv)}
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
                                            <span className="font-medium text-sm">Final Marksheet</span>
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
                                )}
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
                        {placement && (
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
                        )}

                        {/* Applications Table */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                                    <Briefcase className="w-5 h-5 mr-2 text-blue-600" />
                                    Jobs Applied For
                                </h2>
                                <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold">
                                    {applications.length} Total
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Company & Position</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {applications.length > 0 ? (
                                            applications.map((app: any) => (
                                                <tr key={app._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <p className="font-bold text-gray-900 dark:text-white">{app.internship?.title || 'Unknown Position'}</p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">{app.internship?.company_name || 'N/A'}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                        {new Date(app.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${app.status === 'Accepted' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                                            app.status === 'Rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                                                app.status === 'Applied' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                                                    'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                                                            }`}>
                                                            {app.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-12 text-center text-gray-500 italic">
                                                    No applications found for this student.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
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
