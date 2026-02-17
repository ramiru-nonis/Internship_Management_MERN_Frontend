"use client";
import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { FiLock, FiFileText, FiDownload, FiX, FiEye, FiAlertCircle } from "react-icons/fi";
import { Award, CheckCircle, BookOpen } from "lucide-react";

export default function FinalSubmissionPage() {
    const router = useRouter();
    const [marksheet, setMarksheet] = useState<File | null>(null);
    const [presentation, setPresentation] = useState<File | null>(null);
    const [studentId, setStudentId] = useState<string | null>(null);

    // New State for existing submissions
    const [existingMarksheet, setExistingMarksheet] = useState<any>(null);
    const [finalizedMarksheet, setFinalizedMarksheet] = useState<any>(null);
    const [existingPresentation, setExistingPresentation] = useState<any>(null);

    // Attempt Counts
    const [marksheetCount, setMarksheetCount] = useState<number>(0);
    const [presentationCount, setPresentationCount] = useState<number>(0);

    // UI Toggle for Resubmission
    const [showMarksheetUpload, setShowMarksheetUpload] = useState(false);
    const [showPresentationUpload, setShowPresentationUpload] = useState(false);

    const [loading, setLoading] = useState(true);
    const [authLoading, setAuthLoading] = useState(true);
    const [logbookStatus, setLogbookStatus] = useState({ complete: false, total: 0, approved: 0 });

    // PDF Modal State
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [pdfError, setPdfError] = useState(false);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) {
            router.push('/login');
            return;
        }

        try {
            const user = JSON.parse(userStr);
            if (user.role !== 'student') {
                router.push('/login');
                return;
            }
            setStudentId(user._id);
            setAuthLoading(false);
            fetchExistingSubmissions(user._id);
        } catch (error) {
            console.error('Error parsing user data:', error);
            router.push('/login');
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

            if (res.data.logbookStatus) {
                setLogbookStatus(res.data.logbookStatus);
            }
        } catch (error) {
            console.error("Error fetching submissions", error);
        } finally {
            setLoading(false);
        }
    }

    const fetchConsolidatedPdf = async () => {
        if (!studentId) return;
        setPdfLoading(true);
        setPdfError(false);
        try {
            console.log(`[DEBUG] Fetching consolidated PDF for student: ${studentId}`);
            const response = await api.get(`/logbooks/consolidated/${studentId}`, {
                responseType: 'blob'
            });

            // response.data is already a Blob when responseType is 'blob'
            const blob = new Blob([response.data], { type: 'application/pdf' });
            if (blob.size === 0) throw new Error("Received empty blob");

            const url = window.URL.createObjectURL(blob);
            setPdfUrl(url);
            console.log("[DEBUG] Consolidated PDF Blob URL created successfully");
        } catch (err: any) {
            console.error("Error fetching consolidated PDF:", err);
            // If it's a blob-type error, the response might still contain JSON but it's hidden in the blob
            if (err.response?.data instanceof Blob) {
                const text = await err.response.data.text();
                try {
                    const errorJson = JSON.parse(text);
                    console.error("[DEBUG] Backend error message:", errorJson.message);
                } catch (e) {
                    console.error("[DEBUG] Raw error text:", text);
                }
            }
            setPdfError(true);
        } finally {
            setPdfLoading(false);
        }
    };

    useEffect(() => {
        if (showPdfModal && studentId) {
            fetchConsolidatedPdf();
        }
    }, [showPdfModal]);

    useEffect(() => {
        return () => {
            if (pdfUrl) window.URL.revokeObjectURL(pdfUrl);
        };
    }, [pdfUrl]);

    useEffect(() => {
        if (!showPdfModal) {
            setPdfUrl(null);
            setPdfError(false);
        }
    }, [showPdfModal]);

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
                studentId
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

    // Done if: we have existing files OR user is uploading marksheet/presentation.
    // Crucially: Presentation is REQUIRED. Marksheet is OPTIONAL.
    // So if we have an existing presentation, we can submit (to finalize). 
    // If we have a new presentation selected, we can submit.
    const canSubmit = (presentation !== null || existingPresentation !== null);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Final Submission</h1>
                <p className="text-gray-500 mb-8">Upload your Marksheet and Exit Presentation (PDF only) to complete your internship.</p>

                {/* Auth Loading State */}
                {authLoading && (
                    <div className="flex flex-col items-center justify-center p-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">Verifying authorization...</p>
                    </div>
                )}

                {/* STRICT LOCK: If logbooks are not strictly complete, BLOCK EVERYTHING */}

                {/* Main Content Area */}
                {!authLoading && !loading && (
                    <div className="space-y-8 pb-12">
                        {/* 2. Signed Logbook Card (ALWAYS SHOWN when authenticated) */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row items-center justify-between gap-6 mb-8 mt-2">
                            <div className="flex items-center gap-4 text-center md:text-left">
                                <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                                    <BookOpen size={30} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">Signed Logbook</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Your consolidated record of all signed monthly logbooks.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowPdfModal(true)}
                                className="w-full md:w-auto px-10 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-200 dark:shadow-none flex items-center justify-center gap-3 transform active:scale-95"
                            >
                                <FiEye size={20} /> View Signed Logbook
                            </button>
                        </div>

                        {/* Condition-based content starts here */}
                        {!logbookStatus.complete ? (
                            /* STRICT LOCK: If logbooks are not strictly complete, BLOCK SUBMISSION UI */
                            <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-3xl p-12 shadow-xl border border-gray-200 dark:border-gray-700 text-center space-y-6">
                                <div className="bg-red-50 dark:bg-red-900/30 p-6 rounded-full">
                                    <FiLock className="text-5xl text-red-500 dark:text-red-400" />
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Submission Locked</h2>
                                    <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
                                        To unlock final submission, you must have an <strong>Approved Logbook</strong> for every month of your placement duration.
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
                        ) : (
                            /* UNLOCKED: Show marksheet and submission uploaders */
                            <div className="space-y-8">
                                {/* 1. Finalized Marks Display (Only if finalized) */}
                                {finalizedMarksheet && finalizedMarksheet.isFinalized && (
                                    <div className="space-y-8 mb-8">
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

                                        {/* Detailed Marks Table */}
                                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                                            <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col md:flex-row md:items-center justify-between gap-2">
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
                                                        <Award className="w-5 h-5 mr-2 text-indigo-500" />
                                                        Detailed Mark Breakdown
                                                    </h3>
                                                </div>
                                                <div className="text-md font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-900 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700">
                                                    Submission Date: {new Date(finalizedMarksheet.updatedAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left">
                                                    <thead>
                                                        <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 uppercase text-[10px] font-bold tracking-widest">
                                                            <th className="px-6 py-4">Criteria</th>
                                                            <th className="px-6 py-4">Marks Obtained</th>
                                                            <th className="px-6 py-4">Max Marks</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700 font-medium">
                                                        <tr className="text-sm">
                                                            <td className="px-6 py-4 text-gray-700 dark:text-gray-300">Technical Skill Development (AM)</td>
                                                            <td className="px-6 py-4 text-gray-900 dark:text-white">{finalizedMarksheet.marks?.technical || 0}</td>
                                                            <td className="px-6 py-4 text-gray-400">20</td>
                                                        </tr>
                                                        <tr className="text-sm">
                                                            <td className="px-6 py-4 text-gray-700 dark:text-gray-300">Soft Skill Development (AM)</td>
                                                            <td className="px-6 py-4 text-gray-900 dark:text-white">{finalizedMarksheet.marks?.softSkills || 0}</td>
                                                            <td className="px-6 py-4 text-gray-400">20</td>
                                                        </tr>
                                                        <tr className="text-sm">
                                                            <td className="px-6 py-4 text-gray-700 dark:text-gray-300">Presentation Skills (AM)</td>
                                                            <td className="px-6 py-4 text-gray-900 dark:text-white">{finalizedMarksheet.marks?.presentation || 0}</td>
                                                            <td className="px-6 py-4 text-gray-400">20</td>
                                                        </tr>
                                                        <tr className="bg-indigo-50/50 dark:bg-indigo-900/20 font-bold">
                                                            <td className="px-6 py-4 text-indigo-700 dark:text-indigo-300">Industry Mentor Marks</td>
                                                            <td className="px-6 py-4 text-indigo-700 dark:text-indigo-300">{finalizedMarksheet.marks?.industryMarks || 0}</td>
                                                            <td className="px-6 py-4 text-indigo-400">40</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Evaluation PDFs */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {finalizedMarksheet.fileUrl && (
                                                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">Academic evaluation</p>
                                                    <button
                                                        onClick={() => window.open(`${apiUrl}/submissions/marksheets/${finalizedMarksheet._id}/view?type=academic`, '_blank')}
                                                        className="text-xs font-bold text-indigo-600 hover:underline"
                                                    >
                                                        View PDF
                                                    </button>
                                                </div>
                                            )}
                                            {finalizedMarksheet.marks?.industryMarksheetUrl && (
                                                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">Industry evaluation</p>
                                                    <button
                                                        onClick={() => window.open(`${apiUrl}/submissions/marksheets/${finalizedMarksheet._id}/view?type=industry`, '_blank')}
                                                        className="text-xs font-bold text-blue-600 hover:underline"
                                                    >
                                                        View PDF
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* 3. Main Submission UI (Uploaders) */}
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Submission Files</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">Please upload your final marksheet and presentation slides.</p>

                                    <div className="grid md:grid-cols-2 gap-8">
                                        {/* Marksheet Card */}
                                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
                                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <FiFileText className="text-blue-500" size={24} />
                                                    Industry Marksheet
                                                </div>
                                                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-500">
                                                    Attempt {marksheetCount}/3
                                                </span>
                                            </h3>
                                            {existingMarksheet && !showMarksheetUpload ? (
                                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl space-y-3">
                                                    <p className="text-sm font-bold text-blue-700 dark:text-blue-300">Latest Submission Received</p>
                                                    <button
                                                        onClick={() => window.open(`${apiUrl}/submissions/marksheets/${existingMarksheet._id}/view`, '_blank')}
                                                        className="text-xs text-blue-600 hover:underline block"
                                                    >
                                                        View Submitted File
                                                    </button>
                                                    {marksheetCount < 3 && (
                                                        <button onClick={() => setShowMarksheetUpload(true)} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold">Resubmit</button>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center relative hover:bg-gray-50 transition-colors">
                                                    <input type="file" accept=".pdf" onChange={(e) => handleFileChange(e, 'marksheet')} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                    <p className="text-gray-400 font-medium">{marksheet ? marksheet.name : "Drag & Drop Marksheet PDF"}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Presentation Card */}
                                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
                                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Award className="text-orange-500" size={24} />
                                                    Exit Presentation
                                                </div>
                                                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-500">
                                                    Attempt {presentationCount}/3
                                                </span>
                                            </h3>
                                            {existingPresentation && !showPresentationUpload ? (
                                                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl space-y-3">
                                                    <p className="text-sm font-bold text-orange-700 dark:text-orange-300">Latest Submission Received</p>
                                                    <button
                                                        onClick={() => window.open(`${apiUrl}/submissions/presentations/${existingPresentation._id}/view`, '_blank')}
                                                        className="text-xs text-orange-600 hover:underline block"
                                                    >
                                                        View Submitted File
                                                    </button>
                                                    {presentationCount < 3 && (
                                                        <button onClick={() => setShowPresentationUpload(true)} className="text-xs bg-orange-600 text-white px-3 py-1.5 rounded-lg font-bold">Resubmit</button>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center relative hover:bg-gray-50 transition-colors">
                                                    <input type="file" accept=".pdf" onChange={(e) => handleFileChange(e, 'presentation')} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                    <p className="text-gray-400 font-medium">{presentation ? presentation.name : "Drag & Drop Presentation PDF"}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-center pt-8">
                                        <button
                                            onClick={handleSubmit}
                                            disabled={!canSubmit || loading}
                                            className={`px-12 py-4 rounded-2xl font-black text-xl shadow-2xl transition-all flex items-center gap-3 ${!canSubmit || loading
                                                ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                                                : "bg-gradient-to-r from-blue-700 to-indigo-700 text-white hover:shadow-indigo-300"
                                                }`}
                                        >
                                            {loading ? "Processing..." : "Submit Final Materials"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* PDF Modal */}
            {showPdfModal && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-6xl flex flex-col h-[92vh] overflow-hidden">
                        <div className="px-8 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/30">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl">
                                    <FiFileText size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-800 dark:text-white tracking-tight">Signed Logbook</h3>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Consolidated Document</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <a
                                    href={pdfUrl || '#'}
                                    download="Consolidated_Signed_Logbook.pdf"
                                    className="p-3 text-gray-400 hover:text-blue-600 transition-colors bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm"
                                >
                                    <FiDownload size={20} />
                                </a>
                                <button
                                    onClick={() => setShowPdfModal(false)}
                                    className="p-3 text-gray-400 hover:text-red-500 transition-colors bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm"
                                >
                                    <FiX size={24} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 bg-gray-100 dark:bg-gray-900 relative">
                            {pdfLoading ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                                    <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-blue-600 border-r-transparent"></div>
                                    <p className="font-bold text-gray-500 tracking-wide">MERGING LOGBOOKS...</p>
                                </div>
                            ) : pdfError ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center group">
                                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                        <FiAlertCircle size={40} className="text-red-500" />
                                    </div>
                                    <h4 className="text-2xl font-black text-gray-800 dark:text-white mb-2">Merge Failed</h4>
                                    <p className="text-gray-500 max-w-sm mb-8">We couldn't combine your monthly logbooks. Please ensure all months are approved and signed by your mentor.</p>
                                    <button onClick={fetchConsolidatedPdf} className="px-8 py-3 bg-gray-800 dark:bg-white dark:text-gray-900 text-white font-black rounded-xl hover:shadow-xl transition-all">TRY AGAIN</button>
                                </div>
                            ) : (
                                <iframe src={`${pdfUrl}#toolbar=1`} className="w-full h-full border-none" />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
