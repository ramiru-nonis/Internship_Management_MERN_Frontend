'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import api from '@/lib/api';
import { Search, Mail, Phone, User, Save, AlertCircle, ChevronRight } from 'lucide-react';

export default function FinalMarksPage() {
    const router = useRouter();
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [industryMarks, setIndustryMarks] = useState<number>(0);
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
            
            // Auto-select first student if available
            if (res.data.length > 0 && !selectedStudent) {
                const firstStudent = res.data[0];
                setSelectedStudent(firstStudent);
                setIndustryMarks(firstStudent.marksheet?.industryMentorMarks || 0);
            }
        } catch (error) {
            console.error('Error fetching completed students:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectStudent = (student: any) => {
        setSelectedStudent(student);
        setIndustryMarks(student.marksheet?.industryMentorMarks || 0);
    };

    const handleSaveMarks = async () => {
        if (!selectedStudent) return;

        try {
            setSaving(true);
            
            const response = await api.post(`/coordinator/final-marks/${selectedStudent._id}`, {
                industryMentorMarks: parseInt(industryMarks) || 0
            });

            // Update student data with new marksheet
            setStudents(prev => prev.map(s =>
                s._id === selectedStudent._id
                    ? { ...s, marksheet: response.data.marksheet }
                    : s
            ));
            
            // Update selected student
            setSelectedStudent(prev => ({
                ...prev,
                marksheet: response.data.marksheet
            }));

            alert('Final marks submitted successfully!');
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

    const academicMarksTotal = selectedStudent?.marksheet?.marks?.total || 0;
    const industryMarksNum = parseInt(industryMarks) || 0;
    const finalMarksTotal = academicMarksTotal + industryMarksNum;
    const isAlreadySubmitted = selectedStudent?.marksheet?.finalMarksSubmitted;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Final Marks Assignment</h1>
                    <p className="text-gray-600 mt-2 dark:text-gray-400">
                        Assign industry mentor marks to completed students
                    </p>
                </div>

                {/* Main Layout */}
                <div className="flex gap-6">
                    {/* Left Sidebar - Students List */}
                    <div className="w-full md:w-80 flex-shrink-0">
                        {/* Search Bar */}
                        <div className="mb-4 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search students..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            />
                        </div>

                        {/* Students List */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                            <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                                {students.length === 0 ? (
                                    <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                                        <p>No completed students found</p>
                                    </div>
                                ) : (
                                    students.map((student) => (
                                        <button
                                            key={student._id}
                                            onClick={() => handleSelectStudent(student)}
                                            className={`w-full px-4 py-4 border-b border-gray-200 dark:border-gray-700 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                                                selectedStudent?._id === student._id
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-600'
                                                    : ''
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                                                        {student.first_name} {student.last_name}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                        {student.cb_number}
                                                    </p>
                                                    {student.marksheet?.finalMarksSubmitted && (
                                                        <p className="text-xs font-medium text-green-600 dark:text-green-400 mt-1">
                                                            ✓ Submitted
                                                        </p>
                                                    )}
                                                </div>
                                                {selectedStudent?._id === student._id && (
                                                    <ChevronRight className="h-5 w-5 text-blue-600 ml-2 flex-shrink-0" />
                                                )}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Content - Details */}
                    <div className="flex-1">
                        {!selectedStudent ? (
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                                <p className="text-gray-600 dark:text-gray-400">Select a student to view their marks</p>
                            </div>
                        ) : !selectedStudent.marksheet ? (
                            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
                                <div className="flex items-start gap-4">
                                    <AlertCircle className="h-6 w-6 text-amber-600 mt-1 flex-shrink-0" />
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">No Academic Mentor Marksheet</h3>
                                        <p className="text-gray-600 dark:text-gray-300">
                                            This student does not have an academic mentor marksheet yet. The academic mentor must submit their marksheet first before you can assign final marks.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Student Info Card */}
                                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="h-14 w-14 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                                            {selectedStudent.profile_picture ? (
                                                <img
                                                    src={selectedStudent.profile_picture.startsWith('http') ? selectedStudent.profile_picture : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/${selectedStudent.profile_picture}`}
                                                    alt=""
                                                    className="h-14 w-14 rounded-full object-cover"
                                                />
                                            ) : (
                                                <User className="h-7 w-7 text-blue-600" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                                {selectedStudent.first_name} {selectedStudent.last_name}
                                            </h2>
                                            <p className="text-gray-600 dark:text-gray-400 mt-1">{selectedStudent.cb_number}</p>
                                            <div className="flex gap-4 mt-3 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-gray-400" />
                                                    <span className="text-gray-600 dark:text-gray-300">{selectedStudent.user?.email}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4 text-gray-400" />
                                                    <span className="text-gray-600 dark:text-gray-300">{selectedStudent.contact_number}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Info Banner */}
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
                                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-blue-900 dark:text-blue-200">
                                        <p className="font-medium">Final Marks Breakdown:</p>
                                        <p className="mt-1">Academic Mentor: 0-60 | Industry Mentor: 0-40 | Total: 0-100</p>
                                    </div>
                                </div>

                                {/* Marks Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Academic Mentor Marks */}
                                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-4">
                                            Academic Mentor Marks
                                        </h3>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Technical</p>
                                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                    {selectedStudent.marksheet?.marks?.technical || 0}/20
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Soft Skills</p>
                                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                    {selectedStudent.marksheet?.marks?.softSkills || 0}/20
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Presentation</p>
                                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                    {selectedStudent.marksheet?.marks?.presentation || 0}/20
                                                </p>
                                            </div>
                                            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total</p>
                                                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                                                    {academicMarksTotal}/60
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Industry Mentor Marks */}
                                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-4">
                                            Industry Mentor Marks
                                        </h3>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                                Enter Marks (0-40)
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="40"
                                                value={industryMarks}
                                                onChange={(e) =>
                                                    setIndustryMarks(Math.min(40, Math.max(0, parseInt(e.target.value) || 0)))
                                                }
                                                disabled={isAlreadySubmitted}
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-2xl font-bold text-center disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                                            />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                                                Out of 40
                                            </p>
                                        </div>
                                    </div>

                                    {/* Final Marks */}
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800 p-6">
                                        <h3 className="text-sm font-semibold text-green-900 dark:text-green-300 uppercase tracking-wider mb-4">
                                            Final Total Marks
                                        </h3>
                                        <div className="text-center">
                                            <p className="text-5xl font-bold text-green-600 dark:text-green-400 mb-2">
                                                {finalMarksTotal}
                                            </p>
                                            <p className="text-sm text-green-700 dark:text-green-300">Out of 100</p>
                                            {isAlreadySubmitted && (
                                                <p className="text-xs font-medium text-green-700 dark:text-green-300 mt-4 bg-green-100 dark:bg-green-900/40 px-3 py-2 rounded">
                                                    ✓ Already Submitted
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Academic Mentor Marksheet */}
                                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                        Academic Mentor Marksheet Details
                                    </h3>
                                    
                                    {selectedStudent.academic_mentor && (
                                        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                                Submitted by Mentor:
                                            </p>
                                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {selectedStudent.academic_mentor.first_name} {selectedStudent.academic_mentor.last_name}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {selectedStudent.academic_mentor.email}
                                            </p>
                                        </div>
                                    )}

                                    {/* Comments Section */}
                                    <div className="space-y-4">
                                        {[
                                            { label: 'Technical', key: 'technical' },
                                            { label: 'Soft Skills', key: 'softSkills' },
                                            { label: 'Presentation', key: 'presentation' }
                                        ].map(({ label, key }) => (
                                            <div key={key} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
                                                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                                    {label} - {selectedStudent.marksheet?.marks?.[key] || 0}/20
                                                </h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded">
                                                    {selectedStudent.marksheet?.comments?.[key] || 'No comments provided'}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Submit Button */}
                                {!isAlreadySubmitted && (
                                    <div className="flex justify-end gap-3">
                                        <button
                                            onClick={handleSaveMarks}
                                            disabled={saving}
                                            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-500 disabled:opacity-70 text-white font-semibold rounded-lg transition-colors"
                                        >
                                            <Save className="h-5 w-5" />
                                            {saving ? 'Submitting...' : 'Submit Final Marks'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
