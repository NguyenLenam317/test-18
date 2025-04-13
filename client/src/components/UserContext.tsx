import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserProfile } from '@/types';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Function to get or generate a device ID
function getDeviceId(): string {
  // Try to get the device ID from local storage
  let deviceId = localStorage.getItem('ecosense_device_id');
  
  // If no device ID exists, generate a new one and store it
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('ecosense_device_id', deviceId);
  }
  
  return deviceId;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  hasSurveyCompleted: boolean;
  setHasSurveyCompleted: (value: boolean) => void;
  updateUserProfile: (profile: UserProfile) => Promise<void>;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  deviceId: string; // Add device ID to the context
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  hasSurveyCompleted: false,
  setHasSurveyCompleted: () => {},
  updateUserProfile: async () => {},
  isAuthenticated: false,
  logout: async () => {},
  deviceId: '', // Initialize with empty string
});

export const useUser = () => useContext(UserContext);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasSurveyCompleted, setHasSurveyCompleted] = useState(false);
  const [deviceId] = useState<string>(getDeviceId()); // Initialize device ID
  const { toast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Include device ID in the request headers
        const response = await fetch('/api/user/profile', {
          credentials: 'include',
          headers: {
            'x-device-id': deviceId
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          console.log('Fetched user data for device:', userData.deviceId);
          setUser(userData);
          setHasSurveyCompleted(userData.hasSurveyCompleted);
          
          // Check if the server assigned a new device ID and update if needed
          const serverDeviceId = response.headers.get('x-device-id');
          if (serverDeviceId && serverDeviceId !== deviceId) {
            console.log('Updating device ID from server:', serverDeviceId);
            localStorage.setItem('ecosense_device_id', serverDeviceId);
            // Note: We don't update the state here to avoid a re-render loop
            // The new ID will be used on the next app load
          }
        } else {
          // Create a demo user if not authenticated
          const demoUser: User = {
            id: 0,
            username: 'demo_user',
            hasSurveyCompleted: false,
            userProfile: undefined
          };
          setUser(demoUser);
          console.error('Failed to fetch user profile, status:', response.status);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Create a demo user if error
        const demoUser: User = {
          id: 0,
          username: 'demo_user',
          hasSurveyCompleted: false,
          userProfile: undefined
        };
        setUser(demoUser);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [deviceId]); // Add deviceId as a dependency

  const updateUserProfile = async (profile: UserProfile) => {
    try {
      // Include device ID in the request headers
      const response = await apiRequest('POST', '/api/user/profile', profile);
      
      if (response.ok) {
        const updatedUser = await response.json();
        setUser((prevUser: User | null) => prevUser ? { ...prevUser, userProfile: updatedUser.userProfile } : null);
        toast({
          title: 'Profile Updated',
          description: 'Your profile has been successfully updated.',
        });
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update your profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const logout = async () => {
    try {
      // Include device ID in the request headers
      await apiRequest('POST', '/api/auth/logout', {});
      setUser(null);
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        hasSurveyCompleted,
        setHasSurveyCompleted,
        updateUserProfile,
        isAuthenticated: !!user && user.id !== 0,
        logout,
        deviceId, // Provide device ID to consumers
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
