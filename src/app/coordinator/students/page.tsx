'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';
import { Search, Filter, Mail, Phone, FileText, User } from 'lucide-react';

export default function CoordinatorStudents() {
    const router = useRouter();
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [selectedDegrees, setSelectedDegrees] = useState<string[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');

        if (!token || !user) {
            router.push('/login');
            return;
        }

        const userData = JSON.parse(user);
        if (userData.role !== 'coordinator' && userData.role !== 'admin') {
            router.push('/login');
            return;
        }

        const delayDebounceFn = setTimeout(() => {
            fetchStudents();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, selectedStatuses, selectedDegrees]);

    const fetchStudents = async () => {
        try {
            const params: any = {};
            if (selectedStatuses.length > 0) params.status = selectedStatuses.join(',');
            if (selectedDegrees.length > 0) params.degree = selectedDegrees.join(',');
            if (searchTerm) params.search = searchTerm;

            if (searchTerm) params.search = searchTerm;

            const res = await api.get('/coordinator/students', { params });
            setStudents(res.data);
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClearFilters = () => {
        setSelectedStatuses([]);
        setSelectedDegrees([]);
        setSearchTerm('');
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedStudents(students.map(s => s._id));
        } else {
            setSelectedStudents([]);
        }
    };

    const handleSelectStudent = (id: string) => {
        if (selectedStudents.includes(id)) {
            setSelectedStudents(selectedStudents.filter(sId => sId !== id));
        } else {
            setSelectedStudents([...selectedStudents, id]);
        }
    };

    const handleBulkDownload = async (downloadAll = false) => {
        if (!downloadAll && selectedStudents.length === 0) return;

        setDownloading(true);
        try {
            const payload = downloadAll ? {} : { studentIds: selectedStudents };

            const response = await api.post('/coordinator/students/download-cvs',
                payload,
                { responseType: 'blob' }
            );

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `InternHub_CVs_${Date.now()}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to download CVs. Ensure students have uploaded their CVs.');
        } finally {
            setDownloading(false);
        }
    };

    const handleViewPdf = async (url: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const pdfBlob = new Blob([blob], { type: 'application/pdf' });
            const blobUrl = window.URL.createObjectURL(pdfBlob);
            window.open(blobUrl, '_blank');
            setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
        } catch (error) {
            console.error('Error viewing PDF:', error);
            window.open(url, '_blank'); // Fallback
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading students...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6 flex flex-col h-auto md:min-h-screen shadow-sm z-10">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                        <Filter className="w-5 h-5 mr-2" />
                        Filters
                    </h2>
                    {(selectedStatuses.length > 0 || selectedDegrees.length > 0 || searchTerm) && (
                        <button
                            onClick={handleClearFilters}
                            className="text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded transition-colors"
                        >
                            Clear
                        </button>
                    )}
                </div>

                {/* Status Filter */}
                <div className="mb-8">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                        Status
                    </h3>
                    <div className="space-y-2">
                        {['non-intern', 'intern', 'Completed'].map((status) => (
                            <label key={status} className="flex items-center cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={selectedStatuses.includes(status)}
                                    onChange={() => {
                                        if (selectedStatuses.includes(status)) {
                                            setSelectedStatuses(selectedStatuses.filter(s => s !== status));
                                        } else {
                                            setSelectedStatuses([...selectedStatuses, status]);
                                        }
                                    }}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className={`ml-3 text-sm group-hover:text-blue-600 transition-colors ${selectedStatuses.includes(status) ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Degree Filter */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                        Degree
                    </h3>
                    <div className="space-y-2">
                        {['Computer Science', 'Information Technology', 'Software Engineering', 'Data Science'].map((degree) => (
                            <label key={degree} className="flex items-center cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={selectedDegrees.includes(degree)}
                                    onChange={() => {
                                        if (selectedDegrees.includes(degree)) {
                                            setSelectedDegrees(selectedDegrees.filter(d => d !== degree));
                                        } else {
                                            setSelectedDegrees([...selectedDegrees, degree]);
                                        }
                                    }}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className={`ml-3 text-sm group-hover:text-blue-600 transition-colors ${selectedDegrees.includes(degree) ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                                    {degree}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-hidden">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Students</h1>
                    <p className="text-gray-600 mt-2 dark:text-gray-400">Manage and track student progress</p>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    {/* Search Bar - Moved here */}
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or CB number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                    </div>

                    {selectedStudents.length > 0 ? (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-2 pl-4 flex items-center justify-between w-full md:w-auto gap-4">
                            <div className="text-blue-700 dark:text-blue-300 font-medium whitespace-nowrap">
                                {selectedStudents.length} selected
                            </div>
                            <button
                                onClick={() => handleBulkDownload(false)}
                                disabled={downloading}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-70 flex items-center text-sm"
                            >
                                {downloading ? 'Downloading...' : 'Download Selected'}
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => handleBulkDownload(true)}
                            disabled={downloading}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-70 flex items-center whitespace-nowrap"
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            Download All CVs
                        </button>
                    )}
                </div>

                {/* Removed the old filter bar container since it is now in sidebar/top */}

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedStudents.length === students.length && students.length > 0}
                                            onChange={handleSelectAll}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Degree</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>

                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">CV</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {students.map((student) => (
                                    <tr key={student._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                checked={selectedStudents.includes(student._id)}
                                                onChange={() => handleSelectStudent(student._id)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                                    {student.profile_picture ? (
                                                        <img
                                                            src={student.profile_picture.startsWith('http') ? student.profile_picture : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/${student.profile_picture}`}
                                                            alt=""
                                                            className="h-10 w-10 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <User className="h-6 w-6" />
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {student.first_name} {student.last_name}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">{student.cb_number}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-gray-300 flex items-center">
                                                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                                {student.user?.email}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
                                                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                                {student.contact_number}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">{student.degree}</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">{student.degree_level}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select
                                                value={student.status}
                                                onChange={async (e) => {
                                                    const newStatus = e.target.value;
                                                    try {
                                                        await api.put(`/coordinator/students/${student._id}/status`, { status: newStatus });
                                                        setStudents(students.map(s => s._id === student._id ? { ...s, status: newStatus } : s));
                                                    } catch (error: any) {
                                                        console.error('Error updating status:', error);
                                                        alert(error.response?.data?.message || 'Failed to update status');
                                                    }
                                                }}
                                                className={`px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${student.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                    student.status === 'intern' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}
                                            >
                                                <option value="non-intern">Non-Intern</option>
                                                <option value="intern">Intern</option>
                                                <option value="Completed">Completed</option>
                                            </select>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {student.cv ? (
                                                <button
                                                    onClick={() => handleViewPdf(student.cv.startsWith('http') ? student.cv : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/${student.cv}`)}
                                                    className="text-blue-600 hover:text-blue-900 flex items-center bg-transparent border-0 cursor-pointer"
                                                >
                                                    <FileText className="h-4 w-4 mr-1" />
                                                    View PDF
                                                </button>
                                            ) : (
                                                <span className="text-gray-400">No CV</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {students.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                            No students found matching your criteria
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
