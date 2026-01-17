'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { X, Download, Clock, ExternalLink } from 'lucide-react';

interface LogbookData {
    _id: string;
    month: number;
    year: number;
    status: string;
    weeks: any[];
}

interface LogbookModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialLogbookId: string | null;
    studentId: string;
    studentName: string;
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function LogbookModal({ isOpen, onClose, initialLogbookId, studentId, studentName }: LogbookModalProps) {
    const [selectedLogbook, setSelectedLogbook] = useState<LogbookData | null>(null);
    const [logbookHistory, setLogbookHistory] = useState<LogbookData[]>([]);
    const [loadingLogbook, setLoadingLogbook] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        if (isOpen && (initialLogbookId || studentId)) {
            fetchData();
        }
    }, [isOpen, initialLogbookId, studentId]);

    const fetchData = async () => {
        setLoadingHistory(true);
        try {
            // Fetch History
            const histRes = await api.get(`/logbooks/history/${studentId}`);
            const history = histRes.data || [];
            // Show ALL logbooks in history for "Current Logbook" context
            setLogbookHistory(history);

            // Fetch specific logbook
            const targetId = initialLogbookId || (history.length > 0 ? history[history.length - 1]._id : null);

            if (targetId) {
                setLoadingLogbook(true);
                const res = await api.get(`/logbooks/${targetId}`);
                setSelectedLogbook(res.data);
                setLoadingLogbook(false);
            }
        } catch (error) {
            console.error("Error fetching logbook data:", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleSelectLogbook = async (id: string) => {
        setLoadingLogbook(true);
        try {
            const res = await api.get(`/logbooks/${id}`);
            setSelectedLogbook(res.data);
        } catch (error) {
            console.error("Error fetching logbook:", error);
        } finally {
            setLoadingLogbook(false);
        }
    };

    const handleDownloadPdf = async () => {
        if (!selectedLogbook) return;
        try {
            const res = await api.get(`/logbooks/${selectedLogbook._id}/download`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Logbook_${studentName.replace(/\s+/g, '_')}_Month_${selectedLogbook.month}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Download error:", error);
            alert("Failed to download PDF.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex overflow-hidden">

                {/* Sidebar: History */}
                <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-100 dark:border-gray-700 flex flex-col hidden md:flex">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                        <h3 className="font-bold text-gray-700 dark:text-gray-200">History</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {loadingHistory ? (
                            <div className="text-center p-4 text-xs text-gray-500">Loading...</div>
                        ) : logbookHistory.length > 0 ? (
                            logbookHistory.sort((a, b) => (a.year !== b.year ? b.year - a.year : b.month - a.month)).map(lb => (
                                <button
                                    key={lb._id}
                                    onClick={() => handleSelectLogbook(lb._id)}
                                    className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${selectedLogbook && selectedLogbook._id === lb._id
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-medium'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span>{MONTH_NAMES[lb.month - 1]} {lb.year}</span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${lb.status === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200' :
                                            lb.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-200' :
                                                'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                            }`}>
                                            {lb.status}
                                        </span>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="text-center p-4 text-xs text-gray-400">No approved logbooks.</div>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/30">
                        <div className="flex flex-col">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                                {selectedLogbook ? `Logbook - ${MONTH_NAMES[selectedLogbook.month - 1]} ${selectedLogbook.year}` : 'Logbook Details'}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{studentName}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            {selectedLogbook && (
                                <button
                                    onClick={handleDownloadPdf}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-all shadow-sm flex items-center gap-2 text-sm"
                                >
                                    <Download className="w-4 h-4" />
                                    Download PDF
                                </button>
                            )}
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 overflow-y-auto flex-1 bg-white dark:bg-gray-800">
                        {loadingLogbook ? (
                            <div className="flex justify-center p-12">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                            </div>
                        ) : selectedLogbook ? (
                            <div className="space-y-6">
                                {selectedLogbook.weeks && selectedLogbook.weeks.length > 0 ? (
                                    selectedLogbook.weeks.sort((a, b) => a.weekNumber - b.weekNumber).map((week) => (
                                        <div key={week.weekNumber} className="bg-gray-50 dark:bg-gray-700/20 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
                                            <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-600 pb-2">
                                                Week {week.weekNumber}
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Activities</label>
                                                    <p className="text-sm text-gray-800 dark:text-gray-200 mt-1 whitespace-pre-wrap leading-relaxed">
                                                        {week.activities || <span className="text-gray-400 italic">No entries</span>}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tech Skills</label>
                                                    <p className="text-sm text-gray-800 dark:text-gray-200 mt-1 whitespace-pre-wrap leading-relaxed">
                                                        {week.techSkills || <span className="text-gray-400 italic">No entries</span>}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Soft Skills</label>
                                                    <p className="text-sm text-gray-800 dark:text-gray-200 mt-1 whitespace-pre-wrap leading-relaxed">
                                                        {week.softSkills || <span className="text-gray-400 italic">No entries</span>}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Trainings</label>
                                                    <p className="text-sm text-gray-800 dark:text-gray-200 mt-1 whitespace-pre-wrap leading-relaxed">
                                                        {week.trainings || <span className="text-gray-400 italic">No entries</span>}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 text-gray-500 italic">No weekly entries found for this logbook.</div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-red-500">Failed to load logbook details.</div>
                        )}
                    </div>

                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
