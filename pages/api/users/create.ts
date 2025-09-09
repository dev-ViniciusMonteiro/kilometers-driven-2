import type { NextApiRequest, NextApiResponse } from 'next';
import admin from 'firebase-admin';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, nome, perfil, tipo, jornada } = req.body;

  try {
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      emailVerified: false
    });
    
    await setDoc(doc(db, 'usuarios', userRecord.uid), {
      uid: userRecord.uid,
      email: email,
      nome: nome || '',
      perfil: perfil || 'user',
      tipo: tipo || 'motorista',
      jornada: jornada || [{entrada: '08:00', saida: '17:00'}]
    });

    res.status(201).json({ uid: userRecord.uid, email: userRecord.email });
  } catch (error: any) {
    console.error('Erro ao criar usuário:', error);
    res.status(400).json({ error: 'Failed to create user' });
  }
}