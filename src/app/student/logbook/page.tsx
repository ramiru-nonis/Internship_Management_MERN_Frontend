"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface LogbookEntry {
    week: number;
    activities: string;
    techSkills: string;
    softSkills: string;
    trainings: string;
    status: "Draft" | "Submitted" | "Approved" | "Rejected";
}

export default function LogbookPage() {
    const router = useRouter();
    const [selectedMonth, setSelectedMonth] = useState<number>(1);
    const [months, setMonths] = useState<number[]>([]);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
    const [studentId, setStudentId] = useState<string | null>(null);
    const [mentorEmail, setMentorEmail] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [monthStatus, setMonthStatus] = useState<string>("Draft");
    // Auto-save states
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<string>("");

    // Form State
    const [formData, setFormData] = useState({
        activities: "",
        techSkills: "",
        softSkills: "",
        trainings: "",
    });

    const [entries, setEntries] = useState<LogbookEntry[]>([]);

    const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());

    useEffect(() => {
        // Get Student ID and Placement Info
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setStudentId(user._id);
            fetchPlacementInfo(user._id);
        }
    }, []);

    const fetchPlacementInfo = async (id: string) => {
        try {
            // Check student profile status first
            const profileRes = await api.get('/students/profile');
            const status = profileRes.data.status;
            const allowedStatuses = ['approved', 'hired', 'Hired', 'Completed'];

            if (!allowedStatuses.includes(status)) {
                alert("You need to submit your placement form and get approved before accessing the logbook.");
                router.push('/student/dashboard');
                return;
            }

            // Fetch Real Placement Info
            const res = await api.get('/placement');
            if (res.data && res.data.mentor_email) {
                setMentorEmail(res.data.mentor_email);
            } else {
                // Fallback if no email found (should not happen if status is hired)
                console.warn("No mentor email found in placement data");
            }

            // Calculate months logic (Dynamic)
            // Assuming internship starts in the current year. 
            // Ideally, start/end dates should also come from placement data.
            // For now, using dynamic year but static month range to match user request "6 months only"
            const startStr = res.data.start_date || `${currentYear}-01-01`;
            const endStr = res.data.end_date || `${currentYear}-06-30`;

            const start = new Date(startStr);
            const end = new Date(endStr);

            // Handle edge case where dates might be invalid or missing
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                setMonths([1, 2, 3, 4, 5, 6]); // Default fallback
            } else {
                const monthDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
                // Generate relative month numbers (1, 2, 3...)
                setMonths(Array.from({ length: Math.max(1, monthDiff) }, (_, i) => i + 1));
            }

        } catch (error) {
            console.error("Error fetching placement info", error);
            router.push('/student/dashboard');
        }
    }

    useEffect(() => {
        if (studentId) {
            fetchLogbook();
        }
    }, [studentId, selectedMonth]);

    // Auto-save effect
    useEffect(() => {
        if (!showModal || !selectedWeek || !studentId) return;

        const timeoutId = setTimeout(() => {
            if (monthStatus === 'Draft') {
                saveEntry();
            }
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [formData, showModal, selectedWeek, studentId]);

    const saveEntry = async () => {
        if (!studentId || !selectedWeek) return;

        setSaving(true);
        setSaveStatus("Saving...");

        try {
            await api.post('/logbooks/entry', {
                studentId,
                month: `Month ${selectedMonth}`,
                year: currentYear,
                weekNumber: selectedWeek,
                data: formData
            });

            // Update local state silently
            setEntries(prev => {
                const temp = prev.filter(e => e.week !== selectedWeek);
                return [...temp, {
                    week: selectedWeek,
                    ...formData,
                    status: monthStatus as any
                }].sort((a, b) => a.week - b.week)
            });

            setSaveStatus("Saved");
            setTimeout(() => setSaveStatus(""), 3000); // Clear saved message after 3s
        } catch (error: any) {
            console.error("Error auto-saving", error);
            setSaveStatus("Error saving");
        } finally {
            setSaving(false);
        }
    };

    const fetchLogbook = async () => {
        try {
            setLoading(true);
            const res = await api.get('/logbooks', {
                params: { studentId, month: `Month ${selectedMonth}`, year: currentYear }
            });

            if (res.data.exists) {
                const logbook = res.data.logbook;
                setEntries(logbook.weeks.map((w: any) => ({
                    week: w.weekNumber,
                    activities: w.activities,
                    techSkills: w.techSkills,
                    softSkills: w.softSkills,
                    trainings: w.trainings,
                    status: logbook.status
                })));
                setMonthStatus(logbook.status);
            } else {
                setEntries([]);
                setMonthStatus("Draft");
            }
        } catch (error) {
            console.error("Error fetching logbook", error);
        } finally {
            setLoading(false);
        }
    }

    const handleWeekClick = (week: number) => {
        setSelectedWeek(week);
        // Load existing data for the week if exists
        const existing = entries.find(e => e.week === week);
        if (existing) {
            setFormData({
                activities: existing.activities,
                techSkills: existing.techSkills,
                softSkills: existing.softSkills,
                trainings: existing.trainings
            })
        } else {
            setFormData({
                activities: "",
                techSkills: "",
                softSkills: "",
                trainings: ""
            })
        }
        setShowModal(true);
    };

    // Manual Save Removed in favor of Auto-save
    // const handleSaveDraft = async () => { ... }

    const handleClear = () => {
        setFormData({
            activities: "",
            techSkills: "",
            softSkills: "",
            trainings: "",
        });
    };

    const handleGetApproval = async () => {
        if (!studentId) return;
        if (entries.length < 4) {
            alert("Please complete all 4 weeks before submitting for approval.");
            return;
        }

        // Ensure mentor email is available
        if (!mentorEmail) {
            alert("Mentor email not found. Please contact support.");
            return;
        }

        try {
            const res = await api.get('/logbooks', {
                params: { studentId, month: `Month ${selectedMonth}`, year: currentYear }
            });

            if (res.data.exists) {
                const logbookId = res.data.logbook._id;
                await api.post('/logbooks/submit', {
                    logbookId,
                    mentorEmail
                });
                setMonthStatus("Pending");
                alert(`Submitted for approval! Notification sent to ${mentorEmail}.`);
            } else {
                alert("Please save at least one entry first.");
            }
        } catch (error) {
            console.error("Error submitting logbook", error);
            alert("Failed to submit logbook.");
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">Weekly Logbook</h1>

                {/* Month Navigation */}
                <div className="flex space-x-4 mb-8 overflow-x-auto pb-4">
                    {months.map((month) => (
                        <button
                            key={month}
                            onClick={() => setSelectedMonth(month)}
                            className={`px-6 py-3 rounded-lg font-semibold transition-all shadow-sm whitespace-nowrap ${selectedMonth === month
                                ? "bg-purple-600 text-white shadow-purple-200"
                                : "bg-white text-gray-600 hover:bg-gray-100"
                                }`}
                        >
                            Month {month}
                        </button>
                    ))}
                </div>

                {/* Logbook Table */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8 border border-gray-100 relative">
                    {loading && (
                        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                            Loading...
                        </div>
                    )}
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="p-4 font-semibold text-gray-600 text-sm">Week</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Activities Carried Out</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Technical Skills Developed</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Soft Skills Developed</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {[1, 2, 3, 4].map((week) => {
                                const entry = entries.find(e => e.week === week);
                                return (
                                    <tr key={week} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <button
                                                onClick={() => handleWeekClick(week)}
                                                disabled={monthStatus !== 'Draft'}
                                                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${monthStatus !== 'Draft'
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                                                    }`}
                                            >
                                                Week {week}
                                            </button>
                                        </td>
                                        <td className="p-4 text-gray-700 text-sm">{entry?.activities || "-"}</td>
                                        <td className="p-4 text-gray-700 text-sm">{entry?.techSkills || "-"}</td>
                                        <td className="p-4 text-gray-700 text-sm">{entry?.softSkills || "-"}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Get Approval Button */}
                <div className="flex justify-end items-center space-x-4">
                    <div className="text-sm font-semibold">
                        Status: <span className={`${monthStatus === 'Approved' ? 'text-green-600' :
                            monthStatus === 'Rejected' ? 'text-red-600' :
                                monthStatus === 'Pending' ? 'text-yellow-600' :
                                    'text-gray-600'
                            }`}>{monthStatus}</span>
                    </div>
                    {monthStatus === 'Draft' && (
                        <button onClick={handleGetApproval} className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-green-200 transition-all transform hover:-translate-y-1">
                            Get Approval for Month {selectedMonth}
                        </button>
                    )}
                </div>

                {/* Add Entry Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full scale-100 transform transition-all">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">Week {selectedWeek} Log Entry</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Activities Carried Out</label>
                                    <textarea
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                        rows={3}
                                        value={formData.activities}
                                        onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Technical Skills Developed</label>
                                    <textarea
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                        rows={2}
                                        value={formData.techSkills}
                                        onChange={(e) => setFormData({ ...formData, techSkills: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Soft Skills Developed</label>
                                    <textarea
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                        rows={2}
                                        value={formData.softSkills}
                                        onChange={(e) => setFormData({ ...formData, softSkills: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Trainings Received/Attended</label>
                                    <textarea
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                        rows={2}
                                        value={formData.trainings}
                                        onChange={(e) => setFormData({ ...formData, trainings: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between items-center mt-8">
                                <div className="text-sm font-medium italic text-gray-500">
                                    {saveStatus}
                                </div>
                                <div className="flex space-x-4">
                                    <button
                                        onClick={handleClear}
                                        className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors shadow-md"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
