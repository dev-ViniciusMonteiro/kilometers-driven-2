import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'PUT') {
    const { id, kmInicial, kmFinal, dataAbertura, dataFechamento, diarioBordo } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID é obrigatório' });
    }

    try {
      const updateData: any = {};

      if (kmInicial !== null && kmInicial !== undefined) {
        updateData['abertura.kmInicial'] = kmInicial;
      }

      if (dataAbertura) {
        updateData['abertura.dataHora'] = dataAbertura;
      }

      if (kmFinal !== null && kmFinal !== undefined) {
        updateData['fechamento.kmFinal'] = kmFinal;
      }

      if (dataFechamento) {
        updateData['fechamento.dataHora'] = dataFechamento;
      }

      if (diarioBordo !== undefined) {
        updateData['fechamento.diarioBordo'] = diarioBordo;
      }

      await updateDoc(doc(db, 'registros', id), updateData);

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Erro ao atualizar registro:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  } else if (req.method === 'DELETE') {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID é obrigatório' });
    }

    try {
      await deleteDoc(doc(db, 'registros', id));
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Erro ao deletar registro:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}