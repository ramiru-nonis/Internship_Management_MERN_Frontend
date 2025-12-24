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

    // Dates & Tabs
    const [currentMonth, setCurrentMonth] = useState<number>(1);
    const [totalMonths, setTotalMonths] = useState<number>(0);
    const [initializing, setInitializing] = useState(true);

    // Logic State
    const [unlockedMonth, setUnlockedMonth] = useState<number>(1); // The furthest month valid to edit
    const [submissionHistory, setSubmissionHistory] = useState<any[]>([]);

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

            if (!pData) throw new Error("No placement data");

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
            console.error(error);
            // alert("Access Denied: Please fill placement form first.");
            // router.push('/student/dashboard');
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

            // Load current selected month data
            fetchLogbook(id, currentMonth);

        } catch (e) {
            console.error("History fetch failed", e);
        }
    };

    const fetchLogbook = async (id: string, month: number) => {
        setLoading(true);
        try {
            const res = await api.get('/logbooks', {
                params: { studentId: id, month, year: new Date().getFullYear() }
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
            // Prevent clicking future locked months (optional, UI disables it anyway)
            return;
        }
        setCurrentMonth(m);
        if (studentId) fetchLogbook(studentId, m);
    };

    const openModal = (week: number) => {
        if (!isEditable) return;
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
                year: new Date().getFullYear(),
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
                fetchLogbook(studentId, currentMonth); // Refresh current view
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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-800 pb-20">

            {/* Header / Top Bar */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <FiCalendar className="text-blue-600 text-xl" />
                        </div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600">
                            Monthly Logbook
                        </h1>
                    </div>
                    {/* Status Pill */}
                    {logbookData && (
                        <div className={`px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 border ${logbookData.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' :
                                logbookData.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                    logbookData.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                        'bg-gray-100 text-gray-600 border-gray-200'
                            }`}>
                            <span className={`w-2 h-2 rounded-full ${logbookData.status === 'Approved' ? 'bg-green-500' :
                                    logbookData.status === 'Rejected' ? 'bg-red-500' :
                                        logbookData.status === 'Pending' ? 'bg-yellow-500' :
                                            'bg-gray-400'
                                }`} />
                            {logbookData.status.toUpperCase()}
                        </div>
                    )}
                </div>
            </div>

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
                                            ? "bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-transparent shadow-lg shadow-blue-200 scale-105"
                                            : isLocked
                                                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-70"
                                                : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:shadow-md"
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
                    <div className="flex flex-col items-center justify-center h-64 bg-white rounded-3xl border border-dashed border-gray-300">
                        <div className="bg-gray-100 p-4 rounded-full mb-4">
                            <FiLock className="text-gray-400 text-3xl" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Month Locked</h3>
                        <p className="text-gray-500 max-w-md text-center">
                            Please submit your previous month's logbook to unlock this month.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(week => {
                            const wData = logbookData?.weeks?.find((w: any) => w.weekNumber === week);
                            const hasData = !!wData;
                            return (
                                <div key={week} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden flex flex-col">
                                    <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                        <h3 className="font-bold text-gray-800">Week {week}</h3>
                                        {hasData ? (
                                            <FiCheckCircle className="text-green-500" />
                                        ) : (
                                            <div className="w-2 h-2 rounded-full bg-gray-300" />
                                        )}
                                    </div>
                                    <div className="p-5 flex-1 space-y-3">
                                        {hasData ? (
                                            <>
                                                <div className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Activities</div>
                                                <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
                                                    {wData.activities}
                                                </p>
                                                {/* More details truncated visually */}
                                            </>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2 opacity-60">
                                                <FiEdit3 className="text-2xl" />
                                                <span className="text-sm">No Entry</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 bg-gray-50 border-t border-gray-100">
                                        <button
                                            onClick={() => openModal(week)}
                                            disabled={!isEditable}
                                            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${isEditable
                                                    ? "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm"
                                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                }`}
                                        >
                                            <FiEdit3 />
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
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200 flex justify-end items-center z-20">
                        <div className="max-w-7xl w-full mx-auto px-4 flex justify-between items-center">
                            <div className="text-sm text-gray-500">
                                {logbookData?.status === 'Draft' ? "Draft - Not Submitted" :
                                    logbookData?.status === 'Pending' ? "Submitted for Review" : ""}
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
            {showModal && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-800">
                                Week {activeWeek} <span className="text-gray-400 font-normal text-base ml-2">Log Entry</span>
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto space-y-6">

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    ACTIVITIES
                                    <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Required</span>
                                </label>
                                <textarea
                                    className="w-full border border-gray-200 rounded-xl p-4 h-32 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all resize-none text-gray-700 bg-gray-50/30 focus:bg-white"
                                    placeholder="Describe the tasks you worked on this week..."
                                    value={formData.activities}
                                    onChange={e => setFormData({ ...formData, activities: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">TECHNICAL SKILLS</label>
                                    <textarea
                                        className="w-full border border-gray-200 rounded-xl p-4 h-24 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all resize-none text-gray-700 bg-gray-50/30 focus:bg-white"
                                        placeholder="React, Node.js, etc."
                                        value={formData.techSkills}
                                        onChange={e => setFormData({ ...formData, techSkills: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">SOFT SKILLS</label>
                                    <textarea
                                        className="w-full border border-gray-200 rounded-xl p-4 h-24 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all resize-none text-gray-700 bg-gray-50/30 focus:bg-white"
                                        placeholder="Communication, Teamwork..."
                                        value={formData.softSkills}
                                        onChange={e => setFormData({ ...formData, softSkills: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">TRAININGS RECEIVED</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-200 rounded-xl p-4 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all text-gray-700 bg-gray-50/30 focus:bg-white"
                                    placeholder="Any workshops or mentorship sessions?"
                                    value={formData.trainings}
                                    onChange={e => setFormData({ ...formData, trainings: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-6 py-2.5 text-gray-600 hover:text-gray-800 font-medium rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveDraft}
                                disabled={saving}
                                className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md shadow-blue-200 hover:shadow-lg transition-all disabled:opacity-70 disabled:shadow-none"
                            >
                                {saving ? "Saving..." : "Save Entry"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
