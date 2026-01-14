'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/login', data);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data));

            // Redirect based on role
            if (res.data.role === 'student') {
                router.push('/student/dashboard');
            } else if (res.data.role === 'coordinator') {
                router.push('/coordinator/dashboard');
            } else if (res.data.role === 'admin') {
                router.push('/admin/dashboard');
            } else if (res.data.role === 'academic_mentor') {
                router.push('/mentor/dashboard');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-800 bg-[url('/images/loginPic.jpg')] bg-cover bg-center bg-fixed relative">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

            <div className="relative z-10 w-full max-w-md p-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl">
                <div className="flex justify-center mb-8">
                    {/* Placeholder for Logo - assuming assets are moved or we use text */}
                    <div className="relative w-72 h-24 md:w-96 md:h-32">
                        <Image
                            src="/images/NewLogo.png"
                            alt="NextStep Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                </div>

                <h2 className="text-3xl font-bold text-center text-white mb-8">Welcome Back</h2>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-100 text-center text-sm backdrop-blur-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">Email Address</label>
                        <input
                            {...register('email', { required: 'Email is required' })}
                            type="email"
                            autoComplete="email"
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                            placeholder="Enter your email"
                        />
                        {errors.email && <p className="mt-1 text-sm text-red-300">{errors.email.message as string}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">Password</label>
                        <input
                            {...register('password', { required: 'Password is required' })}
                            type="password"
                            autoComplete="current-password"
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                            placeholder="Enter your password"
                        />
                        {errors.password && <p className="mt-1 text-sm text-red-300">{errors.password.message as string}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/30 transform transition-all duration-200 hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
                    </button>
                </form>

                <p className="mt-8 text-center text-white/80 text-sm">
                    Don't have an account?{' '}
                    <Link href="/register" className="text-blue-300 hover:text-blue-200 font-semibold hover:underline transition-colors">
                        Register here
                    </Link>
                </p>
            </div>

            <footer className="absolute bottom-6 text-white/60 text-xs">
                &copy; {new Date().getFullYear()} NextStep. All Rights Reserved.
            </footer>
        </div>
    );
}
