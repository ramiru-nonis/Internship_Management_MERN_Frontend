import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function Home() {
    return (
        <div className="min-h-screen flex flex-col bg-white">
            {/* Hero Section */}
            <div className="flex-grow flex items-center justify-center bg-[url('/images/loginPic.jpg')] bg-cover bg-center relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-black/80" />

                <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
                        Launch Your Career with <span className="text-blue-400">Next Step</span>
                    </h1>
                    <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                        The premier platform connecting ambitious students with world-class internships. Your future starts here.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/login"
                            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-all transform hover:scale-105 shadow-lg shadow-blue-600/30 flex items-center"
                        >
                            Get Started
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Link>
                        <Link
                            href="/register"
                            className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full backdrop-blur-sm border border-white/30 transition-all"
                        >
                            Create Account
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
