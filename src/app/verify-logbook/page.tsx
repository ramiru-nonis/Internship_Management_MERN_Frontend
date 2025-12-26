"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import Link from 'next/link';

function VerifyContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const status = searchParams.get('status');

    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<'success' | 'error' | null>(null);
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!id || !status) {
            setLoading(false);
            setResult('error');
            setMessage("Invalid verification link.");
            return;
        }

        const verifyLogbook = async () => {
            try {
                // Call the backend action endpoint
                await api.get(`/logbooks/action/${id}/${status}`);

                setResult('success');
                setMessage(status === 'Approved'
                    ? "Logbook Approved Successfully"
                    : "Logbook Rejected Successfully");
            } catch (error: any) {
                console.error("Verification error:", error);
                setResult('error');
                let msg = "Failed to process verification. Please try again or contact support.";
                if (error.response?.data) {
                    msg = error.response.data.message || (typeof error.response.data === 'string' ? error.response.data : msg);
                }
                setMessage(msg);
            } finally {
                setLoading(false);
            }
        };

        verifyLogbook();
    }, [id, status]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-600 font-medium">Processing verification...</p>
            </div>
        );
    }

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
                <p className="text-gray-500">
                    The student has been notified of your decision.
                </p>
                <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
                    Return to Home
                </Link>
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
