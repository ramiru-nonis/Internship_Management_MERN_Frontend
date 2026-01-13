'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaUserPlus, FaUserTie, FaSearch, FaArrowLeft, FaEdit, FaUserSlash, FaUserCheck } from 'react-icons/fa';
import api from '@/lib/api';

interface Mentor {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
    contact_number: string;
    status: 'active' | 'inactive';
    user: {
        email: string;
    };
}

interface Student {
    _id: string;
    first_name: string;
    last_name: string;
    cb_number: string;
    academic_mentor?: string;
    status: string;
}

export default function MentorManagement() {
    const router = useRouter();
    const [mentors, setMentors] = useState<Mentor[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);

    // Create/Edit Mentor Form State
    const [currentMentor, setCurrentMentor] = useState({
        _id: '',
        first_name: '',
        last_name: '',
        email: '',
        password: '',
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
                api.get('/coordinator/students')
            ]);
            setMentors(mentorsRes.data);
            setStudents(studentsRes.data.filter((s: Student) => s.status === 'Completed' || s.status === 'intern'));
            setLoading(false);
        } catch (error) {
            console.error(error);
            alert('Failed to fetch data');
            setLoading(false);
        }
    };

    const handleCreateOrUpdateMentor = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (currentMentor._id) {
                await api.put(`/coordinator/mentors/${currentMentor._id}`, currentMentor);
                alert('Mentor updated successfully');
            } else {
                await api.post('/coordinator/mentors', currentMentor);
                alert('Mentor created successfully. Share credentials manually.');
            }
            setShowCreateModal(false);
            resetForm();
            fetchData();
        } catch (error) {
            console.error(error);
            alert('Operation failed');
        }
    };

    const toggleMentorStatus = async (mentor: Mentor) => {
        const newStatus = mentor.status === 'active' ? 'inactive' : 'active';
        try {
            await api.put(`/coordinator/mentors/${mentor._id}`, { status: newStatus });
            alert(`Mentor ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
            fetchData();
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const handleAssignStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMentor || !selectedStudentId) return;

        try {
            await api.post('/coordinator/assign-mentor', {
                studentId: selectedStudentId,
                mentorId: selectedMentor._id
            });
            setShowAssignModal(false);
            setSelectedMentor(null);
            setSelectedStudentId('');
            alert('Student assigned successfully');
            fetchData();
        } catch (error) {
            console.error(error);
            alert('Assignment failed');
        }
    };

    const resetForm = () => {
        setCurrentMentor({ _id: '', first_name: '', last_name: '', email: '', password: '', contact_number: '' });
    };

    const openEditModal = (mentor: Mentor) => {
        setCurrentMentor({
            _id: mentor._id,
            first_name: mentor.first_name,
            last_name: mentor.last_name,
            email: mentor.email,
            password: '', // Password not editable here for security usually, or handled separately
            contact_number: mentor.contact_number || ''
        });
        setShowCreateModal(true);
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    const filteredStudents = students.filter(s =>
        (s.first_name + ' ' + s.last_name + ' ' + s.cb_number).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 font-outfit p-4 md:p-8">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
                    <FaArrowLeft /> Back to Dashboard
                </button>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Academic Mentors</h1>
                        <p className="text-gray-500">Manage mentor accounts and student assignments</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowCreateModal(true); }}
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                    >
                        <FaUserPlus /> Create New Mentor
                    </button>
                </div>
            </div>

            {/* Mentor Cards Grid */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mentors.map((mentor) => (
                    <div key={mentor._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                                    <FaUserTie className="text-2xl" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{mentor.first_name} {mentor.last_name}</h3>
                                    <p className="text-sm text-gray-500">{mentor.email}</p>
                                </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${mentor.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {mentor.status}
                            </span>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="text-sm text-gray-600">
                                <span className="font-medium">Phone:</span> {mentor.contact_number || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-600">
                                <span className="font-medium">Assigned Students:</span> {students.filter(s => s.academic_mentor === mentor._id).length}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => openEditModal(mentor)}
                                className="flex-1 flex items-center justify-center gap-2 bg-gray-50 text-gray-700 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                            >
                                <FaEdit /> Edit
                            </button>
                            <button
                                onClick={() => { setSelectedMentor(mentor); setShowAssignModal(true); }}
                                className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-700 py-2 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                            >
                                Assign Student
                            </button>
                            <button
                                onClick={() => toggleMentorStatus(mentor)}
                                title={mentor.status === 'active' ? 'Deactivate' : 'Activate'}
                                className={`p-2 rounded-lg transition-colors ${mentor.status === 'active' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                            >
                                {mentor.status === 'active' ? <FaUserSlash /> : <FaUserCheck />}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create/Edit Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl w-full max-w-md p-8">
                        <h2 className="text-2xl font-bold mb-6">{currentMentor._id ? 'Edit Mentor' : 'Create Mentor'}</h2>
                        <form onSubmit={handleCreateOrUpdateMentor} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                <input
                                    required
                                    className="w-full px-4 py-2 border rounded-xl"
                                    value={currentMentor.first_name}
                                    onChange={(e) => setCurrentMentor({ ...currentMentor, first_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                <input
                                    required
                                    className="w-full px-4 py-2 border rounded-xl"
                                    value={currentMentor.last_name}
                                    onChange={(e) => setCurrentMentor({ ...currentMentor, last_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Username)</label>
                                <input
                                    required
                                    type="email"
                                    className="w-full px-4 py-2 border rounded-xl"
                                    value={currentMentor.email}
                                    onChange={(e) => setCurrentMentor({ ...currentMentor, email: e.target.value })}
                                    disabled={!!currentMentor._id}
                                />
                            </div>
                            {!currentMentor._id && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <input
                                        required
                                        type="password"
                                        className="w-full px-4 py-2 border rounded-xl"
                                        value={currentMentor.password}
                                        onChange={(e) => setCurrentMentor({ ...currentMentor, password: e.target.value })}
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                                <input
                                    className="w-full px-4 py-2 border rounded-xl"
                                    value={currentMentor.contact_number}
                                    onChange={(e) => setCurrentMentor({ ...currentMentor, contact_number: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3 bg-gray-100 rounded-xl">Cancel</button>
                                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl w-full max-w-lg p-8">
                        <h2 className="text-2xl font-bold mb-2">Assign Student</h2>
                        <p className="text-sm text-gray-500 mb-6">Assigning student to {selectedMentor?.first_name}</p>

                        <div className="relative mb-4">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                placeholder="Search student by name or CB number..."
                                className="w-full pl-10 pr-4 py-2 border rounded-xl"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <form onSubmit={handleAssignStudent}>
                            <div className="max-h-60 overflow-y-auto border border-gray-100 rounded-xl mb-6">
                                {filteredStudents.length > 0 ? (
                                    filteredStudents.map(student => (
                                        <label key={student._id} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-0">
                                            <input
                                                type="radio"
                                                name="student"
                                                value={student._id}
                                                onChange={(e) => setSelectedStudentId(e.target.value)}
                                                className="w-4 h-4 text-blue-600"
                                            />
                                            <div>
                                                <p className="font-medium text-gray-900">{student.first_name} {student.last_name}</p>
                                                <p className="text-xs text-gray-500">{student.cb_number} • {student.status}</p>
                                            </div>
                                            {student.academic_mentor && (
                                                <span className="ml-auto text-[10px] bg-amber-50 text-amber-600 px-2 py-1 rounded">Has Mentor</span>
                                            )}
                                        </label>
                                    ))
                                ) : (
                                    <p className="p-4 text-center text-gray-400">No eligible students found</p>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <button type="button" onClick={() => setShowAssignModal(false)} className="flex-1 py-3 bg-gray-100 rounded-xl">Cancel</button>
                                <button type="submit" disabled={!selectedStudentId} className="flex-1 py-3 bg-blue-600 text-white rounded-xl disabled:opacity-50">Assign</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
