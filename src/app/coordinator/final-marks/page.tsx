'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';
import { Search, Mail, Phone, FileText, User, Save, AlertCircle } from 'lucide-react';

export default function FinalMarksPage() {
    const router = useRouter();
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
    const [marks, setMarks] = useState<{ [key: string]: any }>({});
    const [saving, setSaving] = useState(false);

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

        const delayDebounceFn = setTimeout(() => {
            fetchCompletedStudents();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const fetchCompletedStudents = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (searchTerm) params.search = searchTerm;

            const res = await api.get('/coordinator/final-marks', { params });
            setStudents(res.data);
            
            // Initialize marks state with existing data
            const initialMarks: { [key: string]: any } = {};
            res.data.forEach((student: any) => {
                if (student.marksheet?.marks) {
                    initialMarks[student._id] = {
                        technical: student.marksheet.marks.technical || 0,
                        softSkills: student.marksheet.marks.softSkills || 0,
                        presentation: student.marksheet.marks.presentation || 0,
                        comments: student.marksheet.comments || {}
                    };
                } else {
                    initialMarks[student._id] = {
                        technical: 0,
                        softSkills: 0,
                        presentation: 0,
                        comments: {}
                    };
                }
            });
            setMarks(initialMarks);
        } catch (error) {
            console.error('Error fetching completed students:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkChange = (studentId: string, field: string, value: any) => {
        setMarks(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [field]: value
            }
        }));
    };

    const handleCommentChange = (studentId: string, field: string, value: string) => {
        setMarks(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                comments: {
                    ...(prev[studentId]?.comments || {}),
                    [field]: value
                }
            }
        }));
    };

    const handleSaveMarks = async (studentId: string) => {
        try {
            setSaving(true);
            const studentMarks = marks[studentId];

            const response = await api.post(`/coordinator/final-marks/${studentId}`, {
                technical: parseInt(studentMarks.technical) || 0,
                softSkills: parseInt(studentMarks.softSkills) || 0,
                presentation: parseInt(studentMarks.presentation) || 0,
                comments: studentMarks.comments
            });

            // Update student data with new marksheet
            setStudents(prev => prev.map(s =>
                s._id === studentId
                    ? { ...s, marksheet: response.data.marksheet }
                    : s
            ));

            alert('Final marks saved successfully!');
        } catch (error: any) {
            console.error('Error saving marks:', error);
            alert(error.response?.data?.message || 'Failed to save marks');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading completed students...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Final Marks Assignment</h1>
                    <p className="text-gray-600 mt-2 dark:text-gray-400">
                        Assign final marks to completed students. Only students with 'Completed' status are shown.
                    </p>
                </div>

                {/* Search Bar */}
                <div className="mb-6 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or CB number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                    </div>
                </div>

                {/* Info Banner */}
                <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                            Maximum marks: Technical (20), Soft Skills (20), Presentation (20) = Total (60)
                        </p>
                    </div>
                </div>

                {/* Students List */}
                {students.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <p className="text-gray-600 dark:text-gray-400 mb-2">No completed students found</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">Students need to be marked as 'Completed' in the Students tab to appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {students.map((student) => {
                            const studentMarks = marks[student._id];
                            const total = (parseInt(studentMarks?.technical) || 0) +
                                (parseInt(studentMarks?.softSkills) || 0) +
                                (parseInt(studentMarks?.presentation) || 0);
                            const isExpanded = expandedStudentId === student._id;

                            return (
                                <div
                                    key={student._id}
                                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                                >
                                    {/* Header / Summary Row */}
                                    <div
                                        className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                        onClick={() => setExpandedStudentId(isExpanded ? null : student._id)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                                    {student.profile_picture ? (
                                                        <img
                                                            src={student.profile_picture.startsWith('http') ? student.profile_picture : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/${student.profile_picture}`}
                                                            alt=""
                                                            className="h-12 w-12 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <User className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                                        {student.first_name} {student.last_name}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">{student.cb_number}</div>
                                                </div>
                                            </div>

                                            {/* Summary Info */}
                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                                        {total}/60
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">Total Marks</div>
                                                </div>
                                                <div className="text-gray-400">
                                                    <svg
                                                        className={`h-6 w-6 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    {isExpanded && (
                                        <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-700/50">
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                {/* Contact Info */}
                                                <div>
                                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">
                                                        Contact Information
                                                    </h3>
                                                    <div className="space-y-3">
                                                        <div className="flex items-start gap-3">
                                                            <Mail className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                                                            <div className="text-sm text-gray-600 dark:text-gray-300">{student.user?.email}</div>
                                                        </div>
                                                        <div className="flex items-start gap-3">
                                                            <Phone className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                                                            <div className="text-sm text-gray-600 dark:text-gray-300">{student.contact_number}</div>
                                                        </div>
                                                        {student.academic_mentor && (
                                                            <div className="pt-3 border-t border-gray-300 dark:border-gray-600">
                                                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Assigned Academic Mentor:</p>
                                                                <p className="text-sm text-gray-900 dark:text-white font-medium">
                                                                    {student.academic_mentor.first_name} {student.academic_mentor.last_name}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Marks Input */}
                                                <div>
                                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">
                                                        Final Marks (Max 20 each)
                                                    </h3>
                                                    <div className="space-y-4">
                                                        {[
                                                            { label: 'Technical', key: 'technical' },
                                                            { label: 'Soft Skills', key: 'softSkills' },
                                                            { label: 'Presentation', key: 'presentation' }
                                                        ].map(({ label, key }) => (
                                                            <div key={key}>
                                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                                    {label}
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="20"
                                                                    value={studentMarks?.[key] || 0}
                                                                    onChange={(e) =>
                                                                        handleMarkChange(student._id, key, Math.min(20, Math.max(0, parseInt(e.target.value) || 0)))
                                                                    }
                                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Comments Section */}
                                            <div className="mt-8 pt-8 border-t border-gray-300 dark:border-gray-600">
                                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">
                                                    Comments
                                                </h3>
                                                <div className="space-y-4">
                                                    {[
                                                        { label: 'Technical', key: 'technical' },
                                                        { label: 'Soft Skills', key: 'softSkills' },
                                                        { label: 'Presentation', key: 'presentation' }
                                                    ].map(({ label, key }) => (
                                                        <div key={key}>
                                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                                {label} Comment
                                                            </label>
                                                            <textarea
                                                                rows={2}
                                                                placeholder={`Add comments about ${label.toLowerCase()}...`}
                                                                value={studentMarks?.comments?.[key] || ''}
                                                                onChange={(e) =>
                                                                    handleCommentChange(student._id, key, e.target.value)
                                                                }
                                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Save Button */}
                                            <div className="mt-8 flex justify-end">
                                                <button
                                                    onClick={() => handleSaveMarks(student._id)}
                                                    disabled={saving}
                                                    className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-500 disabled:opacity-70 text-white font-semibold rounded-lg transition-colors"
                                                >
                                                    <Save className="h-4 w-4" />
                                                    {saving ? 'Saving...' : 'Save Final Marks'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
