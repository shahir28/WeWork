import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Moon, Sun, User, Save, Upload } from "lucide-react";

interface SettingsPanelProps {
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
  onClose: () => void;
}

export default function SettingsPanel({ user, onClose }: SettingsPanelProps) {
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState(user.avatar);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);

  // Check current theme
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  // Toggle dark mode
  const toggleDarkMode = (enabled: boolean) => {
    setIsDarkMode(enabled);
    if (enabled) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Handle avatar file upload
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewAvatar(result);
        setAvatar(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    // Save user preferences to localStorage for demo
    const userSettings = {
      name,
      avatar,
      theme: isDarkMode ? 'dark' : 'light'
    };
    localStorage.setItem('userSettings', JSON.stringify(userSettings));
    
    // Show success message
    const successEvent = new CustomEvent('settings-saved', {
      detail: { message: 'Settings saved successfully!' }
    });
    window.dispatchEvent(successEvent);
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>

          <div className="space-y-6">
            {/* Profile Section */}
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Profile</h3>
              
              {/* Avatar */}
              <div className="flex items-center space-x-4 mb-4">
                <div className="relative">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={previewAvatar || avatar} alt={name} />
                    <AvatarFallback>
                      <User className="w-8 h-8" />
                    </AvatarFallback>
                  </Avatar>
                  <label 
                    htmlFor="avatar-upload" 
                    className="absolute -bottom-1 -right-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1.5 cursor-pointer transition-colors"
                  >
                    <Camera className="w-3 h-3" />
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Click the camera icon to change your profile picture
                  </p>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Display Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full"
                />
              </div>
            </Card>

            {/* Appearance Section */}
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Appearance</h3>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {isDarkMode ? (
                    <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Dark Mode</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Switch between light and dark themes
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isDarkMode}
                  onCheckedChange={toggleDarkMode}
                />
              </div>
            </Card>

            {/* Audio Section */}
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Audio</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Ambient Sound Volume</Label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="50"
                    className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    onChange={(e) => {
                      const volume = parseInt(e.target.value) / 100;
                      // Dispatch event to update ambient sound volume
                      const volumeEvent = new CustomEvent('volume-change', {
                        detail: { volume }
                      });
                      window.dispatchEvent(volumeEvent);
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Notification Sounds</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Play sounds for notifications</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </Card>
          </div>

          {/* Save Button */}
          <div className="mt-6 flex space-x-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}