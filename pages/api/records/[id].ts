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
    
    // Validar KM final
    if (kmFinal < registroData.abertura.kmInicial) {
      return res.status(400).json({ error: `KM final deve ser maior ou igual a ${registroData.abertura.kmInicial}` });
    }
    
    // Verificar se copiloto pode fechar (só se motorista fechou)
    if (registroData.userTipo === 'copiloto') {
      const registrosSnapshot = await getDocs(collection(db, 'registros'));
      const motoristaFechado = registrosSnapshot.docs.find(doc => {
        const registro = doc.data();
        const isMotorista = !registro.userTipo || registro.userTipo === 'motorista';
        return registro.vanId === registroData.vanId && 
               registro.fechamento && 
               isMotorista;
      });
      
      if (!motoristaFechado) {
        return res.status(400).json({ error: 'Aguarde o motorista finalizar primeiro' });
      }
    }
    
    // Atualizar o fechamento do registro
    await updateDoc(doc(db, 'registros', id as string), {
      fechamento: {
        kmFinal,
        dataHora: new Date().toISOString(),
        diarioBordo: req.body.diarioBordo || null
      }
    });
    
    // Atualizar o KM atual da van
    if (registroData.vanId) {
      await updateDoc(doc(db, 'vans', registroData.vanId), {
        kmAtual: kmFinal
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar registro:', error);
    res.status(400).json({ error: error.message || 'Failed to update record' });
  }
}