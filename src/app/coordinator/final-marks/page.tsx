'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Check, AlertCircle, Send } from 'lucide-react';

interface Student {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
    status: string;
}

interface StudentMarks {
    _id: string;
    first_name: string;
    last_name: string;
    academicMentorMarks: number;
    academicMentorComments: string;
    industryMentorMarks: number | null;
    industryMentorComments: string | null;
    finalMarks: number | null;
    finalMarkStatus: string;
    finalMarksSubmittedDate?: string;
}

export default function FinalMarksPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<StudentMarks | null>(null);
    const [industryMarks, setIndustryMarks] = useState<number | null>(null);
    const [industryComments, setIndustryComments] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchCompletedStudents();
    }, []);

    const fetchCompletedStudents = async () => {
        try {
            setLoading(true);
            const response = await api.get('/coordinator/final-marks/students');
            setStudents(response.data);
            setError('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    const handleStudentSelect = async (student: Student) => {
        try {
            setError('');
            const response = await api.get(`/coordinator/final-marks/student/${student._id}`);
            const markData = response.data;
            setSelectedStudent(markData);
            setIndustryMarks(markData.industryMentorMarks || null);
            setIndustryComments(markData.industryMentorComments || '');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load student marks');
        }
    };

    const handleSubmitMarks = async () => {
        if (!selectedStudent || industryMarks === null) {
            setError('Please enter industry mentor marks');
            return;
        }

        if (industryMarks < 0 || industryMarks > 40) {
            setError('Industry marks must be between 0 and 40');
            return;
        }

        try {
            setSubmitting(true);
            setError('');
            await api.post(`/coordinator/final-marks/submit/${selectedStudent._id}`, {
                industryMentorMarks: industryMarks,
                industryMentorComments: industryComments
            });
            setSuccess('Final marks submitted successfully!');
            setTimeout(() => setSuccess(''), 3000);
            
            // Refresh student data
            const response = await api.get(`/coordinator/final-marks/student/${selectedStudent._id}`);
            setSelectedStudent(response.data);
            setIndustryMarks(response.data.industryMentorMarks);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit marks');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredStudents = students.filter(student =>
        `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const calculateFinalMarks = () => {
        if (selectedStudent && industryMarks !== null) {
            return selectedStudent.academicMentorMarks + industryMarks;
        }
        return null;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-lg text-gray-500">Loading students...</div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Final Marks Assignment</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Assign industry mentor marks to complete final marks calculation</p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Students List */}
                    <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-lg shadow">
                        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Completed Students</h2>
                            <input
                                type="text"
                                placeholder="Search students..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="divide-y divide-gray-200 dark:divide-slate-700 max-h-[600px] overflow-y-auto">
                            {filteredStudents.length === 0 ? (
                                <div className="p-6 text-center text-gray-500 dark:text-gray-400">No completed students found</div>
                            ) : (
                                filteredStudents.map(student => (
                                    <button
                                        key={student._id}
                                        onClick={() => handleStudentSelect(student)}
                                        className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition ${
                                            selectedStudent?._id === student._id ? 'bg-blue-50 dark:bg-blue-900' : ''
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                    {student.first_name} {student.last_name}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{student.email}</p>
                                            </div>
                                            {selectedStudent?._id === student._id && selectedStudent.finalMarkStatus === 'submitted' && (
                                                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                            )}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Marks Form */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                        {selectedStudent ? (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {selectedStudent.first_name} {selectedStudent.last_name}
                                    </h2>
                                    <p className="text-gray-500 dark:text-gray-400">Final Marks Assignment</p>
                                </div>

                                {error && (
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-lg flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {success && (
                                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 p-4 rounded-lg flex items-center gap-3">
                                        <Check className="w-5 h-5" />
                                        <span>{success}</span>
                                    </div>
                                )}

                                {/* Academic Mentor Marks (Read-only) */}
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-6">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Academic Mentor Marks</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Marks (out of 60)
                                            </label>
                                            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                                {selectedStudent.academicMentorMarks}
                                            </div>
                                        </div>
                                        {selectedStudent.academicMentorComments && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Comments
                                                </label>
                                                <p className="text-gray-600 dark:text-gray-400 p-3 bg-white dark:bg-slate-700 rounded">
                                                    {selectedStudent.academicMentorComments}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Industry Mentor Marks (Editable) */}
                                <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg p-6">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Industry Mentor Marks</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="industryMarks" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Marks (out of 40)
                                            </label>
                                            <input
                                                id="industryMarks"
                                                type="number"
                                                min="0"
                                                max="40"
                                                value={industryMarks ?? ''}
                                                onChange={(e) => setIndustryMarks(e.target.value ? Number(e.target.value) : null)}
                                                disabled={selectedStudent.finalMarkStatus === 'submitted'}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-amber-500 outline-none"
                                                placeholder="Enter marks (0-40)"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="industryComments" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Comments (Optional)
                                            </label>
                                            <textarea
                                                id="industryComments"
                                                value={industryComments}
                                                onChange={(e) => setIndustryComments(e.target.value)}
                                                disabled={selectedStudent.finalMarkStatus === 'submitted'}
                                                rows={3}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                                                placeholder="Add any comments about the performance..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Final Marks Summary */}
                                {industryMarks !== null && (
                                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-6">
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Final Marks Summary</h3>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="bg-white dark:bg-slate-700 p-4 rounded-lg text-center">
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Academic</p>
                                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedStudent.academicMentorMarks}/60</p>
                                            </div>
                                            <div className="bg-white dark:bg-slate-700 p-4 rounded-lg text-center">
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Industry</p>
                                                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{industryMarks}/40</p>
                                            </div>
                                            <div className="bg-white dark:bg-slate-700 p-4 rounded-lg text-center border-2 border-green-500">
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total</p>
                                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{calculateFinalMarks()}/100</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Submission Button */}
                                {selectedStudent.finalMarkStatus !== 'submitted' ? (
                                    <button
                                        onClick={handleSubmitMarks}
                                        disabled={submitting || industryMarks === null}
                                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
                                    >
                                        <Send className="w-5 h-5" />
                                        {submitting ? 'Submitting...' : 'Submit Final Marks'}
                                    </button>
                                ) : (
                                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 p-4 rounded-lg flex items-center gap-3">
                                        <Check className="w-5 h-5" />
                                        <div>
                                            <p className="font-semibold">Marks Already Submitted</p>
                                            <p className="text-sm">Final marks were submitted on {new Date(selectedStudent.finalMarksSubmittedDate || '').toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-96 text-gray-500 dark:text-gray-400">
                                <p>Select a student to view and assign their final marks</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
