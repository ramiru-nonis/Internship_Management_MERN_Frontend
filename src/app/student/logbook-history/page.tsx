"use client";
import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

export default function LogbookHistoryPage() {
    const router = useRouter();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            fetchHistory(user._id);
        } else {
            router.push('/login');
        }
    }, []);

    const fetchHistory = async (studentId: string) => {
        try {
            const res = await api.get(`/logbooks/history/${studentId}`);
            setHistory(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="max-w-4xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Logbook History</h1>
                    <button
                        onClick={() => router.push('/student/logbook')}
                        className="text-blue-600 hover:underline font-medium"
                    >
                        Back to Logbook
                    </button>
                </header>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-100 text-gray-700 uppercase text-xs font-bold tracking-wider">
                            <tr>
                                <th className="p-5 border-b">Month</th>
                                <th className="p-5 border-b">Year</th>
                                <th className="p-5 border-b">Submitted Date</th>
                                <th className="p-5 border-b">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan={4} className="p-6 text-center text-gray-500">Loading...</td></tr>
                            ) : history.length === 0 ? (
                                <tr><td colSpan={4} className="p-6 text-center text-gray-500">No submissions found.</td></tr>
                            ) : (
                                history.map((item) => (
                                    <tr key={item._id} className="hover:bg-gray-50">
                                        <td className="p-5 font-medium text-gray-900">Month {item.month}</td>
                                        <td className="p-5 text-gray-600">{item.year}</td>
                                        <td className="p-5 text-gray-600">{new Date(item.submittedDate).toLocaleDateString()}</td>
                                        <td className="p-5">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                                    item.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
