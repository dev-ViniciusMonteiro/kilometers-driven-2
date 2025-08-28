import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, kmAtual } = req.body;

  if (!id || kmAtual === undefined) {
    return res.status(400).json({ error: 'ID e KM são obrigatórios' });
  }

  try {
    await updateDoc(doc(db, 'vans', id), {
      kmAtual: parseInt(kmAtual)
    });

    res.status(200).json({ message: 'KM atualizado com sucesso' });
  } catch (error: any) {
    console.error('Erro ao atualizar KM:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}