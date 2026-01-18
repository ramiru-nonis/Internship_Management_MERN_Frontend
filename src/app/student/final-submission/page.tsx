"use client";
import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { FiLock } from "react-icons/fi";
import { Award, CheckCircle } from "lucide-react";

export default function FinalSubmissionPage() {
    const router = useRouter();
    const [marksheet, setMarksheet] = useState<File | null>(null);
    const [presentation, setPresentation] = useState<File | null>(null);
    const [studentId, setStudentId] = useState<string | null>(null);

    // New State for existing submissions
    const [existingMarksheet, setExistingMarksheet] = useState<any>(null);
    const [finalizedMarksheet, setFinalizedMarksheet] = useState<any>(null);
    const [existingPresentation, setExistingPresentation] = useState<any>(null);
    const [combinedLogbookUrl, setCombinedLogbookUrl] = useState<string | null>(null);

    // Attempt Counts
    const [marksheetCount, setMarksheetCount] = useState<number>(0);
    const [presentationCount, setPresentationCount] = useState<number>(0);

    // UI Toggle for Resubmission
    const [showMarksheetUpload, setShowMarksheetUpload] = useState(false);
    const [showPresentationUpload, setShowPresentationUpload] = useState(false);

    const [loading, setLoading] = useState(true);
    const [logbookStatus, setLogbookStatus] = useState({ complete: false, total: 0, approved: 0 });

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setStudentId(user._id);
            fetchExistingSubmissions(user._id);
        }
    }, []);

    const fetchExistingSubmissions = async (id: string) => {
        try {
            const res = await api.get(`/submissions/student/${id}`);
            setExistingMarksheet(res.data.marksheet);
            setFinalizedMarksheet(res.data.finalizedMarksheet);
            setExistingPresentation(res.data.presentation);
            setMarksheetCount(res.data.marksheetCount || 0);
            setPresentationCount(res.data.presentationCount || 0);
            setCombinedLogbookUrl(res.data.combinedLogbookUrl);

            if (res.data.logbookStatus) {
                setLogbookStatus(res.data.logbookStatus);
            }
        } catch (error) {
            console.error("Error fetching submissions", error);
        } finally {
            setLoading(false);
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'marksheet' | 'presentation') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if ((type === 'marksheet' || type === 'presentation') && file.type !== 'application/pdf') {
                alert(`${type === 'marksheet' ? 'Marksheet' : 'Presentation'} must be a PDF`);
                return;
            }

            if (type === 'marksheet') setMarksheet(file);
            else setPresentation(file);
        }
    }

    const handleSubmit = async () => {
        if (!studentId) return;

        const confirmed = window.confirm("Are you sure you want to submit these files? This will count as one of your attempts.");
        if (!confirmed) return;

        setLoading(true);

        try {
            // Upload Marksheet if new
            if (marksheet) {
                const marksheetData = new FormData();
                marksheetData.append('marksheet', marksheet);
                marksheetData.append('studentId', studentId);
                await api.post('/submissions/marksheet', marksheetData);
            }

            // Upload Presentation if new
            if (presentation) {
                const presentationData = new FormData();
                presentationData.append('presentation', presentation);
                presentationData.append('studentId', studentId);
                await api.post('/submissions/presentation', presentationData);
            }

            // Notify Coordinator - Only if both parts exist NOW (whether just uploaded or existing)
            await api.post('/submissions/notify', {
                studentId,
                combinedLogbookUrl // Include this in notification logic if needed, or backend can fetch it
            });

            alert("Submission processed.");
            // Refresh
            fetchExistingSubmissions(studentId); // This will set loading to false in its finally block
            setMarksheet(null);
            setPresentation(null);
            setShowMarksheetUpload(false);
            setShowPresentationUpload(false);

        } catch (error: any) {
            console.error("Error submitting files", error);
            const msg = error.response?.data?.message || "Failed to submit files.";
            alert(`Submission failed: ${msg}`);
            setLoading(false); // Ensure loading is reset on error
        }
    }

    // Checking if we are "done" is nuanced now.
    // Done if: we have existing files AND user isn't trying to upload new ones.
    const canSubmit = (marksheet || presentation);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Final Submission</h1>
                <p className="text-gray-500 mb-8">Upload your Marksheet and Exit Presentation (PDF only) to complete your internship.</p>

                {/* STRICT LOCK: If logbooks are not strictly complete, BLOCK EVERYTHING */}
                {!loading && !logbookStatus.complete && (
                    <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-3xl p-12 shadow-xl border border-gray-200 dark:border-gray-700 text-center space-y-6">
                        <div className="bg-red-50 dark:bg-red-900/30 p-6 rounded-full">
                            <FiLock className="text-5xl text-red-500 dark:text-red-400" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Submission Locked</h2>
                            <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
                                To unlock this page, you must have an <strong>Approved Logbook</strong> for every month of your placement duration.
                            </p>
                        </div>

                        <div className="w-full max-w-md bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                            <div
                                className="bg-red-500 h-full transition-all duration-1000"
                                style={{ width: `${(logbookStatus.approved / Math.max(logbookStatus.total, 1)) * 100}%` }}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-8 text-left max-w-xs mx-auto w-full">
                            <div>
                                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Approved</p>
                                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{logbookStatus.approved}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Required</p>
                                <p className="text-3xl font-bold text-gray-800 dark:text-white">{logbookStatus.total}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => router.push('/student/logbook')}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-red-200 dark:shadow-none transition-all mt-4"
                        >
                            Go to Logbook
                        </button>
                    </div>
                )}

                {/* Finalized Marks Display (NEW) */}
                {finalizedMarksheet && finalizedMarksheet.isFinalized && (
                    <div className="space-y-8 mb-12">
                        {/* Summary Card */}
                        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                <h2 className="text-2xl font-bold flex items-center">
                                    <Award className="w-8 h-8 mr-3" />
                                    Final Evaluation Result
                                </h2>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center px-4 py-2 bg-green-500/20 backdrop-blur-md rounded-full border border-white/30 text-white font-bold text-sm">
                                        <CheckCircle className="w-5 h-5 mr-2" />
                                        Status: Finalized
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                                    <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-1">Academic Mentor</p>
                                    <p className="text-3xl font-black">{finalizedMarksheet.marks?.total || 0} <span className="text-sm font-normal opacity-60">/ 60</span></p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                                    <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-1">Industry Mentor</p>
                                    <p className="text-3xl font-black">{finalizedMarksheet.marks?.industryMarks || 0} <span className="text-sm font-normal opacity-60">/ 40</span></p>
                                </div>
                                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/40 shadow-inner text-center md:text-left">
                                    <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-1">Final Score</p>
                                    <p className="text-4xl font-black text-white">{finalizedMarksheet.marks?.finalTotal || 0} <span className="text-sm font-normal opacity-60">/ 100</span></p>
                                </div>
                            </div>
                            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                        </div>

                        {/* Detailed Marks Table (Functional Requirement 1) */}
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col md:flex-row md:items-center justify-between gap-2">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
                                        <Award className="w-5 h-5 mr-2 text-indigo-500" />
                                        Detailed Mark Breakdown
                                    </h3>
                                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest mt-1 italic">Read-Only View</p>
                                </div>
                                <div className="text-md font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-900 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700">
                                    Submission Date: {new Date(finalizedMarksheet.updatedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 uppercase text-[10px] font-bold tracking-widest">
                                            <th className="px-6 py-4">Criteria</th>
                                            <th className="px-6 py-4">Marks Obtained</th>
                                            <th className="px-6 py-4">Max Marks</th>
                                            <th className="px-6 py-4">Feedback</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        <tr className="text-sm">
                                            <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300">Technical Skill Development (AM)</td>
                                            <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{finalizedMarksheet.marks?.technical || 0}</td>
                                            <td className="px-6 py-4 text-gray-400">20</td>
                                            <td className="px-6 py-4 text-gray-500 text-xs italic">"{finalizedMarksheet.comments?.technical || 'No comments'}"</td>
                                        </tr>
                                        <tr className="text-sm">
                                            <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300">Soft Skill Development (AM)</td>
                                            <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{finalizedMarksheet.marks?.softSkills || 0}</td>
                                            <td className="px-6 py-4 text-gray-400">20</td>
                                            <td className="px-6 py-4 text-gray-500 text-xs italic">"{finalizedMarksheet.comments?.softSkills || 'No comments'}"</td>
                                        </tr>
                                        <tr className="text-sm">
                                            <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300">Presentation Skills (AM)</td>
                                            <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{finalizedMarksheet.marks?.presentation || 0}</td>
                                            <td className="px-6 py-4 text-gray-400">20</td>
                                            <td className="px-6 py-4 text-gray-500 text-xs italic">"{finalizedMarksheet.comments?.presentation || 'No comments'}"</td>
                                        </tr>
                                        <tr className="text-sm bg-indigo-50/30 dark:bg-indigo-900/10">
                                            <td className="px-6 py-4 font-bold text-indigo-700 dark:text-indigo-300">Industry Mentor Evaluation (IM)</td>
                                            <td className="px-6 py-4 font-bold text-indigo-700 dark:text-indigo-300">{finalizedMarksheet.marks?.industryMarks || 0}</td>
                                            <td className="px-6 py-4 text-indigo-400">40</td>
                                            <td className="px-6 py-4 text-indigo-600 dark:text-indigo-400 text-xs italic">"{finalizedMarksheet.comments?.finalComments || 'Finalized by Coordinator'}"</td>
                                        </tr>
                                        <tr className="bg-indigo-600 text-white font-black">
                                            <td className="px-6 py-4 text-white">FINAL TOTAL SCORE</td>
                                            <td className="px-6 py-4 text-white text-xl">{finalizedMarksheet.marks?.finalTotal || 0}</td>
                                            <td className="px-6 py-4 text-indigo-200">100</td>
                                            <td className="px-6 py-4 text-indigo-100 text-xs">Internship Completed successfully.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Evaluation Documents (Functional Requirement 3) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Academic Mentor evaluation link */}
                            {finalizedMarksheet.fileUrl && (
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                            <Award size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">Academic evaluation</p>
                                            <p className="text-xs text-gray-500">Formal assessment by mentor</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => window.open(finalizedMarksheet.fileUrl.startsWith('http') ? finalizedMarksheet.fileUrl : `${apiUrl}${finalizedMarksheet.fileUrl}`, '_blank')}
                                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                    >
                                        View PDF
                                    </button>
                                </div>
                            )}

                            {/* Industry Mentor marksheet link */}
                            {(finalizedMarksheet.marks?.industryMarksheetUrl || (existingMarksheet && existingMarksheet.fileUrl)) && (
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                            <CheckCircle size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">Industry evaluation</p>
                                            <p className="text-xs text-gray-500">Evaluation from employer</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const url = finalizedMarksheet.marks?.industryMarksheetUrl || existingMarksheet.fileUrl;
                                            window.open(url.startsWith('http') ? url : `${apiUrl}${url}`, '_blank');
                                        }}
                                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        View PDF
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <p className="text-gray-600 dark:text-gray-400 mb-8">Please submit your marksheet and exit presentation to complete your internship. You have 3 attempts for each.</p>




                {(!loading && logbookStatus.complete) ? (
                    <>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                            {/* Combined Logbook Card (NEW) */}
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow flex flex-col justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
                                        <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 p-2 rounded-lg mr-3">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                        </span>
                                        Combined Logbook
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">
                                        Your monthly logbooks have been automatically combined into a single document.
                                    </p>
                                </div>
                                {combinedLogbookUrl ? (
                                    <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                        <p className="text-green-700 dark:text-green-300 font-semibold flex items-center mb-1 text-sm">
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                            Generated
                                        </p>
                                        <a
                                            href={combinedLogbookUrl.startsWith('http') ? combinedLogbookUrl : `${apiUrl}${combinedLogbookUrl}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline break-all"
                                        >
                                            View Combined PDF
                                        </a>
                                    </div>
                                ) : (
                                    <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                                        <p className="text-yellow-700 dark:text-yellow-300 font-semibold flex items-center mb-1 text-sm">
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                            Processing
                                        </p>
                                        <p className="text-xs text-yellow-600 dark:text-yellow-400">
                                            Generating combined file... Please refresh in a moment.
                                        </p>
                                    </div>
                                )}
                                {combinedLogbookUrl && (
                                    <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden h-64 bg-gray-100 dark:bg-gray-900">
                                        <iframe
                                            src={combinedLogbookUrl.startsWith('http') ? combinedLogbookUrl : `${apiUrl}${combinedLogbookUrl}`}
                                            className="w-full h-full"
                                            title="Combined Logbook Preview"
                                        />
                                    </div>
                                )}
                                {combinedLogbookUrl && (
                                    <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden h-64 bg-gray-100 dark:bg-gray-900">
                                        <iframe
                                            src={combinedLogbookUrl.startsWith('http') ? combinedLogbookUrl : `${apiUrl}${combinedLogbookUrl}`}
                                            className="w-full h-full"
                                            title="Combined Logbook Preview"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Marksheet Card */}
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center justify-between">
                                    <div className="flex items-center">
                                        <span className="bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 p-2 rounded-lg mr-3">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                                        </span>
                                        Industry Mentor Marksheet <span className="text-gray-400 font-normal ml-2">(Optional)</span>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${marksheetCount >= 3 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                                        Attempt {marksheetCount}/3
                                    </span>
                                </h2>

                                {existingMarksheet && (
                                    <>
                                        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-green-700 dark:text-green-300 font-semibold flex items-center mb-1">
                                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                                        Submitted
                                                    </p>
                                                    <a
                                                        href={existingMarksheet.fileUrl.startsWith('http') ? existingMarksheet.fileUrl : `${apiUrl}${existingMarksheet.fileUrl}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline break-all"
                                                    >
                                                        View Latest Submission
                                                    </a>
                                                </div>
                                                {marksheetCount < 3 && !showMarksheetUpload && (
                                                    <button
                                                        onClick={() => setShowMarksheetUpload(true)}
                                                        className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400"
                                                    >
                                                        Resubmit
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-4 mb-6 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden h-64 bg-gray-100 dark:bg-gray-900">
                                            <iframe
                                                src={existingMarksheet.fileUrl.startsWith('http') ? existingMarksheet.fileUrl : `${apiUrl}${existingMarksheet.fileUrl}`}
                                                className="w-full h-full"
                                                title="Marksheet Preview"
                                            />
                                        </div>
                                    </>
                                )}

                                {(!existingMarksheet || showMarksheetUpload) && (
                                    <>
                                        {marksheetCount >= 3 ? (
                                            <p className="text-sm text-red-500 text-center py-4 bg-red-50 rounded dark:bg-red-900/10">Maximum attempts reached.</p>
                                        ) : (
                                            <>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">
                                                    {existingMarksheet ? "Upload new version (PDF)" : "Upload your verified marksheet (PDF)"}
                                                </p>
                                                {showMarksheetUpload && existingMarksheet && (
                                                    <button onClick={() => { setShowMarksheetUpload(false); setMarksheet(null); }} className="text-xs text-gray-400 mb-2 hover:text-gray-600 dark:hover:text-gray-200">Cancel</button>
                                                )}
                                                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer relative">
                                                    <input
                                                        type="file"
                                                        accept=".pdf"
                                                        onChange={(e) => handleFileChange(e, 'marksheet')}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    />
                                                    {marksheet ? (
                                                        <div className="text-green-600 dark:text-green-400 font-medium break-all">{marksheet.name}</div>
                                                    ) : (
                                                        <div className="text-gray-400 dark:text-gray-500">
                                                            <span className="block text-2xl mb-2">+</span>
                                                            Drop PDF here or click to upload
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Presentation Card */}
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center justify-between">
                                    <div className="flex items-center">
                                        <span className="bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 p-2 rounded-lg mr-3">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                        </span>
                                        Presentation
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${presentationCount >= 3 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                                        Attempt {presentationCount}/3
                                    </span>
                                </h2>

                                {existingPresentation && (
                                    <>
                                        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-green-700 dark:text-green-300 font-semibold flex items-center mb-1">
                                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                                        Submitted
                                                    </p>
                                                    <a
                                                        href={existingPresentation.fileUrl.startsWith('http') ? existingPresentation.fileUrl : `${apiUrl}${existingPresentation.fileUrl}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline break-all"
                                                    >
                                                        View Latest Submission
                                                    </a>
                                                </div>
                                                {presentationCount < 3 && !showPresentationUpload && (
                                                    <button
                                                        onClick={() => setShowPresentationUpload(true)}
                                                        className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400"
                                                    >
                                                        Resubmit
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-4 mb-6 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden h-64 bg-gray-100 dark:bg-gray-900">
                                            <iframe
                                                src={existingPresentation.fileUrl.startsWith('http') ? existingPresentation.fileUrl : `${apiUrl}${existingPresentation.fileUrl}`}
                                                className="w-full h-full"
                                                title="Presentation Preview"
                                            />
                                        </div>
                                    </>
                                )}

                                {(!existingPresentation || showPresentationUpload) && (
                                    <>
                                        {presentationCount >= 3 ? (
                                            <p className="text-sm text-red-500 text-center py-4 bg-red-50 rounded dark:bg-red-900/10">Maximum attempts reached.</p>
                                        ) : (
                                            <>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">
                                                    {existingPresentation ? "Upload new version (PDF)" : "Upload your exit presentation (PDF)"}
                                                </p>
                                                {showPresentationUpload && existingPresentation && (
                                                    <button onClick={() => { setShowPresentationUpload(false); setPresentation(null); }} className="text-xs text-gray-400 mb-2 hover:text-gray-600 dark:hover:text-gray-200">Cancel</button>
                                                )}
                                                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer relative">
                                                    <input
                                                        type="file"
                                                        accept=".pdf"
                                                        onChange={(e) => handleFileChange(e, 'presentation')}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    />
                                                    {presentation ? (
                                                        <div className="text-green-600 dark:text-green-400 font-medium break-all">{presentation.name}</div>
                                                    ) : (
                                                        <div className="text-gray-400 dark:text-gray-500">
                                                            <span className="block text-2xl mb-2">+</span>
                                                            Drop PDF here or click to upload
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </>
                                )}

                                {/* Scheduled Presentation Section */}
                                {existingPresentation && existingPresentation.scheduledDate && (
                                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl">
                                        <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-3 flex items-center">
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                            Scheduled Presentation
                                        </h3>
                                        <div className="space-y-2">
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                <span className="font-semibold">Date:</span> {new Date(existingPresentation.scheduledDate).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                            </p>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                <span className="font-semibold">Time:</span> {new Date(existingPresentation.scheduledDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                            {existingPresentation.meetLink && (
                                                <a
                                                    href={existingPresentation.meetLink}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="mt-3 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                                >
                                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                                    Join Meeting
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <button
                                onClick={handleSubmit}
                                disabled={!canSubmit}
                                className={`px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 w-full md:w-auto flex items-center justify-center transform ${!canSubmit
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                                    : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-1'
                                    }`}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    {loading ? (
                                        "Processing..."
                                    ) : (
                                        <>
                                            Submit Final Files
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                                        </>
                                    )}
                                </span>
                            </button>
                        </div>
                    </>
                ) : null}

            </div>
        </div>
    );
}
