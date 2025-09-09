import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { id, origem, destino } = req.body;

    if (!id || !origem || !destino) {
      return res.status(400).json({ error: 'ID, origem e destino são obrigatórios' });
    }

    const rotaRef = doc(db, 'rotas', id);
    await updateDoc(rotaRef, {
      origem,
      destino
    });

    res.status(200).json({ message: 'Rota atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar rota:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}