import type { NextApiRequest, NextApiResponse } from 'next';
import { collection, addDoc, query, where, getDocs, orderBy, limit, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { userId, vanId, kmInicial, rotaId, origem, destino } = req.body;
    
    try {
      const userDoc = await getDoc(doc(db, 'usuarios', userId));
      const userData = userDoc.data();
      const userTipo = userData?.tipo || 'motorista';
      
      let vanData = null;
      
      if (userTipo === 'motorista') {
        // Verificar se a van existe e pegar KM atual (apenas para motorista)
        const vanDoc = await getDoc(doc(db, 'vans', vanId));
        if (!vanDoc.exists()) {
          return res.status(400).json({ error: 'Van não encontrada' });
        }
        
        vanData = vanDoc.data();
        if (kmInicial < vanData.kmAtual) {
          return res.status(400).json({ error: `KM inicial deve ser maior ou igual a ${vanData.kmAtual}` });
        }
      }
      
      let origemFinal = '';
      let destinoFinal = '';
      let rotaIdFinal = null;
      
      if (rotaId) {
        // Motorista - buscar dados da rota
        const rotaDoc = await getDoc(doc(db, 'rotas', rotaId));
        const rotaData = rotaDoc.data();
        origemFinal = rotaData?.origem || '';
        destinoFinal = rotaData?.destino || '';
        rotaIdFinal = rotaId;
      } else if (origem && destino) {
        // Copiloto - usar origem e destino enviados
        origemFinal = origem;
        destinoFinal = destino;
      }
      
      const registroData: any = {
        userId,
        userTipo: userData?.tipo || 'motorista',
        origem: origemFinal,
        destino: destinoFinal,
        abertura: {
          dataHora: new Date().toISOString()
        }
      };

      // Adicionar dados específicos do motorista
      if (userTipo === 'motorista' && vanData) {
        registroData.vanId = vanId;
        registroData.placa = vanData.placa;
        registroData.rotaId = rotaIdFinal;
        registroData.abertura.kmInicial = kmInicial;
      }

      const docRef = await addDoc(collection(db, 'registros'), registroData);
      
      // Atualizar KM da van na abertura (apenas para motorista)
      if (userTipo === 'motorista' && vanId) {
        await updateDoc(doc(db, 'vans', vanId), {
          kmAtual: kmInicial
        });
      }
      
      res.status(201).json({ id: docRef.id });
    } catch (error: any) {
      res.status(400).json({ error: 'Failed to create record' });
    }
  } else if (req.method === 'GET') {
    const { userId, page = 1 } = req.query;
    
    try {
      let q = query(
        collection(db, 'registros')
      );
      
      if (userId) {
        q = query(
          collection(db, 'registros'),
          where('userId', '==', userId)
        );
      }
      
      const snapshot = await getDocs(q);
      const records = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      
      res.status(200).json(records);
    } catch (error: any) {
      console.error('Erro ao buscar registros:', error);
      res.status(400).json({ error: 'Failed to fetch records' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}