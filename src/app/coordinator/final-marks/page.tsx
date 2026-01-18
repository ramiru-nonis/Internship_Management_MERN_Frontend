"use client";
import React, { useState, useEffect } from "react";
import api from "@/lib/api";

export default function FinalMarksPage() {
    const [candidates, setCandidates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Grading Modal State
    const [showModal, setShowModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [marks, setMarks] = useState({
        technical: 0,
        softSkills: 0,
        presentation: 0
    });
    const [comments, setComments] = useState({
        technical: "",
        softSkills: "",
        presentation: ""
    });
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
        if (student.marks) {
            setMarks(student.marks);
        } else {
            setMarks({ technical: 0, softSkills: 0, presentation: 0 });
        }
        if (student.comments) {
            setComments(student.comments);
        } else {
            setComments({ technical: "", softSkills: "", presentation: "" });
        }
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!selectedStudent) return;
        setSaving(true);
        try {
            await api.post('/coordinator/marks/save', {
                studentId: selectedStudent.studentId,
                marks,
                comments
            });
            setShowModal(false);
            fetchCandidates(); // Refresh list
            alert("Marks saved successfully!");
        } catch (error) {
            console.error("Error saving marks", error);
            alert("Failed to save marks.");
        } finally {
            setSaving(false);
        }
    };

    const filteredCandidates = candidates.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cbNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalMarks = (marks.technical || 0) + (marks.softSkills || 0) + (marks.presentation || 0);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Final Marks Assignment</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-8">
                    Assign marks to students who have completed their internship submissions.
                </p>

                {/* Search */}
                <div className="mb-6">
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
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Submissions</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Marks</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {loading ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading...</td></tr>
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
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                <div className="flex gap-2">
                                                    <span className={student.hasPresentation ? "text-green-600" : "text-gray-400"} title="Presentation">
                                                        Presentation {student.hasPresentation ? "✓" : "✗"}
                                                    </span>
                                                    <span className={student.hasIndustryMarksheet ? "text-green-600" : "text-gray-400"} title="Industry Marksheet">
                                                        Ind. Marksheet {student.hasIndustryMarksheet ? "✓" : "✗"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-md text-xs font-medium ${student.marksStatus === 'Graded'
                                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                                    }`}>
                                                    {student.marksStatus}
                                                </span>
                                                {student.marks && (
                                                    <div className="text-xs text-gray-500 mt-1">Total: {student.marks.total}/60</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleGrade(student)}
                                                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium text-sm"
                                                >
                                                    {student.marksStatus === 'Graded' ? 'Edit Marks' : 'Assign Marks'}
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
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                                Grading: {selectedStudent.name}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Score inputs */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Technical (20)</label>
                                    <input
                                        type="number" min="0" max="20"
                                        value={marks.technical}
                                        onChange={(e) => setMarks({ ...marks, technical: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Soft Skills (20)</label>
                                    <input
                                        type="number" min="0" max="20"
                                        value={marks.softSkills}
                                        onChange={(e) => setMarks({ ...marks, softSkills: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Presentation (20)</label>
                                    <input
                                        type="number" min="0" max="20"
                                        value={marks.presentation}
                                        onChange={(e) => setMarks({ ...marks, presentation: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg flex justify-between items-center">
                                <span className="font-semibold text-gray-700 dark:text-gray-300">Total Score</span>
                                <span className={`text-2xl font-bold ${totalMarks > 60 ? 'text-red-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                    {totalMarks} / 60
                                </span>
                            </div>

                            {/* Comments */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Technical Comments</label>
                                    <textarea
                                        rows={2}
                                        value={comments.technical}
                                        onChange={(e) => setComments({ ...comments, technical: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        placeholder="Feedback on technical performance..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Soft Skills Comments</label>
                                    <textarea
                                        rows={2}
                                        value={comments.softSkills}
                                        onChange={(e) => setComments({ ...comments, softSkills: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        placeholder="Feedback on communication, teamwork..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Presentation Comments</label>
                                    <textarea
                                        rows={2}
                                        value={comments.presentation}
                                        onChange={(e) => setComments({ ...comments, presentation: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        placeholder="Feedback on final presentation..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end space-x-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 flex items-center"
                            >
                                {saving ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Saving...
                                    </>
                                ) : 'Save Marks'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
