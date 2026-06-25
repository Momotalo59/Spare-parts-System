
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { CircularProgress, Box } from '@mui/material';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, loadingAuth] = useAuthState(auth);
  const [userProfile, setUserProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        setLoadingProfile(true);
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserProfile({ uid: user.uid, ...docSnap.data() });
          } else if (user.providerData.some(p => p.providerId === 'google.com')) {
            const newUserProfile = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              role: 'user',
            };
            await setDoc(docRef, newUserProfile);
            setUserProfile(newUserProfile);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        } finally {
          setLoadingProfile(false);
        }
      } else {
        setUserProfile(null);
        setLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  const googleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error during Google Sign-In:", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email, password, firstName, lastName, employeeId) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      // Now, create the user profile in Firestore
      const userProfileData = {
        uid: newUser.uid,
        email: email,
        firstName: firstName,
        lastName: lastName,
        displayName: `${firstName} ${lastName}`,
        employeeId: employeeId,
        role: 'user', // Default role
        createdAt: new Date(),
      };
      await setDoc(doc(db, 'users', newUser.uid), userProfileData);
      setUserProfile(userProfileData); // Manually set profile for immediate use
    } catch (error) {
      console.error("Error signing up with email:", error);
      throw error; // Re-throw the error to be caught in the component
    }
  };

  const signInWithEmail = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Error signing in with email:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const value = {
    user,
    userProfile,
    loading: loadingAuth || loadingProfile,
    googleSignIn,
    signUpWithEmail, // <-- Add new function to context
    signInWithEmail, // <-- Add new function to context
    signOut,
  };

  if (loadingAuth) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Box component="span" sx={{ ml: 2, fontFamily: 'Kanit' }}>กำลังตรวจสอบสิทธิ์...</Box>
      </Box>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
