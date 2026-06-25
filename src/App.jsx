
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from "firebase/firestore";
import { Box, CircularProgress, Typography } from '@mui/material';

// Layouts are imported directly because they are part of the core shell
import MainLayout from './layouts/MainLayout';
import LoginPageLayout from './layouts/LoginPageLayout';
import SplashScreen from './components/SplashScreen'; // Import the custom splash screen

// Lazy load the pages
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const ItemDetails = lazy(() => import('./pages/ItemDetails'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const ActionPage = lazy(() => import('./pages/ActionPage'));

const App = () => {
  const [user, authLoading] = useAuthState(auth);
  const [userData, setUserData] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        // If userData is already loaded for the current user, don't refetch
        if (userData && userData.uid === user.uid) {
            setUserLoading(false);
            return;
        }
        try {
          const userRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            const fetchedData = { uid: user.uid, ...docSnap.data() };
            // Ensure displayName exists
            if (!fetchedData.displayName) {
              console.error("User is authenticated, but displayName is missing in Firestore!");
              setUserData(null); // Treat as an error or incomplete profile
            } else {
              setUserData(fetchedData);
            }
          } else {
            console.log("User data not found in Firestore!");
            setUserData(null); 
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserData(null);
        } finally {
            setUserLoading(false);
        }
      } else {
        setUserData(null);
        setUserLoading(false);
      }
    };

    // Only run fetchUserData if auth state is resolved
    if (!authLoading) {
      fetchUserData();
    }
  }, [user, authLoading]);

  // This effect manages the initial splash screen duration
  useEffect(() => {
    if (!authLoading && !userLoading) {
      // Give a bit of time for the UI to settle
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
      }, 500); // Adjust time as needed
      return () => clearTimeout(timer);
    }
  }, [authLoading, userLoading]);

  // Show splash screen during initial load (auth + user data)
  if (isInitialLoad) {
    return <SplashScreen />;
  }

  return (
    <Suspense fallback={<SplashScreen />}>
      <Routes>
        {/* ActionPage now also gets a loading indicator and better user handling */}
        <Route path="/action/:category/:itemId" element={<ActionPage />} />

        {/* --- Protected Routes --- */}
        {/* Render content only if user is authenticated AND userData is successfully loaded */}
        {user && userData ? (
          <Route path="/" element={<MainLayout userData={userData} />}>
            <Route index element={<Dashboard userData={userData} />} />
            <Route path="profile" element={<Profile userData={userData} />} />
            <Route path="details/:category/:id" element={<ItemDetails userData={userData} />} />
            <Route path="history" element={<HistoryPage userData={userData} />} />
            {/* Redirect any other authenticated paths to the main dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        ) : (
          /* --- Public/Authentication Routes --- */
          /* If user is not logged in, or userData is null, show login page */
          <Route path="/" element={<LoginPageLayout />}>
            <Route index element={<Login />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            {/* Redirect any other unauthenticated paths to the login page */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Route>
        )}
      </Routes>
    </Suspense>
  );
};

export default App;
