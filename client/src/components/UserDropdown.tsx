import { useRef, useEffect } from "react";
import { Settings, LogOut, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface UserDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  user?: {
    name: string;
    email?: string;
    avatarUrl?: string;
  };
}

export function UserDropdown({ isOpen, onClose, user }: UserDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleLogout = () => {
    // TODO: Implement logout logic
    console.log("Logging out...");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
    >
      {/* User Info */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center overflow-hidden">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name || "User"}
                className="w-full h-full object-cover"
              />
            ) : (
              <svg className="w-10 h-10" viewBox="0 0 32 32" fill="none">
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
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user?.name || "Dr. Eleanor Smith"}
            </p>
            <p className="text-xs text-gray-600 truncate">
              {user?.email || "dr.smith@mindscribe.com"}
            </p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="py-2">
        <Link
          to="/settings"
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </Link>

        <Link
          to="/help"
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Help & Support</span>
        </Link>

        <div className="my-1 border-t border-gray-200"></div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
