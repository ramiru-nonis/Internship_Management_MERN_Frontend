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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 font-sans">
            <div className="max-w-4xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Logbook History</h1>
                    <button
                        onClick={() => router.push('/student/logbook')}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                        Back to Logbook
                    </button>
                </header>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 uppercase text-xs font-bold tracking-wider">
                            <tr>
                                <th className="p-5 border-b">Month</th>
                                <th className="p-5 border-b">Year</th>
                                <th className="p-5 border-b">Submitted Date</th>
                                <th className="p-5 border-b">Status</th>
                                <th className="p-5 border-b">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan={5} className="p-6 text-center text-gray-500 dark:text-gray-400">Loading...</td></tr>
                            ) : history.length === 0 ? (
                                <tr><td colSpan={5} className="p-6 text-center text-gray-500 dark:text-gray-400">No submissions found.</td></tr>
                            ) : (
                                history.map((item) => (
                                    <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="p-5 font-medium text-gray-900 dark:text-white">Month {item.month}</td>
                                        <td className="p-5 text-gray-600 dark:text-gray-400">{item.year}</td>
                                        <td className="p-5 text-gray-600 dark:text-gray-400">{new Date(item.submittedDate).toLocaleDateString()}</td>
                                        <td className="p-5">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.status === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200' :
                                                item.status === 'Rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200' :
                                                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-200'
                                                }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            {item.status === 'Approved' && item.signedPDFPath ? (
                                                <a
                                                    href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'}/logbooks/${item._id}/download`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline text-sm font-semibold"
                                                >
                                                    View Signed Logbook
                                                </a>
                                            ) : (
                                                <span className="text-gray-400 text-sm">N/A</span>
                                            )}
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
