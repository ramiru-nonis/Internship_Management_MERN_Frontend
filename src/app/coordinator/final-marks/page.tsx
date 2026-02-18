"use client";
import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Upload, FileText } from "lucide-react";

export default function FinalMarksPage() {
    const [candidates, setCandidates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Grading Modal State
    const [showModal, setShowModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [industryMarks, setIndustryMarks] = useState<number>(0);
    const [finalComments, setFinalComments] = useState("");
    const [industryMarksheet, setIndustryMarksheet] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchCandidates();
    }, []);

    const fetchCandidates = async () => {
        try {
            // Role Check: Verify if user is coordinator
            const userData = localStorage.getItem('user');
            if (userData) {
                const user = JSON.parse(userData);
                if (user.role !== 'coordinator') {
                    alert("Unauthorized access.");
                    window.location.href = '/';
                    return;
                }
            }

            const res = await api.get('/coordinator/marks/candidates');
            setCandidates(res.data);
        } catch (error) {
            console.error("Error fetching candidates", error);
        } finally {
            setLoading(false);
        }
    };

    const handleGrade = (student: any) => {
        setSelectedStudent(student);
        setIndustryMarksheet(null);
        setIndustryMarks(student.marks?.industryMarks || 0);
        setFinalComments(student.comments?.finalComments || "");
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!selectedStudent) return;
        if (industryMarks < 0 || industryMarks > 40) {
            alert("Industry marks must be between 0 and 40.");
            return;
        }

        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('studentId', selectedStudent.studentId);
            formData.append('industryMarks', String(industryMarks));
            formData.append('finalComments', finalComments);
            if (industryMarksheet) {
                formData.append('industryMarksheet', industryMarksheet);
            }

            await api.post('/coordinator/marks/save', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setShowModal(false);
            fetchCandidates(); // Refresh list
            alert("Final marks submitted successfully!");
        } catch (error: any) {
            console.error("Error saving marks", error);
            alert(error.response?.data?.message || "Failed to save marks.");
        } finally {
            setSaving(false);
        }
    };

    const filteredCandidates = candidates.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cbNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const amTotal = selectedStudent?.marks?.total || (
        (selectedStudent?.marks?.technical || 0) +
        (selectedStudent?.marks?.softSkills || 0) +
        (selectedStudent?.marks?.presentation || 0)
    );

    const finalTotal = amTotal + Number(industryMarks || 0);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Final Marks Assignment</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-8">
                    Combine Academic Mentor evaluations with Industry marks to finalize student grades.
                </p>

                {/* Search */}
                <div className="mb-6 flex justify-between items-center">
                    <input
                        type="text"
                        placeholder="Search by Name or CB Number..."
                        className="w-full md:w-96 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* List */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Student</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Mentor</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Marks Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Final Score</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {loading ? (
                                    <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading...</td></tr>
                                ) : filteredCandidates.length > 0 ? (
                                    filteredCandidates.map((student) => (
                                        <tr key={student.studentId} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900 dark:text-white">{student.name}</div>
                                                <div className="text-sm text-gray-500">{student.cbNumber}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                {student.mentorName}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-md text-xs font-medium ${student.submissionStatus === 'Completed'
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                                                    }`}>
                                                    {student.submissionStatus}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-md text-xs font-medium ${student.marksStatus === 'Finalized'
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                    : student.marksStatus === 'Graded'
                                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                                    }`}>
                                                    {student.marksStatus}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {student.isFinalized ? (
                                                    <div className="font-bold text-gray-900 dark:text-white">
                                                        {student.marks?.finalTotal} <span className="text-xs text-gray-400">/ 100</span>
                                                    </div>
                                                ) : student.marks ? (
                                                    <div className="text-sm text-gray-500">AM: {student.marks.total}/60</div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleGrade(student)}
                                                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium text-sm"
                                                >
                                                    {student.isFinalized ? 'View/Update' : 'Finalize Marks'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={6} className="p-8 text-center text-gray-500">No eligible students found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Grading Modal */}
            {showModal && selectedStudent && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                                    Final Marks Finalization
                                </h2>
                                <p className="text-sm text-gray-500">{selectedStudent.name} ({selectedStudent.cbNumber})</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-8">
                            {/* Academic Mentor Marks (Read Only) */}
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Academic Mentor Evaluation (60)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                                        <p className="text-xs text-gray-500 font-medium uppercase mb-1">Technical Skills</p>
                                        <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedStudent.marks?.technical || 0} <span className="text-sm text-gray-400">/ 20</span></p>
                                        <p className="text-xs text-gray-500 mt-2 italic">"{selectedStudent.comments?.technical || 'No comments'}"</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                                        <p className="text-xs text-gray-500 font-medium uppercase mb-1">Soft Skills</p>
                                        <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedStudent.marks?.softSkills || 0} <span className="text-sm text-gray-400">/ 20</span></p>
                                        <p className="text-xs text-gray-500 mt-2 italic">"{selectedStudent.comments?.softSkills || 'No comments'}"</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                                        <p className="text-xs text-gray-500 font-medium uppercase mb-1">Presentation</p>
                                        <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedStudent.marks?.presentation || 0} <span className="text-sm text-gray-400">/ 20</span></p>
                                        <p className="text-xs text-gray-500 mt-2 italic">"{selectedStudent.comments?.presentation || 'No comments'}"</p>
                                    </div>
                                </div>
                                <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex justify-between items-center text-indigo-700 dark:text-indigo-300">
                                    <span className="font-semibold">Academic Mentor Total</span>
                                    <span className="text-2xl font-bold">{amTotal} / 60</span>
                                </div>
                            </div>

                            <hr className="dark:border-gray-700" />

                            {/* Industry Mentor Marks Input */}
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Industry Mentor Evaluation (40)</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex-1">
                                            <input
                                                type="number"
                                                min="0"
                                                max="40"
                                                value={industryMarks}
                                                onChange={(e) => setIndustryMarks(Math.min(40, Math.max(0, Number(e.target.value))))}
                                                className="w-full px-4 py-3 text-xl font-bold border-2 border-indigo-100 dark:border-indigo-900/50 rounded-xl focus:border-indigo-500 outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                                placeholder="Enter Industry Marks (0-40)"
                                            />
                                        </div>
                                        <div className="text-2xl font-bold text-gray-400">/ 40</div>
                                    </div>
                                    <textarea
                                        rows={3}
                                        value={finalComments}
                                        onChange={(e) => setFinalComments(e.target.value)}
                                        className="w-full px-4 py-3 border rounded-xl dark:bg-gray-900 dark:border-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Coordinator final feedback/comments..."
                                    />

                                    {/* Optional Marksheet Upload & View Links */}
                                    <div className="mt-4">
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                                            <Upload className="w-4 h-4 mr-2" />
                                            Industry Mentor Marksheet (Optional)
                                        </label>
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer relative">
                                                    <input
                                                        type="file"
                                                        accept=".pdf"
                                                        onChange={(e) => e.target.files && setIndustryMarksheet(e.target.files[0])}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    />
                                                    <span className="text-sm text-gray-500">
                                                        {industryMarksheet ? industryMarksheet.name : "Click to upload industry marksheet (PDF)"}
                                                    </span>
                                                </div>
                                                {selectedStudent.marks?.fileUrl && (
                                                    <a
                                                        href={selectedStudent.marks.fileUrl.startsWith('http') ? selectedStudent.marks.fileUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}${selectedStudent.marks.fileUrl}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 text-sm font-bold h-fit"
                                                        title="View Academic Mentor Marksheet"
                                                    >
                                                        <FileText className="w-4 h-4 mr-2" />
                                                        AM Marksheet
                                                    </a>
                                                )}
                                            </div>
                                            {selectedStudent.industryMarksheetUrl && (
                                                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                                                    <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">Existing Submission found</span>
                                                    <a
                                                        href={selectedStudent.industryMarksheetUrl.startsWith('http') ? selectedStudent.industryMarksheetUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}${selectedStudent.industryMarksheetUrl}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center text-xs font-bold text-blue-600 hover:underline"
                                                    >
                                                        <FileText className="w-3 h-3 mr-1" />
                                                        View Industry Marksheet
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Final Total Calculation */}
                            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-xl shadow-green-500/20">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-green-50 font-medium opacity-80 uppercase text-xs tracking-widest mb-1">Final Calculated Marks</p>
                                        <h3 className="text-4xl font-black">{finalTotal} <span className="text-xl font-normal opacity-70">/ 100</span></h3>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-green-50 opacity-80 mb-1">Composition</p>
                                        <p className="text-sm font-bold">Academic: {amTotal}</p>
                                        <p className="text-sm font-bold">Industry: {industryMarks}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end space-x-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || industryMarks === undefined}
                                className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-500/30 disabled:opacity-50 flex items-center"
                            >
                                {saving ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Submitting...
                                    </>
                                ) : 'Submit Final Marks'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
