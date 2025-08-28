import type { NextApiRequest, NextApiResponse } from 'next';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'usuarios', userCredential.user.uid));
    
    res.status(200).json({
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      profile: userDoc.data()?.perfil
    });
  } catch (error: any) {
    res.status(401).json({ error: 'Invalid credentials' });
  }
}