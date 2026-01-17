'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Search, ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';

interface Student {
    _id: string;
    userId: string;
    firstName: string;
    lastName: string;
    cbNumber: string;
    profilePicture?: string;
    email: string;
    status: string;
}

interface StudentSubmissions {
    marksheet?: {
        _id: string;
        fileUrl: string;
        submittedDate: string;
    };
    presentation?: {
        _id: string;
        fileUrl: string;
        submittedDate: string;
        scheduledDate?: string;
        meetLink?: string;
    };
}

export default function FinalMarksPage() {
    const router = useRouter();
    const [students, setStudents] = useState<Student[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [studentSubmissions, setStudentSubmissions] = useState<StudentSubmissions | null>(null);
    const [submissionsLoading, setSubmissionsLoading] = useState(false);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

    useEffect(() => {
        fetchFinalSubmissionStudents();
    }, []);

    const fetchFinalSubmissionStudents = async () => {
        try {
            setLoading(true);
            const response = await api.get('/submissions/final-submissions');
            setStudents(response.data);
            setFilteredStudents(response.data);
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        const filtered = students.filter(
            student =>
                student.firstName.toLowerCase().includes(query.toLowerCase()) ||
                student.lastName.toLowerCase().includes(query.toLowerCase()) ||
                student.cbNumber.toLowerCase().includes(query.toLowerCase()) ||
                student.email.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredStudents(filtered);
    };

    const handleSelectStudent = async (student: Student) => {
        setSelectedStudent(student);
        setSubmissionsLoading(true);
        try {
            const response = await api.get(`/submissions/student/${student.userId}`);
            setStudentSubmissions(response.data);
        } catch (error) {
            console.error('Error fetching student submissions:', error);
        } finally {
            setSubmissionsLoading(false);
        }
    };

    const handleViewPdf = (fileUrl: string) => {
        const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${apiUrl}${fileUrl}`;
        window.open(fullUrl, '_blank');
    };

    const handleDownloadFile = (fileUrl: string, fileName: string) => {
        const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${apiUrl}${fileUrl}`;
        const link = document.createElement('a');
        link.href = fullUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <Link
                            href="/coordinator/dashboard"
                            className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Link>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Final Marks & Submissions</h1>
                    <p className="text-gray-600 dark:text-gray-400">Review and manage student final submissions (Marksheet & Presentation)</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Student List Sidebar */}
                    <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-[800px]">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Students with Submissions</h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search student..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
                            </p>
                        </div>

                        {/* Student List */}
                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="p-4 text-center text-gray-500 dark:text-gray-400">Loading students...</div>
                            ) : filteredStudents.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 dark:text-gray-400">No students found with final submissions</div>
                            ) : (
                                filteredStudents.map((student) => (
                                    <button
                                        key={student._id}
                                        onClick={() => handleSelectStudent(student)}
                                        className={`w-full text-left p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                                            selectedStudent?._id === student._id
                                                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-l-indigo-600'
                                                : ''
                                        }`}
                                    >
                                        {student.profilePicture && (
                                            <img
                                                src={student.profilePicture}
                                                alt={student.firstName}
                                                className="w-10 h-10 rounded-full mb-2 object-cover"
                                            />
                                        )}
                                        <p className="font-semibold text-sm text-gray-900 dark:text-white">
                                            {student.firstName} {student.lastName}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{student.cbNumber}</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 break-all">{student.email}</p>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Submission Details */}
                    <div className="lg:col-span-3">
                        {!selectedStudent ? (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                                <div className="text-gray-400 dark:text-gray-500 mb-4">
                                    <svg className="w-16 h-16 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">Select a Student</h3>
                                <p className="text-gray-500 dark:text-gray-400">Choose a student from the list to view their final submissions</p>
                            </div>
                        ) : submissionsLoading ? (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                                <p className="text-gray-600 dark:text-gray-400">Loading submissions...</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Student Header */}
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center space-x-4">
                                            {selectedStudent.profilePicture && (
                                                <img
                                                    src={selectedStudent.profilePicture}
                                                    alt={selectedStudent.firstName}
                                                    className="w-16 h-16 rounded-full object-cover"
                                                />
                                            )}
                                            <div>
                                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                                    {selectedStudent.firstName} {selectedStudent.lastName}
                                                </h2>
                                                <p className="text-gray-600 dark:text-gray-400">{selectedStudent.cbNumber}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-500">{selectedStudent.email}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                                                selectedStudent.status === 'Completed'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                            }`}>
                                                {selectedStudent.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Marksheet Card */}
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                                        <svg className="w-6 h-6 mr-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Marksheet (Industry)
                                    </h3>
                                    {studentSubmissions?.marksheet ? (
                                        <div className="space-y-4">
                                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                                <p className="text-green-700 dark:text-green-300 font-semibold flex items-center mb-2">
                                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Submitted
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {new Date(studentSubmissions.marksheet.submittedDate).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => studentSubmissions.marksheet && handleViewPdf(studentSubmissions.marksheet.fileUrl)}
                                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center"
                                                >
                                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => studentSubmissions.marksheet && handleDownloadFile(studentSubmissions.marksheet.fileUrl, 'marksheet.pdf')}
                                                    className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center"
                                                >
                                                    <Download className="w-5 h-5 mr-2" />
                                                    Download
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 dark:text-gray-400">No marksheet submitted yet</p>
                                    )}
                                </div>

                                {/* Presentation Card */}
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                                        <svg className="w-6 h-6 mr-3 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        Exit Presentation
                                    </h3>
                                    {studentSubmissions?.presentation ? (
                                        <div className="space-y-4">
                                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                                <p className="text-green-700 dark:text-green-300 font-semibold flex items-center mb-2">
                                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Submitted
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {new Date(studentSubmissions.presentation.submittedDate).toLocaleString()}
                                                </p>
                                            </div>

                                            {studentSubmissions.presentation.scheduledDate && (
                                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                                    <p className="text-blue-700 dark:text-blue-300 font-semibold mb-2">Scheduled Presentation</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {new Date(studentSubmissions.presentation.scheduledDate).toLocaleDateString('en-GB', {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                        })}
                                                    </p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {new Date(studentSubmissions.presentation.scheduledDate).toLocaleTimeString('en-GB', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </p>
                                                    {studentSubmissions.presentation.meetLink && (
                                                        <a
                                                            href={studentSubmissions.presentation.meetLink}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="mt-3 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                                                        >
                                                            Join Meeting
                                                        </a>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => studentSubmissions.presentation && handleViewPdf(studentSubmissions.presentation.fileUrl)}
                                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center"
                                                >
                                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => studentSubmissions.presentation && handleDownloadFile(studentSubmissions.presentation.fileUrl, 'presentation.pdf')}
                                                    className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center"
                                                >
                                                    <Download className="w-5 h-5 mr-2" />
                                                    Download
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 dark:text-gray-400">No presentation submitted yet</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
