import Link from 'next/link';
import { Calendar, MapPin, Briefcase, ArrowRight } from 'lucide-react';
import StatusBadge from './StatusBadge';

interface JobCardProps {
    internship: {
        _id: string;
        title: string;
        company_name: string;
        category: string;
        location: string;
        deadline: string;
        description: string;
    };
    applicationStatus?: string;
    showApplyButton?: boolean;
}

export default function JobCard({ internship, applicationStatus, showApplyButton = true }: JobCardProps) {
    const deadlineDate = new Date(internship.deadline);
    const isExpiringSoon = (deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24) < 7;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden">
            <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {internship.title}
                        </h3>
                        <p className="text-lg text-gray-600 font-medium">
                            {internship.company_name}
                        </p>
                    </div>
                    {applicationStatus && (
                        <StatusBadge status={applicationStatus} type="application" />
                    )}
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                        <Briefcase className="h-4 w-4 mr-2" />
                        <span>{internship.category}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{internship.location}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className={isExpiringSoon ? 'text-red-600 font-medium' : ''}>
                            Deadline: {deadlineDate.toLocaleDateString()}
                            {isExpiringSoon && ' (Expiring Soon!)'}
                        </span>
                    </div>
                </div>

                {/* Description */}
                <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                    {internship.description}
                </p>

                {/* Action Button */}
                {showApplyButton && (
                    <Link
                        href={`/student/internships/${internship._id}`}
                        className="inline-flex items-center justify-center w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                )}
            </div>
        </div>
    );
}
