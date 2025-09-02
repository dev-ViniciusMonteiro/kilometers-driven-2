import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'ID é obrigatório' });
  }

  try {
    await updateDoc(doc(db, 'vans', id), {
      ativa: false
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao desativar van:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}