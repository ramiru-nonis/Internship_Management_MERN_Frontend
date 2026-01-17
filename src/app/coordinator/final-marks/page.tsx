"use client";
import React, { useState, useEffect } from "react";
import api from "@/lib/api";

interface Student {
    id: string; // Student ID
    userId: string; // User ID
    name: string;
    cbNumber: string;
    profilePicture?: string;
    batch?: string;
}

export default function CoordinatorFinalMarksPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const res = await api.get('/submissions/final-students');
            setStudents(res.data);
        } catch (error) {
            console.error("Error fetching students", error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
            {/* Left Sidebar: Student List */}
            <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen fixed">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Final Submissions</h2>
                    <p className="text-xs text-gray-500 mt-1">Students ready for marking</p>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {loading ? (
                        <div className="p-4 text-center text-sm text-gray-500">Loading students...</div>
                    ) : students.length > 0 ? (
                        students.map((student) => (
                            <button
                                key={student.id}
                                onClick={() => setSelectedStudent(student)}
                                className={`w-full flex items-center p-3 rounded-xl transition-all ${selectedStudent?.id === student.id
                                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-transparent'
                                    } border`}
                            >
                                <div className="relative">
                                    {student.profilePicture ? (
                                        <img
                                            src={student.profilePicture.startsWith('http') ? student.profilePicture : `${apiUrl}${student.profilePicture}`}
                                            alt={student.name}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                                            {student.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="ml-3 text-left">
                                    <p className={`text-sm font-semibold ${selectedStudent?.id === student.id ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`}>
                                        {student.name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{student.cbNumber}</p>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="p-6 text-center text-gray-400 text-sm">
                            No students have submitted final documents yet.
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 ml-80 p-8">
                {selectedStudent ? (
                    <div className="max-w-4xl mx-auto">
                        <header className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{selectedStudent.name}</h1>
                            <p className="text-gray-500 dark:text-gray-400">Manage final marks and grading</p>
                        </header>

                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="bg-blue-50 dark:bg-blue-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Grading Interface</h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                                Select a student from the left sidebar to view their submissions and assign final marks.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full mb-6">
                            <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-2">Select a Student</h2>
                        <p className="text-gray-500 dark:text-gray-400 max-w-md">
                            Choose a student from the list on the left to view their final submissions and enter marks.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
