"use client";
import React, { useState, useEffect } from "react";
import api from "@/lib/api";

export default function FinalSubmissionPage() {
    const [marksheet, setMarksheet] = useState<File | null>(null);
    const [presentation, setPresentation] = useState<File | null>(null);
    const [studentId, setStudentId] = useState<string | null>(null);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setStudentId(user._id);
        }
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'marksheet' | 'presentation') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (type === 'marksheet' && file.type !== 'application/pdf') {
                alert("Marksheet must be a PDF");
                return;
            }
            if (type === 'presentation' && !file.name.endsWith('.pptx')) {
                alert("Presentation must be a PPTX");
                return;
            }

            if (type === 'marksheet') setMarksheet(file);
            else setPresentation(file);
        }
    }

    const handleSubmit = async () => {
        if (!studentId) return;
        if (!marksheet || !presentation) {
            alert("Please upload both files.");
            return;
        }

        try {
            // Upload Marksheet
            const marksheetData = new FormData();
            marksheetData.append('marksheet', marksheet);
            marksheetData.append('studentId', studentId);
            await api.post('/submissions/marksheet', marksheetData);

            // Upload Presentation
            const presentationData = new FormData();
            presentationData.append('presentation', presentation);
            presentationData.append('studentId', studentId);

            await api.post('/submissions/presentation', presentationData);

            // Notify Coordinator
            await api.post('/submissions/notify', { studentId });

            alert("Final submission successful! Coordinator notified.");
        } catch (error: any) {
            console.error("Error submitting files", error);
            const msg = error.response?.data?.message || "Failed to submit files.";
            alert(`Submission failed: ${msg}`);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">Final Submission</h1>
                <p className="text-gray-600 mb-8">Please submit your marksheet and exit presentation to complete your internship.</p>

                <div className="grid md:grid-cols-2 gap-8 mb-8">
                    {/* Marksheet Card */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                            <span className="bg-red-100 text-red-600 p-2 rounded-lg mr-3">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                            </span>
                            Marksheet Submission
                        </h2>
                        <p className="text-sm text-gray-500 mb-6">Upload your verified marksheet in PDF format.</p>

                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => handleFileChange(e, 'marksheet')}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            {marksheet ? (
                                <div className="text-green-600 font-medium break-all">{marksheet.name}</div>
                            ) : (
                                <div className="text-gray-400">
                                    <span className="block text-2xl mb-2">+</span>
                                    Drop PDF here or click to upload
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Presentation Card */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                            <span className="bg-orange-100 text-orange-600 p-2 rounded-lg mr-3">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                            </span>
                            Exit Presentation
                        </h2>
                        <p className="text-sm text-gray-500 mb-6">Upload your exit presentation in PPTX format.</p>

                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                            <input
                                type="file"
                                accept=".pptx"
                                onChange={(e) => handleFileChange(e, 'presentation')}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            {presentation ? (
                                <div className="text-green-600 font-medium break-all">{presentation.name}</div>
                            ) : (
                                <div className="text-gray-400">
                                    <span className="block text-2xl mb-2">+</span>
                                    Drop PPTX here or click to upload
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-center">
                    <button
                        onClick={handleSubmit}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-4 rounded-xl font-bold text-lg shadow-xl shadow-indigo-200 transition-all transform hover:-translate-y-1 w-full md:w-auto"
                    >
                        Submit Everything
                    </button>
                </div>

            </div>
        </div>
    );
}
