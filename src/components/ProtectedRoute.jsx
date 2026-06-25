
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import SplashScreen from './SplashScreen';

// CORRECTED: This component was fundamentally broken. It should check auth state
// and then render the `children` prop if the user is authenticated.
const ProtectedRoute = ({ children }) => {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    // If authentication state is still loading, show a splash screen.
    return <SplashScreen />;
  }

  if (!user) {
    // If not loading and no user is found, redirect to the login page.
    return <Navigate to="/login" replace />;
  }

  // If the user is authenticated, render the child components that were passed in.
  // This is the key part that was missing and caused the blank page.
  return children;
};

export default ProtectedRoute;
