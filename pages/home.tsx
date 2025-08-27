import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth } from '../lib/firebase';
import { createRecord, closeRecord, getOpenRecord } from '../lib/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [openRecord, setOpenRecord] = useState<any>(null);
  const [kmValue, setKmValue] = useState('');
  const [dateValue, setDateValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRecords, setShowRecords] = useState(false);
  const [userRecords, setUserRecords] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      try {
        const record = await getOpenRecord(user.uid);
        setOpenRecord(record);
      } catch (error) {
        console.error('Erro ao buscar registro aberto:', error);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleOpen = async () => {
    if (!kmValue || !user) return;
    
    setLoading(true);
    try {
      const selectedDate = dateValue || new Date().toISOString();
      const record = await createRecord(user.uid, parseInt(kmValue), selectedDate);
      setOpenRecord({ id: record.id, userId: user.uid, abertura: { kmInicial: parseInt(kmValue) } });
      setKmValue('');
      setDateValue('');
    } catch (error) {
      alert('Erro ao abrir registro');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    if (!kmValue || !openRecord) return;
    
    setLoading(true);
    try {
      const selectedDate = dateValue || new Date().toISOString();
      await closeRecord(openRecord.id, parseInt(kmValue), selectedDate);
      setOpenRecord(null);
      setKmValue('');
      setDateValue('');
    } catch (error) {
      alert('Erro ao fechar registro');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    auth.signOut();
    router.push('/login');
  };

  const loadUserRecords = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/records?userId=${user.uid}`);
      const records = await response.json();
      setUserRecords(Array.isArray(records) ? records : []);
      setShowRecords(true);
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
      setUserRecords([]);
      setShowRecords(true);
    }
  };

  if (!user) return <div>Carregando...</div>;

  return (
    <div className="home-container">
      <header className="header">
        <h1>Sistema de Quilometragem</h1>
        <div className="header-buttons">
          <button onClick={loadUserRecords} className="btn-secondary">Meus Registros</button>
          <button onClick={logout} className="btn-secondary">Sair</button>
        </div>
      </header>

      <div className="status-card">
        <h2>Status: {openRecord ? 'Registro aberto' : 'Nenhum registro aberto'}</h2>
        
        {openRecord && (
          <p>KM Inicial: {openRecord.abertura.kmInicial}</p>
        )}
        
        <input
          type="number"
          value={kmValue}
          onChange={(e) => setKmValue(e.target.value)}
          placeholder={openRecord ? 'KM Final' : 'KM Inicial'}
          className="input"
        />
        
        <input
          type="datetime-local"
          value={dateValue}
          onChange={(e) => setDateValue(e.target.value)}
          className="input"
          title="Deixe vazio para usar data/hora atual"
        />
        
        {openRecord ? (
          <button onClick={handleClose} disabled={loading || !kmValue} className="btn-danger">
            {loading ? 'Fechando...' : 'Fechar'}
          </button>
        ) : (
          <button onClick={handleOpen} disabled={loading || !kmValue} className="btn-primary">
            {loading ? 'Abrindo...' : 'Abrir'}
          </button>
        )}
      </div>
      
      {showRecords && (
        <div className="records-modal">
          <div className="records-modal-content">
            <div className="records-header">
              <h2>Meus Registros</h2>
              <button onClick={() => setShowRecords(false)} className="btn-secondary">Fechar</button>
            </div>
            
            <div className="records-table">
              <table>
                <thead>
                  <tr>
                    <th>KM Inicial</th>
                    <th>Data Abertura</th>
                    <th>KM Final</th>
                    <th>Data Fechamento</th>
                    <th>Total KM</th>
                  </tr>
                </thead>
                <tbody>
                  {userRecords && userRecords.length > 0 ? userRecords.map(record => {
                    const totalKm = record.fechamento?.kmFinal && record.abertura?.kmInicial 
                      ? record.fechamento.kmFinal - record.abertura.kmInicial 
                      : null;
                    
                    return (
                      <tr key={record.id}>
                        <td>{record.abertura?.kmInicial}</td>
                        <td>{record.abertura?.dataHora ? new Date(record.abertura.dataHora).toLocaleString() : ''}</td>
                        <td>{record.fechamento?.kmFinal || 'Em aberto'}</td>
                        <td>{record.fechamento?.dataHora ? new Date(record.fechamento.dataHora).toLocaleString() : 'Em aberto'}</td>
                        <td>{totalKm ? `${totalKm} km` : '-'}</td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={5} style={{textAlign: 'center'}}>Nenhum registro encontrado</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}