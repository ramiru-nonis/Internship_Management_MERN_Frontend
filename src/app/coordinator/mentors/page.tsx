'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaUserPlus, FaUserTie, FaSearch, FaArrowLeft } from 'react-icons/fa';
import api from '@/lib/api';

interface Mentor {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
    contact_number: string;
}

interface Student {
    _id: string;
    first_name: string;
    last_name: string;
    cb_number: string;
    academic_mentor?: string;
}

export default function MentorManagement() {
    const router = useRouter();
    const [mentors, setMentors] = useState<Mentor[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);

    // Create Mentor Form State
    const [newMentor, setNewMentor] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '', // Manual password assignment
        contact_number: ''
    });

    // Assign Student State
    const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [mentorsRes, studentsRes] = await Promise.all([
                api.get('/coordinator/mentors'),
                api.get('/coordinator/students?status=all') // Get all students
            ]);
            setMentors(mentorsRes.data);
            // Filter students who need assignment (e.g., interns or completed, or just all)
            // Requirement: "Student assignment occurs after a student submits their final submission."
            // This implies 'Completed' or 'intern' status usually. 
            // But for flexibility, let's allow assigning any student, or maybe filter by status.
            setStudents(studentsRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateMentor = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/coordinator/mentors', newMentor);
            setShowCreateModal(false);
            setNewMentor({ first_name: '', last_name: '', email: '', password: '', contact_number: '' });
            fetchData();
            alert('Mentor created successfully. Please share credentials offline.');
        } catch (error) {
            console.error(error);
            alert('Failed to create mentor');
        }
    };

    const handleAssignStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMentor) return;

        try {
            await api.post('/coordinator/assign-mentor', {
                studentId: selectedStudentId,
                mentorId: selectedMentor._id
            });
            setShowAssignModal(false);
            setSelectedMentor(null);
            setSelectedStudentId('');
            fetchData(); // Refresh to show updated assignment if we display it (optional)
            alert('Student assigned successfully.');
        } catch (error) {
            console.error(error);
            alert('Failed to assign student');
        }
    };

    const openAssignModal = (mentor: Mentor) => {
        setSelectedMentor(mentor);
        setShowAssignModal(true);
    };

    // Filter students for assignment dropdown (exclude already assigned?)
    // Ideally yes, but for now just list all.
    const filteredStudents = students.filter(s =>
        s.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.cb_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 font-outfit p-8">
            <div className="max-w-7xl mx-auto">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
                >
                    <FaArrowLeft /> Back to Dashboard
                </button>

                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Academic Mentors</h1>
                        <p className="text-gray-500 mt-1">Manage mentor accounts and student assignments</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        <FaUserPlus /> Create Mentor
                    </button>
                </div>

                {/* Mentors Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mentors.map((mentor) => (
                        <div key={mentor._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                                        <FaUserTie />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{mentor.first_name} {mentor.last_name}</h3>
                                        <p className="text-sm text-gray-500">{mentor.email}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-50 pt-4 mt-4">
                                <button
                                    onClick={() => openAssignModal(mentor)}
                                    className="w-full py-2 text-sm text-center text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                                >
                                    Assign Student
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Create Mentor Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl max-w-md w-full p-6">
                            <h2 className="text-xl font-bold mb-4">Create New Mentor</h2>
                            <form onSubmit={handleCreateMentor}>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            type="text"
                                            placeholder="First Name"
                                            className="w-full p-2 border rounded-lg"
                                            value={newMentor.first_name}
                                            onChange={e => setNewMentor({ ...newMentor, first_name: e.target.value })}
                                            required
                                        />
                                        <input
                                            type="text"
                                            placeholder="Last Name"
                                            className="w-full p-2 border rounded-lg"
                                            value={newMentor.last_name}
                                            onChange={e => setNewMentor({ ...newMentor, last_name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        className="w-full p-2 border rounded-lg"
                                        value={newMentor.email}
                                        onChange={e => setNewMentor({ ...newMentor, email: e.target.value })}
                                        required
                                    />
                                    <input
                                        type="tel"
                                        placeholder="Contact Number"
                                        className="w-full p-2 border rounded-lg"
                                        value={newMentor.contact_number}
                                        onChange={e => setNewMentor({ ...newMentor, contact_number: e.target.value })}
                                        required
                                    />
                                    <div>
                                        <input
                                            type="password"
                                            placeholder="Assign Password"
                                            className="w-full p-2 border rounded-lg"
                                            value={newMentor.password}
                                            onChange={e => setNewMentor({ ...newMentor, password: e.target.value })}
                                            required
                                        />
                                        <p className="text-xs text-amber-600 mt-1">
                                            Important: Share this password with the mentor manually.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                    >
                                        Create Account
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Assign Student Modal */}
                {showAssignModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl max-w-lg w-full p-6">
                            <h2 className="text-xl font-bold mb-4">
                                Assign Student to {selectedMentor?.first_name}
                            </h2>
                            <form onSubmit={handleAssignStudent}>
                                <div className="mb-4">
                                    <div className="relative mb-2">
                                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search student..."
                                            className="w-full pl-10 p-2 border rounded-lg"
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="max-h-60 overflow-y-auto border rounded-lg divide-y">
                                        {filteredStudents.map(student => (
                                            <div
                                                key={student._id}
                                                className={`p-3 cursor-pointer hover:bg-gray-50 flex justify-between items-center ${selectedStudentId === student._id ? 'bg-purple-50 border-l-4 border-purple-600' : ''}`}
                                                onClick={() => setSelectedStudentId(student._id)}
                                            >
                                                <div>
                                                    <p className="font-medium">{student.first_name} {student.last_name}</p>
                                                    <p className="text-xs text-gray-500">{student.cb_number}</p>
                                                </div>
                                                {student.academic_mentor && (
                                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                                        Assigned
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowAssignModal(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!selectedStudentId}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                                    >
                                        Assign Student
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
