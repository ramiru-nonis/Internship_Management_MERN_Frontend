'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
    FileText, Upload, CheckCircle, XCircle, Search,
    Loader, AlertCircle, RefreshCw
} from 'lucide-react';
import FileUpload from '@/components/FileUpload';

interface Student {
    _id: string;
    first_name: string;
    last_name: string;
    cb_number: string;
    user: {
        _id: string;
        email: string;
    };
    hasMarksheet: boolean;
}

export default function MarksheetSubmission() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const res = await api.get('/mentor/students-marks');
            setStudents(res.data);
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (file: File) => {
        if (!selectedStudent) return;
        setUploading(true);
        setMessage(null);

        const formData = new FormData();
        formData.append('studentId', selectedStudent._id);
        formData.append('file', file);

        try {
            await api.post('/mentor/marksheet', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setMessage({ type: 'success', text: 'Marksheet submitted successfully!' });

            // Refresh list to update status
            fetchStudents();

            // Wait a moment then clear selection
            setTimeout(() => {
                setSelectedStudent(null);
                setMessage(null);
            }, 2000);

        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to submit marksheet' });
        } finally {
            setUploading(false);
        }
    };

    const filteredStudents = students.filter(student =>
        student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.cb_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                        <FileText className="w-8 h-8 mr-3 text-blue-600" />
                        Marksheet Submission
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Upload and manage marksheets for your assigned students via PDF.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Student List */}
                    <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <input
                                    type="text"
                                    placeholder="Search students..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                                />
                            </div>
                        </div>
                        <div className="overflow-y-auto flex-1 p-2 space-y-2">
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((student) => (
                                    <button
                                        key={student._id}
                                        onClick={() => setSelectedStudent(student)}
                                        className={`w-full text-left p-4 rounded-xl border transition-all flex justify-between items-center group ${selectedStudent?._id === student._id
                                                ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 shadow-sm'
                                                : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                            }`}
                                    >
                                        <div>
                                            <p className={`font-bold ${selectedStudent?._id === student._id ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`}>
                                                {student.first_name} {student.last_name}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{student.cb_number}</p>
                                        </div>
                                        <div>
                                            {student.hasMarksheet ? (
                                                <div className="flex items-center text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg">
                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                    <span className="text-xs font-bold">Submitted</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center text-gray-400 bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded-lg">
                                                    <XCircle className="w-4 h-4 mr-1" />
                                                    <span className="text-xs font-bold">Pending</span>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="p-8 text-center text-gray-500">
                                    No students found matching your search.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Upload Area */}
                    <div className="lg:col-span-2">
                        {selectedStudent ? (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
                                <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100 dark:border-gray-700">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {selectedStudent.first_name} {selectedStudent.last_name}
                                        </h2>
                                        <p className="text-gray-500 mt-1 flex items-center">
                                            <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-xs font-bold mr-2 text-gray-600 dark:text-gray-300">
                                                {selectedStudent.cb_number}
                                            </span>
                                            {selectedStudent.user.email}
                                        </p>
                                    </div>
                                    {selectedStudent.hasMarksheet && (
                                        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-xl text-green-700 dark:text-green-300 border border-green-100 dark:border-green-800">
                                            <CheckCircle className="w-5 h-5" />
                                            <span className="font-bold text-sm">Marksheet on file</span>
                                        </div>
                                    )}
                                </div>

                                <div className="max-w-xl mx-auto text-center">
                                    <h3 className="text-lg font-semibold mb-2">
                                        {selectedStudent.hasMarksheet ? 'Update Marksheet' : 'Upload Marksheet'}
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-8">
                                        Please upload the final marksheet PDF. This will be visible to the Coordinator.
                                    </p>

                                    {uploading ? (
                                        <div className="py-12 flex flex-col items-center">
                                            <Loader className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                                            <p className="text-gray-600 font-medium">Submitting marksheet...</p>
                                        </div>
                                    ) : (
                                        <FileUpload
                                            onFileSelect={handleFileUpload}
                                            accept=".pdf"
                                            maxSize={5}
                                            label="Drop PDF here or click to browse"
                                        />
                                    )}

                                    {message && (
                                        <div className={`mt-6 p-4 rounded-xl flex items-center justify-center gap-3 ${message.type === 'success'
                                                ? 'bg-green-50 text-green-700 border border-green-100'
                                                : 'bg-red-50 text-red-700 border border-red-100'
                                            }`}>
                                            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                            <span className="font-medium">{message.text}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center h-full flex flex-col items-center justify-center text-gray-400">
                                <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-full mb-4">
                                    <Upload className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-300 mb-2">Select a Student</h3>
                                <p className="text-sm max-w-xs mx-auto">
                                    Choose a student from the list on the left to upload or update their marksheet.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
