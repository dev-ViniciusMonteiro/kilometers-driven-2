import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { uid } = req.query;

  if (!uid) {
    return res.status(400).json({ error: 'UID é obrigatório' });
  }

  try {
    const userDoc = await getDoc(doc(db, 'usuarios', uid as string));
    
    if (!userDoc.exists()) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const userData = userDoc.data();
    res.status(200).json(userData);
  } catch (error: any) {
    console.error('Erro ao buscar dados do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}