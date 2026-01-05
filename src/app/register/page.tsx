'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Loader2, Upload, User, FileText } from 'lucide-react';

const JOB_PREFERENCES = [
    "Software Engineering",
    "Data Science",
    "Web Development",
    "Mobile App Development",
    "UI/UX Design",
    "Quality Assurance",
    "DevOps",
    "Business Analysis",
    "Product Management",
    "Network Engineering",
    "Cybersecurity",
    "Database Administration"
];

export default function RegisterPage() {
    const { register, handleSubmit, formState: { errors }, watch } = useForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    // Watch file inputs for preview/name display
    const cvFile = watch('cv_file');
    const profileFile = watch('profile_picture');

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('email', data.email);
        formData.append('password', data.password);
        formData.append('role', 'student');
        formData.append('cb_number', data.cb_number);
        formData.append('first_name', data.first_name);
        formData.append('last_name', data.last_name);
        formData.append('contact_number', data.contact_number);
        formData.append('degree', data.degree);
        formData.append('degree_level', data.degree_level);
        formData.append('availability', data.availability);

        // Preferences as JSON string
        const preferences = [data.preference1, data.preference2, data.preference3].filter(Boolean);
        formData.append('preferences', JSON.stringify(preferences));

        if (data.cv_file?.[0]) {
            formData.append('cv', data.cv_file[0]);
        }
        if (data.profile_picture?.[0]) {
            formData.append('profile_picture', data.profile_picture[0]);
        }

        try {
            await api.post('/auth/register', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            // Show success state briefly before redirecting
            alert('Registration successful! Redirecting to login...');
            router.push('/login?registered=true');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 bg-[url('/images/loginPic.jpg')] bg-cover bg-center bg-fixed relative py-12">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            <div className="relative z-10 w-full max-w-4xl p-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl">
                <h2 className="text-3xl font-bold text-center text-white mb-8">Create Student Account</h2>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-100 text-center text-sm backdrop-blur-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Info */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-white border-b border-white/20 pb-2">Personal Info</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-white/90 mb-1">First Name</label>
                                <input {...register('first_name', { required: 'Required' })} autoComplete="given-name" className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="John" />
                                {errors.first_name && <p className="text-xs text-red-300 mt-1">Required</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/90 mb-1">Last Name</label>
                                <input {...register('last_name', { required: 'Required' })} autoComplete="family-name" className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Doe" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/90 mb-1">CB Number</label>
                            <input {...register('cb_number', { required: 'Required' })} className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="CB00XXXX" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/90 mb-1">Contact Number</label>
                            <input {...register('contact_number', { required: 'Required' })} className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="+94 7X XXX XXXX" />
                        </div>
                    </div>

                    {/* Academic Info */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-white border-b border-white/20 pb-2">Academic Info</h3>

                        <div>
                            <label className="block text-sm font-medium text-white/90 mb-1">Degree</label>
                            <select {...register('degree', { required: 'Required' })} className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 [&>option]:text-black">
                                <option value="">Select Degree</option>
                                <option value="Computer Science">Computer Science</option>
                                <option value="Software Engineering">Software Engineering</option>
                                <option value="Business IT">Business IT</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-white/90 mb-1">Level</label>
                                <select {...register('degree_level', { required: 'Required' })} className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 [&>option]:text-black">
                                    <option value="">Select Level</option>

                                    <option value="Level 5">Level 5</option>
                                    <option value="Level 6">Level 6</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/90 mb-1">Availability</label>
                                <select {...register('availability', { required: 'Required' })} className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 [&>option]:text-black">
                                    <option value="Full-Time">Full-Time</option>
                                    <option value="Part-Time">Part-Time</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Account Info */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-white border-b border-white/20 pb-2">Account Info</h3>

                        <div>
                            <label className="block text-sm font-medium text-white/90 mb-1">Email</label>
                            <input {...register('email', { required: 'Required' })} type="email" autoComplete="email" className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/90 mb-1">Password</label>
                            <input {...register('password', { required: 'Required', minLength: 6 })} type="password" autoComplete="new-password" className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                        </div>
                    </div>

                    {/* Preferences & Uploads */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-white border-b border-white/20 pb-2">Preferences & Files</h3>

                        <div className="grid grid-cols-3 gap-2">
                            <select {...register('preference1', { required: 'At least 1 pref required' })} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 [&>option]:text-black">
                                <option value="">Pref 1</option>
                                {JOB_PREFERENCES.map(pref => (
                                    <option key={pref} value={pref}>{pref}</option>
                                ))}
                            </select>
                            <select {...register('preference2')} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 [&>option]:text-black">
                                <option value="">Pref 2</option>
                                {JOB_PREFERENCES.map(pref => (
                                    <option key={pref} value={pref}>{pref}</option>
                                ))}
                            </select>
                            <select {...register('preference3')} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 [&>option]:text-black">
                                <option value="">Pref 3</option>
                                {JOB_PREFERENCES.map(pref => (
                                    <option key={pref} value={pref}>{pref}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative group">
                                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-white/30 border-dashed rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-colors">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <FileText className="w-6 h-6 text-white/70 mb-1" />
                                        <p className="text-xs text-white/70">Upload CV (PDF)</p>
                                    </div>
                                    <input {...register('cv_file', { required: 'CV is required' })} type="file" className="hidden" accept=".pdf" />
                                </label>
                                {cvFile?.[0] && <p className="text-xs text-green-300 mt-1 truncate">{cvFile[0].name}</p>}
                            </div>

                            <div className="relative group">
                                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-white/30 border-dashed rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-colors">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <User className="w-6 h-6 text-white/70 mb-1" />
                                        <p className="text-xs text-white/70">Profile Pic</p>
                                    </div>
                                    <input {...register('profile_picture')} type="file" className="hidden" accept="image/*" />
                                </label>
                                {profileFile?.[0] && <p className="text-xs text-green-300 mt-1 truncate">{profileFile[0].name}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2 pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 px-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-semibold rounded-xl shadow-lg shadow-green-600/30 transform transition-all duration-200 hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register Account'}
                        </button>
                    </div>
                </form>

                <p className="mt-6 text-center text-white/80 text-sm">
                    Already have an account?{' '}
                    <Link href="/login" className="text-blue-300 hover:text-blue-200 font-semibold hover:underline transition-colors">
                        Login here
                    </Link>
                </p>
            </div>
        </div>
    );
}
