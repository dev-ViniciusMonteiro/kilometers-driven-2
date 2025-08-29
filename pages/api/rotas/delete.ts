import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'ID da rota é obrigatório' });
  }

  try {
    await updateDoc(doc(db, 'rotas', id), {
      ativa: false,
      desativadaEm: new Date().toISOString()
    });

    res.status(200).json({ message: 'Rota desativada com sucesso' });
  } catch (error: any) {
    console.error('Erro ao desativar rota:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}