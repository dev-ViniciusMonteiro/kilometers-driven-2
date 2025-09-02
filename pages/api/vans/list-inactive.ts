import type { NextApiRequest, NextApiResponse } from 'next';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const q = query(
      collection(db, 'vans'),
      where('ativa', '==', false)
    );
    
    const snapshot = await getDocs(q);
    const vans = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json(vans);
  } catch (error) {
    console.error('Erro ao buscar vans desativadas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}