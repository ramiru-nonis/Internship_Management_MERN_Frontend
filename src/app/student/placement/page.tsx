'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import api from '@/lib/api';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function PlacementFormPage() {
    const router = useRouter();
    const [existingForm, setExistingForm] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        full_name: '',
        student_id_number: '',
        batch_code: '',
        email: '',
        address: '',
        has_visa: 'no',
        award_title: '',
        emergency_contact: '',
        emergency_relationship: '',
        company_name: '',
        company_address: '',
        company_phone: '',
        company_email: '',
        position: '',
        placement_job_title: '',
        placement_job_role: '',
        start_date: '',
        end_date: '',

        mentor_name: '',
        mentor_email: '',
        mentor_phone: '',
        description: '',
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        checkExistingForm();
    }, []);

    const checkExistingForm = async () => {
        try {
            const response = await api.get('/placement');
            if (response.data) {
                setExistingForm(response.data);
            } else {
                // If no existing form, fetch student details to autofill
                fetchStudentDetails();
            }
        } catch (error: any) {
            // If 404, no form exists yet - this is expected
            if (error.response?.status === 404) {
                fetchStudentDetails();
            } else {
                console.error('Error checking existing form:', error);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentDetails = async () => {
        try {
            const response = await api.get('/students/profile');
            const student = response.data;
            if (student) {
                setFormData(prev => ({
                    ...prev,
                    full_name: `${student.first_name} ${student.last_name}`,
                    student_id_number: student.cb_number,
                    email: student.user?.email || prev.email,
                }));
            }
        } catch (error) {
            console.error('Error fetching student details:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        if (new Date(formData.end_date) < new Date(formData.start_date)) {
            setError('End date cannot be before start date');
            setSubmitting(false);
            return;
        }

        try {
            const response = await api.post('/placement', formData);
            setExistingForm(response.data?.placementForm || { ...formData });
            alert('Placement form submitted successfully! Your status has been updated to "Hired".');
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to submit placement form');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">


            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Industry Placement Form</h1>
                    <p className="text-gray-600 mt-2 dark:text-gray-400">
                        {existingForm ? 'Your placement form has been submitted' : 'Submit your internship placement details'}
                    </p>
                </div>

                {existingForm ? (
                    /* Read-only view */
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
                        <div className="flex items-center justify-center mb-6">
                            <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">Form Submitted Successfully</h2>
                        <div className="flex justify-center mb-8">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200">
                                Status: Submitted
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Student Details</h3>
                                <div className="space-y-3 text-gray-900 dark:text-gray-300">
                                    <div><span className="text-gray-500 dark:text-gray-400 text-sm">Full Name:</span> <p>{existingForm.full_name}</p></div>
                                    <div><span className="text-gray-500 dark:text-gray-400 text-sm">Student ID:</span> <p>{existingForm.student_id_number}</p></div>
                                    <div><span className="text-gray-500 dark:text-gray-400 text-sm">Batch Code:</span> <p>{existingForm.batch_code}</p></div>
                                    <div><span className="text-gray-500 dark:text-gray-400 text-sm">Email:</span> <p>{existingForm.email}</p></div>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Company Details</h3>
                                <div className="space-y-3 text-gray-900 dark:text-gray-300">
                                    <div><span className="text-gray-500 dark:text-gray-400 text-sm">Company:</span> <p>{existingForm.company_name}</p></div>
                                    <div><span className="text-gray-500 dark:text-gray-400 text-sm">Address:</span> <p>{existingForm.company_address}</p></div>

                                    <div><span className="text-gray-500 dark:text-gray-400 text-sm">Mentor:</span> <p>{existingForm.mentor_name}</p></div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Form */
                    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 space-y-8">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start">
                                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3 mt-0.5" />
                                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                            </div>
                        )}

                        {/* Student Details */}
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">Student Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name *</label>
                                    <input required type="text" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Student ID *</label>
                                    <input required type="text" value={formData.student_id_number} onChange={e => setFormData({ ...formData, student_id_number: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Batch Code *</label>
                                    <input required type="text" value={formData.batch_code} onChange={e => setFormData({ ...formData, batch_code: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Personal Email *</label>
                                    <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address *</label>
                                    <input required type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Award Title *</label>
                                    <input required type="text" value={formData.award_title} onChange={e => setFormData({ ...formData, award_title: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Do you have a Visa? *</label>
                                    <select required value={formData.has_visa} onChange={e => setFormData({ ...formData, has_visa: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent accent-blue-500">
                                        <option value="no">No</option>
                                        <option value="yes">Yes</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Emergency Contact */}
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">Emergency Contact</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contact Number *</label>
                                    <input required type="text" value={formData.emergency_contact} onChange={e => setFormData({ ...formData, emergency_contact: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Relationship *</label>
                                    <input required type="text" value={formData.emergency_relationship} onChange={e => setFormData({ ...formData, emergency_relationship: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                            </div>
                        </div>

                        {/* Company Details */}
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">Company Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Name *</label>
                                    <input required type="text" value={formData.company_name} onChange={e => setFormData({ ...formData, company_name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Phone *</label>
                                    <input required type="tel" value={formData.company_phone} onChange={e => setFormData({ ...formData, company_phone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Email *</label>
                                    <input required type="email" value={formData.company_email} onChange={e => setFormData({ ...formData, company_email: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Company Address *</label>
                                    <input required type="text" value={formData.company_address} onChange={e => setFormData({ ...formData, company_address: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                            </div>
                        </div>

                        {/* Placement Details */}
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">Placement Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Job Title *</label>
                                    <input required type="text" value={formData.placement_job_title} onChange={e => setFormData({ ...formData, placement_job_title: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Position *</label>
                                    <input required type="text" value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Job Role Description *</label>
                                    <textarea required value={formData.placement_job_role} onChange={e => setFormData({ ...formData, placement_job_role: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows={3} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date *</label>
                                    <input required type="date" value={formData.start_date} onChange={e => {
                                        const newStartDate = e.target.value;
                                        setFormData(prev => ({
                                            ...prev,
                                            start_date: newStartDate,
                                            // Reset end date if it's now invalid
                                            end_date: prev.end_date && new Date(prev.end_date) < new Date(newStartDate) ? '' : prev.end_date
                                        }));
                                    }} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date *</label>
                                    <input required type="date" value={formData.end_date} min={formData.start_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                            </div>
                        </div>

                        {/* Supervisor & Mentor */}
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">Supervisor & Mentor</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mentor Name *</label>
                                    <input required type="text" value={formData.mentor_name} onChange={e => setFormData({ ...formData, mentor_name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mentor Email *</label>
                                    <input required type="email" value={formData.mentor_email} onChange={e => setFormData({ ...formData, mentor_email: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mentor Phone *</label>
                                    <input required type="tel" value={formData.mentor_phone} onChange={e => setFormData({ ...formData, mentor_phone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">General Description *</label>
                            <textarea required rows={4} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Additional details..." />
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                <strong>Note:</strong> Once submitted, this form cannot be edited. Your student status will automatically be updated to "Hired".
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Submitting...' : 'Submit Placement Form'}
                        </button>
                    </form>
                )}
            </div>
        </div >
    );
}
