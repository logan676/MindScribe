import { useState } from "react";
import { Bell } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { NotificationDropdown } from "../NotificationDropdown";
import { UserDropdown } from "../UserDropdown";

interface HeaderProps {
  user?: {
    name: string;
    email?: string;
    avatarUrl?: string;
  };
}

export function Header({ user }: HeaderProps) {
  const location = useLocation();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", path: "/" },
    { name: "Sessions", path: "/sessions" },
    { name: "Patients", path: "/patients" },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <div className="relative w-10 h-10">
                <svg
                  viewBox="0 0 40 40"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Circular gradient background */}
                  <defs>
                    <linearGradient
                      id="brainGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop
                        offset="0%"
                        style={{
                          stopColor: "var(--color-primary-500)",
                          stopOpacity: 1,
                        }}
                      />
                      <stop
                        offset="100%"
                        style={{
                          stopColor: "var(--color-primary-700)",
                          stopOpacity: 1,
                        }}
                      />
                    </linearGradient>
                  </defs>

                  {/* Background circle */}
                  <circle cx="20" cy="20" r="18" fill="url(#brainGradient)" />

                  {/* Brain outline - simplified modern design */}
                  <path
                    d="M13 16c0-1.5 1-3 2.5-3.5c0.5-1.5 2-2.5 3.5-2.5s3 1 3.5 2.5c1.5 0.5 2.5 2 2.5 3.5c0 0.8-0.2 1.5-0.6 2.1c0.4 0.6 0.6 1.3 0.6 2.1c0 1.5-1 3-2.5 3.5c-0.5 1.5-2 2.5-3.5 2.5s-3-1-3.5-2.5c-1.5-0.5-2.5-2-2.5-3.5c0-0.8 0.2-1.5 0.6-2.1c-0.4-0.6-0.6-1.3-0.6-2.1z"
                    stroke="white"
                    strokeWidth="1.5"
                    fill="none"
                    strokeLinecap="round"
                  />

                  {/* Brain waves/lines */}
                  <path
                    d="M16 18h8M16 20h8M16 22h6"
                    stroke="white"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />

                  {/* Pen/writing element */}
                  <path
                    d="M26 14l2 2M27 25l-2-2l6-6l2 2z"
                    stroke="white"
                    strokeWidth="1.5"
                    fill="white"
                    fillOpacity="0.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900 leading-tight">
                  MindScribe
                </span>
                <span className="text-xs text-gray-500 font-medium tracking-wide">
                  Clinical Notes AI
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "text-primary bg-primary-light"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                  style={
                    isActive
                      ? {
                          color: "var(--color-primary-600)",
                          backgroundColor: "var(--color-primary-50)",
                        }
                      : {}
                  }
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <Bell className="w-5 h-5" />
                {/* Notification badge */}
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Notification Dropdown */}
              <NotificationDropdown
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
              />
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center overflow-hidden">
                    <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
                      {/* Head */}
                      <circle cx="16" cy="16" r="14" fill="#FDB44B" />
                      {/* Eyes */}
                      <circle cx="12" cy="14" r="1.5" fill="#2D3748" />
                      <circle cx="20" cy="14" r="1.5" fill="#2D3748" />
                      {/* Smile */}
                      <path
                        d="M 11 18 Q 16 21 21 18"
                        stroke="#2D3748"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        fill="none"
                      />
                      {/* Hair */}
                      <path d="M 6 12 Q 8 6 16 6 Q 24 6 26 12" fill="#2D3748" />
                      {/* White coat collar */}
                      <path
                        d="M 8 24 L 10 20 L 16 22 L 22 20 L 24 24 L 28 28 L 4 28 Z"
                        fill="white"
                      />
                    </svg>
                  </div>
                )}
              </button>

              {/* User Dropdown */}
              <UserDropdown
                isOpen={isUserDropdownOpen}
                onClose={() => setIsUserDropdownOpen(false)}
                user={user}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
