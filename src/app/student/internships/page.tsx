'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import JobCard from '@/components/JobCard';
import api from '@/lib/api';
import { Search, Filter } from 'lucide-react';

export default function InternshipsPage() {
    const router = useRouter();
    const [internships, setInternships] = useState<any[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [categories, setCategories] = useState<string[]>([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        fetchData();
    }, [selectedCategory, searchTerm]);

    const fetchData = async () => {
        try {
            const params: any = { status: 'active' };
            if (selectedCategory !== 'all') params.category = selectedCategory;
            if (searchTerm) params.search = searchTerm;

            const [internshipsRes, applicationsRes] = await Promise.all([
                api.get('/internships', { params }),
                api.get('/students/applications'),
            ]);

            setInternships(internshipsRes.data);
            setApplications(applicationsRes.data);

            // Extract unique categories
            const uniqueCategories: string[] = Array.from(new Set(internshipsRes.data.map((i: any) => i.category)));
            setCategories(uniqueCategories);
        } catch (error) {
            console.error('Error fetching internships:', error);
        } finally {
            setLoading(false);
        }
    };

    const getApplicationStatus = (internshipId: string) => {
        const application = applications.find(app => app.internship._id === internshipId);
        return application?.status;
    };

    return (
        <div className="min-h-screen bg-gray-50">


            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Browse Internships</h1>
                    <p className="text-gray-600 mt-2">Discover and apply for internship opportunities</p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by title, company, or description..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                            >
                                <option value="all">All Categories</option>
                                {categories.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Results */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading internships...</p>
                        </div>
                    </div>
                ) : internships.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600 text-lg">No internships found matching your criteria</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {internships.map(internship => (
                            <JobCard
                                key={internship._id}
                                internship={internship}
                                applicationStatus={getApplicationStatus(internship._id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
