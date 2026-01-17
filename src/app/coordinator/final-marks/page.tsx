'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface Student {
    _id: string;
    cb_number: string;
    first_name: string;
    last_name: string;
    email: string;
    hasFinalMarks: boolean;
    marksStatus: string;
    academic_mentor?: {
        first_name: string;
        last_name: string;
    };
}

interface Marksheet {
    _id: string;
    academicMentorMarks: {
        technical: number;
        softSkills: number;
        presentation: number;
        total: number;
    };
    academicMentorComments: {
        technical: string;
        softSkills: string;
        presentation: string;
    };
    industryMentorMarks: number | null;
    industryMentorComments: string | null;
    finalMarks: number | null;
    finalMarkStatus: string;
    submittedDate: string;
    finalMarksSubmittedDate: string | null;
}

interface StudentData {
    student: {
        _id: string;
        cb_number: string;
        first_name: string;
        last_name: string;
        email: string;
        academic_mentor?: {
            first_name: string;
            last_name: string;
        };
    };
    marksheet: Marksheet;
}

export default function FinalMarksPage() {
    const router = useRouter();
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [studentData, setStudentData] = useState<StudentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [industryMarks, setIndustryMarks] = useState<number | ''>('');
    const [industryComments, setIndustryComments] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

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

        fetchCompletedStudents();
    }, []);

    const fetchCompletedStudents = async () => {
        try {
            setLoading(true);
            const res = await api.get('/coordinator/final-marks/students');
            setStudents(res.data);
        } catch (error) {
            console.error('Error fetching students:', error);
            setError('Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    const handleStudentSelect = async (student: Student) => {
        try {
            setLoading(true);
            setError('');
            setSuccess('');
            setSelectedStudent(student);
            
            const res = await api.get(`/coordinator/final-marks/student/${student._id}`);
            setStudentData(res.data);
            
            // Pre-fill form with existing data if available
            if (res.data.marksheet.industryMentorMarks !== null) {
                setIndustryMarks(res.data.marksheet.industryMentorMarks);
            } else {
                setIndustryMarks('');
            }
            
            setIndustryComments(res.data.marksheet.industryMentorComments || '');
        } catch (error) {
            console.error('Error fetching student data:', error);
            setError('Failed to load student details');
            setSelectedStudent(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitMarks = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedStudent || !studentData) {
            setError('No student selected');
            return;
        }

        if (industryMarks === '' || industryMarks === null) {
            setError('Industry mentor marks are required');
            return;
        }

        const marksNum = typeof industryMarks === 'string' ? parseInt(industryMarks) : industryMarks;
        
        if (isNaN(marksNum) || marksNum < 0 || marksNum > 40) {
            setError('Industry mentor marks must be a number between 0 and 40');
            return;
        }

        try {
            setSubmitting(true);
            setError('');
            
            const res = await api.post(`/coordinator/final-marks/submit/${selectedStudent._id}`, {
                industryMentorMarks: marksNum,
                industryMentorComments: industryComments || undefined
            });

            setSuccess(`Final marks submitted successfully! Total: ${res.data.marksheet.finalMarks}/100`);
            
            // Refresh the student list to update status
            setTimeout(() => {
                fetchCompletedStudents();
                setSelectedStudent(null);
                setStudentData(null);
                setIndustryMarks('');
                setIndustryComments('');
                setSuccess('');
            }, 2000);
        } catch (error: any) {
            console.error('Error submitting marks:', error);
            setError(error.response?.data?.message || 'Failed to submit marks');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading && !studentData) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <Loader className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
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
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Final Marks Assignment</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Assign industry mentor marks to complete the final evaluation
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Students List */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                Completed Students ({students.length})
                            </h2>
                            
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {students.length === 0 ? (
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                                        No students with completed internships
                                    </p>
                                ) : (
                                    students.map((student) => (
                                        <button
                                            key={student._id}
                                            onClick={() => handleStudentSelect(student)}
                                            className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                                                selectedStudent?._id === student._id
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                                                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                                        {student.first_name} {student.last_name}
                                                    </p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                                        {student.cb_number}
                                                    </p>
                                                </div>
                                                {student.hasFinalMarks && (
                                                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                                                )}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Student Details and Form */}
                    <div className="lg:col-span-2">
                        {!selectedStudent ? (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
                                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 dark:text-gray-400">
                                    Select a student to view their marks and submit final evaluation
                                </p>
                            </div>
                        ) : studentData ? (
                            <div className="space-y-6">
                                {/* Error/Success Messages */}
                                {error && (
                                    <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
                                        <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                                    </div>
                                )}
                                
                                {success && (
                                    <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4">
                                        <p className="text-green-800 dark:text-green-200 text-sm">{success}</p>
                                    </div>
                                )}

                                {/* Student Information */}
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                        Student Information
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-600 dark:text-gray-400">Name</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {studentData.student.first_name} {studentData.student.last_name}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600 dark:text-gray-400">CB Number</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {studentData.student.cb_number}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600 dark:text-gray-400">Email</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {studentData.student.email}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600 dark:text-gray-400">Academic Mentor</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {studentData.student.academic_mentor
                                                    ? `${studentData.student.academic_mentor.first_name} ${studentData.student.academic_mentor.last_name}`
                                                    : 'Not assigned'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Academic Mentor Marks */}
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                        Academic Mentor Marks (Read-Only)
                                    </h3>
                                    <div className="space-y-4">
                                        {/* Technical Skills */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Technical Skill Development
                                                </label>
                                                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                                    {studentData.marksheet.academicMentorMarks.technical}/20
                                                </span>
                                            </div>
                                            {studentData.marksheet.academicMentorComments.technical && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded">
                                                    {studentData.marksheet.academicMentorComments.technical}
                                                </p>
                                            )}
                                        </div>

                                        {/* Soft Skills */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Soft Skill Development
                                                </label>
                                                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                                    {studentData.marksheet.academicMentorMarks.softSkills}/20
                                                </span>
                                            </div>
                                            {studentData.marksheet.academicMentorComments.softSkills && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded">
                                                    {studentData.marksheet.academicMentorComments.softSkills}
                                                </p>
                                            )}
                                        </div>

                                        {/* Presentation Skills */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Presentation Skills
                                                </label>
                                                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                                    {studentData.marksheet.academicMentorMarks.presentation}/20
                                                </span>
                                            </div>
                                            {studentData.marksheet.academicMentorComments.presentation && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded">
                                                    {studentData.marksheet.academicMentorComments.presentation}
                                                </p>
                                            )}
                                        </div>

                                        {/* Total Academic Mentor Marks */}
                                        <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4">
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-gray-900 dark:text-white">
                                                    Academic Mentor Total
                                                </span>
                                                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                    {studentData.marksheet.academicMentorMarks.total}/60
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Industry Mentor Marks Form */}
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                        Industry Mentor Marks (Coordinator Entry)
                                    </h3>
                                    
                                    <form onSubmit={handleSubmitMarks} className="space-y-4">
                                        {/* Industry Marks Input */}
                                        <div>
                                            <label htmlFor="industryMarks" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Industry Mentor Marks *
                                            </label>
                                            <div className="flex items-center gap-4">
                                                <input
                                                    type="number"
                                                    id="industryMarks"
                                                    value={industryMarks}
                                                    onChange={(e) => setIndustryMarks(e.target.value === '' ? '' : parseInt(e.target.value))}
                                                    min="0"
                                                    max="40"
                                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                                    placeholder="Enter marks (0-40)"
                                                    disabled={submitting}
                                                />
                                                <span className="text-lg font-bold text-gray-600 dark:text-gray-400">/40</span>
                                            </div>
                                        </div>

                                        {/* Comments */}
                                        <div>
                                            <label htmlFor="comments" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Comments (Optional)
                                            </label>
                                            <textarea
                                                id="comments"
                                                value={industryComments}
                                                onChange={(e) => setIndustryComments(e.target.value)}
                                                rows={4}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                                placeholder="Add any feedback from industry mentor..."
                                                disabled={submitting}
                                            />
                                        </div>

                                        {/* Final Marks Preview */}
                                        {industryMarks !== '' && !isNaN(Number(industryMarks)) && (
                                            <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold text-gray-900 dark:text-white">
                                                        Final Marks Preview:
                                                    </span>
                                                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                        {studentData.marksheet.academicMentorMarks.total + Number(industryMarks)}/100
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                                                    {studentData.marksheet.academicMentorMarks.total}/60 (Academic) + {industryMarks}/40 (Industry)
                                                </p>
                                            </div>
                                        )}

                                        {/* Status Display */}
                                        {studentData.marksheet.finalMarkStatus === 'submitted' && (
                                            <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4">
                                                <p className="text-green-800 dark:text-green-200 text-sm font-medium">
                                                    ✓ Final marks already submitted
                                                </p>
                                            </div>
                                        )}

                                        {/* Submit Button */}
                                        <button
                                            type="submit"
                                            disabled={submitting || studentData.marksheet.finalMarkStatus === 'submitted'}
                                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors"
                                        >
                                            {submitting ? 'Submitting...' : 'Submit Final Marks'}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
                                <Loader className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                                <p className="text-gray-600 dark:text-gray-400">Loading student details...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
