"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import {
    FiCalendar, FiClock, FiCheckCircle, FiAlertCircle,
    FiEdit3, FiLock, FiSend, FiChevronRight, FiChevronLeft
} from "react-icons/fi";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function LogbookPage() {
    const router = useRouter();

    // --- State ---
    const [studentId, setStudentId] = useState<string | null>(null);
    const [mentorEmail, setMentorEmail] = useState<string>("");

    const [currentMonth, setCurrentMonth] = useState<number>(1);
    const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
    const [totalMonths, setTotalMonths] = useState<number>(0);
    const [initializing, setInitializing] = useState(true);

    // Logic State
    const [unlockedMonth, setUnlockedMonth] = useState<number>(1); // The furthest month valid to edit
    const [submissionHistory, setSubmissionHistory] = useState<any[]>([]);

    // Missing Data State
    const [missingPlacement, setMissingPlacement] = useState(false);

    // Data
    const [logbookData, setLogbookData] = useState<any>(null); // Full doc
    const [loading, setLoading] = useState(false);

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [activeWeek, setActiveWeek] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        activities: "",
        techSkills: "",
        softSkills: "",
        trainings: ""
    });
    const [saving, setSaving] = useState(false);
    const [sending, setSending] = useState(false);
    const [showPdfModal, setShowPdfModal] = useState(false);

    // --- Init ---
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setStudentId(user._id);
            checkPlacementAndLoad(user._id);
        } else {
            router.push('/login');
        }
    }, []);

    const checkPlacementAndLoad = async (id: string) => {
        try {
            // 1. Placement Check
            const placementRes = await api.get('/placement');
            const pData = placementRes.data;

            if (!pData) {
                console.warn("No placement data found.");
                setMissingPlacement(true);
                setInitializing(false);
                return;
            }

            setMentorEmail(pData.mentor_email || "");

            // 2. Calculate Durations
            if (pData.start_date && pData.end_date) {
                const start = new Date(pData.start_date);
                const end = new Date(pData.end_date);
                const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
                setTotalMonths(Math.max(1, months));
            }

            // 3. Load History & Determine Unlock State
            await refreshHistory(id);

            // Default to first month or last active
            // We'll trust refreshHistory to set unlocked logic, but we default view to 1
        } catch (error) {
            console.error("Error loading logbook data:", error);
            // If API fails (500 etc), we might also want to show missing placement or generic error
            setMissingPlacement(true);
        } finally {
            setInitializing(false);
        }
    };

    const refreshHistory = async (id: string) => {
        try {
            const histRes = await api.get(`/logbooks/history/${id}`);
            const history = histRes.data || [];
            setSubmissionHistory(history);

            // Calculate Unlocked Month
            // Logic: Month N unlocks IF Month N-1 is (Pending OR Approved OR Rejected)
            // Ideally backend enforces this, but UI should reflect it.
            // We iterate from 1 to totalMonths.
            let maxUnlocked = 1;

            // Sort history by month asc
            const sortedHistory = [...history].sort((a, b) => a.month - b.month);

            // If month 1 is submitted, month 2 opens.
            // If month 1 is NOT submitted (Draft or nonexistent), month 2 is closed.

            // Simple approach: find last submitted month
            const lastSubmitted = sortedHistory.filter(l => l.status !== 'Draft').pop();
            if (lastSubmitted) {
                maxUnlocked = lastSubmitted.month + 1;
            }

            // Cap at total months
            // if (maxUnlocked > totalMonths) maxUnlocked = totalMonths; 
            // Actually, we should allow viewing future if needed? No, strict sequential.

            setUnlockedMonth(maxUnlocked);

            // 4. Default View Logic (Latest Approved)
            const approvedHistory = history
                .filter((l: any) => l.status === 'Approved')
                .sort((a: any, b: any) => {
                    if (a.year !== b.year) return b.year - a.year;
                    return b.month - a.month;
                });

            let targetMonth = currentMonth;
            let targetYear = currentYear;

            if (approvedHistory.length > 0) {
                targetMonth = approvedHistory[0].month;
                targetYear = approvedHistory[0].year;
                setCurrentMonth(targetMonth);
                setCurrentYear(targetYear);
            } else if (history.length > 0) {
                // If no approved, maybe show last entry? 
                // Let's decide if we stick to Month 1 or last created.
                // User specifically asked for "last month approved".
                // If none approved, staying on default (1) is probably fine, 
                // OR show the unlocked month.
                // Let's default to maxUnlocked if no approved.
                const lastEntry = history.sort((a: any, b: any) => {
                    if (a.year !== b.year) return b.year - a.year;
                    return b.month - a.month;
                })[0];
                targetMonth = lastEntry.month;
                targetYear = lastEntry.year;
                setCurrentMonth(targetMonth);
                setCurrentYear(targetYear);
            }

            // Load current selected month data
            fetchLogbook(id, targetMonth, targetYear);

        } catch (e) {
            console.error("History fetch failed", e);
        }
    };

    const fetchLogbook = async (id: string, month: number, year: number) => {
        setLoading(true);
        try {
            const res = await api.get('/logbooks', {
                params: { studentId: id, month, year }
            });
            if (res.data.exists) setLogbookData(res.data.logbook);
            else setLogbookData(null);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // --- Actions ---
    const handleMonthChange = (m: number) => {
        if (m > unlockedMonth && m > 1) {
            return;
        }

        // Find year for this month in history
        const histEntry = submissionHistory.find(h => h.month === m);
        const yearToFetch = histEntry ? histEntry.year : currentYear;

        setCurrentMonth(m);
        setCurrentYear(yearToFetch);
        if (studentId) fetchLogbook(studentId, m, yearToFetch);
    };

    const openModal = (week: number) => {
        // if (!isEditable) return; // Allow opening in view-only mode
        setActiveWeek(week);
        // Find existing data
        const weekData = logbookData?.weeks?.find((w: any) => w.weekNumber === week);
        if (weekData) {
            setFormData({
                activities: weekData.activities || "",
                techSkills: weekData.techSkills || "",
                softSkills: weekData.softSkills || "",
                trainings: weekData.trainings || ""
            });
        } else {
            setFormData({ activities: "", techSkills: "", softSkills: "", trainings: "" });
        }
        setShowModal(true);
    };

    const handleSaveDraft = async () => {
        if (!studentId || !activeWeek) return;
        setSaving(true);
        try {
            const res = await api.post('/logbooks/entry', {
                studentId,
                month: currentMonth,
                year: currentYear,
                weekNumber: activeWeek,
                data: formData,
                mentorEmail
            });
            setLogbookData(res.data.logbook);
            // alert("Entry Saved Successfully!");
            setShowModal(false);
            // Refresh history in case status changed (unlikely for draft save but good practice)
        } catch (error: any) {
            alert(error.response?.data?.message || "Failed to save draft.");
        } finally {
            setSaving(false);
        }
    };

    const handleSubmitApproval = async () => {
        if (!logbookData?._id) return alert("No entries to submit.");

        // Count weeks
        const weeksFilled = logbookData.weeks?.length || 0;
        if (weeksFilled < 4) {
            if (!window.confirm(`You have only filled ${weeksFilled} / 4 weeks. Are you sure you want to submit?`)) return;
        } else {
            if (!window.confirm("Submit for Mentor Approval? This will lock your entries.")) return;
        }

        setSending(true);
        try {
            await api.post('/logbooks/submit', {
                logbookId: logbookData._id,
                mentorEmail
            });
            alert(`Submitted! An email has been sent to your mentor.`);

            // Refresh everything so Unlocked Logic updates immediately
            if (studentId) {
                await refreshHistory(studentId);
                // fetchLogbook is now called inside refreshHistory which determines latest state
            }

        } catch (error: any) {
            const msg = error.response?.data?.message || "Submission Failed. Please try again.";
            alert(`Error: ${msg}`);
            console.error(error);
        } finally {
            setSending(false);
        }
    };

    const isEditable = logbookData ? (logbookData.status === 'Draft' || logbookData.status === 'Rejected') : true; // True if null (new draft)
    const isLockedMonth = currentMonth > unlockedMonth;

    if (initializing) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (missingPlacement) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center space-y-4">
                    <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiAlertCircle className="text-3xl" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Setup Required</h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        You need to complete your <strong>Placement Form</strong> before you can start filling out your logbooks. This sets up your timeline and mentor details.
                    </p>
                    <button
                        onClick={() => router.push('/student/dashboard')}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-200"
                    >
                        Go to Dashboard
                    </button>
                    <button
                        onClick={() => router.push('/student/profile')}
                        className="block w-full text-sm text-gray-400 hover:text-gray-600 mt-2"
                    >
                        Check Profile
                    </button>
                </div>
            </div>
        );
    }

    // Helper for table weeks to render
    const isSubmitted = logbookData?.status === 'Pending' || logbookData?.status === 'Approved';
    const weeksToRender = isSubmitted
        ? (logbookData?.weeks || []).map((w: any) => w.weekNumber).sort((a: number, b: number) => a - b)
        : [1, 2, 3, 4];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-800 dark:text-white pb-20">

            {/* Header / Top Bar */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600">
                        Monthly Logbook
                    </h1>

                    <div className="flex items-center gap-4">

                        {/* Status Pill */}
                        {logbookData && (
                            <div className={`px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 border ${logbookData.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-200 dark:border-green-800' :
                                logbookData.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-200 dark:border-red-800' :
                                    logbookData.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-200 dark:border-yellow-800' :
                                        'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                                }`}>
                                <span className={`w-2 h-2 rounded-full ${logbookData.status === 'Approved' ? 'bg-green-500' :
                                    logbookData.status === 'Rejected' ? 'bg-red-500' :
                                        logbookData.status === 'Pending' ? 'bg-yellow-500' :
                                            'bg-gray-400'
                                    }`} />
                                {logbookData.status.toUpperCase()}
                            </div>
                        )}

                        {/* View Signed Logbook Button */}
                        {logbookData?.status === 'Approved' && logbookData?.signedPDFPath && (
                            <button
                                onClick={() => setShowPdfModal(true)}
                                className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-full transition-all shadow-md shadow-blue-100"
                            >
                                <FiCheckCircle className="text-white" />
                                View Signed Logbook
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ... (rest of the component) ... */}



            {logbookData?.status === 'Rejected' && (
                <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 max-w-7xl mx-auto mt-6 mx-4 sm:mx-6 lg:mx-8">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <FiAlertCircle className="h-5 w-5 text-red-500" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700 dark:text-red-200 font-bold"> Logbook Rejected </p>
                            {/* Prioritize Rejection Reason, fallback to mentorComments if reason missing, or generic message */}
                            <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                                Reason: <span className="italic">"{logbookData.rejectionReason || logbookData.mentorComments || "No reason provided."}"</span>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {logbookData?.status !== 'Rejected' && logbookData?.mentorComments && (
                <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-4 max-w-7xl mx-auto mt-6 mx-4 sm:mx-6 lg:mx-8">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <FiAlertCircle className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-blue-700 dark:text-blue-200 font-bold"> Mentor Feedback </p>
                            <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                                <span className="italic">"{logbookData.mentorComments}"</span>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Month Navigation */}
                <div className="space-y-2">
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Timeline</h2>
                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                        {Array.from({ length: totalMonths }, (_, i) => i + 1).map(m => {
                            const isLocked = m > unlockedMonth && m > 1; // Always allow M1? No, locked if strict.
                            const isActive = currentMonth === m;
                            return (
                                <button
                                    key={m}
                                    onClick={() => !isLocked && handleMonthChange(m)}
                                    disabled={isLocked}
                                    className={`
                                        relative group flex-shrink-0 w-32 h-24 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-1
                                        ${isActive
                                            ? "bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-transparent shadow-lg shadow-blue-200 dark:shadow-none scale-105"
                                            : isLocked
                                                ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-70"
                                                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md dark:hover:shadow-none"
                                        }
                                    `}
                                >
                                    <span className="text-2xl font-bold">{m}</span>
                                    <span className="text-xs font-medium opacity-80">Month</span>
                                    {isLocked && <FiLock className="absolute top-3 right-3 text-gray-400" />}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Content Area */}
                {isLockedMonth ? (
                    <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
                        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full mb-4">
                            <FiLock className="text-gray-400 dark:text-gray-500 text-3xl" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Month Locked</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-md text-center">
                            Please submit your previous month's logbook to unlock this month.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {weeksToRender.map((week: number) => {
                            const wData = logbookData?.weeks?.find((w: any) => w.weekNumber === week);
                            const hasData = !!wData;
                            return (
                                <div key={week} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md dark:hover:shadow-none transition-shadow duration-300 overflow-hidden flex flex-col">
                                    <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30 flex justify-between items-center">
                                        <h3 className="font-bold text-gray-800 dark:text-white">Week {week}</h3>
                                        {hasData ? (
                                            <FiCheckCircle className="text-green-500" />
                                        ) : (
                                            <div className="w-2 h-2 rounded-full bg-gray-300" />
                                        )}
                                    </div>
                                    <div className="p-5 flex-1 space-y-3">
                                        {hasData ? (
                                            <>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wide">Activities</div>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 leading-relaxed">
                                                    {wData.activities}
                                                </p>
                                                {/* More details truncated visually */}
                                            </>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2 opacity-60">
                                                {week > 1 && !logbookData?.weeks?.some((w: any) => w.weekNumber === week - 1) ? (
                                                    <FiLock className="text-2xl" />
                                                ) : (
                                                    <FiEdit3 className="text-2xl" />
                                                )}
                                                <span className="text-sm">
                                                    {week > 1 && !logbookData?.weeks?.some((w: any) => w.weekNumber === week - 1) ? "Locked" : "No Entry"}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700">
                                        <button
                                            onClick={() => openModal(week)}
                                            disabled={!hasData && week > 1 && !logbookData?.weeks?.some((w: any) => w.weekNumber === week - 1)}
                                            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${isEditable
                                                ? (!hasData && week > 1 && !logbookData?.weeks?.some((w: any) => w.weekNumber === week - 1)
                                                    ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed border-none"
                                                    : "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500 shadow-sm dark:shadow-none")
                                                // View Only Style
                                                : "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                                                }`}
                                        >
                                            {week > 1 && !hasData && !logbookData?.weeks?.some((w: any) => w.weekNumber === week - 1) ? <FiLock /> : <FiEdit3 />}
                                            {isEditable ? (hasData ? "Edit Entry" : "Add Entry") : "View Only"}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Submit Action Area */}
                {!isLockedMonth && (
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 flex justify-end items-center z-20">
                        <div className="max-w-7xl w-full mx-auto px-4 flex justify-between items-center">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                {logbookData?.status === 'Draft' ? "Draft - Not Submitted" :
                                    logbookData?.status === 'Pending' ? "Submitted for Review" :
                                        logbookData?.status === 'Rejected' ? (
                                            <div className="flex flex-col items-end">
                                                <span className="text-red-500 font-bold">Rejected</span>
                                                {logbookData.rejectionReason && (
                                                    <span className="text-xs text-red-400 max-w-xs text-right truncate" title={logbookData.rejectionReason}>
                                                        "{logbookData.rejectionReason}"
                                                    </span>
                                                )}
                                            </div>
                                        ) : "Approved"}
                            </div>
                            <button
                                onClick={handleSubmitApproval}
                                disabled={!isEditable || sending}
                                className={`
                                    px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center gap-3 transform active:scale-95
                                    ${!isEditable || sending
                                        ? "bg-gray-400 cursor-not-allowed shadow-none"
                                        : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 hover:shadow-green-200"
                                    }
                                `}
                            >
                                {sending ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <FiSend />
                                        Get Approval
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* Modal */}
            {
                showModal && (
                    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-7xl p-0 overflow-hidden flex flex-col max-h-[100vh]">
                            {/* Modal Header */}
                            <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/30">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                                    Week {activeWeek} <span className="text-gray-400 dark:text-gray-500 font-normal text-base ml-2">Log Entry</span>
                                </h2>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-10 md:p-12 overflow-y-auto space-y-6">

                                <div className="space-y-6">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                        ACTIVITIES
                                        <span className="text-xs font-normal text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">Required</span>
                                    </label>
                                </div>
                                <textarea
                                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl p-4 h-32 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/30 focus:border-blue-500 outline-none transition-all resize-none text-gray-700 dark:text-gray-200 bg-gray-50/30 dark:bg-gray-700/30 focus:bg-white dark:focus:bg-gray-800"
                                    placeholder="Describe the tasks you worked on this week..."
                                    value={formData.activities}
                                    onChange={e => setFormData({ ...formData, activities: e.target.value })}
                                    readOnly={!isEditable}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">TECHNICAL SKILLS</label>
                                    <textarea
                                        className="w-full border border-gray-200 dark:border-gray-600 rounded-xl p-6 h-24 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/30 focus:border-blue-500 outline-none transition-all resize-none text-gray-700 dark:text-gray-200 bg-gray-50/30 dark:bg-gray-700/30 focus:bg-white dark:focus:bg-gray-800"
                                        placeholder="React, Node.js, etc."
                                        value={formData.techSkills}
                                        onChange={e => setFormData({ ...formData, techSkills: e.target.value })}
                                        readOnly={!isEditable}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">SOFT SKILLS</label>
                                    <textarea
                                        className="w-full border border-gray-200 dark:border-gray-600 rounded-xl p-6 h-24 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/30 focus:border-blue-500 outline-none transition-all resize-none text-gray-700 dark:text-gray-200 bg-gray-50/30 dark:bg-gray-700/30 focus:bg-white dark:focus:bg-gray-800"
                                        placeholder="Communication, Teamwork..."
                                        value={formData.softSkills}
                                        onChange={e => setFormData({ ...formData, softSkills: e.target.value })}
                                        readOnly={!isEditable}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">TRAININGS RECEIVED (Recieved by Company)</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl p-6 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/30 focus:border-blue-500 outline-none transition-all text-gray-700 dark:text-gray-200 bg-gray-50/30 dark:bg-gray-700/30 focus:bg-white dark:focus:bg-gray-800"
                                    placeholder="Any workshops or mentorship sessions?"
                                    value={formData.trainings}
                                    onChange={e => setFormData({ ...formData, trainings: e.target.value })}
                                    readOnly={!isEditable}
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6 pb-2">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium rounded-lg"
                                >
                                    {isEditable ? "Cancel" : "Close"}
                                </button>
                                {isEditable && (
                                    <button
                                        onClick={handleSaveDraft}
                                        disabled={saving}
                                        className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md shadow-blue-200 hover:shadow-lg transition-all disabled:opacity-70 disabled:shadow-none"
                                    >
                                        {saving ? "Saving..." : "Save Entry"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

            {/* Signed PDF Viewer Modal */}
            {showPdfModal && logbookData?.signedPDFPath && (
                <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/30">
                            <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <FiCheckCircle className="text-green-500" />
                                Signed Logbook - {MONTH_NAMES[logbookData.month - 1]} {logbookData.year}
                            </h2>
                            <button
                                onClick={() => setShowPdfModal(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                            >
                                <span className="text-2xl text-gray-500">&times;</span>
                            </button>
                        </div>
                        <div className="flex-1 bg-gray-100 dark:bg-gray-900 relative">
                            <iframe
                                src={logbookData.signedPDFPath.startsWith('http')
                                    ? logbookData.signedPDFPath
                                    : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/${logbookData.signedPDFPath}`}
                                className="w-full h-full"
                                title="Signed Logbook PDF"
                            />
                        </div>
                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end bg-white dark:bg-gray-800">
                            <a
                                href={logbookData.signedPDFPath.startsWith('http')
                                    ? logbookData.signedPDFPath
                                    : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/${logbookData.signedPDFPath}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg text-sm font-medium mr-2"
                            >
                                Open in New Tab
                            </a>
                            <button
                                onClick={() => setShowPdfModal(false)}
                                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
