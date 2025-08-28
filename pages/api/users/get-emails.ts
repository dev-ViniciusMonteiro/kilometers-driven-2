import type { NextApiRequest, NextApiResponse } from 'next';
import admin from 'firebase-admin';

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

  const { userIds } = req.body;

  try {
    console.log('Environment check:', {
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    });

    const userRecords = await admin.auth().getUsers(
      userIds.map((uid: string) => ({ uid }))
    );

    const emailMap: { [key: string]: string } = {};
    userRecords.users.forEach(user => {
      emailMap[user.uid] = user.email || 'Email não encontrado';
    });

    res.status(200).json(emailMap);
  } catch (error: any) {
    console.error('Erro ao buscar emails:', error);
    res.status(400).json({ error: 'Failed to get emails', details: error instanceof Error ? error.message : 'Unknown error' });
  }
}