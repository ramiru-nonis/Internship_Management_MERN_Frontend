'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

import api from '@/lib/api';
import { Briefcase, MapPin, Calendar, Clock, Building, CheckCircle, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function JobDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const [job, setJob] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        fetchJobDetails();
    }, []);

    const fetchJobDetails = async () => {
        try {
            const res = await api.get(`/internships/${params.id}`);
            setJob(res.data);
            if (res.data.hasApplied) {
                setMessage({ type: 'success', text: 'You have already applied for this position' });
            }
        } catch (error) {
            console.error('Error fetching job details:', error);
            setMessage({ type: 'error', text: 'Failed to load job details' });
        } finally {
            setLoading(false);
        }
    };

    const [showApplyModal, setShowApplyModal] = useState(false);
    const [applyType, setApplyType] = useState<'profile' | 'custom_cv'>('profile');
    const [customCv, setCustomCv] = useState<File | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);

    const handleApplySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setApplying(true);
        setModalError(null);

        try {
            const formData = new FormData();
            formData.append('internshipId', params.id as string);
            formData.append('apply_type', applyType);

            if (applyType === 'custom_cv' && customCv) {
                formData.append('cv', customCv);
            }

            await api.post('/applications', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setMessage({ type: 'success', text: 'Application submitted successfully!' });
            setShowApplyModal(false);
            setCustomCv(null);
            setApplyType('profile');
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to apply';
            setModalError(errorMessage);
            setMessage({ type: 'error', text: errorMessage });
        } finally {
            setApplying(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading job details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center py-12">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Job not found</h2>
                        <Link href="/student/internships" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
                            &larr; Back to Jobs
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">


            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Link
                    href="/student/internships"
                    className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Opportunities
                </Link>

                {message.text && (
                    <div className={`mb-6 p-4 rounded-lg flex items-center ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                        {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-3" /> : <AlertCircle className="w-5 h-5 mr-3" />}
                        {message.text}
                    </div>
                )}

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {/* Header */}
                    <div className="p-8 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{job.title}</h1>
                                <div className="flex items-center text-gray-600 dark:text-gray-400 mb-4">
                                    <Building className="w-5 h-5 mr-2" />
                                    <span className="font-medium text-lg">{job.company_name}</span>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200">
                                        {job.category}
                                    </span>
                                    {job.location && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                            <MapPin className="w-3 h-3 mr-1" />
                                            {job.location}
                                        </span>
                                    )}
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-50 text-orange-700 dark:bg-orange-900/50 dark:text-orange-200">
                                        <Clock className="w-3 h-3 mr-1" />
                                        Deadline: {new Date(job.deadline).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setModalError(null);
                                    setShowApplyModal(true);
                                }}
                                disabled={applying || message.type === 'success'}
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[160px]"
                            >
                                {applying ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        Applying...
                                    </>
                                ) : message.type === 'success' ? (
                                    'Applied'
                                ) : (
                                    'Apply Now'
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 space-y-8">
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                                <Briefcase className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                                Job Description
                            </h2>
                            <div className="prose max-w-none text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                                {job.description}
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                                <CheckCircle className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                                Requirements
                            </h2>
                            <div className="prose max-w-none text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                                {job.requirements}
                            </div>
                        </section>

                        {job.skills && job.skills.length > 0 && (
                            <section>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Required Skills</h2>
                                <div className="flex flex-wrap gap-2">
                                    {job.skills.map((skill: string, index: number) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>

            {/* Apply Modal */}
            {showApplyModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Apply for {job.title}</h3>

                        {modalError && (
                            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
                                {modalError}
                            </div>
                        )}

                        <form onSubmit={handleApplySubmit}>
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                        <input
                                            type="radio"
                                            name="applyType"
                                            value="profile"
                                            checked={applyType === 'profile'}
                                            onChange={() => setApplyType('profile')}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                        />
                                        <div>
                                            <span className="font-medium text-gray-900 dark:text-white">Use Profile CV</span>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Apply with your default CV</p>
                                        </div>
                                    </label>
                                </div>

                                <div>
                                    <label className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                        <input
                                            type="radio"
                                            name="applyType"
                                            value="custom_cv"
                                            checked={applyType === 'custom_cv'}
                                            onChange={() => setApplyType('custom_cv')}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                        />
                                        <div>
                                            <span className="font-medium text-gray-900 dark:text-white">Upload Custom CV</span>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Upload a specific CV for this job</p>
                                        </div>
                                    </label>
                                </div>

                                {applyType === 'custom_cv' && (
                                    <div className="mt-3 ml-7">
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={(e) => setCustomCv(e.target.files ? e.target.files[0] : null)}
                                            required={applyType === 'custom_cv'}
                                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowApplyModal(false);
                                        setModalError(null);
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={applying || (applyType === 'custom_cv' && !customCv)}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {applying ? 'Applying...' : 'Submit Application'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
