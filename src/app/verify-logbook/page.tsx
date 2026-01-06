"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import Link from 'next/link';

function VerifyContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const action = searchParams.get('action'); // 'approve' or 'reject'
    const statusParam = searchParams.get('status');

    // Normalize status
    let status = statusParam;
    if (!status && action) {
        if (action === 'approve') status = 'Approved';
        if (action === 'reject') status = 'Rejected';
    }

    const [loading, setLoading] = useState(true); // Loading initially for status check
    const [result, setResult] = useState<'success' | 'error' | null>(null);
    const [message, setMessage] = useState("");
    const [processed, setProcessed] = useState(false);
    const [alreadyDone, setAlreadyDone] = useState(false);

    const [feedback, setFeedback] = useState("");

    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }

        const checkStatus = async () => {
            try {
                const res = await api.get(`/logbooks/${id}`);
                const logbook = res.data;

                if (['Approved', 'Rejected'].includes(logbook.status)) {
                    setAlreadyDone(true);
                    setProcessed(true);
                    setResult('success'); // Technically success as in "done"
                    setMessage(`This logbook has already been ${logbook.status}.`);
                }
            } catch (error) {
                console.error("Error checking status:", error);
                // Fallback to allowing user to try (backend will block anyway)
            } finally {
                setLoading(false);
            }
        };

        checkStatus();
    }, [id]);

    const handleConfirm = async () => {
        if (!id || !status) return;

        setLoading(true);
        try {
            // Call the backend action endpoint
            await api.post(`/logbooks/verify/${id}`, {
                status,
                feedback,
                rejectionReason: status === 'Rejected' ? feedback : "" // Map feedback to rejectionReason if rejected, for backward compatibility/clarity
            });

            setResult('success');
            setMessage(status === 'Approved'
                ? "Logbook Approved Successfully"
                : "Logbook Rejected Successfully");
            setProcessed(true);
        } catch (error: any) {
            console.error("Verification error:", error);
            setResult('error');
            let msg = "Failed to process verification. Please try again.";
            if (error.response?.data) {
                msg = error.response.data.message || (typeof error.response.data === 'string' ? error.response.data : msg);
            }
            setMessage(msg);
            setProcessed(true);
        } finally {
            setLoading(false);
        }
    };

    if (!id || !status) {
        return (
            <div className="flex flex-col items-center justify-center py-4">
                <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Invalid Link</h3>
                <p className="text-red-600 mb-4">Missing parameters.</p>
                <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
                    Return to Home
                </Link>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-600 font-medium">Checking status...</p>
            </div>
        );
    }

    if (processed) {
        if (result === 'success') {
            return (
                <div className="flex flex-col items-center justify-center py-4">
                    {alreadyDone ? (
                        <CheckCircle className="h-16 w-16 text-blue-500 mb-4" />
                    ) : (
                        status === 'Approved' ? (
                            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                        ) : (
                            <XCircle className="h-16 w-16 text-red-500 mb-4" />
                        )
                    )}

                    <h3 className={`text-xl font-bold mb-2 ${alreadyDone ? 'text-blue-600' : (status === 'Approved' ? 'text-green-600' : 'text-red-600')}`}>
                        {message}
                    </h3>
                    <p className="text-gray-500 mb-4">
                        {alreadyDone ? "No further action is required." : "The student has been notified of your decision."}
                    </p>
                    <button disabled className="bg-gray-300 text-gray-500 px-6 py-2 rounded-lg cursor-not-allowed font-medium">
                        Action Completed
                    </button>
                </div>
            );
        }

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

    // Initial Confirmation Screen
    return (
        <div className="flex flex-col items-center justify-center py-4 text-center w-full max-w-md mx-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Action</h3>
            <p className="text-gray-600 mb-6">
                Are you sure you want to <strong>{status}</strong> this logbook?
            </p>

            <div className="w-full text-left mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mentor Comment (Optional)
                </label>
                <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder={status === 'Rejected' ? "Reason for rejection..." : "Add a comment..."}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    rows={4}
                />
            </div>

            <button
                onClick={handleConfirm}
                disabled={loading}
                className={`flex items-center justify-center px-8 py-3 rounded-lg font-bold text-white transition-all transform hover:-translate-y-0.5 w-full ${loading ? 'opacity-70 cursor-wait' : ''
                    } ${status === 'Approved'
                        ? 'bg-green-600 hover:bg-green-700 shadow-green-200 shadow-lg'
                        : 'bg-red-600 hover:bg-red-700 shadow-red-200 shadow-lg'
                    }`}
            >
                {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                {loading ? 'Processing...' : `Confirm ${status}`}
            </button>
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
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
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
