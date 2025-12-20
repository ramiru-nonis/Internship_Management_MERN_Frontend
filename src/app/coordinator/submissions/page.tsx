"use client";
import React, { useState, useEffect } from "react";
import api from "@/lib/api";

interface Submission {
    id: string;
    type: "Logbook" | "Marksheet" | "Exit Presentation";
    name: string;
    cbNumber: string;
    month?: string;
    status: string;
    date: string;
    fileUrl?: string; // For Marksheet/Presentation
}

export default function CoordinatorSubmissionsPage() {
    const [filter, setFilter] = useState<"All" | "Logbook" | "Marksheet" | "Exit Presentation">("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const fetchSubmissions = async () => {
        try {
            const res = await api.get('/submissions');
            setSubmissions(res.data);
        } catch (error) {
            console.error("Error fetching submissions", error);
        } finally {
            setLoading(false);
        }
    }

    const filteredSubmissions = submissions.filter((sub) => {
        const matchesFilter = filter === "All" || sub.type === filter;
        const matchesSearch = sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sub.cbNumber.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const handleView = (sub: Submission) => {
        if (sub.type === 'Logbook') {
            alert(`View Logic for Logbook ${sub.id} (Open Detail Modal or Page)`);
        } else if (sub.fileUrl) {
            // Construct full URL if needed, assuming API serves static files
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
            const url = `${apiUrl}${sub.fileUrl}`;
            window.open(url, '_blank');
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">View Student Submissions</h1>

                {/* Controls */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    {/* Search */}
                    <div className="relative w-full md:w-96">
                        <input
                            type="text"
                            placeholder="Search by Name or CB Number..."
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>

                    {/* Filters */}
                    <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-100">
                        {["All", "Logbook", "Marksheet", "Exit Presentation"].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f as any)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === f
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Scrollable List */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 max-h-[600px] overflow-y-auto">
                    {loading ? (
                        <div className="p-12 text-center text-gray-500">Loading submissions...</div>
                    ) : filteredSubmissions.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {filteredSubmissions.map((sub) => (
                                <div key={sub.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center space-x-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white ${sub.type === 'Logbook' ? 'bg-purple-500' :
                                            sub.type === 'Marksheet' ? 'bg-red-500' : 'bg-orange-500'
                                            }`}>
                                            {sub.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800">{sub.name} <span className="text-gray-400 font-normal text-sm">({sub.cbNumber})</span></h3>
                                            <p className="text-sm text-gray-500">
                                                {sub.type} {sub.month && `- ${sub.month}`}
                                                <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${sub.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                                    sub.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {sub.status}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleView(sub)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-white hover:border-blue-500 hover:text-blue-600 font-medium transition-all shadow-sm hover:shadow-md"
                                    >
                                        View
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center text-gray-400">
                            No submissions found matching your criteria.
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
