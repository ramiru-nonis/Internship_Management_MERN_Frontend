"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function LogbookPage() {
    const router = useRouter();

    // --- State ---
    const [studentId, setStudentId] = useState<string | null>(null);
    const [mentorEmail, setMentorEmail] = useState<string>("");

    const [currentMonth, setCurrentMonth] = useState<number>(1);
    const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());

    const [logbookData, setLogbookData] = useState<any>(null); // Full logbook doc
    const [loading, setLoading] = useState(false);

    // Modal & Editing
    const [showModal, setShowModal] = useState(false);
    const [activeWeek, setActiveWeek] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        activities: "",
        techSkills: "",
        softSkills: "",
        trainings: ""
    });

    // Auto-Save State Removed
    const [saving, setSaving] = useState(false);

    // --- Init & Auth Check ---
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
            // 1. Check Profile Status
            const profileRes = await api.get('/students/profile');
            const status = profileRes.data.status;

            if (!['approved', 'hired', 'Hired', 'Completed'].includes(status)) {
                alert("Access Denied: You must be placed/hired to access the Logbook.");
                router.push('/student/dashboard');
                return;
            }

            // 2. Get Mentor Info
            const placementRes = await api.get('/placement');
            if (placementRes.data?.mentor_email) {
                setMentorEmail(placementRes.data.mentor_email);
            }

            // 3. Load Logbook for default month
            fetchLogbook(id, 1);

        } catch (error) {
            console.error("Init check failed", error);
            router.push('/student/dashboard');
        }
    };

    // --- Data Fetching ---
    const fetchLogbook = async (id: string, month: number) => {
        setLoading(true);
        try {
            const res = await api.get('/logbooks', {
                params: { studentId: id, month, year: currentYear }
            });

            if (res.data.exists) {
                setLogbookData(res.data.logbook);
            } else {
                setLogbookData(null); // No entry for this month yet
            }
        } catch (error) {
            console.error("Fetch logbook error", error);
        } finally {
            setLoading(false);
        }
    };

    // --- Event Handlers ---
    const handleMonthChange = (month: number) => {
        setCurrentMonth(month);
        if (studentId) fetchLogbook(studentId, month);
    };

    const isEditable = () => {
        return !logbookData || logbookData.status === 'Draft' || logbookData.status === 'Rejected';
    };

    const openWeekModal = (weekNum: number) => {
        setActiveWeek(weekNum);

        // Populate Form
        const weekData = logbookData?.weeks?.find((w: any) => w.weekNumber === weekNum);
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

    const handleDataChange = (field: string, value: string) => {
        if (!isEditable()) return; // Prevent edits in RO mode
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // --- Manual Save Logic ---
    const handleSave = async () => {
        if (!studentId || !activeWeek) return;

        setSaving(true);
        try {
            const res = await api.post('/logbooks/entry', {
                studentId,
                month: currentMonth,
                year: currentYear,
                weekNumber: activeWeek,
                data: formData
            });

            setLogbookData(res.data.logbook); // Update local cache
            // alert("Entry Saved Successfully!"); // Optional: Remove alert if sticky notification preferred
            // setShowModal(false); // KEEP OPEN per user request

        } catch (error: any) {
            console.error("Save failed", error);
            const errMsg = error.response?.data?.error || error.response?.data?.message || "Error saving";
            alert(`Failed to save: ${errMsg}`);
        } finally {
            setSaving(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    // --- Submission ---
    const handleSubmitForApproval = async () => {
        if (!logbookData?._id) return alert("Nothing to submit.");
        if (!mentorEmail) return alert("Mentor email not found.");

        const confirm = window.confirm(`Submit Month ${currentMonth} logbook to ${mentorEmail}?`);
        if (!confirm) return;

        try {
            await api.post('/logbooks/submit', {
                logbookId: logbookData._id,
                mentorEmail
            });
            alert("Submitted Successfully!");
            fetchLogbook(studentId!, currentMonth); // Refresh status
        } catch (error) {
            alert("Submission failed.");
            console.error(error);
        }
    };

    // Helper to get week summary
    const getWeekSummary = (weekKey: number) => {
        const found = logbookData?.weeks?.find((w: any) => w.weekNumber === weekKey);
        if (!found) return "No entries yet.";
        return (found.activities || "").substring(0, 50) + (found.activities?.length > 50 ? "..." : "");
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Student Logbook</h1>
                    <p className="text-gray-500 mt-1">Record your weekly progress and submit for mentor approval.</p>
                </header>

                {/* Month Tabs */}
                <div className="flex space-x-2 overflow-x-auto pb-4 mb-6 border-b border-gray-200">
                    {[1, 2, 3, 4, 5, 6].map(m => (
                        <button
                            key={m}
                            onClick={() => handleMonthChange(m)}
                            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${currentMonth === m
                                ? "bg-blue-600 text-white shadow-md"
                                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                                }`}
                        >
                            Month {m}
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                {loading ? (
                    <div className="text-center py-20 text-gray-500">Loading logbook...</div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* Status Bar */}
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                            <div>
                                <span className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Status: </span>
                                <span className={`font-bold ml-2 ${logbookData?.status === 'Approved' ? 'text-green-600' :
                                    logbookData?.status === 'Rejected' ? 'text-red-600' :
                                        logbookData?.status === 'Pending' ? 'text-yellow-600' :
                                            'text-gray-600'
                                    }`}>
                                    {logbookData?.status || "Draft"}
                                </span>
                            </div>

                            {(logbookData?.status === 'Draft' || logbookData?.status === 'Rejected' || !logbookData) && (
                                <button
                                    onClick={handleSubmitForApproval}
                                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm"
                                >
                                    Request Approval
                                </button>
                            )}
                        </div>

                        {/* Weeks Grid */}
                        <div className="p-6 grid gap-4">
                            {[1, 2, 3, 4].map(week => (
                                <div
                                    key={week}
                                    onClick={() => openWeekModal(week)} // Always allow open, logic handles read-only
                                    className={`
                                        border rounded-lg p-5 flex justify-between items-center transition-all group cursor-pointer bg-white hover:shadow-md
                                        ${(!isEditable()) ? "opacity-90" : "hover:border-blue-400"}
                                    `}
                                >
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600">Week {week}</h3>
                                        <p className="text-sm text-gray-500 mt-1">{getWeekSummary(week)}</p>
                                    </div>
                                    <div className="text-gray-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">
                                {isEditable() ? `Editing Week ${activeWeek}` : `Viewing Week ${activeWeek}`}
                            </h2>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6 flex-1">
                            {!isEditable() && (
                                <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm mb-4">
                                    <strong>Read Only:</strong> This logbook has been submitted/approved and cannot be edited.
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Activities Carried Out</label>
                                <textarea
                                    className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none bg-gray-50 focus:bg-white disabled:bg-gray-100 disabled:text-gray-500"
                                    rows={4}
                                    placeholder="What did you work on this week?"
                                    value={formData.activities}
                                    onChange={(e) => handleDataChange('activities', e.target.value)}
                                    disabled={!isEditable()}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Technical Skills</label>
                                    <textarea
                                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white disabled:bg-gray-100 disabled:text-gray-500"
                                        rows={3}
                                        value={formData.techSkills}
                                        onChange={(e) => handleDataChange('techSkills', e.target.value)}
                                        disabled={!isEditable()}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Soft Skills</label>
                                    <textarea
                                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white disabled:bg-gray-100 disabled:text-gray-500"
                                        rows={3}
                                        value={formData.softSkills}
                                        onChange={(e) => handleDataChange('softSkills', e.target.value)}
                                        disabled={!isEditable()}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Trainings Attended</label>
                                <textarea
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white disabled:bg-gray-100 disabled:text-gray-500"
                                    rows={2}
                                    value={formData.trainings}
                                    onChange={(e) => handleDataChange('trainings', e.target.value)}
                                    disabled={!isEditable()}
                                />
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-between items-center">
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2"
                            >
                                {isEditable() ? 'Cancel' : 'Close'}
                            </button>
                            {isEditable() && (
                                <div className="flex items-center gap-4">
                                    {/* Success Indicator could go here, for now using alert/state */}
                                    {/* {logbookData?.weeks?.find(w => w.weekNumber === activeWeek) && <span className="text-green-600 text-sm">Saved!</span>} */}
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className={`bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-md ${saving ? 'opacity-70 cursor-wait' : ''}`}
                                    >
                                        {saving ? "Saving..." : "Save Entry"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
