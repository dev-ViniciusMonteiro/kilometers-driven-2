import type { NextApiRequest, NextApiResponse } from 'next';
import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { userId, kmInicial } = req.body;
    
    try {
      const docRef = await addDoc(collection(db, 'registros'), {
        userId,
        abertura: {
          kmInicial,
          dataHora: new Date().toISOString()
        }
      });
      
      res.status(201).json({ id: docRef.id });
    } catch (error) {
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
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      res.status(200).json(records);
    } catch (error) {
      console.error('Erro ao buscar registros:', error);
      res.status(400).json({ error: 'Failed to fetch records' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}