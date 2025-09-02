import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, updateDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { kmFinal } = req.body;

  try {
    // Buscar o registro para pegar o vanId
    const registroDoc = await getDoc(doc(db, 'registros', id as string));
    if (!registroDoc.exists()) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }
    
    const registroData = registroDoc.data();
    const userTipo = registroData.userTipo || 'motorista';
    
    // Validar KM final apenas para motorista
    if (userTipo === 'motorista') {
      if (!kmFinal) {
        return res.status(400).json({ error: 'KM final é obrigatório para motorista' });
      }
      if (kmFinal < registroData.abertura.kmInicial) {
        return res.status(400).json({ error: `KM final deve ser maior ou igual a ${registroData.abertura.kmInicial}` });
      }
    }
    
    // Copiloto pode fechar livremente agora
    
    // Atualizar o fechamento do registro
    const updateData: any = {
      fechamento: {
        dataHora: new Date().toISOString(),
        diarioBordo: req.body.diarioBordo || null
      }
    };
    
    // Adicionar KM final apenas para motorista
    if (userTipo === 'motorista' && kmFinal) {
      updateData.fechamento.kmFinal = kmFinal;
    }
    
    await updateDoc(doc(db, 'registros', id as string), updateData);
    
    // Atualizar o KM atual da van (apenas para motorista)
    if (userTipo === 'motorista' && registroData.vanId && kmFinal) {
      await updateDoc(doc(db, 'vans', registroData.vanId), {
        kmAtual: kmFinal
      });
    }

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Erro ao atualizar registro:', error);
    res.status(400).json({ error: error.message || 'Failed to update record' });
  }
}