import { useState } from "react";
import { Link } from "react-router-dom";
import { User, Shield, Plug, FileText, Palette } from "lucide-react";
import { useTheme, themes, type ThemeType } from "../contexts/ThemeContext";

type SettingsTab =
  | "account"
  | "appearance"
  | "compliance"
  | "integrations"
  | "templates";

export function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  // Mock user data - replace with actual user data from context/API
  const user = {
    name: "Dr. Evelyn Reed",
    title: "Clinical Psychologist",
    email: "evelyn.reed@clinic.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Evelyn",
    passwordLastChanged: "Jan 12, 2024",
    plan: "Pro Plan",
    renewalDate: "December 31, 2024",
  };

  const [formData, setFormData] = useState({
    fullName: user.name,
    professionalTitle: user.title,
    email: user.email,
  });

  const { theme, setTheme } = useTheme();

  const tabs = [
    { id: "account" as SettingsTab, label: "Account", icon: User },
    { id: "appearance" as SettingsTab, label: "Appearance", icon: Palette },
    { id: "compliance" as SettingsTab, label: "Compliance", icon: Shield },
    { id: "integrations" as SettingsTab, label: "Integrations", icon: Plug },
    { id: "templates" as SettingsTab, label: "Templates", icon: FileText },
  ];

  const handleSaveChanges = () => {
    // TODO: Implement save changes API call
    console.log("Saving changes:", formData);
  };

  const handleChangePassword = () => {
    // TODO: Implement change password functionality
    console.log("Change password clicked");
  };

  const handleDeleteAccount = () => {
    // TODO: Implement delete account with confirmation
    if (
      confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      console.log("Delete account confirmed");
    }
  };

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <div
        className="w-64 bg-white rounded-lg shadow-sm p-6 flex flex-col"
        style={{ height: "fit-content" }}
      >
        {/* User Profile Card */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-6">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-12 h-12 rounded-full"
            />
            <div>
              <h3 className="font-semibold text-gray-900">{user.name}</h3>
              <p className="text-sm text-gray-600">{user.title}</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* View Profile Button */}
        <button className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors">
          View Profile
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {activeTab === "account" && (
          <div>
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Account Settings
              </h1>
              <p className="text-gray-600">
                Manage your profile, password, and security settings.
              </p>
            </div>

            {/* Profile Information Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Profile Information
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Professional Title
                    </label>
                    <input
                      type="text"
                      value={formData.professionalTitle}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          professionalTitle: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() =>
                    setFormData({
                      fullName: user.name,
                      professionalTitle: user.title,
                      email: user.email,
                    })
                  }
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveChanges}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>

            {/* Password & Security Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Password & Security
              </h2>

              <div className="space-y-6">
                {/* Password */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Password</h3>
                    <p className="text-sm text-gray-600">
                      Last changed on {user.passwordLastChanged}
                    </p>
                  </div>
                  <button
                    onClick={handleChangePassword}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Change Password
                  </button>
                </div>

                {/* Two-Factor Authentication */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Two-Factor Authentication (2FA)
                    </h3>
                    <p className="text-sm text-gray-600">
                      Add an extra layer of security to your account.
                    </p>
                  </div>
                  <button
                    onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      twoFactorEnabled ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        twoFactorEnabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Subscription Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Subscription
              </h2>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{user.plan}</h3>
                  <p className="text-sm text-gray-600">
                    Your plan renews on {user.renewalDate}.
                  </p>
                </div>
                <Link
                  to="/billing"
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                >
                  Manage Billing
                </Link>
              </div>
            </div>

            {/* Danger Zone Section */}
            <div className="bg-white rounded-lg shadow-sm border-2 border-red-200 p-6">
              <h2 className="text-xl font-semibold text-red-600 mb-6">
                Danger Zone
              </h2>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Delete Account</h3>
                  <p className="text-sm text-gray-600">
                    Permanently delete your account and all associated data.
                  </p>
                </div>
                <button
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "appearance" && (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Appearance Settings
              </h1>
              <p className="text-gray-600">
                Customize the look and feel of your workspace.
              </p>
            </div>

            {/* Theme Selection */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Choose Your Theme
              </h2>
              <p className="text-gray-600 mb-6">
                Select a color theme that matches your preference and working
                style.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(Object.keys(themes) as ThemeType[]).map((themeKey) => {
                  const themeData = themes[themeKey];
                  const isSelected = theme === themeKey;

                  return (
                    <button
                      key={themeKey}
                      onClick={() => setTheme(themeKey)}
                      className={`relative p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                        isSelected
                          ? "border-gray-200"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      style={
                        isSelected
                          ? {
                              borderColor: themeData.colors[500],
                              backgroundColor: themeData.colors[50],
                            }
                          : {}
                      }
                    >
                      {/* Selected Badge */}
                      {isSelected && (
                        <div
                          className="absolute top-2 right-2 text-white rounded-full p-1"
                          style={{ backgroundColor: themeData.colors[500] }}
                        >
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}

                      {/* Theme Preview */}
                      <div className="mb-3">
                        <div className="h-20 rounded-md overflow-hidden flex">
                          <div
                            className="flex-1"
                            style={{ backgroundColor: themeData.colors[50] }}
                          />
                          <div
                            className="flex-1"
                            style={{ backgroundColor: themeData.colors[100] }}
                          />
                          <div
                            className="flex-1"
                            style={{ backgroundColor: themeData.colors[500] }}
                          />
                          <div
                            className="flex-1"
                            style={{ backgroundColor: themeData.colors[600] }}
                          />
                          <div
                            className="flex-1"
                            style={{ backgroundColor: themeData.colors[700] }}
                          />
                        </div>
                      </div>

                      {/* Theme Info */}
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {themeData.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {themeData.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === "compliance" && (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Compliance Settings
              </h1>
              <p className="text-gray-600">
                Manage HIPAA compliance and audit settings.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                Compliance settings will be available soon.
              </p>
            </div>
          </div>
        )}

        {activeTab === "integrations" && (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Integrations
              </h1>
              <p className="text-gray-600">
                Connect with third-party services and APIs.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <Plug className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                Integration settings will be available soon.
              </p>
            </div>
          </div>
        )}

        {activeTab === "templates" && (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Templates
              </h1>
              <p className="text-gray-600">
                Manage your clinical note templates and formats.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                Template management will be available soon.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
