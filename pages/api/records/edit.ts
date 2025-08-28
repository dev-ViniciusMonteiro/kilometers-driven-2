import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'PUT') {
    // Editar registro
    const { id, kmInicial, kmFinal } = req.body;

    try {
      // Buscar registro atual
      const registroDoc = await getDoc(doc(db, 'registros', id));
      const registroData = registroDoc.data();
      
      if (!registroData) {
        return res.status(404).json({ error: 'Registro não encontrado' });
      }

      const updateData: any = {};
      let novoKmInicial = registroData.abertura?.kmInicial;
      let novoKmFinal = registroData.fechamento?.kmFinal;
      
      if (kmInicial !== undefined) {
        novoKmInicial = parseInt(kmInicial);
        
        // Validar KM inicial com van
        const vanDoc = await getDoc(doc(db, 'vans', registroData.vanId));
        const vanData = vanDoc.data();
        
        if (vanData && novoKmInicial < vanData.kmAtual) {
          return res.status(400).json({ 
            error: `KM inicial deve ser maior ou igual ao KM atual da van (${vanData.kmAtual})` 
          });
        }
        
        updateData['abertura.kmInicial'] = novoKmInicial;
      }
      
      if (kmFinal !== undefined) {
        if (kmFinal === null) {
          // Remover fechamento
          updateData['fechamento'] = null;
          novoKmFinal = null;
        } else {
          novoKmFinal = parseInt(kmFinal);
          // Validar KM final
          if (novoKmFinal < novoKmInicial) {
            return res.status(400).json({ error: `KM final deve ser maior ou igual a ${novoKmInicial}` });
          }
          updateData['fechamento.kmFinal'] = novoKmFinal;
          updateData['fechamento.dataHora'] = new Date().toISOString();
        }
      }

      await updateDoc(doc(db, 'registros', id), updateData);
      
      // Atualizar KM da van apenas se o novo KM final for igual ao KM atual da van
      if (novoKmFinal && registroData.vanId) {
        const vanDoc = await getDoc(doc(db, 'vans', registroData.vanId));
        const vanData = vanDoc.data();
        
        if (vanData && novoKmFinal === vanData.kmAtual) {
          // Só atualiza se o KM final editado for igual ao KM atual da van
          await updateDoc(doc(db, 'vans', registroData.vanId), {
            kmAtual: novoKmFinal
          });
        } else if (vanData && novoKmFinal !== vanData.kmAtual) {
          return res.status(400).json({ 
            error: `KM final deve ser igual ao KM atual da van (${vanData.kmAtual})` 
          });
        }
      }
      
      res.status(200).json({ message: 'Registro atualizado com sucesso' });
    } catch (error) {
      console.error('Erro ao editar registro:', error);
      res.status(500).json({ error: error.message || 'Erro ao editar registro' });
    }
  } else if (req.method === 'DELETE') {
    // Cancelar registro
    const { id } = req.body;

    try {
      await deleteDoc(doc(db, 'registros', id));
      res.status(200).json({ message: 'Registro cancelado com sucesso' });
    } catch (error) {
      console.error('Erro ao cancelar registro:', error);
      res.status(500).json({ error: 'Erro ao cancelar registro' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}