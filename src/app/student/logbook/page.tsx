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

    // Form State
    const [formData, setFormData] = useState({
        activities: "",
        techSkills: "",
        softSkills: "",
        trainings: "",
    });

    const [entries, setEntries] = useState<LogbookEntry[]>([]);

    useEffect(() => {
        // Get Student ID and Placement Info
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setStudentId(user._id); // Assuming _id field

            // Fetch Placement Info to calculate months
            // In real app, fetch /api/placement/student/${user._id}
            fetchPlacementInfo(user._id);
        }
    }, []);

    const fetchPlacementInfo = async (id: string) => {
        try {
            // Mock placement fetch or real
            // const res = await api.get(`/placement/student/${id}`);
            // setMentorEmail(res.data.mentorEmail);
            setMentorEmail("mentor@example.com"); // Mock for now

            // Calculate months logic
            const start = new Date("2024-01-01"); // Mock start
            const end = new Date("2024-06-30"); // Mock end
            const monthDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
            setMonths(Array.from({ length: monthDiff }, (_, i) => i + 1));
        } catch (error) {
            console.error("Error fetching placement info", error);
        }
    }

    useEffect(() => {
        if (studentId) {
            fetchLogbook();
        }
    }, [studentId, selectedMonth]);

    const fetchLogbook = async () => {
        try {
            setLoading(true);
            const res = await api.get('/logbooks', {
                params: { studentId, month: `Month ${selectedMonth}`, year: 2024 } // Hardcoded year for now
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

    const handleSaveDraft = async () => {
        if (!studentId || !selectedWeek) return;

        try {
            await api.post('/logbooks/entry', {
                studentId,
                month: `Month ${selectedMonth}`,
                year: 2024,
                weekNumber: selectedWeek,
                data: formData
            });

            // Update local state
            setEntries(prev => {
                const temp = prev.filter(e => e.week !== selectedWeek);
                return [...temp, {
                    week: selectedWeek,
                    ...formData,
                    status: monthStatus as any
                }].sort((a, b) => a.week - b.week)
            })
            setShowModal(false);
            alert("Draft saved successfully!");
        } catch (error) {
            console.error("Error saving draft", error);
            alert("Failed to save draft.");
        }
    };

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

        try {
            const res = await api.get('/logbooks', {
                params: { studentId, month: `Month ${selectedMonth}`, year: 2024 }
            });

            if (res.data.exists) {
                const logbookId = res.data.logbook._id;
                await api.post('/logbooks/submit', {
                    logbookId,
                    mentorEmail
                });
                setMonthStatus("Pending");
                alert("Submitted for approval! Mentor has been notified.");
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

                            <div className="flex justify-end space-x-4 mt-8">
                                <button
                                    onClick={handleClear}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                                >
                                    Clear
                                </button>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveDraft}
                                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold shadow-md shadow-purple-200 transition-all"
                                >
                                    Save Draft
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
