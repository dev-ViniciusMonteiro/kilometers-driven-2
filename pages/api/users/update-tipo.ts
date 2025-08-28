import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { uid, tipo } = req.body;

  if (!uid || !tipo) {
    return res.status(400).json({ error: 'UID e tipo são obrigatórios' });
  }

  try {
    await updateDoc(doc(db, 'usuarios', uid), {
      tipo: tipo
    });

    res.status(200).json({ message: 'Tipo atualizado com sucesso' });
  } catch (error: any) {
    console.error('Erro ao atualizar tipo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}