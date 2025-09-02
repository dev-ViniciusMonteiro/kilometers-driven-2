import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, placa } = req.body;

  if (!id || !placa) {
    return res.status(400).json({ error: 'ID e placa são obrigatórios' });
  }

  try {
    await updateDoc(doc(db, 'vans', id), {
      placa: placa
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar placa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}