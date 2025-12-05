"use client";
import React, { useState, useEffect } from "react";
import api from "@/lib/api";

interface HistoryEntry {
    month: string;
    status: "Pending" | "Approved" | "Rejected" | "Draft";
    submittedDate: string;
    submittedToCoordinator?: boolean;
}

export default function LogbookHistoryPage() {
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [studentId, setStudentId] = useState<string | null>(null);
    const [submittedToCoordinator, setSubmittedToCoordinator] = useState(false);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setStudentId(user._id);
            fetchHistory(user._id);
        }
    }, []);

    const fetchHistory = async (id: string) => {
        try {
            const res = await api.get(`/logbooks/history/${id}`);
            const data = res.data;
            setHistory(data.map((item: any) => ({
                month: item.month,
                status: item.status,
                submittedDate: item.submittedDate ? new Date(item.submittedDate).toLocaleDateString() : 'N/A',
                submittedToCoordinator: item.submittedToCoordinator
            })));

            // Check if any are already submitted to coordinator
            if (data.some((item: any) => item.submittedToCoordinator)) {
                setSubmittedToCoordinator(true);
            }
        } catch (error) {
            console.error("Error fetching history", error);
        }
    }

    const allApproved = history.length > 0 && history.every(h => h.status === "Approved");

    const handleSubmitToCoordinator = async () => {
        if (!studentId) return;
        try {
            await api.post('/logbooks/submit-all', { studentId });
            setSubmittedToCoordinator(true);
            alert("Submitted all logbooks to Coordinator successfully!");
        } catch (error: any) {
            console.error("Error submitting to coordinator", error);
            alert(error.response?.data?.message || "Failed to submit to coordinator.");
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">Logbook History</h1>

                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 mb-8">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="p-4 font-semibold text-gray-600 text-sm">Month</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Submitted Date</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Status</th>
                                <th className="p-4 font-semibold text-gray-600 text-sm">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {history.length > 0 ? history.map((entry, index) => (
                                <tr key={index} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 text-gray-700 font-medium">{entry.month}</td>
                                    <td className="p-4 text-gray-600">{entry.submittedDate}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${entry.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                            entry.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {entry.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">View Details</button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500">No logbook history found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleSubmitToCoordinator}
                        disabled={!allApproved || submittedToCoordinator}
                        className={`px-8 py-3 rounded-xl font-bold shadow-lg transition-all transform ${allApproved && !submittedToCoordinator
                            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 hover:-translate-y-1"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                    >
                        {submittedToCoordinator ? "Submitted to Coordinator" : "Submit to Coordinator"}
                    </button>
                </div>
                {!allApproved && (
                    <p className="text-right text-sm text-gray-500 mt-2">All monthly logbooks must be approved before final submission.</p>
                )}
            </div>
        </div>
    );
}
