'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
    Award, CheckCircle, Search, User, Calculator, Save, Loader, AlertCircle
} from 'lucide-react';

interface Student {
    _id: string;
    first_name: string;
    last_name: string;
    cb_number: string;
    user: { _id: string; email: string };
    degree: string;
    hasFinalMarks: boolean;
    academicMarks?: {
        technical: number;
        softSkills: number;
        presentation: number;
        total: number;
    } | null;
}

export default function FinalMarksAssignment() {
    const [students, setStudents] = useState<Student[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [industryMarks, setIndustryMarks] = useState<number | ''>('');
    const [industryComments, setIndustryComments] = useState('');
    const [finalTotal, setFinalTotal] = useState(0);

    useEffect(() => {
        fetchCompletedStudents();
    }, []);

    useEffect(() => {
        if (selectedStudent?.academicMarks && industryMarks !== '') {
            const academicTotal = selectedStudent.academicMarks.total || 0;
            const indMarks = Number(industryMarks);
            setFinalTotal(academicTotal + indMarks);
        } else if (selectedStudent?.academicMarks) {
            setFinalTotal(selectedStudent.academicMarks.total);
        } else {
            setFinalTotal(0);
        }
    }, [industryMarks, selectedStudent]);

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

    const fetchCompletedStudents = async () => {
        try {
            const res = await api.get('/coordinator/students/completed');
            setStudents(res.data);
            setFilteredStudents(res.data);
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleIndustryMarksChange = (value: string) => {
        let numVal = Number(value);
        if (numVal < 0) numVal = 0;
        if (numVal > 40) numVal = 40;
        setIndustryMarks(value === '' ? '' : numVal);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudent || industryMarks === '') return;

        setSubmitting(true);
        try {
            await api.post('/coordinator/final-marks', {
                studentId: selectedStudent._id,
                industryMarks: Number(industryMarks),
                industryComments
            });

            alert('Final marks submitted successfully!');
            fetchCompletedStudents();
            setSelectedStudent(null);
            setIndustryMarks('');
            setIndustryComments('');
        } catch (error: any) {
            console.error('Error submitting final marks:', error);
            alert(error.response?.data?.message || 'Failed to submit final marks');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader className="w-8 h-8 animate-spin text-teal-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center mb-8">
                    <Award className="w-8 h-8 text-teal-600 mr-3" />
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Final Marks Assignment</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-[600px]">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Completed Students</h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search student..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-teal-500 bg-gray-50 dark:bg-gray-900"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map(student => (
                                    <button
                                        key={student._id}
                                        onClick={() => {
                                            setSelectedStudent(student);
                                            setIndustryMarks('');
                                            setIndustryComments('');
                                        }}
                                        className={`w-full text-left p-3 rounded-xl transition-all border ${selectedStudent?._id === student._id
                                            ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-500'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-transparent hover:border-gray-200'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {student.first_name} {student.last_name}
                                                </p>
                                                <p className="text-xs text-gray-500">{student.cb_number}</p>
                                            </div>
                                            {student.hasFinalMarks ? (
                                                <CheckCircle className="w-5 h-5 text-green-500" />
                                            ) : (
                                                <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                                            )}
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 mt-10">No completed students found.</p>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        {selectedStudent ? (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
                                <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center">
                                        <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold text-xl mr-4">
                                            {selectedStudent.first_name[0]}{selectedStudent.last_name[0]}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                                {selectedStudent.first_name} {selectedStudent.last_name}
                                            </h2>
                                            <p className="text-sm text-gray-500">{selectedStudent.cb_number} • {selectedStudent.degree}</p>
                                        </div>
                                    </div>
                                    {selectedStudent.hasFinalMarks && (
                                        <div className="flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                                            <CheckCircle className="w-4 h-4 mr-1.5" />
                                            Final Marks Submitted
                                        </div>
                                    )}
                                </div>

                                {!selectedStudent.academicMarks ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <AlertCircle className="w-12 h-12 text-yellow-500 mb-4" />
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Academic Marks Missing</h3>
                                        <p className="text-gray-500 max-w-md">
                                            The Academic Mentor has not yet submitted marks for this student.
                                            You cannot assign final marks until the academic assessment is complete.
                                        </p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-8">
                                        <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-100 dark:border-gray-800">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                                <User className="w-5 h-5 mr-2 text-blue-500" />
                                                Academic Mentor Assessment
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                                    <p className="text-sm text-gray-500 mb-1">Technical Skills</p>
                                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                        {selectedStudent.academicMarks.technical} <span className="text-sm text-gray-400">/ 20</span>
                                                    </p>
                                                </div>
                                                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                                    <p className="text-sm text-gray-500 mb-1">Soft Skills</p>
                                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                        {selectedStudent.academicMarks.softSkills} <span className="text-sm text-gray-400">/ 20</span>
                                                    </p>
                                                </div>
                                                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                                    <p className="text-sm text-gray-500 mb-1">Presentation</p>
                                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                        {selectedStudent.academicMarks.presentation} <span className="text-sm text-gray-400">/ 20</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                                                <div className="text-right">
                                                    <p className="text-sm text-gray-500">Academic Subtotal</p>
                                                    <p className="text-2xl font-bold text-blue-600">
                                                        {selectedStudent.academicMarks.total} <span className="text-sm text-gray-400">/ 60</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border-2 border-teal-100 dark:border-teal-900/30">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                                                <Calculator className="w-5 h-5 mr-2 text-teal-600" />
                                                Industry Mentor Assessment
                                            </h3>

                                            <div className="mb-6">
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Industry Mentor Marks
                                                    </label>
                                                    <span className="text-xs text-gray-500">Max: 40</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="40"
                                                        required
                                                        disabled={selectedStudent.hasFinalMarks}
                                                        value={industryMarks}
                                                        onChange={(e) => handleIndustryMarksChange(e.target.value)}
                                                        className="w-full text-center font-bold text-3xl p-4 border-2 border-teal-200 dark:border-teal-800 rounded-xl focus:border-teal-500 outline-none transition-colors"
                                                        placeholder="0"
                                                    />
                                                    <span className="ml-4 text-2xl font-bold text-gray-400">/ 40</span>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Industry Mentor Comments (Optional)
                                                </label>
                                                <textarea
                                                    disabled={selectedStudent.hasFinalMarks}
                                                    value={industryComments}
                                                    onChange={(e) => setIndustryComments(e.target.value)}
                                                    className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none h-32 resize-none bg-gray-50 dark:bg-gray-900"
                                                    placeholder="Enter feedback from the industry mentor..."
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                                            <div>
                                                <p className="text-gray-500 font-medium mb-1">Final Calculated Mark</p>
                                                <div className="text-5xl font-bold text-teal-600">
                                                    {finalTotal} <span className="text-2xl text-gray-400">/ 100</span>
                                                </div>
                                            </div>

                                            {!selectedStudent.hasFinalMarks && (
                                                <button
                                                    type="submit"
                                                    disabled={submitting || industryMarks === ''}
                                                    className={`px-8 py-4 rounded-xl font-bold text-white shadow-lg flex items-center transition-all ${submitting || industryMarks === ''
                                                        ? 'bg-gray-400 cursor-not-allowed'
                                                        : 'bg-teal-600 hover:bg-teal-700 hover:shadow-teal-500/30'
                                                        }`}
                                                >
                                                    {submitting ? (
                                                        <>
                                                            <Loader className="w-5 h-5 mr-2 animate-spin" />
                                                            Publishing Results...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save className="w-5 h-5 mr-2" />
                                                            Submit Final Marks
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </form>
                                )}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-[400px]">
                                <User className="w-16 h-16 mb-4 opacity-20" />
                                <p className="text-lg font-medium">Select a student to assign final marks</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
