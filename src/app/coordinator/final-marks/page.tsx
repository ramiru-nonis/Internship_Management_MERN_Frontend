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

interface MarksheetData {
    _id: string;
    fileUrl: string;
    submittedDate: string;
    marks?: {
        technical: number;
        softSkills: number;
        presentation: number;
        total: number;
    };
    comments?: {
        technical: string;
        softSkills: string;
        presentation: string;
    };
    industryMarks?: number;
    finalTotal?: number;
    finalGradingStatus: 'Pending' | 'Completed';
}

interface GradingDetails {
    student: {
        name: string;
        cbNumber: string;
        profilePicture?: string;
    };
    marksheet?: MarksheetData;
    presentation?: any; // Add type if needed
}

export default function CoordinatorFinalMarksPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loadingList, setLoadingList] = useState(true);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

    // Grading Data
    const [gradingDetails, setGradingDetails] = useState<GradingDetails | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Form State
    const [industryMarks, setIndustryMarks] = useState<string>("");
    const [calculating, setCalculating] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

    useEffect(() => {
        fetchStudents();
    }, []);

    useEffect(() => {
        if (selectedStudentId) {
            fetchGradingDetails(selectedStudentId);
        } else {
            setGradingDetails(null);
        }
    }, [selectedStudentId]);

    const fetchStudents = async () => {
        try {
            const res = await api.get('/submissions/final-students');
            setStudents(res.data);
        } catch (error) {
            console.error("Error fetching students", error);
        } finally {
            setLoadingList(false);
        }
    }

    const fetchGradingDetails = async (studentUserId: string) => {
        setLoadingDetails(true);
        // Reset form
        setIndustryMarks("");
        try {
            const res = await api.get(`/submissions/grading/${studentUserId}`);
            setGradingDetails(res.data);

            // Pre-fill if already graded
            if (res.data.marksheet?.industryMarks !== undefined) {
                setIndustryMarks(res.data.marksheet.industryMarks.toString());
            }
        } catch (error) {
            console.error("Error fetching details", error);
        } finally {
            setLoadingDetails(false);
        }
    }

    const handleIndustryMarksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === '' || (Number(val) >= 0 && Number(val) <= 40)) {
            setIndustryMarks(val);
        }
    };

    const handleSubmit = async () => {
        if (!gradingDetails?.marksheet || !selectedStudentId) return;

        const marks = Number(industryMarks);
        if (isNaN(marks) || marks < 0 || marks > 40) {
            alert("Please enter valid Industry Marks (0-40).");
            return;
        }

        const confirmSubmit = window.confirm(`Submit Industry Marks: ${marks}? This will calculate the final total.`);
        if (!confirmSubmit) return;

        setSubmitting(true);
        try {
            await api.post('/submissions/final-grade', {
                studentId: selectedStudentId,
                industryMarks: marks
            });
            alert("Final marks submitted successfully!");
            fetchGradingDetails(selectedStudentId); // Refresh to show completed status
        } catch (error: any) {
            console.error("Error submitting", error);
            alert(error.response?.data?.message || "Failed to submit marks.");
        } finally {
            setSubmitting(false);
        }
    };

    const academicTotal = gradingDetails?.marksheet?.marks?.total || 0;
    const currentIndustryMarks = Number(industryMarks) || 0;
    const calculatedFinalTotal = academicTotal + currentIndustryMarks;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
            {/* Sidebar */}
            <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen fixed overflow-hidden z-10">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Final Submissions</h2>
                    <p className="text-xs text-gray-500 mt-1">Select a student to grade</p>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {loadingList ? (
                        <div className="p-4 text-center text-sm text-gray-500">Loading students...</div>
                    ) : students.length > 0 ? (
                        students.map((student) => (
                            <button
                                key={student.id}
                                onClick={() => setSelectedStudentId(student.userId)}
                                className={`w-full flex items-center p-3 rounded-xl transition-all ${selectedStudentId === student.userId
                                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 shadow-sm'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-transparent'
                                    } border`}
                            >
                                <div className="relative flex-shrink-0">
                                    {student.profilePicture ? (
                                        <img
                                            src={student.profilePicture.startsWith('http') ? student.profilePicture : `${apiUrl}${student.profilePicture}`}
                                            alt={student.name}
                                            className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                                            {student.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="ml-3 text-left overflow-hidden">
                                    <p className={`text-sm font-semibold truncate ${selectedStudentId === student.userId ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`}>
                                        {student.name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{student.cbNumber}</p>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="p-6 text-center text-gray-400 text-sm">
                            No final submissions found.
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 ml-80 p-8 overflow-y-auto h-screen">
                {selectedStudentId && gradingDetails ? (
                    <div className="max-w-5xl mx-auto space-y-6 pb-20">
                        {/* Header */}
                        <div className="flex items-center space-x-6 mb-8">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                                {gradingDetails.student.profilePicture ? (
                                    <img
                                        src={gradingDetails.student.profilePicture.startsWith('http') ? gradingDetails.student.profilePicture : `${apiUrl}${gradingDetails.student.profilePicture}`}
                                        alt={gradingDetails.student.name}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : gradingDetails.student.name.charAt(0)}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{gradingDetails.student.name}</h1>
                                <p className="text-gray-500 dark:text-gray-400 text-lg">{gradingDetails.student.cbNumber}</p>
                            </div>
                            <div className="ml-auto">
                                {gradingDetails.marksheet?.finalGradingStatus === 'Completed' ? (
                                    <span className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full font-bold text-sm border border-green-200 dark:border-green-800">
                                        Grading Completed
                                    </span>
                                ) : (
                                    <span className="px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full font-bold text-sm border border-yellow-200 dark:border-yellow-800">
                                        Pending Grading
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                            {/* Left Column: Academic Marks & Proofs */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Academic Mentor Marks */}
                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
                                            <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                                            Academic Mentor Evaluation
                                        </h3>
                                        {gradingDetails.marksheet?.fileUrl && (
                                            <a
                                                href={gradingDetails.marksheet.fileUrl.startsWith('http') ? gradingDetails.marksheet.fileUrl : `${apiUrl}${gradingDetails.marksheet.fileUrl}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-sm px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 transition-colors font-medium flex items-center"
                                            >
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                                View Marksheet
                                            </a>
                                        )}
                                    </div>

                                    {gradingDetails.marksheet?.marks ? (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl text-center border border-gray-100 dark:border-gray-700">
                                                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Technical</p>
                                                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{gradingDetails.marksheet.marks.technical}<span className="text-sm text-gray-400 font-normal">/20</span></p>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl text-center border border-gray-100 dark:border-gray-700">
                                                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Soft Skills</p>
                                                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{gradingDetails.marksheet.marks.softSkills}<span className="text-sm text-gray-400 font-normal">/20</span></p>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl text-center border border-gray-100 dark:border-gray-700">
                                                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Presentation</p>
                                                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{gradingDetails.marksheet.marks.presentation}<span className="text-sm text-gray-400 font-normal">/20</span></p>
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-semibold text-gray-700 dark:text-gray-300">Academic Subtotal</span>
                                                    <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{gradingDetails.marksheet.marks.total}<span className="text-sm text-gray-400 font-normal">/60</span></span>
                                                </div>
                                            </div>

                                            {/* Comments */}
                                            {gradingDetails.marksheet.comments && (
                                                <div className="mt-6 space-y-3">
                                                    <h4 className="text-sm font-bold text-gray-500 uppercase">Mentor Comments</h4>
                                                    {gradingDetails.marksheet.comments.technical && (
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/20 p-3 rounded-lg"><strong className="text-indigo-500 block text-xs mb-1">Technical</strong> {gradingDetails.marksheet.comments.technical}</p>
                                                    )}
                                                    {gradingDetails.marksheet.comments.softSkills && (
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/20 p-3 rounded-lg"><strong className="text-indigo-500 block text-xs mb-1">Soft Skills</strong> {gradingDetails.marksheet.comments.softSkills}</p>
                                                    )}
                                                    {gradingDetails.marksheet.comments.presentation && (
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/20 p-3 rounded-lg"><strong className="text-indigo-500 block text-xs mb-1">Presentation</strong> {gradingDetails.marksheet.comments.presentation}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-gray-400 bg-gray-50 dark:bg-gray-700/20 rounded-xl">
                                            Academic Mentor marks have not been submitted yet.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Column: Industry Marks & Final Total */}
                            <div className="space-y-6">
                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-600 sticky top-6">
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        Final Grading
                                    </h3>

                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                            Industry Mentor Marks (Max 40)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="40"
                                            value={industryMarks}
                                            onChange={handleIndustryMarksChange}
                                            disabled={gradingDetails.marksheet?.finalGradingStatus === 'Completed'}
                                            placeholder="Enter marks (0-40)"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:dark:bg-gray-800 disabled:text-gray-500"
                                        />
                                    </div>

                                    <div className="space-y-4 border-t border-b border-gray-100 dark:border-gray-700 py-6 mb-6">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500 dark:text-gray-400">Academic Score (60%)</span>
                                            <span className="font-semibold text-gray-800 dark:text-white">{academicTotal}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500 dark:text-gray-400">Industry Score (40%)</span>
                                            <span className="font-semibold text-gray-800 dark:text-white">{currentIndustryMarks}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-lg font-bold text-gray-800 dark:text-white">Final Total</span>
                                            <span className={`text-3xl font-bold ${calculatedFinalTotal >= 50 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                                                {calculatedFinalTotal}<span className="text-sm text-gray-400 font-normal">/100</span>
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSubmit}
                                        disabled={submitting || gradingDetails.marksheet?.finalGradingStatus === 'Completed' || !gradingDetails.marksheet?.marks}
                                        className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all ${gradingDetails.marksheet?.finalGradingStatus === 'Completed'
                                                ? 'bg-gray-400 cursor-not-allowed text-gray-100'
                                                : !gradingDetails.marksheet?.marks
                                                    ? 'bg-gray-300 cursor-not-allowed text-gray-500' // Disable if Academic Marks missing
                                                    : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-green-500/30 hover:-translate-y-1'
                                            }`}
                                    >
                                        {submitting ? 'Submitting...' :
                                            gradingDetails.marksheet?.finalGradingStatus === 'Completed' ? 'Grading Completed' :
                                                !gradingDetails.marksheet?.marks ? 'Waiting for Academic Marks' :
                                                    'Submit Final Grade'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center pb-20">
                        {loadingDetails ? (
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        ) : (
                            <>
                                <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-full mb-6">
                                    <svg className="w-16 h-16 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                </div>
                                <h2 className="text-3xl font-bold text-gray-700 dark:text-gray-200 mb-3">Select a Student</h2>
                                <p className="text-gray-500 dark:text-gray-400 max-w-md text-lg">
                                    Choose a student from the sidebar to view their marksheet and assign final grades.
                                </p>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
