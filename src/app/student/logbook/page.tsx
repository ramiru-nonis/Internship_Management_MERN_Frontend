"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Navbar from "@/components/Navbar";

export default function LogbookPage() {
    const router = useRouter();

    // --- State ---
    const [studentId, setStudentId] = useState<string | null>(null);
    const [mentorEmail, setMentorEmail] = useState<string>("");

    // Dates & Tabs
    const [currentMonth, setCurrentMonth] = useState<number>(1);
    const [totalMonths, setTotalMonths] = useState<number>(0);
    const [initializing, setInitializing] = useState(true);

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
                throw new Error("No placement data");
            }

            setMentorEmail(pData.mentor_email || "");

            // 2. Calculate Durations
            if (pData.start_date && pData.end_date) {
                const start = new Date(pData.start_date);
                const end = new Date(pData.end_date);
                const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
                setTotalMonths(Math.max(1, months));
            }

            // 3. Load Data
            fetchLogbook(id, 1);

        } catch (error) {
            alert("Access Denied: Please fill placement form first.");
            router.push('/student/dashboard');
        } finally {
            setInitializing(false);
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
        setCurrentMonth(m);
        if (studentId) fetchLogbook(studentId, m);
    };

    const openModal = (week: number) => {
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
            alert("Entry Saved Successfully!");
            setShowModal(false);
        } catch (error) {
            alert("Failed to save draft.");
        } finally {
            setSaving(false);
        }
    };

    const handleClear = () => {
        setFormData({ activities: "", techSkills: "", softSkills: "", trainings: "" });
    };

    const handleSubmitApproval = async () => {
        if (!logbookData?._id) return alert("No entries to submit.");

        // Basic Check: Are all 4 weeks filled? (Optional per req, but good logic)
        // const filledWeeks = logbookData.weeks.length;
        // if(filledWeeks < 4) return alert("Please fill all 4 weeks.");

        if (!window.confirm("Submit for Mentor Approval?")) return;

        try {
            await api.post('/logbooks/submit', {
                logbookId: logbookData._id,
                mentorEmail
            });
            alert("Submitted for Approval!");
            fetchLogbook(studentId!, currentMonth);
        } catch (error) {
            alert("Submission Failed");
        }
    };

    // Helper for table cell
    const getCell = (week: number, field: string) => {
        const w = logbookData?.weeks?.find((w: any) => w.weekNumber === week);
        return w ? w[field] : "-";
    };

    if (initializing) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Logbook Management</h1>

                {/* Month Tabs */}
                {totalMonths > 0 && (
                    <div className="flex gap-2 overflow-x-auto mb-6 border-b pb-2">
                        {Array.from({ length: totalMonths }, (_, i) => i + 1).map(m => (
                            <button
                                key={m}
                                onClick={() => handleMonthChange(m)}
                                className={`px-6 py-2 rounded-t-lg font-medium transition-colors ${currentMonth === m
                                    ? "bg-blue-600 text-white"
                                    : "bg-white text-gray-600 hover:bg-gray-100"
                                    }`}
                            >
                                Month {m}
                            </button>
                        ))}
                    </div>
                )}

                {/* Status Display */}
                {logbookData && (
                    <div className="mb-4 text-sm font-semibold">
                        Status: <span className={
                            logbookData.status === 'Approved' ? 'text-green-600' :
                                logbookData.status === 'Rejected' ? 'text-red-600' :
                                    logbookData.status === 'Draft' ? 'text-gray-600' : 'text-yellow-600'
                        }>{logbookData.status}</span>
                    </div>
                )}

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 mb-6 min-h-[300px] relative">
                    {loading && (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    )}
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-100 text-gray-700">
                            <tr>
                                <th className="p-4 border-b w-24">Week</th>
                                <th className="p-4 border-b">Activities Carried Out</th>
                                <th className="p-4 border-b">Technical Skills</th>
                                <th className="p-4 border-b">Soft Skills</th>
                                <th className="p-4 border-b">Trainings Received</th>
                                <th className="p-4 border-b w-32">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[1, 2, 3, 4].map(week => (
                                <tr key={week} className="border-b last:border-b-0 hover:bg-gray-50">
                                    <td className="p-4 font-semibold text-gray-900">Week {week}</td>
                                    <td className="p-4 text-gray-600 text-sm">{getCell(week, 'activities')}</td>
                                    <td className="p-4 text-gray-600 text-sm">{getCell(week, 'techSkills')}</td>
                                    <td className="p-4 text-gray-600 text-sm">{getCell(week, 'softSkills')}</td>
                                    <td className="p-4 text-gray-600 text-sm">{getCell(week, 'trainings')}</td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => openModal(week)}
                                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                            disabled={logbookData?.status === 'Pending' || logbookData?.status === 'Approved'}
                                        >
                                            {logbookData?.status === 'Pending' ? 'Locked' : 'Add / Edit'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Approval Button */}
                <div className="text-right">
                    <button
                        onClick={handleSubmitApproval}
                        disabled={logbookData?.status === 'Pending' || logbookData?.status === 'Approved'}
                        className={`px-6 py-3 rounded-lg font-bold text-white shadow-md transition-all ${logbookData?.status === 'Pending' || logbookData?.status === 'Approved'
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700"
                            }`}
                    >
                        Get Approval
                    </button>
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
                            <h2 className="text-xl font-bold mb-4 text-gray-900">Add Log Entry - Week {activeWeek}</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Activities Carried Out</label>
                                    <textarea
                                        className="w-full border rounded-lg p-3 h-24 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.activities}
                                        onChange={e => setFormData({ ...formData, activities: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Technical Skills</label>
                                        <textarea
                                            className="w-full border rounded-lg p-3 h-20 focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.techSkills}
                                            onChange={e => setFormData({ ...formData, techSkills: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Soft Skills</label>
                                        <textarea
                                            className="w-full border rounded-lg p-3 h-20 focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={formData.softSkills}
                                            onChange={e => setFormData({ ...formData, softSkills: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Trainings Received</label>
                                    <textarea
                                        className="w-full border rounded-lg p-3 h-16 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.trainings}
                                        onChange={e => setFormData({ ...formData, trainings: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between mt-6 pt-4 border-t">
                                <button
                                    onClick={handleClear}
                                    className="text-red-500 font-medium hover:text-red-700"
                                >
                                    Clear
                                </button>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveDraft}
                                        disabled={saving}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {saving ? "Saving..." : "Save Draft"}
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
