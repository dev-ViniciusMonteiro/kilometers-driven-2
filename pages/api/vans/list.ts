import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const q = query(
      collection(db, 'vans'), 
      where('ativa', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const vans = querySnapshot.docs
      .map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a: any, b: any) => a.placa.localeCompare(b.placa));

    res.status(200).json(vans);
  } catch (error: any) {
    console.error('Erro ao listar vans:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}