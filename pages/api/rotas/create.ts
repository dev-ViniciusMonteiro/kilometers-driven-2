import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { origem, destino } = req.body;

  if (!origem || !destino) {
    return res.status(400).json({ error: 'Origem e destino são obrigatórios' });
  }

  try {
    const rotaData = {
      origem: origem.trim(),
      destino: destino.trim(),
      ativa: true,
      criadaEm: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'rotas'), rotaData);
    
    res.status(201).json({ id: docRef.id, ...rotaData });
  } catch (error: any) {
    console.error('Erro ao criar rota:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}