
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // User is signed in, now fetch their data from Firestore
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    // Combine auth data with Firestore data
                    const userData = userDocSnap.data();
                    setUser({
                        ...currentUser, // from auth
                        ...userData,   // from firestore (overwrites displayName, etc.)
                    });
                } else {
                    // Fallback to auth data if firestore doc doesn't exist
                    setUser(currentUser);
                }
            } else {
                // User is signed out
                setUser(null);
            }
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    return { user, loading };
};

export default useAuth;
