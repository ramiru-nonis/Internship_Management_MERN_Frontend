'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    Briefcase,
    FileText,
    User,
    LogOut,
    Menu,
    X,
    Users,
    ClipboardList,
    Bell,
    Check
} from 'lucide-react';
import api from '@/lib/api';
import { ThemeToggle } from './ThemeToggle';

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const [placementStatus, setPlacementStatus] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('placementStatus') === 'true';
        }
        return false;
    });

    const hiddenPaths = ['/', '/login', '/register'];

    useEffect(() => {
        if (hiddenPaths.includes(pathname) || pathname.startsWith('/verify-logbook')) return;

        if (typeof window !== 'undefined') {
            const userData = localStorage.getItem('user');
            if (userData) {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
                fetchNotifications();
                if (parsedUser.role === 'student') checkPlacement();
            }
        }
    }, [pathname]);

    const checkPlacement = async () => {
        try {
            await api.get('/placement');
            setPlacementStatus(true);
            localStorage.setItem('placementStatus', 'true');
        } catch (error) {
            setPlacementStatus(false);
            localStorage.setItem('placementStatus', 'false');
        }
    };

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data);
            setUnreadCount(res.data.filter((n: any) => !n.read).length);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(notifications.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push('/login');
        }
    };

    if (hiddenPaths.includes(pathname)) return null;
    if (!user) return null;

    const studentLinks = [
        { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/student/internships', label: 'Browse Jobs', icon: Briefcase },
        { href: '/student/applications', label: 'My Applications', icon: FileText },
        ...(placementStatus ? [
            { href: '/student/logbook', label: 'Logbook', icon: FileText },
            { href: '/student/final-submission', label: 'Final Submission', icon: Check }
        ] : []),
        { href: '/student/placement', label: 'Placement Form', icon: ClipboardList },
        { href: '/student/profile', label: 'Profile', icon: User },
    ];

    const coordinatorLinks = [
        { href: '/coordinator/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/coordinator/students', label: 'Students', icon: Users },
        { href: '/coordinator/jobs', label: 'Job Posts', icon: Briefcase },
        { href: '/coordinator/applications', label: 'Applications', icon: FileText },
        { href: '/coordinator/submissions', label: 'Submissions', icon: Check },
        { href: '/coordinator/mentors', label: 'Academic Mentors', icon: User },
    ];

    const mentorLinks = [
        { href: '/mentor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/mentor/marksheets', label: 'Marksheet Submission', icon: FileText },
    ];

    const links = user.role === 'student' ? studentLinks :
        user.role === 'academic_mentor' ? mentorLinks : coordinatorLinks;

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href={
                            user.role === 'student' ? '/student/dashboard' :
                                user.role === 'academic_mentor' ? '/mentor/dashboard' :
                                    '/coordinator/dashboard'
                        } className="flex items-center gap-3">
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xl px-4 py-2 rounded-lg shadow-sm">
                                <div className="flex flex-col items-center leading-none">
                                    <span>NextStep</span>
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-1">
                        {links.map((link) => {
                            const Icon = link.icon;
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    <Icon className="h-4 w-4 mr-2" />
                                    {link.label}
                                </Link>
                            );
                        })}

                        {/* Theme Toggle */}
                        <div className="ml-2">
                            <ThemeToggle />
                        </div>

                        {/* Notification Bell */}
                        <div className="relative ml-4">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="p-2 rounded-full text-gray-600 hover:bg-gray-100 focus:outline-none"
                            >
                                <Bell className="h-5 w-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 ring-2 ring-white text-xs text-white font-bold flex items-center justify-center">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Notification Dropdown */}
                            {showNotifications && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                                    <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                                        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                                        {unreadCount > 0 && (
                                            <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-800">
                                                Mark all read
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-96 overflow-y-auto">
                                        {notifications.length > 0 ? (
                                            notifications.map((notification) => (
                                                <div
                                                    key={notification._id}
                                                    className={`px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 ${!notification.read ? 'bg-blue-50/50' : ''}`}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <p className="text-sm text-gray-800">{notification.message}</p>
                                                        {!notification.read && (
                                                            <button onClick={() => markAsRead(notification._id)} className="text-blue-600 hover:text-blue-800 ml-2">
                                                                <Check className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {new Date(notification.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-6 text-center text-gray-500 text-sm">
                                                No notifications
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleLogout}
                            className="flex items-center px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors ml-2"
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </button>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="text-gray-700 hover:text-gray-900"
                        >
                            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-gray-200 bg-white">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <div className="flex items-center justify-between px-3 py-2">
                            <span className="text-gray-600 dark:text-gray-300">Theme</span>
                            <ThemeToggle />
                        </div>
                        {links.map((link) => {
                            const Icon = link.icon;
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center px-3 py-2 rounded-lg text-base font-medium ${isActive
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    <Icon className="h-5 w-5 mr-3" />
                                    {link.label}
                                </Link>
                            );
                        })}

                        <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-3 py-2 rounded-lg text-base font-medium text-red-600 hover:bg-red-50"
                        >
                            <LogOut className="h-5 w-5 mr-3" />
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
}
