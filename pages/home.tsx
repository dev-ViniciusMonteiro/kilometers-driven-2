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
  const [showRotaModal, setShowRotaModal] = useState(false);
  const [rotaSearch, setRotaSearch] = useState('');
  const [showVanModal, setShowVanModal] = useState(false);
  const [vanSearch, setVanSearch] = useState('');
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
        // Copiloto não precisa selecionar van
        vansData = [];
        setCanCloseRecord(true);
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
    if (userTipo === 'motorista') {
      if (!kmValue || !user || !selectedVan) {
        alert('Selecione uma van e informe o KM');
        return;
      }
      if (!selectedRota) {
        alert('Selecione uma rota');
        return;
      }
    } else {
      // Copiloto só precisa de rota
      if (!selectedRota) {
        alert('Selecione uma rota');
        return;
      }
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.uid, 
          vanId: userTipo === 'motorista' ? selectedVan : null, 
          kmInicial: userTipo === 'motorista' ? parseInt(kmValue) : null,
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
    if (!openRecord) return;
    if (userTipo === 'motorista' && !kmFinalValue) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/records/${(openRecord as any).id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          kmFinal: userTipo === 'motorista' ? parseInt(kmFinalValue) : null,
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
      <header className="header" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <div style={{display: 'flex', alignItems: 'center'}}>
          <img src="/logoOfi.png" alt="Logo" style={{height: '45px', marginRight: '12px'}} />
          <h1>🚐 Olá, {userName}!</h1>
        </div>
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
          
          {userTipo === 'motorista' && (
            <button 
              onClick={() => setShowVanModal(true)}
              disabled={openRecord}
              className="input large"
              style={{textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}
            >
              <span>{selectedVan ? 
                vans.find(v => v.id === selectedVan)?.placa + ' - KM: ' + vans.find(v => v.id === selectedVan)?.kmAtual :
                (vans.length === 0 ? '⚠️ Todas as vans ocupadas' : '🚐 Selecione uma van')
              }</span>
              <span>🔍</span>
            </button>
          )}
          
          <button 
            onClick={() => setShowRotaModal(true)}
            disabled={openRecord}
            className="input large"
            style={{textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}
          >
            <span>{selectedRota ? 
              (userTipo === 'motorista' ? 
                rotas.find(r => r.id === selectedRota)?.origem + ' → ' + rotas.find(r => r.id === selectedRota)?.destino :
                selectedRota
              ) : '🗺️ Selecione a rota'
            }</span>
            <span>🔍</span>
          </button>
          
          {userTipo === 'motorista' && (
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
                placeholder="Digite o KM atual"
                disabled={openRecord}
              />
              {kmError && <div className="error-message">{kmError}</div>}
            </div>
          )}
          
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
            disabled={loading || (userTipo === 'motorista' && (!kmValue || !selectedVan || !selectedRota || !!kmError)) || (userTipo === 'copiloto' && !selectedRota) || openRecord} 
            className={`btn-action ${openRecord ? 'btn-completed' : 'btn-green'}`}
          >
            {openRecord ? '✅ VIAGEM INICIADA' : (loading ? '⏳ Abrindo...' : (userTipo === 'copiloto' ? '✅ BATER PONTO ENTRADA (MONITORA)' : '✅ INICIAR VIAGEM'))}
          </button>
        </div>

        <div className={`action-card fechamento ${!openRecord ? 'disabled' : ''}`}>
          <h2 className="action-title red">FECHAMENTO</h2>
          <p className="instruction">{userTipo === 'copiloto' ? 'Bater o ponto de saída (monitora)' : 'Informe o KM final para encerrar sua viagem'}</p>
          
          {openRecord && userTipo === 'motorista' && (
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
          
          {userTipo === 'motorista' && (
            <div className="km-display">
              <label>KM Final:</label>
              <input
                type="number"
                value={openRecord ? kmFinalValue : ''}
                onChange={(e) => {
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
                placeholder={openRecord ? 'Digite o KM final' : 'Inicie uma viagem primeiro'}
                min={openRecord ? (openRecord as any).abertura.kmInicial : undefined}
                disabled={!openRecord}
              />
              {kmFinalError && <div className="error-message">{kmFinalError}</div>}
            </div>
          )}
          
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
            disabled={loading || !openRecord || (userTipo === 'motorista' && (!kmFinalValue || !!kmFinalError)) || !canCloseRecord} 
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
      
      {showRotaModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'flex-end'
        }}>
          <div style={{
            backgroundColor: 'white',
            width: '100%',
            maxHeight: '70vh',
            borderRadius: '15px 15px 0 0',
            display: 'flex',
            flexDirection: 'column',
            marginBottom: '20px'
          }}>
            <div style={{
              padding: '15px 20px',
              borderBottom: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{margin: 0}}>🔍 Buscar Rota</h2>
              <button onClick={() => setShowRotaModal(false)} className="btn-secondary">Fechar</button>
            </div>
            
            <div style={{padding: '15px 20px', flex: 1, display: 'flex', flexDirection: 'column'}}>
              <input
                type="text"
                value={rotaSearch}
                onChange={(e) => setRotaSearch(e.target.value)}
                placeholder="Digite para buscar (ex: São Paulo, Rio)"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  marginBottom: '15px',
                  fontSize: '16px'
                }}
              />
              
              <div style={{height: '400px', overflowY: 'scroll', WebkitOverflowScrolling: 'touch'}}>
                {rotas.filter(rota => {
                  if (!rotaSearch) return true;
                  const rotaText = `${rota.origem} ${rota.destino}`.toLowerCase();
                  return rotaText.includes(rotaSearch.toLowerCase());
                }).map((rota: any) => (
                  <div
                    key={rota.id}
                    onClick={() => {
                      const rotaValue = userTipo === 'motorista' ? rota.id : `${rota.origem} → ${rota.destino}`;
                      setSelectedRota(rotaValue);
                      setShowRotaModal(false);
                      setRotaSearch('');
                    }}
                    style={{
                      padding: '15px',
                      borderBottom: '1px solid #eee',
                      cursor: 'pointer',
                      backgroundColor: 'white',
                      fontSize: '16px'
                    }}
                    onTouchStart={(e) => (e.target as HTMLElement).style.backgroundColor = '#f5f5f5'}
                    onTouchEnd={(e) => (e.target as HTMLElement).style.backgroundColor = 'white'}
                  >
                    <strong>{rota.origem} → {rota.destino}</strong>
                  </div>
                ))}

                {rotas.filter(rota => {
                  if (!rotaSearch) return true;
                  const rotaText = `${rota.origem} ${rota.destino}`.toLowerCase();
                  return rotaText.includes(rotaSearch.toLowerCase());
                }).length === 0 && rotaSearch && (
                  <div style={{padding: '20px', textAlign: 'center', color: '#999'}}>
                    Nenhuma rota encontrada para "{rotaSearch}"
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {showVanModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'flex-end'
        }}>
          <div style={{
            backgroundColor: 'white',
            width: '100%',
            maxHeight: '70vh',
            borderRadius: '15px 15px 0 0',
            display: 'flex',
            flexDirection: 'column',
            marginBottom: '20px'
          }}>
            <div style={{
              padding: '15px 20px',
              borderBottom: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{margin: 0}}>🔍 Buscar Van</h2>
              <button onClick={() => setShowVanModal(false)} className="btn-secondary">Fechar</button>
            </div>
            
            <div style={{padding: '15px 20px', flex: 1, display: 'flex', flexDirection: 'column'}}>
              <input
                type="text"
                value={vanSearch}
                onChange={(e) => setVanSearch(e.target.value)}
                placeholder="Digite para buscar (ex: ABC-1234)"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  marginBottom: '15px',
                  fontSize: '16px'
                }}
              />
              
              <div style={{height: '400px', overflowY: 'scroll', WebkitOverflowScrolling: 'touch'}}>
                {vans.filter(van => {
                  if (!vanSearch) return true;
                  const vanText = `${van.placa} ${van.kmAtual}`.toLowerCase();
                  return vanText.includes(vanSearch.toLowerCase());
                }).map((van: any) => (
                  <div
                    key={van.id}
                    onClick={() => {
                      setSelectedVan(van.id);
                      setKmValue(van.kmAtual.toString());
                      setShowVanModal(false);
                      setVanSearch('');
                    }}
                    style={{
                      padding: '15px',
                      borderBottom: '1px solid #eee',
                      cursor: 'pointer',
                      backgroundColor: 'white',
                      fontSize: '16px'
                    }}
                    onTouchStart={(e) => (e.target as HTMLElement).style.backgroundColor = '#f5f5f5'}
                    onTouchEnd={(e) => (e.target as HTMLElement).style.backgroundColor = 'white'}
                  >
                    <strong>{van.placa}</strong>
                    <div style={{fontSize: '14px', color: '#666', marginTop: '5px'}}>
                      KM Atual: {van.kmAtual}
                    </div>
                  </div>
                ))}

                {vans.filter(van => {
                  if (!vanSearch) return true;
                  const vanText = `${van.placa} ${van.kmAtual}`.toLowerCase();
                  return vanText.includes(vanSearch.toLowerCase());
                }).length === 0 && vanSearch && (
                  <div style={{padding: '20px', textAlign: 'center', color: '#999'}}>
                    Nenhuma van encontrada para "{vanSearch}"
                  </div>
                )}
                
                {vans.length === 0 && (
                  <div style={{padding: '20px', textAlign: 'center', color: '#999'}}>
                    ⚠️ Todas as vans estão ocupadas
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}