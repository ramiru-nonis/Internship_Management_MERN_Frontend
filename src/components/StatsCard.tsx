import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: number | string;
    icon: LucideIcon;
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
    trend?: {
        value: number;
        isPositive: boolean;
    };
}

export default function StatsCard({ title, value, icon: Icon, color = 'blue', trend }: StatsCardProps) {
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-200',
        green: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-200',
        purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-200',
        orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-200',
        red: 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-200',
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {value}
                    </p>
                    {trend && (
                        <p className={`text-sm mt-2 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                        </p>
                    )}
                </div>
                <div className={`p-4 rounded-full ${colorClasses[color]}`}>
                    <Icon className="h-8 w-8" />
                </div>
            </div>
        </div>
    );
}
