import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'ID da van é obrigatório' });
  }

  try {
    // Desativar van ao invés de deletar
    await updateDoc(doc(db, 'vans', id), {
      ativa: false,
      desativadaEm: new Date().toISOString()
    });

    res.status(200).json({ message: 'Van desativada com sucesso' });
  } catch (error: any) {
    console.error('Erro ao desativar van:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}