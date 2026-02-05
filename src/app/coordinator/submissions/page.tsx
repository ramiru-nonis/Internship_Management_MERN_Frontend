"use client";
import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

interface Submission {
    id: string;
    type: "Logbook" | "Marksheet" | "Exit Presentation" | "Placements";
    name: string;
    cbNumber: string;
    month?: string;
    status: string;
    date: string;
    fileUrl?: string; // For Marksheet/Presentation
    profilePicture?: string | null;
    logbookId?: string;
    studentId?: string;
    scheduledDate?: string;
    meetLink?: string;
    placement?: {
        company_name: string;
        position: string;
        start_date: string;
        end_date: string;
        mentor_name: string;
        mentor_email: string;
        mentor_phone: string;
        company_address: string;
        description: string;
        placement_job_title?: string;
        contact_number?: string;
        email?: string;
    };
}

interface LogbookData {
    _id: string; // Add ID for comparison
    month: number;
    year: number;
    status: string;
    weeks: any[];
    signedPDFPath?: string;
}

export default function CoordinatorSubmissionsPage() {
    const [filter, setFilter] = useState<"Logbook" | "Placements" | "Marksheet" | "Exit Presentation">("Logbook");
    const [searchTerm, setSearchTerm] = useState("");
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [authLoading, setAuthLoading] = useState(true);
    const router = useRouter();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');

        if (!token || !user) {
            router.push('/login');
            return;
        }

        try {
            const userData = JSON.parse(user);
            if (userData.role !== 'coordinator' && userData.role !== 'admin') {
                router.push('/login');
                return;
            }
            setAuthLoading(false);
            fetchSubmissions();
        } catch (error) {
            console.error('Error parsing user data:', error);
            router.push('/login');
        }
    }, []);

    // Logbook Modal State
    const [showLogbookModal, setShowLogbookModal] = useState(false);
    const [selectedLogbook, setSelectedLogbook] = useState<LogbookData | null>(null);
    const [logbookHistory, setLogbookHistory] = useState<LogbookData[]>([]);
    const [loadingLogbook, setLoadingLogbook] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Sorting State for Scheduled Date
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
    const [selectedPresentationId, setSelectedPresentationId] = useState<string | null>(null);
    const [scheduleDateTime, setScheduleDateTime] = useState("");
    const [meetLink, setMeetLink] = useState("");

    // Placement Modal State
    const [showPlacementModal, setShowPlacementModal] = useState(false);
    const [selectedPlacement, setSelectedPlacement] = useState<any>(null);

    const openScheduleModal = (id: string, currentSchedule?: string, currentLink?: string) => {
        setSelectedPresentationId(id);
        // Format for input datetime-local: YYYY-MM-DDTHH:mm
        if (currentSchedule) {
            const date = new Date(currentSchedule);
            const iso = date.toISOString().slice(0, 16); // Extract YYYY-MM-DDTHH:mm
            setScheduleDateTime(iso);
        } else {
            setScheduleDateTime("");
        }
        setMeetLink(currentLink || "");
        setScheduleModalOpen(true);
    };

    const handleSaveSchedule = async () => {
        if (!selectedPresentationId || !scheduleDateTime) return;

        if (new Date(scheduleDateTime) < new Date()) {
            alert("Scheduled date must be in the future.");
            return;
        }

        try {
            await api.put(`/submissions/presentation/${selectedPresentationId}/schedule`, {
                scheduledDate: scheduleDateTime,
                meetLink: meetLink
            });
            alert("Presentation scheduled and invitation sent!");
            setScheduleModalOpen(false);
            fetchSubmissions(); // Refresh
        } catch (error: any) {
            console.error("Error scheduling", error);
            alert("Failed to save schedule.");
        }
    };

    useEffect(() => {
        // fetchSubmissions is now called inside the auth useEffect
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
        const matchesFilter = sub.type === filter;
        const matchesSearch = sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sub.cbNumber.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const handleView = async (sub: Submission) => {
        if (sub.type === 'Logbook') {
            if (!sub.logbookId) return;
            setLoadingLogbook(true);
            setLoadingHistory(true);
            setShowLogbookModal(true);
            setLogbookHistory([]); // Clear previous

            // Fetch specific logbook
            try {
                const res = await api.get(`/logbooks/${sub.logbookId}`);
                setSelectedLogbook(res.data);
            } catch (error) {
                console.error("Error fetching logbook details", error);
                alert("Failed to load logbook details.");
            } finally {
                setLoadingLogbook(false);
            }

            // Fetch History if studentId available
            if (sub.studentId) {
                try {
                    const histRes = await api.get(`/logbooks/history/${sub.studentId}`);
                    setLogbookHistory(histRes.data);
                } catch (error) {
                    console.error("Error fetching history", error);
                } finally {
                    setLoadingHistory(false);
                }
            } else {
                setLoadingHistory(false);
            }

        } else if (sub.type === 'Placements') {
            setSelectedPlacement(sub.placement);
            setShowPlacementModal(true);
        } else if ((sub.type === 'Marksheet' || sub.type === 'Exit Presentation') && sub.fileUrl) {
            const url = sub.fileUrl.startsWith('http') ? sub.fileUrl : `${apiUrl}${sub.fileUrl}`;

            // Open in new tab with toolbar hidden (attempt to prevent download)
            // This works in Chrome/Edge PDF viewers
            window.open(`${url}#toolbar=0&navpanes=0&scrollbar=0`, '_blank');
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">View Student Submissions</h1>

                {/* Controls */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    {/* Search */}
                    <div className="relative w-full md:w-96">
                        <input
                            type="text"
                            placeholder="Search by Name or CB Number..."
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm dark:shadow-none placeholder-gray-500 dark:placeholder-gray-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>

                    {/* Filters */}
                    <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-100 dark:border-gray-700">
                        {["Logbook", "Placements", "Marksheet", "Exit Presentation"].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f as any)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === f
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Scrollable List */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700 max-h-[600px] overflow-y-auto">
                    {authLoading || loading ? (
                        <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                            {authLoading ? "Verifying authorization..." : "Loading submissions..."}
                        </div>
                    ) : filteredSubmissions.length > 0 ? (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredSubmissions.map((sub) => (
                                <div key={sub.id} className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <div className="flex items-center space-x-4">
                                        {sub.profilePicture ? (
                                            <img
                                                src={sub.profilePicture.startsWith('http') ? sub.profilePicture : `${apiUrl}${sub.profilePicture}`}
                                                alt={sub.name}
                                                className="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                                            />
                                        ) : (
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white ${sub.type === 'Logbook' ? 'bg-purple-500' :
                                                sub.type === 'Marksheet' ? 'bg-red-500' :
                                                    sub.type === 'Placements' ? 'bg-blue-500' : 'bg-orange-500'
                                                }`}>
                                                {sub.name.charAt(0)}
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-bold text-gray-800 dark:text-white">
                                                <h3 className="font-bold text-gray-800 dark:text-white">{sub.name} <span className="text-gray-400 dark:text-gray-500 font-normal text-sm">({sub.cbNumber})</span></h3>
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {sub.type} {sub.month && `- ${sub.month}`}
                                                <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${sub.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-200' :
                                                    sub.status === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200' :
                                                        'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200'
                                                    }`}>
                                                    {sub.status}
                                                </span>
                                                {/* Show Scheduled Date if exists */}
                                                {sub.scheduledDate && (
                                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200">
                                                        Scheduled: {new Date(sub.scheduledDate).toLocaleDateString()} {new Date(sub.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleView(sub)}
                                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-all shadow-sm hover:shadow-md"
                                        >
                                            View
                                        </button>
                                        {/* Schedule Button for Presentations */}
                                        {sub.type === 'Exit Presentation' && (
                                            <button
                                                onClick={() => openScheduleModal(sub.id, sub.scheduledDate, sub.meetLink)}
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-all shadow-sm hover:shadow-md"
                                            >
                                                {sub.scheduledDate ? 'Reschedule' : 'Schedule'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center text-gray-400 dark:text-gray-500">
                            No submissions found matching your criteria.
                        </div>
                    )}
                </div>

            </div>

            {/* Logbook Details Modal */}
            {showLogbookModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex overflow-hidden">

                        {/* Sidebar: History */}
                        <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-100 dark:border-gray-700 flex flex-col">
                            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                                <h3 className="font-bold text-gray-700 dark:text-gray-200">Logbook History</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                {loadingHistory ? (
                                    <div className="text-center p-4 text-xs text-gray-500">Loading history...</div>
                                ) : logbookHistory.length > 0 ? (
                                    logbookHistory.sort((a, b) => a.month - b.month).map(lb => (
                                        <button
                                            key={lb._id}
                                            onClick={() => setSelectedLogbook(lb)}
                                            className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${selectedLogbook && selectedLogbook._id === lb._id
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-medium'
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                                }`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span>Month {lb.month}</span>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${lb.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                                    lb.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-gray-200 text-gray-600'
                                                    }`}>{lb.status}</span>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="text-center p-4 text-xs text-gray-400">No other logbooks found.</div>
                                )}
                            </div>
                        </div>

                        {/* Main Content: Details */}
                        <div className="flex-1 flex flex-col min-w-0">
                            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/30">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                                    {selectedLogbook ? `Logbook - Month ${selectedLogbook.month}/${selectedLogbook.year}` : 'Logbook Details'}
                                </h2>
                                <div className="flex items-center gap-4">
                                    {selectedLogbook && selectedLogbook.signedPDFPath && (
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const res = await api.get(`/logbooks/${selectedLogbook._id}/download`, {
                                                        responseType: 'blob'
                                                    });
                                                    // If we get here, axios successfully followed the redirect and got the file
                                                    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
                                                    const link = document.createElement('a');
                                                    link.href = url;
                                                    link.setAttribute('download', `Logbook_Month_${selectedLogbook.month}.pdf`);
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    link.remove();
                                                    window.URL.revokeObjectURL(url);
                                                } catch (error) {
                                                    console.error("Download error:", error);
                                                    alert("Failed to download PDF. The file may be missing.");
                                                }
                                            }}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-all shadow-sm flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                            Download PDF
                                        </button>
                                    )}
                                    <button onClick={() => setShowLogbookModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl">&times;</button>
                                </div>
                            </div>
                            <div className="p-6 overflow-y-auto flex-1">
                                {loadingLogbook ? (
                                    <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>
                                ) : selectedLogbook ? (
                                    <div className="space-y-8">
                                        {selectedLogbook.weeks && selectedLogbook.weeks.length > 0 ? (
                                            selectedLogbook.weeks.sort((a, b) => a.weekNumber - b.weekNumber).map((week) => (
                                                <div key={week.weekNumber} className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
                                                    <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-600 pb-2">
                                                        Week {week.weekNumber}
                                                    </h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <label className="text-xs font-semibold text-gray-500 uppercase">Activities</label>
                                                            <p className="text-sm text-gray-800 dark:text-gray-200 mt-1 whitespace-pre-wrap">{week.activities || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-semibold text-gray-500 uppercase">Tech Skills</label>
                                                            <p className="text-sm text-gray-800 dark:text-gray-200 mt-1 whitespace-pre-wrap">{week.techSkills || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-semibold text-gray-500 uppercase">Soft Skills</label>
                                                            <p className="text-sm text-gray-800 dark:text-gray-200 mt-1 whitespace-pre-wrap">{week.softSkills || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-semibold text-gray-500 uppercase">Trainings</label>
                                                            <p className="text-sm text-gray-800 dark:text-gray-200 mt-1 whitespace-pre-wrap">{week.trainings || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center text-gray-500">No weekly entries found for this logbook.</div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-red-500 text-center">Failed to load data.</div>
                                )}
                            </div>
                            <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30 flex justify-end">
                                <button onClick={() => setShowLogbookModal(false)} className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Schedule Presentation Modal */}
            {scheduleModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Schedule Presentation</h2>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Select Date and Time
                            </label>
                            <input
                                type="datetime-local"
                                value={scheduleDateTime}
                                min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                                onChange={(e) => setScheduleDateTime(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Online Meeting Link
                            </label>
                            <input
                                type="url"
                                placeholder="e.g. https://meet.google.com/xxx-xxxx-xxx"
                                value={meetLink}
                                onChange={(e) => setMeetLink(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setScheduleModalOpen(false)}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveSchedule}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
                                disabled={!scheduleDateTime}
                            >
                                Save Schedule
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Placement Detail Modal */}
            {showPlacementModal && selectedPlacement && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Placement Details</h2>
                            <button
                                onClick={() => setShowPlacementModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Student Info */}
                            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
                                    {selectedPlacement.first_name?.[0]}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                                        {filteredSubmissions.find(s => s.placement === selectedPlacement)?.name}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        {filteredSubmissions.find(s => s.placement === selectedPlacement)?.cbNumber} | {selectedPlacement.contact_number}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{selectedPlacement.email}</p>
                                </div>
                            </div>

                            {/* Internship Details */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Internship Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Company</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{selectedPlacement.company_name}</p>
                                    </div>
                                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Job Title/Role</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{selectedPlacement.placement_job_title || selectedPlacement.position}</p>
                                    </div>
                                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Start Date</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{new Date(selectedPlacement.start_date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">End Date</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{new Date(selectedPlacement.end_date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Company & Mentor Details */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Supervisor / Mentor</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <span className="text-gray-600 dark:text-gray-400">Name</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{selectedPlacement.mentor_name}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <span className="text-gray-600 dark:text-gray-400">Email</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{selectedPlacement.mentor_email}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <span className="text-gray-600 dark:text-gray-400">Phone</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{selectedPlacement.mentor_phone}</span>
                                    </div>
                                    <div className="flex justify-between items-start p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <span className="text-gray-600 dark:text-gray-400 whitespace-nowrap mr-4">Address</span>
                                        <span className="font-medium text-gray-900 dark:text-white text-right">{selectedPlacement.company_address}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            {selectedPlacement.description && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Description / Plan</h3>
                                    <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-sm leading-relaxed">
                                        {selectedPlacement.description}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                            <button
                                onClick={() => setShowPlacementModal(false)}
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-lg transition-colors"
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
