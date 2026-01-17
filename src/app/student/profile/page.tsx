'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

import api from '@/lib/api';
import { User, FileText, Mail, Phone, Book, Calendar, Upload, Loader2, CheckCircle, AlertCircle, Download, Trash2 } from 'lucide-react';

export default function ProfilePage() {
    const router = useRouter();
    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingCV, setUploadingCV] = useState(false);
    const [uploadingPic, setUploadingPic] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const { register, handleSubmit, setValue, formState: { errors } } = useForm();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/students/profile');
            setStudent(res.data);

            // Set form values
            setValue('first_name', res.data.first_name);
            setValue('last_name', res.data.last_name);
            setValue('contact_number', res.data.contact_number);
            setValue('degree', res.data.degree);
            setValue('degree_level', res.data.degree_level);
            setValue('availability', res.data.availability);
            setValue('status', res.data.status);
            setValue('batch', res.data.batch || '');

            if (res.data.preferences && res.data.preferences.length > 0) {
                setValue('preference1', res.data.preferences[0]);
                setValue('preference2', res.data.preferences[1] || '');
                setValue('preference3', res.data.preferences[2] || '');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: any) => {
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const preferences = [data.preference1, data.preference2, data.preference3].filter(Boolean);
            const updateData = { ...data, preferences };

            const res = await api.put('/students/profile', updateData);
            setStudent(res.data);
            setMessage({ type: 'success', text: 'Profile updated successfully' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update profile' });
        } finally {
            setSaving(false);
        }
    };

    const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;

        const file = e.target.files[0];
        if (file.type !== 'application/pdf') {
            setMessage({ type: 'error', text: 'Only PDF files are allowed for CV' });
            return;
        }

        setUploadingCV(true);
        setMessage({ type: '', text: '' });

        const formData = new FormData();
        formData.append('cv', file);

        try {
            await api.post('/students/upload-cv', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            await fetchProfile(); // Refresh to get new CV path
            setMessage({ type: 'success', text: 'CV uploaded successfully' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to upload CV' });
        } finally {
            setUploadingCV(false);
        }
    };

    const handlePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;

        const file = e.target.files[0];
        if (!file.type.startsWith('image/')) {
            setMessage({ type: 'error', text: 'Only image files are allowed for profile picture' });
            return;
        }

        setUploadingPic(true);
        setMessage({ type: '', text: '' });

        const formData = new FormData();
        formData.append('profile_picture', file);

        try {
            await api.post('/students/upload-picture', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            await fetchProfile(); // Refresh to get new pic path
            setMessage({ type: 'success', text: 'Profile picture updated successfully' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to upload profile picture' });
        } finally {
            setUploadingPic(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm("WARNING: Are you sure you want to delete your account? This action is IRREVERSIBLE and will delete all your data including logbooks, applications, and placement forms.")) {
            return;
        }

        const confirmation = window.prompt("To confirm deletion, please type 'DELETE' in the box below:");
        if (confirmation !== 'DELETE') {
            alert("Deletion cancelled. You must type 'DELETE' to confirm.");
            return;
        }

        const password = window.prompt("FINAL SECURITY CHECK: Please enter your account password to authorize deletion:");
        if (!password) {
            alert("Deletion cancelled. Password is required.");
            return;
        }

        try {
            setSaving(true);
            await api.delete('/students/profile', { data: { password } });
            alert("Your account has been successfully deleted.");
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push('/login');
        } catch (error: any) {
            console.error('Failed to delete account:', error);
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to delete account' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">

                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading profile...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">


            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Profile Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-32 relative">
                                <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
                                    <div className="relative group">
                                        <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 overflow-hidden">
                                            {student?.profile_picture ? (
                                                <img
                                                    src={student.profile_picture.startsWith('http') ? student.profile_picture : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/${student.profile_picture}`}
                                                    alt="Profile"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                                    <User className="w-16 h-16" />
                                                </div>
                                            )}
                                        </div>
                                        <label className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                            {uploadingPic ? (
                                                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                            ) : (
                                                <Upload className="w-4 h-4 text-gray-600" />
                                            )}
                                            <input type="file" className="hidden" accept="image/*" onChange={handlePicUpload} disabled={uploadingPic} />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-20 pb-6 px-6 text-center">
                                <h2 className="text-xl font-bold text-gray-900">{student?.first_name} {student?.last_name}</h2>
                                <p className="text-sm text-gray-500 mt-1">{student?.cb_number}</p>
                                <div className="mt-4 inline-flex flex-col gap-1 items-center">
                                    <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                                        {student?.status}
                                    </div>
                                    {student?.batch && (
                                        <div className="text-xs text-gray-500 font-medium">
                                            Batch: {student.batch}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="border-t border-gray-200 px-6 py-4">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                                    <User className="w-4 h-4 mr-2 text-purple-600" />
                                    Academic Mentor
                                </h3>
                                {student?.academic_mentor ? (
                                    <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                                        <p className="text-sm font-bold text-purple-900">
                                            {student.academic_mentor.first_name} {student.academic_mentor.last_name}
                                        </p>
                                        <p className="text-xs text-purple-600 mt-0.5">
                                            {student.academic_mentor.email}
                                        </p>
                                        {student.academic_mentor.contact_number && (
                                            <p className="text-xs text-purple-500 mt-1 flex items-center">
                                                <Phone className="w-3 h-3 mr-1" />
                                                {student.academic_mentor.contact_number}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 italic">No Academic Mentor Assigned</p>
                                )}
                            </div>

                            <div className="border-t border-gray-200 px-6 py-4">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact Info</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Mail className="w-4 h-4 mr-3" />
                                        {student?.user?.email}
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Phone className="w-4 h-4 mr-3" />
                                        {student?.contact_number}
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 px-6 py-4">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">CV / Resume</h3>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center">
                                        <FileText className="w-8 h-8 text-red-500 mr-3" />
                                        <div className="text-left">
                                            <p className="text-sm font-medium text-gray-900">Current CV</p>
                                            <div className="flex items-center space-x-3">
                                                <button
                                                    onClick={async () => {
                                                        const cvUrl = student?.cv?.startsWith('http') ? student.cv : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/${student?.cv}`;
                                                        try {
                                                            const response = await fetch(cvUrl);
                                                            const blob = await response.blob();
                                                            const pdfBlob = new Blob([blob], { type: 'application/pdf' });
                                                            const url = window.URL.createObjectURL(pdfBlob);
                                                            window.open(url, '_blank');
                                                            setTimeout(() => window.URL.revokeObjectURL(url), 100);
                                                        } catch (error) {
                                                            console.error('Error viewing PDF:', error);
                                                            window.open(cvUrl, '_blank');
                                                        }
                                                    }}
                                                    className="text-xs text-blue-600 hover:underline bg-transparent border-0 cursor-pointer p-0"
                                                >
                                                    View Only
                                                </button>
                                                <span className="text-gray-300">|</span>
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            const cvUrl = student?.cv?.startsWith('http') ? student.cv : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/${student?.cv}`;
                                                            const response = await fetch(cvUrl);
                                                            const blob = await response.blob();
                                                            const url = window.URL.createObjectURL(blob);
                                                            const link = document.createElement('a');
                                                            link.href = url;
                                                            link.download = `CV_${student.first_name}_${student.last_name}.pdf`;
                                                            document.body.appendChild(link);
                                                            link.click();
                                                            link.remove();
                                                        } catch (error) {
                                                            console.error('Download failed:', error);
                                                            setMessage({ type: 'error', text: 'Failed to download CV' });
                                                        }
                                                    }}
                                                    className="text-xs text-blue-600 hover:underline flex items-center"
                                                >
                                                    <Download className="w-3 h-3 mr-1" />
                                                    Download
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <label className="p-2 hover:bg-gray-200 rounded-full cursor-pointer transition-colors">
                                        {uploadingCV ? (
                                            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                        ) : (
                                            <Upload className="w-5 h-5 text-gray-600" />
                                        )}
                                        <input type="file" className="hidden" accept=".pdf" onChange={handleCVUpload} disabled={uploadingCV} />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Edit Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
                                {message.text && (
                                    <div className={`flex items-center px-4 py-2 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                        }`}>
                                        {message.type === 'success' ? <CheckCircle className="w-4 h-4 mr-2" /> : <AlertCircle className="w-4 h-4 mr-2" />}
                                        {message.text}
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                                        <input
                                            {...register('first_name', { required: 'Required' })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        {errors.first_name && <p className="text-xs text-red-500 mt-1">Required</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                        <input
                                            {...register('last_name', { required: 'Required' })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                                        <input
                                            {...register('contact_number', { required: 'Required' })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
                                        <select
                                            {...register('availability', { required: 'Required' })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="Full-Time">Full-Time</option>
                                            <option value="Part-Time">Part-Time</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
                                        <select
                                            {...register('status')}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="non-intern">Not Hired (Searching)</option>
                                            <option value="hired">Hired</option>
                                            <option value="not hired">Not Hired</option>
                                        </select>
                                        <p className="text-xs text-gray-500 mt-1">Set to "Hired" to stop applying.</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Batch / Year</label>
                                        <input
                                            {...register('batch')}
                                            placeholder="e.g. 2024"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Degree</label>
                                        <select
                                            {...register('degree', { required: 'Required' })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="Computer Science">Computer Science</option>
                                            <option value="Software Engineering">Software Engineering</option>
                                            <option value="Business IT">Business IT</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                                        <select
                                            {...register('degree_level', { required: 'Required' })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >

                                            <option value="Level 5">Level 5</option>
                                            <option value="Level 6">Level 6</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Preferences</label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <input
                                            {...register('preference1', { required: 'At least 1 preference required' })}
                                            placeholder="Preference 1"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        <input
                                            {...register('preference2')}
                                            placeholder="Preference 2"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        <input
                                            {...register('preference3')}
                                            placeholder="Preference 3"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-70 flex items-center"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                Saving...
                                            </>
                                        ) : (
                                            'Save Changes'
                                        )}
                                    </button>
                                </div>
                            </form>

                            {/* Danger Zone */}
                            <div className="mt-12 pt-8 border-t border-red-100">
                                <h3 className="text-lg font-bold text-red-600 mb-2 flex items-center gap-2">
                                    <Trash2 className="w-5 h-5" />
                                    Danger Zone
                                </h3>
                                <p className="text-sm text-gray-500 mb-6">
                                    Once you delete your account, there is no going back. Please be certain.
                                </p>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={saving}
                                    className="px-6 py-2 border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white font-bold rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete My Account
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
