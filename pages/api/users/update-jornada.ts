import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { uid, jornada } = req.body;

  if (!uid) {
    return res.status(400).json({ error: 'UID é obrigatório' });
  }

  if (!jornada || !Array.isArray(jornada)) {
    return res.status(400).json({ error: 'Jornada deve ser um array válido' });
  }

  try {
    await updateDoc(doc(db, 'usuarios', uid), {
      jornada: jornada
    });

    res.status(200).json({ message: 'Jornada atualizada com sucesso' });
  } catch (error: any) {
    console.error('Erro ao atualizar jornada:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}