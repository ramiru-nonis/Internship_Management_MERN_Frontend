'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
    Search, User, FileText, Award, CheckCircle, Calculator, Save, Loader, AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Student {
    _id: string;
    userId: string;
    name: string;
    cb_number: string;
    batch: string;
    profile_picture?: string;
    finalGradingStatus: 'Pending' | 'Completed';
}

interface GradingDetails {
    student: {
        name: string;
        cbNumber: string;
        profilePicture?: string;
    };
    academicMarksheet: {
        marks: {
            technical: number;
            softSkills: number;
            presentation: number;
            total: number;
        };
        comments: {
            technical: string;
            softSkills: string;
            presentation: string;
        };
        industryMarks?: number;
        finalTotal?: number;
        finalGradingStatus: string;
    };
    presentation?: {
        fileUrl: string;
    };
}

export default function CoordinatorFinalMarks() {
    const [students, setStudents] = useState<Student[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

    // Grading Detais
    const [details, setDetails] = useState<GradingDetails | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [industryMarks, setIndustryMarks] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchStudents();
    }, []);

    useEffect(() => {
        if (searchQuery) {
            const lower = searchQuery.toLowerCase();
            setFilteredStudents(students.filter(s =>
                s.name.toLowerCase().includes(lower) || s.cb_number.toLowerCase().includes(lower)
            ));
        } else {
            setFilteredStudents(students);
        }
    }, [searchQuery, students]);

    const fetchStudents = async () => {
        try {
            const res = await api.get('/submissions/final-students');
            setStudents(res.data);
            setFilteredStudents(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load students");
        } finally {
            setLoading(false);
        }
    };

    const fetchDetails = async (userId: string) => {
        setDetailsLoading(true);
        try {
            const res = await api.get(`/submissions/grading/${userId}`);
            setDetails(res.data);
            // Pre-fill if already graded
            if (res.data.academicMarksheet.industryMarks !== undefined) {
                setIndustryMarks(res.data.academicMarksheet.industryMarks.toString());
            } else {
                setIndustryMarks('');
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load student details");
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleStudentSelect = (student: Student) => {
        setSelectedStudentId(student.userId);
        fetchDetails(student.userId);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudentId || !industryMarks) return;

        const marks = Number(industryMarks);
        if (marks < 0 || marks > 40) {
            toast.error("Industry marks must be between 0 and 40");
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/submissions/final-grade', {
                studentId: selectedStudentId,
                industryMarks: marks
            });
            toast.success("Final grades submitted!");
            fetchDetails(selectedStudentId); // Refresh details
            fetchStudents(); // Refresh list status
        } catch (error) {
            console.error(error);
            toast.error("Submission failed");
        } finally {
            setSubmitting(false);
        }
    };

    const calculateFinal = () => {
        const academic = details?.academicMarksheet.marks.total || 0;
        const industry = Number(industryMarks) || 0;
        return academic + industry;
    };

    if (loading) return <div className="p-10 flex justify-center"><Loader className="animate-spin text-blue-600" /></div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-100px)]">

                {/* LIST SECTION */}
                <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Students for Grading</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {filteredStudents.length === 0 ? (
                            <div className="p-4 text-center text-gray-400 text-sm">No students found ready for grading.</div>
                        ) : filteredStudents.map(student => (
                            <button
                                key={student._id}
                                onClick={() => handleStudentSelect(student)}
                                className={`w-full p-3 flex items-center justify-between rounded-xl transition-all ${selectedStudentId === student.userId
                                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/30 border border-transparent'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 font-bold">
                                        {student.name.charAt(0)}
                                    </div>
                                    <div className="text-left">
                                        <p className={`font-semibold text-sm ${selectedStudentId === student.userId ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`}>
                                            {student.name}
                                        </p>
                                        <p className="text-xs text-gray-500">{student.cb_number}</p>
                                    </div>
                                </div>
                                {student.finalGradingStatus === 'Completed' ? (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : (
                                    <div className="w-2 h-2 rounded-full bg-orange-400" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* DETAILS SECTION */}
                <div className="lg:col-span-2 flex flex-col h-full overflow-hidden">
                    {detailsLoading ? (
                        <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                            <Loader className="w-8 h-8 animate-spin text-blue-500" />
                        </div>
                    ) : details ? (
                        <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
                            {/* Header */}
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start bg-gray-50/50 dark:bg-gray-900/50">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        {details.student.name}
                                        {details.academicMarksheet.finalGradingStatus === 'Completed' && (
                                            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full border border-green-200">Graded</span>
                                        )}
                                    </h1>
                                    <p className="text-gray-500 dark:text-gray-400">{details.student.cbNumber}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Final Score</p>
                                    <div className="text-4xl font-extrabold text-blue-600 dark:text-blue-400">
                                        {calculateFinal()} <span className="text-lg text-gray-400 font-normal">/ 100</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                {/* Academic Marks Review */}
                                <section>
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                        <User className="w-5 h-5 text-indigo-500" />
                                        Academic Mentor Evaluation (60%)
                                    </h3>
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase mb-1">Technical Skills</p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{details.academicMarksheet.marks.technical}/20</p>
                                            <p className="text-sm text-gray-500 mt-2 italic">"{details.academicMarksheet.comments.technical}"</p>
                                        </div>
                                        <div className="bg-pink-50 dark:bg-pink-900/10 p-4 rounded-xl border border-pink-100 dark:border-pink-800">
                                            <p className="text-xs text-pink-600 dark:text-pink-400 font-bold uppercase mb-1">Soft Skills</p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{details.academicMarksheet.marks.softSkills}/20</p>
                                            <p className="text-sm text-gray-500 mt-2 italic">"{details.academicMarksheet.comments.softSkills}"</p>
                                        </div>
                                        <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-800">
                                            <p className="text-xs text-amber-600 dark:text-amber-400 font-bold uppercase mb-1">Presentation</p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{details.academicMarksheet.marks.presentation}/20</p>
                                            <p className="text-sm text-gray-500 mt-2 italic">"{details.academicMarksheet.comments.presentation}"</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg font-medium text-gray-700 dark:text-gray-300">
                                            Academic Total: <span className="font-bold text-gray-900 dark:text-white">{details.academicMarksheet.marks.total}/60</span>
                                        </div>
                                    </div>
                                </section>

                                <hr className="border-gray-200 dark:border-gray-700" />

                                {/* Industry Marks Input */}
                                <section>
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                        <Award className="w-5 h-5 text-teal-500" />
                                        Industry Mentor Evaluation (40%)
                                    </h3>
                                    <div className="bg-teal-50 dark:bg-teal-900/10 p-6 rounded-xl border border-teal-100 dark:border-teal-800">
                                        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                                            <div className="flex-1">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Enter Industry Marks (0-40)
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="40"
                                                        value={industryMarks}
                                                        onChange={e => setIndustryMarks(e.target.value)}
                                                        className="w-full text-3xl font-bold bg-white dark:bg-gray-800 border-2 border-teal-200 dark:border-teal-700 rounded-xl px-4 py-3 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20 outline-none transition-all placeholder-gray-300"
                                                        placeholder="00"
                                                    />
                                                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">/ 40</span>
                                                </div>
                                            </div>
                                            <div className="flex-1 text-sm text-gray-600 dark:text-gray-400">
                                                <div className="flex items-start gap-2">
                                                    <AlertCircle className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                                                    <p>These marks are based on the Industry Mentor's feedback form. Please verify the physical/digital document before entering.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Footer Submit */}
                            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-end">
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting || !industryMarks}
                                    className={`px-8 py-3 rounded-xl font-bold text-lg flex items-center gap-2 shadow-lg transition-all ${submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/30 text-white hover:-translate-y-1'
                                        }`}
                                >
                                    {submitting ? <Loader className="animate-spin" /> : <Save className="w-5 h-5" />}
                                    {details.academicMarksheet.finalGradingStatus === 'Completed' ? 'Update Final Grade' : 'Submit Final Grade'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                            <Calculator className="w-20 h-20 mb-4 opacity-20" />
                            <h3 className="text-xl font-semibold mb-2">Ready to Grade</h3>
                            <p className="max-w-md">Select a student from the list to view their academic scores and enter industry marks.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
