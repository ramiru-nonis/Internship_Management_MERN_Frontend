'use client';

import { useState, useEffect } from 'react';
import { X, User, Loader2, CheckCircle } from 'lucide-react';
import api from '@/lib/api';

interface Mentor {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
}

interface AssignMentorModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentIds: string[];
    onSuccess: () => void;
}

export default function AssignMentorModal({ isOpen, onClose, studentIds, onSuccess }: AssignMentorModalProps) {
    const [mentors, setMentors] = useState<Mentor[]>([]);
    const [selectedMentor, setSelectedMentor] = useState('');
    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchMentors();
        }
    }, [isOpen]);

    const fetchMentors = async () => {
        setLoading(true);
        try {
            const res = await api.get('/coordinator/mentors');
            setMentors(res.data);
        } catch (err: any) {
            console.error('Error fetching mentors:', err);
            setError('Failed to load academic mentors');
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedMentor) {
            setError('Please select a mentor');
            return;
        }

        setAssigning(true);
        setError('');
        try {
            await api.post('/coordinator/students/bulk-assign-mentor', {
                studentIds,
                mentorId: selectedMentor
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error assigning mentor:', err);
            setError(err.response?.data?.message || 'Failed to assign mentor');
        } finally {
            setAssigning(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        <User className="w-5 h-5 mr-2" />
                        Assign Academic Mentor
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            You are assigning an academic mentor to <span className="font-bold text-blue-600 dark:text-blue-400">{studentIds.length}</span> selected student(s).
                        </p>

                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Select Academic Mentor
                        </label>

                        {loading ? (
                            <div className="flex items-center justify-center py-4 text-gray-500">
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                Loading mentors...
                            </div>
                        ) : (
                            <select
                                value={selectedMentor}
                                onChange={(e) => setSelectedMentor(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                            >
                                <option value="">Select a mentor</option>
                                {mentors.map((mentor) => (
                                    <option key={mentor._id} value={mentor._id}>
                                        {mentor.first_name} {mentor.last_name} ({mentor.email})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 dark:text-gray-400 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAssign}
                            disabled={assigning || !selectedMentor || loading}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {assigning ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Assigning...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Assign Now
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
