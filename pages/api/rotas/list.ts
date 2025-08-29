import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const q = query(
      collection(db, 'rotas'), 
      where('ativa', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const rotas = querySnapshot.docs
      .map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a: any, b: any) => a.origem.localeCompare(b.origem));

    res.status(200).json(rotas);
  } catch (error: any) {
    console.error('Erro ao listar rotas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}