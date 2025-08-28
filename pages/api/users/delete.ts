import type { NextApiRequest, NextApiResponse } from 'next';
import admin from 'firebase-admin';
import { doc, deleteDoc } from 'firebase/firestore';
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
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { uid } = req.body;

  if (!uid) {
    return res.status(400).json({ error: 'UID é obrigatório' });
  }

  try {
    // Deletar usuário do Firebase Auth
    await admin.auth().deleteUser(uid);
    
    // Deletar documento do Firestore
    await deleteDoc(doc(db, 'usuarios', uid));

    res.status(200).json({ message: 'Usuário deletado com sucesso' });
  } catch (error: any) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}