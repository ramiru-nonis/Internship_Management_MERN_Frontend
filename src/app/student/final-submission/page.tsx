"use client";
import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { FiLock, FiCheckCircle, FiAlertCircle, FiUploadCloud, FiFileText, FiMonitor } from "react-icons/fi";

export default function FinalSubmissionPage() {
    const [marksheet, setMarksheet] = useState<File | null>(null);
    const [presentation, setPresentation] = useState<File | null>(null);
    const [studentId, setStudentId] = useState<string | null>(null);

    // New State for existing submissions
    const [existingMarksheet, setExistingMarksheet] = useState<any>(null);
    const [existingPresentation, setExistingPresentation] = useState<any>(null);

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'marksheet' | 'presentation') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (type === 'marksheet' && file.type !== 'application/pdf') {
                alert("Marksheet must be a PDF");
                return;
            }
            if (type === 'presentation' && !file.name.endsWith('.pptx')) {
                alert("Presentation must be a PPTX");
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
            await api.post('/submissions/notify', { studentId });

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

    // Progress Bar Logic
    const percentage = logbookStatus.total > 0
        ? Math.round((logbookStatus.approved / logbookStatus.total) * 100)
        : (logbookStatus.complete ? 100 : 0);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 pb-20">
            <div className="max-w-5xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Final Submission</h1>
                    <p className="text-gray-600 dark:text-gray-400">Upload your Marksheet and Exit Presentation to complete your internship.</p>
                </div>

                {/* Logbook Status Card */}
                {!loading && (
                    <div className={`p-6 rounded-2xl border transition-all duration-300 ${logbookStatus.complete
                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm"
                        }`}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-xl ${logbookStatus.complete ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"}`}>
                                    {logbookStatus.complete ? <FiCheckCircle className="text-2xl" /> : <FiFileText className="text-2xl" />}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                        Logbook Requirements
                                        {logbookStatus.complete && <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">Completed</span>}
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        All your monthly logbooks must be approved by your mentor before you can proceed.
                                    </p>
                                </div>
                            </div>
                            <div className="w-full md:w-64 space-y-2">
                                <div className="flex justify-between text-sm font-medium">
                                    <span className={logbookStatus.complete ? "text-green-700 dark:text-green-400" : "text-gray-600 dark:text-gray-300"}>
                                        {logbookStatus.approved} / {logbookStatus.total} Approved
                                    </span>
                                    <span className="text-gray-400">{percentage}%</span>
                                </div>
                                <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 ease-out ${logbookStatus.complete ? "bg-green-500" : "bg-blue-500"}`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Submission Area - Locked or Unlocked */}
                <div className="relative">
                    {/* Lock Overlay */}
                    {!loading && !logbookStatus.complete && (
                        <div className="absolute inset-0 z-10 bg-gray-50/60 dark:bg-gray-900/60 backdrop-blur-[2px] rounded-3xl flex flex-col items-center justify-center text-center p-6 border border-gray-200 dark:border-gray-700">
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-full shadow-xl mb-4 text-gray-400">
                                <FiLock className="text-4xl" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Locked</h3>
                            <p className="text-gray-500 max-w-sm">
                                Complete your logbook approvals to unlock the Final Submission area.
                            </p>
                        </div>
                    )}

                    {/* Main Grid */}
                    <div className={`grid md:grid-cols-2 gap-8 ${!logbookStatus.complete ? "filter blur-sm select-none opacity-50" : ""}`}>

                        {/* Marksheet Card */}
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">
                                        <FiUploadCloud className="text-xl" />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Marksheet</h2>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${marksheetCount >= 3 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                    Attempt {marksheetCount}/3
                                </span>
                            </div>

                            {existingMarksheet ? (
                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl p-4 mb-6">
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium">
                                            <FiCheckCircle />
                                            Already Submitted
                                        </div>
                                        <a
                                            href={existingMarksheet.fileUrl.startsWith('http') ? existingMarksheet.fileUrl : `${apiUrl}${existingMarksheet.fileUrl}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline truncate"
                                        >
                                            View Submission
                                        </a>
                                        {marksheetCount < 3 && !showMarksheetUpload && (
                                            <button
                                                onClick={() => setShowMarksheetUpload(true)}
                                                className="text-sm bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                                            >
                                                Upload New Version
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : null}

                            {(!existingMarksheet || showMarksheetUpload) && (
                                <>
                                    {marksheetCount >= 3 ? (
                                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-center text-sm font-medium">
                                            Maximum attempts reached.
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {showMarksheetUpload && existingMarksheet && (
                                                <button onClick={() => { setShowMarksheetUpload(false); setMarksheet(null); }} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                                            )}
                                            <label className="block w-full cursor-pointer group">
                                                <input
                                                    type="file"
                                                    accept=".pdf"
                                                    onChange={(e) => handleFileChange(e, 'marksheet')}
                                                    className="hidden"
                                                />
                                                <div className={`
                                                    border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300
                                                    ${marksheet
                                                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                                        : "border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                                    }
                                                `}>
                                                    {marksheet ? (
                                                        <div className="text-green-600 dark:text-green-400 font-medium break-all">
                                                            {marksheet.name}
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <div className="mx-auto w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-500">
                                                                <FiUploadCloud className="text-xl" />
                                                            </div>
                                                            <div className="text-gray-500 dark:text-gray-400 text-sm">
                                                                <span className="text-indigo-600 font-medium">Click to upload</span> or drag and drop
                                                            </div>
                                                            <div className="text-xs text-gray-400">
                                                                PDF up to 10MB
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </label>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Presentation Card */}
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-orange-50 dark:bg-orange-900/30 text-orange-600 rounded-xl">
                                        <FiMonitor className="text-xl" />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Presentation</h2>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${presentationCount >= 3 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                    Attempt {presentationCount}/3
                                </span>
                            </div>

                            {existingPresentation ? (
                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl p-4 mb-6">
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium">
                                            <FiCheckCircle />
                                            Already Submitted
                                        </div>
                                        <a
                                            href={existingPresentation.fileUrl.startsWith('http') ? existingPresentation.fileUrl : `${apiUrl}${existingPresentation.fileUrl}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline truncate"
                                        >
                                            View Submission
                                        </a>
                                        {presentationCount < 3 && !showPresentationUpload && (
                                            <button
                                                onClick={() => setShowPresentationUpload(true)}
                                                className="text-sm bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                                            >
                                                Upload New Version
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : null}

                            {(!existingPresentation || showPresentationUpload) && (
                                <>
                                    {presentationCount >= 3 ? (
                                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-center text-sm font-medium">
                                            Maximum attempts reached.
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {showPresentationUpload && existingPresentation && (
                                                <button onClick={() => { setShowPresentationUpload(false); setPresentation(null); }} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                                            )}
                                            <label className="block w-full cursor-pointer group">
                                                <input
                                                    type="file"
                                                    accept=".pptx"
                                                    onChange={(e) => handleFileChange(e, 'presentation')}
                                                    className="hidden"
                                                />
                                                <div className={`
                                                    border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300
                                                    ${presentation
                                                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                                        : "border-gray-300 dark:border-gray-600 hover:border-orange-400 dark:hover:border-orange-500 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                                    }
                                                `}>
                                                    {presentation ? (
                                                        <div className="text-green-600 dark:text-green-400 font-medium break-all">
                                                            {presentation.name}
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <div className="mx-auto w-12 h-12 bg-orange-50 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-500">
                                                                <FiMonitor className="text-xl" />
                                                            </div>
                                                            <div className="text-gray-500 dark:text-gray-400 text-sm">
                                                                <span className="text-orange-600 font-medium">Click to upload</span> or drag and drop
                                                            </div>
                                                            <div className="text-xs text-gray-400">
                                                                PPTX up to 10MB
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </label>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Submit Button */}
                <div className={`flex justify-center pt-6 ${!logbookStatus.complete ? "opacity-50 pointer-events-none" : ""}`}>
                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit || loading}
                        className={`
                            px-12 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300
                            flex items-center gap-3
                            ${!canSubmit || loading
                                ? "bg-gray-200 text-gray-400 shadow-none dark:bg-gray-800 dark:text-gray-600"
                                : "bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 bg-size-200 hover:bg-pos-100 text-white"
                            }
                        `}
                    >
                        {loading ? (
                            "Processing..."
                        ) : (
                            <>
                                Submit Final Files
                                <FiUploadCloud className="text-xl" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
