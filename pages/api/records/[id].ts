import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { kmFinal } = req.body;

  try {
    await updateDoc(doc(db, 'registros', id as string), {
      fechamento: {
        kmFinal,
        dataHora: new Date().toISOString()
      }
    });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Failed to update record' });
  }
}