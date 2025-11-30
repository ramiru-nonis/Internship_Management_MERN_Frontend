interface StatusBadgeProps {
    status: string;
    type?: 'student' | 'application';
}

export default function StatusBadge({ status, type = 'student' }: StatusBadgeProps) {
    const getStatusColor = () => {
        if (type === 'student') {
            switch (status) {
                case 'Not Applied':
                    return 'bg-gray-100 text-gray-800 border-gray-300';
                case 'Applied':
                    return 'bg-blue-100 text-blue-800 border-blue-300';
                case 'Hired':
                    return 'bg-green-100 text-green-800 border-green-300';
                case 'Completed':
                    return 'bg-purple-100 text-purple-800 border-purple-300';
                default:
                    return 'bg-gray-100 text-gray-800 border-gray-300';
            }
        } else {
            // Application statuses
            switch (status) {
                case 'Applied':
                    return 'bg-blue-100 text-blue-800 border-blue-300';
                case 'Shortlisted':
                    return 'bg-yellow-100 text-yellow-800 border-yellow-300';
                case 'Contacted':
                    return 'bg-indigo-100 text-indigo-800 border-indigo-300';
                case 'Rejected':
                    return 'bg-red-100 text-red-800 border-red-300';
                case 'Sent to Company':
                    return 'bg-green-100 text-green-800 border-green-300';
                default:
                    return 'bg-gray-100 text-gray-800 border-gray-300';
            }
        }
    };

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor()}`}>
            {status}
        </span>
    );
}
