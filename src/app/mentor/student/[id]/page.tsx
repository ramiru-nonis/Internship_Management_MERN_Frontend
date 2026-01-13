'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FaUserGraduate, FaArrowLeft, FaFilePdf, FaExternalLinkAlt, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import api from '@/lib/api';

interface Student {
    _id: string;
    first_name: string;
    last_name: string;
    cb_number: string;
    degree: string;
    status: string;
    profile_picture?: string;
    submissions: {
        logbooks: any[];
        marksheet: any;
        presentation: any;
    };
}

export default function MentorStudentView() {
    const router = useRouter();
    const params = useParams();
    const [student, setStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudent = async () => {
            try {
                const res = await api.get(`/academic-mentor/student/${params.id}`);
                setStudent(res.data);
                setLoading(false);
            } catch (error: any) {
                console.error(error);
                alert(error.response?.data?.message || 'Access Denied');
                router.push('/mentor');
            }
        };
        fetchStudent();
    }, [params.id]);

    if (loading) return <div className="p-8 text-center bg-gray-50 min-h-screen">Loading...</div>;
    if (!student) return null;

    const getSubStatus = (sub: any) => sub ? <FaCheckCircle className="text-green-500" /> : <FaExclamationCircle className="text-gray-300" />;

    return (
        <div className="min-h-screen bg-gray-50 font-outfit p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
                >
                    <FaArrowLeft /> Back to Dashboard
                </button>

                {/* Profile Card */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8">
                    <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                        <div className="w-24 h-24 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                            {student.profile_picture ? (
                                <img src={student.profile_picture} alt="Profile" className="w-full h-full object-cover rounded-2xl" />
                            ) : (
                                <FaUserGraduate className="text-4xl" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{student.first_name} {student.last_name}</h1>
                            <p className="text-gray-500 font-medium">{student.cb_number} • {student.degree}</p>
                            <div className="mt-4 flex gap-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${student.status === 'Completed' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                                    }`}>
                                    {student.status}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submissions Section */}
                <h2 className="text-xl font-bold text-gray-900 mb-6 px-2">Academic Submissions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Logbooks */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 text-sm">MB</div>
                                Monthly Logbooks
                            </h3>
                        </div>
                        <div className="space-y-3">
                            {student.submissions.logbooks.length > 0 ? (
                                student.submissions.logbooks.map((log: any, idx: number) => (
                                    <a
                                        key={idx}
                                        href={log.pdfUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-amber-50 transition-colors group"
                                    >
                                        <span className="text-sm font-medium text-gray-700">Logbook - Month {log.month || idx + 1}</span>
                                        <FaExternalLinkAlt className="text-gray-300 group-hover:text-amber-600 text-sm" />
                                    </a>
                                ))
                            ) : (
                                <p className="text-sm text-gray-400 py-2 border border-dashed rounded-xl text-center">No logbooks submitted yet</p>
                            )}
                        </div>
                    </div>

                    {/* Marksheet & Presentation */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col gap-6">
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg px-2">Documents</h3>

                            {/* Marksheet */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <FaFilePdf className="text-red-500 text-xl" />
                                    <span className="text-sm font-bold">Marksheet</span>
                                </div>
                                {student.submissions.marksheet ? (
                                    <a href={student.submissions.marksheet.fileUrl} target="_blank" className="text-blue-600 text-xs font-bold hover:underline">VIEW DOCUMENT</a>
                                ) : <span className="text-xs text-gray-400">NOT SUBMITTED</span>}
                            </div>

                            {/* Presentation */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <FaFilePdf className="text-blue-500 text-xl" />
                                    <span className="text-sm font-bold">Exit Presentation</span>
                                </div>
                                {student.submissions.presentation ? (
                                    <a href={student.submissions.presentation.fileUrl} target="_blank" className="text-blue-600 text-xs font-bold hover:underline">VIEW DOCUMENT</a>
                                ) : <span className="text-xs text-gray-400">NOT SUBMITTED</span>}
                            </div>
                        </div>
                    </div>

                </div>

                {/* Feedback Section (Future) */}
                <div className="mt-12 p-8 bg-blue-600 rounded-[2rem] text-white shadow-xl shadow-blue-200">
                    <h3 className="text-2xl font-bold mb-2">Mentor Feedback</h3>
                    <p className="text-blue-100 mb-6">Feedback and grading features are coming soon. For now, please review documents for your records.</p>
                    <div className="flex gap-4">
                        <button disabled className="px-6 py-2 bg-white/20 rounded-xl font-bold text-sm backdrop-blur-sm opacity-50 cursor-not-allowed italic">Pending Update</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
