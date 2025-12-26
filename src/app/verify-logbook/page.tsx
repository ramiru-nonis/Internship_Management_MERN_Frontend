"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import Link from 'next/link';

function VerifyContent() {
    const searchParams = useSearchParams();
    const router = useRouter(); // Use router for redirection if needed
    const id = searchParams.get('id');
    const status = searchParams.get('status');

    // State
    const [loading, setLoading] = useState(false); // Not loading initially, waiting for user input
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState<'success' | 'error' | null>(null);
    const [message, setMessage] = useState("");
    const [feedback, setFeedback] = useState("");

    // Initial check
    useEffect(() => {
        if (!id || !status) {
            setResult('error');
            setMessage("Invalid verification link.");
        }
    }, [id, status]);

    const handleConfirm = async () => {
        if (!id || !status) return;
        setProcessing(true);
        try {
            await api.post('/logbooks/action', {
                logbookId: id,
                status: status,
                feedback: feedback
            });

            setResult('success');
            setMessage(status === 'Approved'
                ? "Logbook Approved Successfully"
                : "Logbook Rejected Successfully");
        } catch (error: any) {
            console.error("Verification error:", error);
            setResult('error');
            setMessage(error.response?.data?.message || "Failed to process verification. Please try again.");
        } finally {
            setProcessing(false);
        }
    };

    if (result === 'success') {
        return (
            <div className="flex flex-col items-center justify-center py-4">
                {status === 'Approved' ? (
                    <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                ) : (
                    <XCircle className="h-16 w-16 text-red-500 mb-4" />
                )}
                <h3 className={`text-xl font-bold mb-2 ${status === 'Approved' ? 'text-green-600' : 'text-red-600'}`}>
                    {message}
                </h3>
                <p className="text-gray-500 mb-6">
                    The student has been notified of your decision.
                </p>
                <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
                    Return to Home
                </Link>
            </div>
        );
    }

    if (result === 'error') {
        return (
            <div className="flex flex-col items-center justify-center py-4">
                <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Verification Failed</h3>
                <p className="text-red-600 mb-4">{message}</p>
                <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
                    Return to Home
                </Link>
            </div>
        );
    }

    // Default: Show Confirmation Form
    return (
        <div className="flex flex-col py-4 text-left">
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
                Confirm {status}
            </h3>
            <p className="text-gray-600 mb-6 text-center text-sm">
                Please provide any optional feedback for the student below, then confirm your action.
            </p>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mentor Comments (Optional)
                    </label>
                    <textarea
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all h-32 resize-none text-gray-700"
                        placeholder="e.g., Great work on the React project! or Please add more details for Week 2."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                    />
                </div>

                <div className="pt-2">
                    <button
                        onClick={handleConfirm}
                        disabled={processing}
                        className={`w-full py-3 rounded-xl font-bold text-white shadow-md transition-all flex items-center justify-center gap-2
                            ${status === 'Approved'
                                ? "bg-green-600 hover:bg-green-700 shadow-green-200"
                                : "bg-red-600 hover:bg-red-700 shadow-red-200"
                            } disabled:opacity-70 disabled:cursor-not-allowed`}
                    >
                        {processing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                {status === 'Approved' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                Confirm {status}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function VerifyLogbookPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-2xl px-4 py-2 rounded-lg shadow-sm">
                        NextStep
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Logbook Verification
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <Suspense fallback={
                        <div className="flex flex-col items-center justify-center py-8">
                            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
                            <p className="text-gray-600 font-medium">Loading...</p>
                        </div>
                    }>
                        <VerifyContent />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
