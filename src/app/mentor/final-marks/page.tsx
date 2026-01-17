'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Search, AlertCircle } from 'lucide-react';

interface StudentFinalMarks {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
    academicMentorMarks: number;
    academicMentorComments: string;
    industryMentorMarks: number;
    industryMentorComments: string;
    finalMarks: number;
    finalMarkStatus: string;
    finalMarksSubmittedDate: string;
}

export default function MentorFinalMarksPage() {
    const [students, setStudents] = useState<StudentFinalMarks[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<StudentFinalMarks | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchStudentsWithFinalMarks();
    }, []);

    const fetchStudentsWithFinalMarks = async () => {
        try {
            setLoading(true);
            const response = await api.get('/mentor/final-marks');
            setStudents(response.data);
            setError('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load students with final marks');
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(student =>
        `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Final Marks - Assigned Students</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">View final marks for students you have mentored</p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Students List */}
                    <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-lg shadow">
                        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Students</h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search students..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                        <div className="divide-y divide-gray-200 dark:divide-slate-700 max-h-[600px] overflow-y-auto">
                            {filteredStudents.length === 0 ? (
                                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                                    {students.length === 0 ? 'No students with final marks yet' : 'No students match your search'}
                                </div>
                            ) : (
                                filteredStudents.map(student => (
                                    <button
                                        key={student._id}
                                        onClick={() => setSelectedStudent(student)}
                                        className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition ${
                                            selectedStudent?._id === student._id ? 'bg-blue-50 dark:bg-blue-900' : ''
                                        }`}
                                    >
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {student.first_name} {student.last_name}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{student.email}</p>
                                            <p className="text-sm font-semibold text-green-600 dark:text-green-400 mt-2">
                                                {student.finalMarks}/100
                                            </p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Student Details */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                        {selectedStudent ? (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {selectedStudent.first_name} {selectedStudent.last_name}
                                    </h2>
                                    <p className="text-gray-500 dark:text-gray-400">{selectedStudent.email}</p>
                                </div>

                                {error && (
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-lg flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {/* Your Academic Marks */}
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-6">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Your Academic Marks (Mentor Assigned)</h3>
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
                                                    Your Comments
                                                </label>
                                                <p className="text-gray-600 dark:text-gray-400 p-3 bg-white dark:bg-slate-700 rounded">
                                                    {selectedStudent.academicMentorComments}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Industry Mentor Marks */}
                                <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg p-6">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Industry Mentor Marks (Coordinator Assigned)</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Marks (out of 40)
                                            </label>
                                            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                                                {selectedStudent.industryMentorMarks}
                                            </div>
                                        </div>
                                        {selectedStudent.industryMentorComments && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Comments
                                                </label>
                                                <p className="text-gray-600 dark:text-gray-400 p-3 bg-white dark:bg-slate-700 rounded">
                                                    {selectedStudent.industryMentorComments}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Final Marks Summary */}
                                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-6">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Final Marks Summary</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-white dark:bg-slate-700 p-4 rounded-lg text-center">
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Academic</p>
                                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedStudent.academicMentorMarks}/60</p>
                                        </div>
                                        <div className="bg-white dark:bg-slate-700 p-4 rounded-lg text-center">
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Industry</p>
                                            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{selectedStudent.industryMentorMarks}/40</p>
                                        </div>
                                        <div className="bg-white dark:bg-slate-700 p-4 rounded-lg text-center border-2 border-green-500">
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total</p>
                                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{selectedStudent.finalMarks}/100</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Submission Status */}
                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 p-4 rounded-lg">
                                    <p className="text-sm font-semibold">Status: Finalized</p>
                                    {selectedStudent.finalMarksSubmittedDate && (
                                        <p className="text-sm mt-1">
                                            Finalized on {new Date(selectedStudent.finalMarksSubmittedDate).toLocaleDateString('en-GB', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-96 text-gray-500 dark:text-gray-400">
                                <p>Select a student to view their final marks</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
