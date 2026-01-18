'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
    FileText, CheckCircle, Search,
    User, Award, Calculator, Save, Loader
} from 'lucide-react';

interface Student {
    _id: string;
    first_name: string;
    last_name: string;
    cb_number: string;
    user: { _id: string; email: string };
    degree: string;
    hasMarksheet: boolean;
    marksheet?: {
        isFinalized: boolean;
        marks: {
            technical: number;
            softSkills: number;
            presentation: number;
            total: number;
            industryMarks: number;
            finalTotal: number;
            industryMarksheetUrl?: string;
        };
        comments?: {
            technical: string;
            softSkills: string;
            presentation: string;
        };
        fileUrl?: string;
    };
}

export default function MarksheetSubmission() {
    const [students, setStudents] = useState<Student[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [marks, setMarks] = useState({
        technical: 0,
        softSkills: 0,
        presentation: 0
    });
    const [comments, setComments] = useState({
        technical: '',
        softSkills: '',
        presentation: ''
    });
    const [total, setTotal] = useState(0);

    useEffect(() => {
        fetchAssignedStudents();
    }, []);

    useEffect(() => {
        const t = (Number(marks.technical) || 0) + (Number(marks.softSkills) || 0) + (Number(marks.presentation) || 0);
        setTotal(t);
    }, [marks]);

    useEffect(() => {
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            const filtered = students.filter(student =>
                student.first_name.toLowerCase().includes(lowerQuery) ||
                student.last_name.toLowerCase().includes(lowerQuery) ||
                student.cb_number?.toLowerCase().includes(lowerQuery)
            );
            setFilteredStudents(filtered);
        } else {
            setFilteredStudents(students);
        }
    }, [searchQuery, students]);

    const fetchAssignedStudents = async () => {
        try {
            const res = await api.get('/mentor/students-marks');
            setStudents(res.data);
            setFilteredStudents(res.data);
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkChange = (field: keyof typeof marks, value: string) => {
        let numVal = Number(value);
        if (numVal < 0) numVal = 0;
        if (numVal > 20) numVal = 20;
        setMarks(prev => ({ ...prev, [field]: numVal }));
    };

    const handleCommentChange = (field: keyof typeof comments, value: string) => {
        setComments(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudent) return;

        if (total > 60) {
            alert("Total marks cannot exceed 60.");
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/mentor/marksheet', {
                studentId: selectedStudent._id,
                marks: { ...marks, total },
                comments
            });

            alert('Marksheet submitted successfully!');
            fetchAssignedStudents(); // Refresh list to show green tick
            setSelectedStudent(null); // Reset selection
            // Reset form
            setMarks({ technical: 0, softSkills: 0, presentation: 0 });
            setComments({ technical: '', softSkills: '', presentation: '' });

        } catch (error: any) {
            console.error('Error submitting marksheet:', error);
            alert(error.response?.data?.message || 'Failed to submit marksheet');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center mb-8">
                    <FileText className="w-8 h-8 text-blue-600 mr-3" />
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Academic Mentor Marksheet</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Student List Sidebar */}
                    <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-[800px]">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Student</h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search student..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-900"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {filteredStudents.map(student => (
                                <button
                                    key={student._id}
                                    onClick={() => {
                                        setSelectedStudent(student);
                                        // Populate form if marks exist, otherwise reset
                                        if (student.hasMarksheet && student.marksheet) {
                                            setMarks({
                                                technical: student.marksheet.marks.technical || 0,
                                                softSkills: student.marksheet.marks.softSkills || 0,
                                                presentation: student.marksheet.marks.presentation || 0
                                            });
                                            setComments({
                                                technical: student.marksheet.comments?.technical || '',
                                                softSkills: student.marksheet.comments?.softSkills || '',
                                                presentation: student.marksheet.comments?.presentation || ''
                                            });
                                        } else {
                                            setMarks({ technical: 0, softSkills: 0, presentation: 0 });
                                            setComments({ technical: '', softSkills: '', presentation: '' });
                                        }
                                    }}
                                    className={`w-full text-left p-3 rounded-xl transition-all border flex items-center gap-3 ${selectedStudent?._id === student._id
                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-transparent hover:border-gray-200'
                                        }`}
                                >
                                    {student.hasMarksheet ? (
                                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    ) : (
                                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 dark:text-white truncate">
                                            {student.first_name} {student.last_name}
                                        </p>
                                        <p className="text-xs text-gray-500">{student.cb_number}</p>
                                        {student.hasMarksheet && student.marksheet?.isFinalized && (
                                            <div className="mt-1 flex items-center gap-2">
                                                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-green-100 text-green-700 rounded-sm">Finalized</span>
                                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{student.marksheet.marks.finalTotal}/100</span>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Marks Entry Form */}
                    <div className="lg:col-span-2">
                        {selectedStudent ? (
                            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
                                <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center">
                                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl mr-4">
                                            {selectedStudent.first_name[0]}{selectedStudent.last_name[0]}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                                {selectedStudent.first_name} {selectedStudent.last_name}
                                            </h2>
                                            <p className="text-sm text-gray-500">{selectedStudent.cb_number} • {selectedStudent.degree}</p>
                                        </div>
                                    </div>
                                    {selectedStudent.hasMarksheet && (
                                        <div className="flex flex-col items-end">
                                            <div className="flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                                                <CheckCircle className="w-4 h-4 mr-1.5" />
                                                {selectedStudent.marksheet?.isFinalized ? "Finalized" : "Already Submitted"}
                                            </div>
                                            {selectedStudent.marksheet?.isFinalized && (
                                                <div className="mt-2 text-right">
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Final Score</p>
                                                    <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{selectedStudent.marksheet.marks.finalTotal} / 100</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {selectedStudent.marksheet?.isFinalized && (
                                    <div className="mb-8 p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-100 dark:border-green-800 rounded-2xl">
                                        <h3 className="text-sm font-bold text-green-800 dark:text-green-300 uppercase tracking-wider mb-4 flex items-center">
                                            <Award className="w-4 h-4 mr-2" />
                                            Final Evaluation Composition
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800">
                                                <p className="text-[10px] text-gray-400 uppercase font-bold">Your Score</p>
                                                <p className="text-lg font-bold text-gray-800 dark:text-white">{selectedStudent.marksheet.marks.total} / 60</p>
                                            </div>
                                            <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800">
                                                <p className="text-[10px] text-gray-400 uppercase font-bold">Industry</p>
                                                <p className="text-lg font-bold text-gray-800 dark:text-white">{selectedStudent.marksheet.marks.industryMarks} / 40</p>
                                            </div>
                                            <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800 col-span-2">
                                                <p className="text-[10px] text-gray-400 uppercase font-bold">Calculation</p>
                                                <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                                    {selectedStudent.marksheet.marks.total} + {selectedStudent.marksheet.marks.industryMarks} = {selectedStudent.marksheet.marks.finalTotal}
                                                </p>
                                            </div>
                                        </div>
                                        {/* Evaluation Documents link for mentor */}
                                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {selectedStudent.marksheet.fileUrl && (
                                                <a
                                                    href={selectedStudent.marksheet.fileUrl.startsWith('http') ? selectedStudent.marksheet.fileUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}${selectedStudent.marksheet.fileUrl}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800 hover:bg-green-50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Award size={16} className="text-green-600" />
                                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Your Evaluation Assessment</span>
                                                    </div>
                                                    <span className="text-[10px] text-blue-600 font-bold uppercase">View PDF</span>
                                                </a>
                                            )}
                                            {selectedStudent.marksheet.marks.industryMarksheetUrl && (
                                                <a
                                                    href={selectedStudent.marksheet.marks.industryMarksheetUrl.startsWith('http') ? selectedStudent.marksheet.marks.industryMarksheetUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}${selectedStudent.marksheet.marks.industryMarksheetUrl}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-800 hover:bg-green-50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle size={16} className="text-blue-600" />
                                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Industry Assessment Marksheet</span>
                                                    </div>
                                                    <span className="text-[10px] text-blue-600 font-bold uppercase">View PDF</span>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-8">
                                    {/* Technical Skills */}
                                    <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-100 dark:border-gray-800">
                                        <div className="flex justify-between items-center mb-4">
                                            <label className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                                                <Calculator className="w-5 h-5 mr-2 text-indigo-500" />
                                                Technical Skill Development
                                            </label>
                                            <div className="flex items-center">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="20"
                                                    required
                                                    value={marks.technical}
                                                    onChange={(e) => handleMarkChange('technical', e.target.value)}
                                                    className="w-20 text-center font-bold text-xl p-2 border-2 border-indigo-100 dark:border-indigo-900/50 rounded-lg focus:border-indigo-500 outline-none disabled:bg-white dark:disabled:bg-gray-800"
                                                    disabled={selectedStudent.hasMarksheet}
                                                />
                                                <span className="ml-2 text-gray-400 font-medium">/ 20</span>
                                            </div>
                                        </div>
                                        <textarea
                                            placeholder="Comments on technical skills..."
                                            value={comments.technical}
                                            onChange={(e) => handleCommentChange('technical', e.target.value)}
                                            className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none bg-white dark:bg-gray-800 disabled:opacity-70"
                                            disabled={selectedStudent.hasMarksheet}
                                        />
                                    </div>

                                    {/* Soft Skills */}
                                    <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-100 dark:border-gray-800">
                                        <div className="flex justify-between items-center mb-4">
                                            <label className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                                                <User className="w-5 h-5 mr-2 text-pink-500" />
                                                Soft Skill Development
                                            </label>
                                            <div className="flex items-center">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="20"
                                                    required
                                                    value={marks.softSkills}
                                                    onChange={(e) => handleMarkChange('softSkills', e.target.value)}
                                                    className="w-20 text-center font-bold text-xl p-2 border-2 border-pink-100 dark:border-pink-900/50 rounded-lg focus:border-pink-500 outline-none disabled:bg-white dark:disabled:bg-gray-800"
                                                    disabled={selectedStudent.hasMarksheet}
                                                />
                                                <span className="ml-2 text-gray-400 font-medium">/ 20</span>
                                            </div>
                                        </div>
                                        <textarea
                                            placeholder="Comments on soft skills..."
                                            value={comments.softSkills}
                                            onChange={(e) => handleCommentChange('softSkills', e.target.value)}
                                            className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none h-24 resize-none bg-white dark:bg-gray-800 disabled:opacity-70"
                                            disabled={selectedStudent.hasMarksheet}
                                        />
                                    </div>

                                    {/* Presentation Skills */}
                                    <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-100 dark:border-gray-800">
                                        <div className="flex justify-between items-center mb-4">
                                            <label className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                                                <Award className="w-5 h-5 mr-2 text-amber-500" />
                                                Presentation Skills
                                            </label>
                                            <div className="flex items-center">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="20"
                                                    required
                                                    value={marks.presentation}
                                                    onChange={(e) => handleMarkChange('presentation', e.target.value)}
                                                    className="w-20 text-center font-bold text-xl p-2 border-2 border-amber-100 dark:border-amber-900/50 rounded-lg focus:border-amber-500 outline-none disabled:bg-white dark:disabled:bg-gray-800"
                                                    disabled={selectedStudent.hasMarksheet}
                                                />
                                                <span className="ml-2 text-gray-400 font-medium">/ 20</span>
                                            </div>
                                        </div>
                                        <textarea
                                            placeholder="Comments on presentation skills..."
                                            value={comments.presentation}
                                            onChange={(e) => handleCommentChange('presentation', e.target.value)}
                                            className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none h-24 resize-none bg-white dark:bg-gray-800 disabled:opacity-70"
                                            disabled={selectedStudent.hasMarksheet}
                                        />
                                    </div>
                                </div>

                                {/* Total & Submit */}
                                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-3">
                                        <span className="text-gray-500 font-medium">Total Marks:</span>
                                        <span className={`text-4xl font-bold ${total > 60 ? 'text-red-500' : 'text-blue-600'}`}>
                                            {total} <span className="text-xl text-gray-400 dark:text-gray-600">/ 60</span>
                                        </span>
                                    </div>

                                    {!selectedStudent.hasMarksheet && (
                                        <button
                                            type="submit"
                                            disabled={submitting || total > 60}
                                            className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg flex items-center transition-all ${submitting || total > 60
                                                ? 'bg-gray-400 cursor-not-allowed'
                                                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/30'
                                                }`}
                                        >
                                            {submitting ? (
                                                <>
                                                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                                                    Generating Marksheet...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-5 h-5 mr-2" />
                                                    Submit Marksheet
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </form>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-[400px]">
                                <User className="w-16 h-16 mb-4 opacity-20" />
                                <p className="text-lg font-medium">Select a student to enter marks</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
