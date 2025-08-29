import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth } from '../lib/firebase';
import { createRecord, closeRecord, getOpenRecord } from '../lib/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState('Usuário');
  const [userTipo, setUserTipo] = useState('motorista');
  const [openRecord, setOpenRecord] = useState<any>(null);
  const [kmValue, setKmValue] = useState('');
  const [kmFinalValue, setKmFinalValue] = useState('');
  const [kmError, setKmError] = useState('');
  const [kmFinalError, setKmFinalError] = useState('');
  const [diarioBordo, setDiarioBordo] = useState('');
  const [canCloseRecord, setCanCloseRecord] = useState(false);
  const [dateValue, setDateValue] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  });
  const [loading, setLoading] = useState(false);
  const [showRecords, setShowRecords] = useState(false);
  const [userRecords, setUserRecords] = useState<any[]>([]);
  const [vans, setVans] = useState<any[]>([]);
  const [selectedVan, setSelectedVan] = useState('');
  const [rotas, setRotas] = useState<any[]>([]);
  const [selectedRota, setSelectedRota] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      
      // Buscar nome do usuário
      try {
        const userDocResponse = await fetch(`/api/users/get-user-data?uid=${user.uid}`);
        if (userDocResponse.ok) {
          const userDocData = await userDocResponse.json();
          setUserName(userDocData.nome || 'Usuário');
          setUserTipo(userDocData.tipo || 'motorista');
          
          const record = await getOpenRecord(user.uid);
          setOpenRecord(record);
          
          // Se copiloto, sempre preencher com KM atual da van
          if (userDocData.tipo === 'copiloto') {
            const vanResponse = await fetch('/api/vans/list');
            if (vanResponse.ok) {
              const vansData = await vanResponse.json();
              if (record) {
                const van = vansData.find((v: any) => v.id === (record as any).vanId);
                if (van) {
                  setKmValue(van.kmAtual.toString());
                  setKmFinalValue(van.kmAtual.toString());
                }
              }
            }
          }
        } else {
          setUserName('Usuário');
          setUserTipo('motorista');
          
          const record = await getOpenRecord(user.uid);
          setOpenRecord(record);
        }
      } catch (error) {
        console.error('Erro ao buscar registro aberto:', error);
        setUserName('Usuário');
        setUserTipo('motorista');
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (userTipo) {
      loadVans();
      loadRotas();
    }
  }, [userTipo, openRecord]);
  

  
  useEffect(() => {
    if (userTipo === 'copiloto' && openRecord) {
      const interval = setInterval(loadVans, 5000); // Atualizar a cada 5 segundos
      return () => clearInterval(interval);
    }
  }, [userTipo, openRecord]);

  const loadRotas = async () => {
    try {
      const response = await fetch('/api/rotas/list');
      const rotasData = await response.json();
      setRotas(rotasData);
    } catch (error) {
      console.error('Erro ao carregar rotas:', error);
    }
  };



  const loadVans = async () => {
    try {
      const response = await fetch('/api/vans/list');
      let vansData = await response.json();
      
      // Filtrar vans baseado no tipo de usuário
      if (userTipo === 'motorista') {
        // Para motoristas: remover vans que já têm motorista ativo
        const registrosResponse = await fetch('/api/records');
        const registros = await registrosResponse.json();
        
        const vansDisponiveis = vansData.filter((van: any) => {
          const temMotoristaAtivo = registros.some((registro: any) => {
            const isMotorista = !registro.userTipo || registro.userTipo === 'motorista';
            return registro.vanId === van.id && !registro.fechamento && isMotorista;
          });
          return !temMotoristaAtivo;
        });
        
        vansData = vansDisponiveis;
      } else if (userTipo === 'copiloto') {
        const registrosResponse = await fetch('/api/records');
        const registros = await registrosResponse.json();
        
        if (!openRecord) {
          // Para iniciar: apenas vans com motorista ativo
          const vansComMotorista = [];
          
          for (const van of (vansData as any[])) {
            const registroMotorista = registros.find((registro: any) => {
              const isMotorista = !registro.userTipo || registro.userTipo === 'motorista';
              return registro.vanId === van.id && !registro.fechamento && isMotorista;
            });
            
            if (registroMotorista) {
              // Buscar nome do motorista
              const motoristaResponse = await fetch(`/api/users/get-user-data?uid=${registroMotorista.userId}`);
              let nomeMotorista = 'Motorista';
              if (motoristaResponse.ok) {
                const motoristaData = await motoristaResponse.json();
                nomeMotorista = motoristaData.nome || 'Motorista';
              }
              
              vansComMotorista.push({
                ...van,
                nomeMotorista,
                origem: registroMotorista.origem || '',
                destino: registroMotorista.destino || ''
              });
            }
          }
          vansData = vansComMotorista;
        } else {
          // Para fechar: verificar se van do registro aberto ainda tem motorista ativo
          const vanAindaAtiva = registros.some((registro: any) => {
            const isMotorista = !registro.userTipo || registro.userTipo === 'motorista';
            return registro.vanId === (openRecord as any).vanId && !registro.fechamento && isMotorista;
          });
          
          if (vanAindaAtiva) {
            // Motorista ainda ativo na van do copiloto - não pode fechar
            vansData = [];
            setCanCloseRecord(false);
          } else {
            // Motorista fechou - copiloto pode fechar
            vansData = [{ id: (openRecord as any).vanId, placa: (openRecord as any).placa }];
            setCanCloseRecord(true);
          }
        }
      }
      
      setVans(vansData);
      

      
      // Para motoristas, sempre podem fechar se têm registro aberto
      if (userTipo === 'motorista' && openRecord) {
        setCanCloseRecord(true);
      } else if (userTipo === 'motorista') {
        setCanCloseRecord(false);
      }
    } catch (error) {
      console.error('Erro ao carregar vans:', error);
    }
  };

  const handleOpen = async () => {
    if (!kmValue || !user || !selectedVan) {
      alert('Selecione uma van e informe o KM');
      return;
    }
    
    // Para motorista, rota é obrigatória
    if (userTipo === 'motorista' && !selectedRota) {
      alert('Selecione uma rota');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.uid, 
          vanId: selectedVan, 
          kmInicial: parseInt(kmValue),
          rotaId: userTipo === 'motorista' ? selectedRota : null,
          origem: userTipo === 'copiloto' ? selectedRota.split(' → ')[0] : null,
          destino: userTipo === 'copiloto' ? selectedRota.split(' → ')[1] : null
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        const van = vans.find(v => v.id === selectedVan);
        setOpenRecord({ 
          id: result.id, 
          userId: user.uid, 
          vanId: selectedVan,
          placa: van?.placa,
          abertura: { kmInicial: parseInt(kmValue) } 
        });
        
        // Habilitar fechamento para motoristas após abrir
        if (userTipo === 'motorista') {
          setCanCloseRecord(true);
        }
        setKmValue('');
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        setDateValue(`${year}-${month}-${day}T${hours}:${minutes}`);
        loadVans(); // Atualizar lista de vans
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao abrir registro');
      }
    } catch (error) {
      alert('Erro ao abrir registro');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    if (!kmFinalValue || !openRecord) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/records/${(openRecord as any).id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          kmFinal: parseInt(kmFinalValue),
          diarioBordo: diarioBordo
        })
      });
      
      if (response.ok) {
        setOpenRecord(null);
        setKmValue('');
        setKmFinalValue('');
        setKmError('');
        setKmFinalError('');
        setDiarioBordo('');
        setCanCloseRecord(false);
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        setDateValue(`${year}-${month}-${day}T${hours}:${minutes}`);
        loadVans(); // Atualizar lista de vans
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao fechar registro');
      }
    } catch (error) {
      alert('Erro ao fechar registro');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    window.location.reload();
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
        <h1>🚐 Olá, {userName}!</h1>
        <div className="header-buttons">
          <button onClick={() => router.push('/help')} className="btn-secondary">📚 Ajuda</button>
          <button onClick={loadUserRecords} className="btn-secondary">📋 Meus Registros</button>
          <button onClick={refreshData} className="btn-primary">🔄 Atualizar</button>
          <button onClick={logout} className="btn-secondary">🚪 Sair</button>
        </div>
      </header>

      <div className="cards-container">
        <div className={`action-card abertura ${openRecord ? 'disabled' : ''}`}>
          <h2 className="action-title green">ABERTURA</h2>
          <p className="instruction">{userTipo === 'copiloto' ? 'Selecione a van para bater o ponto de entrada (monitora)' : 'Selecione a van e confirme o KM para iniciar sua viagem'}</p>
          
          <select
            value={selectedVan}
            onChange={(e) => {
              setSelectedVan(e.target.value);
              const van = vans.find(v => v.id === e.target.value);
              if (van) {
                const kmAtual = van.kmAtual.toString();
                setKmValue(kmAtual);
                if (userTipo === 'copiloto') {
                  setKmFinalValue(kmAtual);
                  // Para monitora, mostrar a rota do motorista
                  if (van.origem && van.destino) {
                    setSelectedRota(`${van.origem} → ${van.destino}`);
                  }
                }
              }
            }}
            className="input large"
            disabled={openRecord}
          >
            <option value="">
              {userTipo === 'copiloto' && vans.length === 0 ? '⚠️ Nenhum motorista ativo' : 
               userTipo === 'motorista' && vans.length === 0 ? '⚠️ Todas as vans ocupadas' : 
               '🚐 Selecione uma van'}
            </option>
            {vans.map((van: any) => (
              <option key={van.id} value={van.id}>
                {van.placa} - KM: {van.kmAtual}{van.nomeMotorista ? ` - ${van.nomeMotorista}` : ''}
              </option>
            ))}
          </select>
          
          {userTipo === 'motorista' ? (
            <select
              value={selectedRota}
              onChange={(e) => setSelectedRota(e.target.value)}
              className="input large"
              disabled={openRecord}
            >
              <option value="">🗺️ Selecione a rota</option>
              {rotas.map((rota: any) => (
                <option key={rota.id} value={rota.id}>
                  {rota.origem} → {rota.destino}
                </option>
              ))}
            </select>
          ) : (
            <div className="rota-display">
              <label>Origem → Destino:</label>
              <input
                type="text"
                value={selectedRota || 'Aguardando seleção da van...'}
                readOnly
                className="input large"
                placeholder="Rota será exibida após selecionar van"
              />
            </div>
          )}
          
          <div className="km-display">
            <label>KM Inicial:</label>
            <input
              type="number"
              value={openRecord ? (openRecord as any).abertura.kmInicial : kmValue}
              onChange={(e) => {
                const value = e.target.value;
                setKmValue(value);
                
                if (!openRecord && selectedVan && value) {
                  const van = vans.find(v => v.id === selectedVan);
                  if (van && parseInt(value) < van.kmAtual) {
                    setKmError(`❌ KM deve ser maior ou igual a ${van.kmAtual}`);
                  } else {
                    setKmError('');
                  }
                }
              }}
              className={`input large km-input ${kmError ? 'error-input' : ''}`}
              placeholder={userTipo === 'copiloto' ? 'KM automático da van (monitora)' : 'Digite o KM atual'}
              readOnly={userTipo === 'copiloto'}
              disabled={openRecord}
            />
            {kmError && <div className="error-message">{kmError}</div>}
          </div>
          
          <div className="date-display">
            <label>Data/Hora:</label>
            <input
              type="text"
              value={new Date().toLocaleString('pt-BR')}
              readOnly
              className="input large"
            />
          </div>
          
          <button 
            onClick={handleOpen} 
            disabled={loading || !kmValue || !selectedVan || (userTipo === 'motorista' && !selectedRota) || openRecord || !!kmError} 
            className={`btn-action ${openRecord ? 'btn-completed' : 'btn-green'}`}
          >
            {openRecord ? '✅ VIAGEM INICIADA' : (loading ? '⏳ Abrindo...' : (userTipo === 'copiloto' ? '✅ BATER PONTO ENTRADA (MONITORA)' : '✅ INICIAR VIAGEM'))}
          </button>
        </div>

        <div className={`action-card fechamento ${!openRecord ? 'disabled' : ''}`}>
          <h2 className="action-title red">FECHAMENTO</h2>
          <p className="instruction">{userTipo === 'copiloto' ? 'Bater o ponto de saída (monitora)' : 'Informe o KM final para encerrar sua viagem'}</p>
          
          {openRecord && (
            <div className="trip-info">
              <div className="info-item">
                <span className="label">Van:</span>
                <span className="value">{(openRecord as any).placa}</span>
              </div>
              <div className="info-item">
                <span className="label">KM Inicial:</span>
                <span className="value">{(openRecord as any).abertura.kmInicial}</span>
              </div>
            </div>
          )}
          
          <div className="km-display">
            <label>KM Final:</label>
            <input
              type="number"
              value={openRecord ? kmFinalValue : ''}
              onChange={(e) => {
                if (userTipo === 'copiloto') return;
                
                const value = e.target.value;
                setKmFinalValue(value);
                
                if (openRecord && value) {
                  if (parseInt(value) < (openRecord as any).abertura.kmInicial) {
                    setKmFinalError(`❌ KM final deve ser maior ou igual a ${(openRecord as any).abertura.kmInicial}`);
                  } else {
                    setKmFinalError('');
                  }
                }
              }}
              className={`input large km-input ${kmFinalError ? 'error-input' : ''}`}
              placeholder={openRecord ? (userTipo === 'copiloto' ? 'KM automático da van (monitora)' : 'Digite o KM final') : 'Inicie uma viagem primeiro'}
              min={openRecord ? (openRecord as any).abertura.kmInicial : undefined}
              readOnly={userTipo === 'copiloto'}
              disabled={!openRecord}
            />
            {kmFinalError && <div className="error-message">{kmFinalError}</div>}
          </div>
          
          <div className="diario-display">
            <label>Diário de Bordo:</label>
            <textarea
              value={diarioBordo}
              onChange={(e) => setDiarioBordo(e.target.value.slice(0, 100))}
              placeholder="Observações da viagem (opcional - máx. 100 caracteres)"
              className="textarea large"
              maxLength={100}
              rows={2}
            />
            <small>{diarioBordo.length}/100 caracteres</small>
          </div>
          
          <div className="date-display">
            <label>Data/Hora:</label>
            <input
              type="text"
              value={new Date().toLocaleString('pt-BR')}
              readOnly
              className="input large"
            />
          </div>
          
          <button 
            onClick={handleClose} 
            disabled={loading || !kmFinalValue || !openRecord || !!kmFinalError || !canCloseRecord} 
            className="btn-action btn-red"
          >
            {!openRecord ? '🔒 INICIE UMA VIAGEM PRIMEIRO' : (loading ? '⏳ Fechando...' : (!canCloseRecord ? '⚠️ AGUARDE MOTORISTA FINALIZAR TRAJETO' : (userTipo === 'copiloto' ? '🏁 BATER PONTO SAÍDA (MONITORA)' : '🏁 FINALIZAR VIAGEM')))}
          </button>
        </div>
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
                    <th>Van</th>
                    <th>KM Inicial</th>
                    <th>Data Abertura</th>
                    <th>KM Final</th>
                    <th>Data Fechamento</th>
                    <th>Total KM</th>
                  </tr>
                </thead>
                <tbody>
                  {userRecords && userRecords.length > 0 ? userRecords.map((record: any) => {
                    const totalKm = record.fechamento?.kmFinal && record.abertura?.kmInicial 
                      ? record.fechamento.kmFinal - record.abertura.kmInicial 
                      : null;
                    
                    return (
                      <tr key={record.id}>
                        <td>{record.placa || 'N/A'}</td>
                        <td>{record.abertura?.kmInicial}</td>
                        <td>{record.abertura?.dataHora ? new Date(record.abertura.dataHora).toLocaleString('pt-BR') : ''}</td>
                        <td>{record.fechamento?.kmFinal || 'Em aberto'}</td>
                        <td>{record.fechamento?.dataHora ? new Date(record.fechamento.dataHora).toLocaleString('pt-BR') : 'Em aberto'}</td>
                        <td>{totalKm ? `${totalKm} km` : '-'}</td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={6} style={{textAlign: 'center'}}>Nenhum registro encontrado</td>
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