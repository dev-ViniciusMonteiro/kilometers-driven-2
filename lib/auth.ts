import { auth, db } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const loginUser = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const userDoc = await getDoc(doc(db, 'usuarios', userCredential.user.uid));
  return { user: userCredential.user, profile: userDoc.data()?.perfil };
};

export const createUser = async (email: string, password: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, 'usuarios', userCredential.user.uid), {
    uid: userCredential.user.uid,
    perfil: 'user'
  });
  return userCredential.user;
};