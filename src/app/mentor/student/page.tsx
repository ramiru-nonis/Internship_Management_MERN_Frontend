'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface StudentWithMarks {
    _id: string;
    first_name: string;
    last_name: string;
    cb_number: string;
    email: string;
    academicMentorMarks: number | null;
    industryMentorMarks: number | null;
    finalMarks: number | null;
    finalMarkStatus: string;
    finalMarksSubmittedDate: string | null;
}

export default function MentorFinalMarksPage() {
    const router = useRouter();
    const [students, setStudents] = useState<StudentWithMarks[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState<StudentWithMarks | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');

        if (!token || !user) {
            router.push('/login');
            return;
        }

        const userData = JSON.parse(user);
        if (userData.role !== 'academic_mentor') {
            router.push('/login');
            return;
        }

        fetchStudentsWithMarks();
    }, []);

    const fetchStudentsWithMarks = async () => {
        try {
            setLoading(true);
            const res = await api.get('/mentor/final-marks');
            setStudents(res.data);
        } catch (error) {
            console.error('Error fetching students with marks:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(student =>
        student.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.cb_number.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Loading students...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Student Final Marks</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        View finalized marks for students assigned to you
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Students List */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder="Search students..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                />
                            </div>

                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                Students ({filteredStudents.length})
                            </h2>

                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {filteredStudents.length === 0 ? (
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                                        No students found
                                    </p>
                                ) : (
                                    filteredStudents.map((student) => (
                                        <button
                                            key={student._id}
                                            onClick={() => setSelectedStudent(student)}
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
                                                {student.finalMarkStatus === 'submitted' && (
                                                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                                                )}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Student Details */}
                    <div className="lg:col-span-2">
                        {!selectedStudent ? (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center h-96 flex items-center justify-center">
                                <div>
                                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Select a student to view their final marks
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Student Info */}
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                        Student Information
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-600 dark:text-gray-400">Name</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {selectedStudent.first_name} {selectedStudent.last_name}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600 dark:text-gray-400">CB Number</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {selectedStudent.cb_number}
                                            </p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-gray-600 dark:text-gray-400">Email</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {selectedStudent.email}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Marks Display */}
                                {selectedStudent.finalMarkStatus === 'submitted' && selectedStudent.finalMarks !== null ? (
                                    <div className="space-y-6">
                                        {/* Academic Mentor Marks */}
                                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg shadow-sm border border-blue-200 dark:border-blue-800 p-6">
                                            <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300 mb-4">
                                                Academic Mentor Marks
                                            </h3>
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-700 dark:text-gray-300">Your Evaluation</span>
                                                <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                                    {selectedStudent.academicMentorMarks}/60
                                                </span>
                                            </div>
                                        </div>

                                        {/* Industry Mentor Marks */}
                                        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg shadow-sm border border-orange-200 dark:border-orange-800 p-6">
                                            <h3 className="text-lg font-bold text-orange-900 dark:text-orange-300 mb-4">
                                                Industry Mentor Marks
                                            </h3>
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-700 dark:text-gray-300">Coordinator Assigned</span>
                                                <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                                                    {selectedStudent.industryMentorMarks}/40
                                                </span>
                                            </div>
                                        </div>

                                        {/* Final Marks */}
                                        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-900/50 rounded-lg shadow-sm border border-green-200 dark:border-green-800 p-6">
                                            <h3 className="text-lg font-bold text-green-900 dark:text-green-300 mb-4">
                                                Final Marks (Finalized)
                                            </h3>
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-700 dark:text-gray-300 font-semibold">Total</span>
                                                <span className="text-4xl font-bold text-green-600 dark:text-green-400">
                                                    {selectedStudent.finalMarks}
                                                    <span className="text-xl text-gray-500 dark:text-gray-400 ml-2">/100</span>
                                                </span>
                                            </div>
                                            {selectedStudent.finalMarksSubmittedDate && (
                                                <p className="text-xs text-green-700 dark:text-green-400 mt-4">
                                                    Finalized on {new Date(selectedStudent.finalMarksSubmittedDate).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>

                                        {/* Breakdown */}
                                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                                Mark Breakdown
                                            </h3>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                    <span className="text-gray-700 dark:text-gray-300">Academic Mentor</span>
                                                    <span className="font-semibold text-gray-900 dark:text-white">
                                                        {selectedStudent.academicMentorMarks}/60
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                    <span className="text-gray-700 dark:text-gray-300">Industry Mentor</span>
                                                    <span className="font-semibold text-gray-900 dark:text-white">
                                                        {selectedStudent.industryMentorMarks}/40
                                                    </span>
                                                </div>
                                                <div className="border-t border-gray-300 dark:border-gray-600 pt-3 flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                                    <span className="font-bold text-gray-900 dark:text-white">Total</span>
                                                    <span className="text-xl font-bold text-green-600 dark:text-green-400">
                                                        {selectedStudent.finalMarks}/100
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg shadow-sm border border-yellow-200 dark:border-yellow-800 p-8 text-center">
                                        <AlertCircle className="h-12 w-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-4" />
                                        <p className="text-yellow-800 dark:text-yellow-300 font-medium">
                                            Final marks not yet submitted
                                        </p>
                                        <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-2">
                                            The coordinator will submit final marks once they assign industry mentor marks.
                                        </p>
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
