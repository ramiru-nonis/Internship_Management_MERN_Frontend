'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
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
        } catch (error) {
            console.error('Error fetching job details:', error);
            setMessage({ type: 'error', text: 'Failed to load job details' });
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async () => {
        if (!confirm('Are you sure you want to apply for this internship?')) return;

        setApplying(true);
        setMessage({ type: '', text: '' });

        try {
            await api.post(`/internships/${params.id}/apply`);
            setMessage({ type: 'success', text: 'Application submitted successfully!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to apply' });
        } finally {
            setApplying(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading job details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center py-12">
                        <h2 className="text-2xl font-bold text-gray-900">Job not found</h2>
                        <Link href="/student/internships" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
                            &larr; Back to Jobs
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Link
                    href="/student/internships"
                    className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
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

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Header */}
                    <div className="p-8 border-b border-gray-100">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                                <div className="flex items-center text-gray-600 mb-4">
                                    <Building className="w-5 h-5 mr-2" />
                                    <span className="font-medium text-lg">{job.company_name}</span>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                                        {job.category}
                                    </span>
                                    {job.location && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                                            <MapPin className="w-3 h-3 mr-1" />
                                            {job.location}
                                        </span>
                                    )}
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-50 text-orange-700">
                                        <Clock className="w-3 h-3 mr-1" />
                                        Deadline: {new Date(job.deadline).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={handleApply}
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
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <Briefcase className="w-5 h-5 mr-2 text-blue-600" />
                                Job Description
                            </h2>
                            <div className="prose max-w-none text-gray-600 whitespace-pre-wrap">
                                {job.description}
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                                Requirements
                            </h2>
                            <div className="prose max-w-none text-gray-600 whitespace-pre-wrap">
                                {job.requirements}
                            </div>
                        </section>

                        {job.skills && job.skills.length > 0 && (
                            <section>
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Required Skills</h2>
                                <div className="flex flex-wrap gap-2">
                                    {job.skills.map((skill: string, index: number) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
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
        </div>
    );
}
