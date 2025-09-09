import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../lib/firebase';
import { createUser } from '../lib/auth';
import { getAllRecords } from '../lib/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';

function RotaManagement() {
  const [rotas, setRotas] = useState<any[]>([]);
  const [newRotaOrigem, setNewRotaOrigem] = useState('');
  const [newRotaDestino, setNewRotaDestino] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingRota, setEditingRota] = useState<any>(null);
  const [editRotaOrigem, setEditRotaOrigem] = useState('');
  const [editRotaDestino, setEditRotaDestino] = useState('');

  useEffect(() => {
    loadRotas();
  }, []);

  const loadRotas = async () => {
    try {
      const response = await fetch('/api/rotas/list');
      const rotasData = await response.json();
      setRotas(rotasData);
    } catch (error) {
      console.error('Erro ao carregar rotas:', error);
    }
  };

  const handleCreateRota = async () => {
    if (!newRotaOrigem || !newRotaDestino) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/rotas/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origem: newRotaOrigem, destino: newRotaDestino })
      });
      
      if (response.ok) {
        loadRotas();
        setNewRotaOrigem('');
        setNewRotaDestino('');
        alert('Rota cadastrada com sucesso!');
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao cadastrar rota');
      }
    } catch (error) {
      alert('Erro ao cadastrar rota');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRota = async () => {
    if (!editingRota || !editRotaOrigem || !editRotaDestino) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/rotas/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: editingRota.id, 
          origem: editRotaOrigem, 
          destino: editRotaDestino 
        })
      });
      
      if (response.ok) {
        alert('Rota atualizada com sucesso!');
        setEditingRota(null);
        setEditRotaOrigem('');
        setEditRotaDestino('');
        loadRotas();
      } else {
        alert('Erro ao atualizar rota');
      }
    } catch (error) {
      alert('Erro ao atualizar rota');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRota = async (rotaId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta rota?')) return;
    
    try {
      const response = await fetch('/api/rotas/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rotaId })
      });
      
      if (response.ok) {
        loadRotas();
        alert('Rota deletada com sucesso!');
      } else {
        alert('Erro ao deletar rota');
      }
    } catch (error) {
      alert('Erro ao deletar rota');
    }
  };

  return (
    <div>
      <div className="form-group" style={{padding: '20px'}}>
        <input
          type="text"
          value={newRotaOrigem}
          onChange={(e) => setNewRotaOrigem(e.target.value)}
          placeholder="Origem (ex: São Paulo)"
          className="input"
        />
        <input
          type="text"
          value={newRotaDestino}
          onChange={(e) => setNewRotaDestino(e.target.value)}
          placeholder="Destino (ex: Rio de Janeiro)"
          className="input"
        />
        <button onClick={handleCreateRota} disabled={loading} className="btn-primary">
          {loading ? 'Cadastrando...' : 'Cadastrar Rota'}
        </button>
      </div>

      <div className="vans-list" style={{padding: '20px', paddingTop: '0'}}>
        <h3>Rotas Cadastradas ({Array.isArray(rotas) ? rotas.length : 0})</h3>
        {Array.isArray(rotas) && rotas.length > 0 ? rotas.map((rota: any) => (
          <div key={rota.id} className="van-item">
            <div className="van-info">
              <span className="van-placa">{rota.origem} → {rota.destino}</span>
            </div>
            <div className="van-actions">
              <button 
                onClick={() => {
                  setEditingRota(rota);
                  setEditRotaOrigem(rota.origem);
                  setEditRotaDestino(rota.destino);
                }} 
                className="btn-secondary btn-small"
              >
                Editar
              </button>
              <button 
                onClick={() => handleDeleteRota(rota.id)} 
                className="btn-danger btn-small"
              >
                Deletar
              </button>
            </div>
          </div>
        )) : <p>Nenhuma rota cadastrada</p>}
      </div>
      
      {editingRota && (
        <div className="modal">
          <div className="modal-content">
            <h3>Editar Rota</h3>
            <div className="form-group">
              <label>Origem:</label>
              <input
                type="text"
                value={editRotaOrigem}
                onChange={(e) => setEditRotaOrigem(e.target.value)}
                className="input"
                style={{width: '100%', marginBottom: '10px'}}
              />
              <label>Destino:</label>
              <input
                type="text"
                value={editRotaDestino}
                onChange={(e) => setEditRotaDestino(e.target.value)}
                className="input"
                style={{width: '100%'}}
              />
            </div>
            <div className="modal-actions">
              <button onClick={handleEditRota} disabled={!editRotaOrigem || !editRotaDestino || loading} className="btn-primary">
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
              <button onClick={() => { 
                setEditingRota(null); 
                setEditRotaOrigem(''); 
                setEditRotaDestino('');
              }} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VanManagement() {
  const [vans, setVans] = useState<any[]>([]);
  const [newVanPlaca, setNewVanPlaca] = useState('');
  const [newVanKm, setNewVanKm] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editingVan, setEditingVan] = useState<any>(null);
  const [editVanKm, setEditVanKm] = useState('');
  const [editVanPlaca, setEditVanPlaca] = useState('');
  const [showInactiveVans, setShowInactiveVans] = useState(false);

  useEffect(() => {
    loadVans();
  }, []);

  useEffect(() => {
    loadVans();
  }, [showInactiveVans]);

  const loadVans = async () => {
    try {
      const endpoint = showInactiveVans ? '/api/vans/list-inactive' : '/api/vans/list';
      const response = await fetch(endpoint);
      const vansData = await response.json();
      setVans(vansData);
    } catch (error) {
      console.error('Erro ao carregar vans:', error);
    }
  };

  const handleCreateVan = async () => {
    if (!newVanPlaca) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/vans/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placa: newVanPlaca, kmInicial: newVanKm })
      });
      
      if (response.ok) {
        loadVans();
        setNewVanPlaca('');
        setNewVanKm(0);
        alert('Van cadastrada com sucesso!');
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao cadastrar van');
      }
    } catch (error) {
      alert('Erro ao cadastrar van');
    } finally {
      setLoading(false);
    }
  };



  const handleEditVan = async () => {
    if (!editingVan || !editVanKm || !editVanPlaca) return;
    
    setLoading(true);
    try {
      // Atualizar KM
      const kmResponse = await fetch('/api/vans/update-km', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: editingVan.id, 
          kmAtual: parseInt(editVanKm)
        })
      });
      
      // Se a placa mudou, atualizar placa
      if (editVanPlaca !== editingVan.placa) {
        await fetch('/api/vans/update-placa', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            id: editingVan.id, 
            placa: editVanPlaca
          })
        });
      }
      
      const response = kmResponse;
      
      if (response.ok) {
        alert('Van atualizada com sucesso!');
        setEditingVan(null);
        setEditVanKm('');
        setEditVanPlaca('');
        loadVans();
      } else {
        alert('Erro ao atualizar van');
      }
    } catch (error) {
      alert('Erro ao atualizar van');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateVan = async (vanId: string) => {
    try {
      const response = await fetch('/api/vans/activate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: vanId })
      });
      
      if (response.ok) {
        loadVans();
        alert('Van ativada com sucesso!');
      } else {
        alert('Erro ao ativar van');
      }
    } catch (error) {
      alert('Erro ao ativar van');
    }
  };

  const handleDeactivateVan = async (vanId: string) => {
    if (!confirm('Tem certeza que deseja desativar esta van?')) return;
    
    try {
      const response = await fetch('/api/vans/deactivate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: vanId })
      });
      
      if (response.ok) {
        loadVans();
        alert('Van desativada com sucesso!');
      } else {
        alert('Erro ao desativar van');
      }
    } catch (error) {
      alert('Erro ao desativar van');
    }
  };

  return (
    <div>
      <div className="form-group" style={{padding: '20px'}}>
        <input
          type="text"
          value={newVanPlaca}
          onChange={(e) => setNewVanPlaca(e.target.value.toUpperCase())}
          placeholder="Placa da van (ex: ABC-1234)"
          className="input van-placa-input"
          style={{width: '300px', minWidth: '200px'}}
        />
        <input
          type="number"
          value={newVanKm}
          onChange={(e) => setNewVanKm(Number(e.target.value))}
          placeholder="KM inicial"
          className="input"
          style={{width: '200px'}}
        />
        <button onClick={handleCreateVan} disabled={loading} className="btn-primary">
          {loading ? 'Cadastrando...' : 'Cadastrar Van'}
        </button>
      </div>

      <div className="vans-list" style={{padding: '20px', paddingTop: '0'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
          <h3>Vans {showInactiveVans ? 'Desativadas' : 'Ativas'} ({Array.isArray(vans) ? vans.length : 0})</h3>
          <button 
            onClick={() => setShowInactiveVans(!showInactiveVans)} 
            className="btn-secondary"
          >
            {showInactiveVans ? 'Ver Ativas' : 'Ver Desativadas'}
          </button>
        </div>
        {Array.isArray(vans) && vans.length > 0 ? vans.map((van: any) => (
          <div key={van.id} className="van-item">
            <div className="van-info">
              <span className="van-placa">{van.placa}</span>
              <span className="van-km">KM Atual: {van.kmAtual}</span>
              {van.ativa === false && <span className="van-status" style={{color: 'red'}}>DESATIVADA</span>}
            </div>
            <div className="van-actions">
              <button 
                onClick={() => {
                  setEditingVan(van);
                  setEditVanKm(van.kmAtual.toString());
                  setEditVanPlaca(van.placa);
                }} 
                className="btn-secondary btn-small"
              >
                Editar
              </button>
              {van.ativa === false ? (
                <button 
                  onClick={() => handleActivateVan(van.id)} 
                  className="btn-primary btn-small"
                >
                  Ativar
                </button>
              ) : (
                <button 
                  onClick={() => handleDeactivateVan(van.id)} 
                  className="btn-danger btn-small"
                >
                  Desativar
                </button>
              )}
            </div>
          </div>
        )) : <p>Nenhuma van cadastrada</p>}
      </div>
      
      {editingVan && (
        <div className="modal">
          <div className="modal-content">
            <h3>Editar Van - {editingVan.placa}</h3>
            <div className="form-group">
              <label>Placa:</label>
              <input
                type="text"
                value={editVanPlaca}
                onChange={(e) => setEditVanPlaca(e.target.value.toUpperCase())}
                className="input van-placa-input"
                style={{width: '100%', marginBottom: '10px'}}
              />
              <label>KM Atual:</label>
              <input
                type="number"
                value={editVanKm}
                onChange={(e) => setEditVanKm(e.target.value)}
                className="input"
                style={{width: '100%'}}
              />
            </div>
            <div className="modal-actions">
              <button onClick={handleEditVan} disabled={!editVanKm || !editVanPlaca || loading} className="btn-primary">
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
              <button onClick={() => { 
                setEditingVan(null); 
                setEditVanKm(''); 
                setEditVanPlaca('');
              }} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  // Função helper para de-para copiloto -> monitora
  const formatUserType = (tipo: string) => {
    return tipo === 'copiloto' ? 'Monitora' : 'Motorista';
  };

  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserNome, setNewUserNome] = useState('');
  const [newUserPerfil, setNewUserPerfil] = useState('user');
  const [newUserTipo, setNewUserTipo] = useState('motorista');
  const [newUserJornada, setNewUserJornada] = useState([{entrada: '08:00', saida: '17:00'}]);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [editingUserName, setEditingUserName] = useState<any>(null);
  const [newName, setNewName] = useState('');
  const [editingUserTipo, setEditingUserTipo] = useState<any>(null);
  const [newTipo, setNewTipo] = useState('');
  const [editingUserJornada, setEditingUserJornada] = useState<any>(null);
  const [newJornada, setNewJornada] = useState([{entrada: '08:00', saida: '17:00'}]);
  const [userFilter, setUserFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    createUser: false,
    vans: false,
    rotas: false,
    users: false,
    records: false,
    charts: false,
    jornadas: false,
    dashboard: false
  });
  
  const [openRecords, setOpenRecords] = useState<any[]>([]);
  
  // Atualizar registros em aberto a cada 5 minutos
  useEffect(() => {
    const updateOpenRecords = () => {
      const open = records.filter(record => !record.fechamento);
      setOpenRecords(open);
    };
    
    updateOpenRecords();
    const interval = setInterval(() => {
      loadRecords(); // Recarregar todos os registros
      updateOpenRecords();
    }, 5 * 60 * 1000); // 5 minutos
    
    return () => clearInterval(interval);
  }, [records]);
  const [chartFilters, setChartFilters] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    selectedUser: ''
  });
  const [recordFilters, setRecordFilters] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    selectedUser: '',
    showOnlyOpen: false,
    rotaSearch: ''
  });
  const [jornadasFilters, setJornadasFilters] = useState({
    startDate: '',
    endDate: '',
    selectedUser: ''
  });
  const [showJornadaModal, setShowJornadaModal] = useState(false);
  const [jornadaNormal, setJornadaNormal] = useState('08:00');
  const [exportType, setExportType] = useState('');
  const [expandedJornadas, setExpandedJornadas] = useState<{[key: string]: boolean}>({});
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [editRecordData, setEditRecordData] = useState({
    kmInicial: '',
    kmFinal: '',
    dataAbertura: '',
    dataFechamento: '',
    diarioBordo: ''
  });
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      
      try {
        const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
        if (userDoc.data()?.perfil !== 'admin') {
          router.push('/home');
          return;
        }
        
        setUser(user);
        loadUsers();
        loadRecords();
      } catch (error) {
        console.error('Erro ao verificar perfil admin:', error);
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const loadUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'usuarios'));
      const userIds = snapshot.docs.map((doc: any) => doc.data().uid);
      
      const response = await fetch('/api/users/get-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds })
      });
      
      const emailData = await response.json();
      
      const usersData = snapshot.docs.map((doc: any) => {
        const userData = doc.data();
        const userEmail = emailData[userData.uid] || userData.email || 'Email não encontrado';
        return {
          id: doc.id,
          ...userData,
          email: userEmail,
          nome: userData.nome || '',
          tipo: userData.tipo || 'motorista',
          jornada: userData.jornada || [{entrada: '08:00', saida: '17:00'}]
        };
      });
      
      setUsers(usersData);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(50);

  const loadRecords = async () => {
    const recordsData = await getAllRecords(1000); // Carregar mais registros
    // Ordenar por nome do usuário
    const sortedRecords = recordsData.sort((a: any, b: any) => {
      const userA = users.find(u => u.uid === a.userId);
      const userB = users.find(u => u.uid === b.userId);
      const nameA = userA?.nome || '';
      const nameB = userB?.nome || '';
      return nameA.localeCompare(nameB);
    });
    setRecords(sortedRecords);
  };

  const addJornadaHorario = () => {
    setNewUserJornada([...newUserJornada, {entrada: '08:00', saida: '17:00'}]);
  };

  const removeJornadaHorario = (index: number) => {
    if (newUserJornada.length > 1) {
      setNewUserJornada(newUserJornada.filter((_, i) => i !== index));
    }
  };

  const updateJornadaHorario = (index: number, field: 'entrada' | 'saida', value: string) => {
    const updated = [...newUserJornada];
    updated[index][field] = value;
    setNewUserJornada(updated);
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword || !newUserNome) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: newUserEmail, 
          password: newUserPassword, 
          nome: newUserNome, 
          perfil: newUserPerfil, 
          tipo: newUserTipo,
          jornada: newUserJornada
        })
      });
      
      if (response.ok) {
        const userData = await response.json();
        loadUsers();
        const tipoTexto = newUserPerfil === 'admin' ? 'Administrador' : (newUserTipo === 'motorista' ? 'Motorista' : 'Monitora');
        alert(`Usuário criado com sucesso!\n\nNome: ${newUserNome}\nEmail: ${newUserEmail}\nSenha: ${newUserPassword}\nTipo: ${tipoTexto}\n\nCopie estes dados para o cliente.`);
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserNome('');
        setNewUserPerfil('user');
        setNewUserTipo('motorista');
        setNewUserJornada([{entrada: '08:00', saida: '17:00'}]);
      } else {
        alert('Erro ao criar usuário');
      }
    } catch (error) {
      alert('Erro ao criar usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user: any) => {
    if (!confirm(`Tem certeza que deseja deletar o usuário ${user.email}?\n\nEsta ação não pode ser desfeita!`)) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/users/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid })
      });
      
      if (response.ok) {
        alert('Usuário deletado com sucesso');
        loadUsers();
      } else {
        alert('Erro ao deletar usuário');
      }
    } catch (error) {
      alert('Erro ao deletar usuário');
    } finally {
      setLoading(false);
    }
  };



  const handleEditRecord = async () => {
    if (!editingRecord) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/records/edit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: editingRecord.id,
          kmInicial: editRecordData.kmInicial ? parseInt(editRecordData.kmInicial) : null,
          kmFinal: editRecordData.kmFinal ? parseInt(editRecordData.kmFinal) : null,
          dataAbertura: editRecordData.dataAbertura ? new Date(editRecordData.dataAbertura).toISOString() : null,
          dataFechamento: editRecordData.dataFechamento ? new Date(editRecordData.dataFechamento).toISOString() : null,
          diarioBordo: editRecordData.diarioBordo
        })
      });
      
      if (response.ok) {
        alert('Registro atualizado com sucesso');
        setEditingRecord(null);
        setEditRecordData({kmInicial: '', kmFinal: '', dataAbertura: '', dataFechamento: '', diarioBordo: ''});
        loadRecords();
      } else {
        alert('Erro ao atualizar registro');
      }
    } catch (error) {
      alert('Erro ao atualizar registro');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRecord = async (record: any) => {
    if (!confirm(`Tem certeza que deseja deletar este registro?\n\nEsta ação não pode ser desfeita!`)) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/records/edit', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: record.id })
      });
      
      if (response.ok) {
        alert('Registro deletado com sucesso');
        loadRecords();
      } else {
        alert('Erro ao deletar registro');
      }
    } catch (error) {
      alert('Erro ao deletar registro');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeTipo = async () => {
    if (!editingUserTipo) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/users/update-tipo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: editingUserTipo.uid, tipo: newTipo })
      });
      
      if (response.ok) {
        alert('Tipo alterado com sucesso');
        setEditingUserTipo(null);
        setNewTipo('');
        loadUsers();
      } else {
        alert('Erro ao alterar tipo');
      }
    } catch (error) {
      alert('Erro ao alterar tipo');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeJornada = async () => {
    if (!editingUserJornada) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/users/update-jornada', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: editingUserJornada.uid, jornada: newJornada })
      });
      
      if (response.ok) {
        alert('Jornada alterada com sucesso');
        setEditingUserJornada(null);
        setNewJornada([{entrada: '08:00', saida: '17:00'}]);
        loadUsers();
      } else {
        alert('Erro ao alterar jornada');
      }
    } catch (error) {
      alert('Erro ao alterar jornada');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeName = async () => {
    if (!editingUserName) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/users/update-name', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: editingUserName.uid, nome: newName })
      });
      
      if (response.ok) {
        alert('Nome alterado com sucesso');
        setEditingUserName(null);
        setNewName('');
        loadUsers();
      } else {
        alert('Erro ao alterar nome');
      }
    } catch (error) {
      alert('Erro ao alterar nome');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!editingUser || !newPassword) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: editingUser.uid, newPassword })
      });
      
      if (response.ok) {
        alert('Senha alterada com sucesso');
        setEditingUser(null);
        setNewPassword('');
      } else {
        alert('Erro ao alterar senha');
      }
    } catch (error) {
      alert('Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredData = () => {
    const filteredRecords = records.filter((record: any) => {
      if (recordFilters.selectedUser && record.userId !== recordFilters.selectedUser) {
        return false;
      }
      
      if (recordFilters.startDate || recordFilters.endDate) {
        const recordDate = new Date(record.abertura?.dataHora);
        
        if (recordFilters.startDate) {
          const startDate = new Date(recordFilters.startDate + 'T00:00:00-03:00');
          if (recordDate < startDate) {
            return false;
          }
        }
        if (recordFilters.endDate) {
          const endDate = new Date(recordFilters.endDate + 'T23:59:59-03:00');
          if (recordDate > endDate) {
            return false;
          }
        }
      }
      
      if (recordFilters.showOnlyOpen && record.fechamento) {
        return false;
      }
      
      if (recordFilters.rotaSearch) {
        const rota = `${record.origem || ''} ${record.destino || ''}`.toLowerCase();
        if (!rota.includes(recordFilters.rotaSearch.toLowerCase())) {
          return false;
        }
      }
      
      return true;
    });
    
    const data = [];
    data.push(['Nome', 'Tipo', 'Van', 'Rota', 'KM Inicial', 'Data Abertura', 'KM Final', 'Data Fechamento', 'Distância', 'Diário']);
    
    filteredRecords.forEach(record => {
      const user = users.find(u => u.uid === record.userId);
      const distancia = record.fechamento?.kmFinal && record.abertura?.kmInicial 
        ? record.fechamento.kmFinal - record.abertura.kmInicial 
        : null;
      const userTipo = user?.tipo || 'motorista';
      data.push([
        user?.nome || '',
        formatUserType(userTipo),
        userTipo === 'copiloto' ? '-' : (record.placa || '-'),
        record.origem && record.destino ? `${record.origem} → ${record.destino}` : '-',
        userTipo === 'copiloto' ? '-' : (record.abertura?.kmInicial || ''),
        record.abertura?.dataHora ? new Date(record.abertura.dataHora).toLocaleString('pt-BR') : '',
        userTipo === 'copiloto' ? '-' : (record.fechamento?.kmFinal || 'Em aberto'),
        record.fechamento?.dataHora ? new Date(record.fechamento.dataHora).toLocaleString('pt-BR') : 'Em aberto',
        userTipo === 'copiloto' || !distancia ? '-' : `${distancia} km`,
        record.fechamento?.diarioBordo || '-'
      ]);
    });
    
    const selectedUser = recordFilters.selectedUser ? users.find(u => u.uid === recordFilters.selectedUser) : null;
    
    return { data, selectedUser, filteredRecords };
  };

  const exportCSV = (): void => {
    const { data } = getFilteredData();
    
    // Se tem filtro por usuário, adicionar rodapé personalizado
    if (recordFilters.selectedUser) {
      const selectedUser = users.find(u => u.uid === recordFilters.selectedUser);
      data.push(['']);
      data.push(['']);
      data.push([`Data de Exportação: ${new Date().toLocaleString('pt-BR')}`]);
      data.push([`Funcionário: ${selectedUser?.nome || 'N/A'}`]);
      data.push([`Período: ${recordFilters.startDate ? new Date(recordFilters.startDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'Todas'} até ${recordFilters.endDate ? new Date(recordFilters.endDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'Todas'}`]);
      data.push(['']);
      data.push(['Assinatura: _________________________________']);
    }
    
    const csvString = data.map((row: any) => row.map((cell: any) => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'registros.csv';
    a.click();
  };

  const exportExcel = (): void => {
    const XLSX = require('xlsx');
    const { data, selectedUser } = getFilteredData();
    
    // Se tem filtro por usuário, adicionar rodapé personalizado
    if (selectedUser) {
      data.push(['']);
      data.push(['']);
      data.push([`Data de Exportação: ${new Date().toLocaleString('pt-BR')}`]);
      data.push([`Funcionário: ${selectedUser?.nome || 'N/A'}`]);
      data.push([`Período: ${recordFilters.startDate ? new Date(recordFilters.startDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'Todas'} até ${recordFilters.endDate ? new Date(recordFilters.endDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'Todas'}`]);
      data.push(['']);
      data.push(['Assinatura: _________________________________']);
    }
    
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Registros');
    XLSX.writeFile(wb, 'registros.xlsx');
  };

  const getJornadasData = () => {
    const filteredRecords = records.filter((record: any) => {
      if (jornadasFilters.selectedUser && record.userId !== jornadasFilters.selectedUser) {
        return false;
      }
      
      if (jornadasFilters.startDate || jornadasFilters.endDate) {
        const recordDate = new Date(record.abertura?.dataHora);
        if (jornadasFilters.startDate && recordDate < new Date(jornadasFilters.startDate)) {
          return false;
        }
        if (jornadasFilters.endDate && recordDate > new Date(jornadasFilters.endDate + 'T23:59:59')) {
          return false;
        }
      }
      
      return true;
    });
    
    const data = [];
    data.push(['Nome', 'Jornada', 'Rota', 'Data Abertura', 'Data Fechamento']);
    
    filteredRecords.forEach(record => {
      const user = users.find(u => u.uid === record.userId);
      const userJornada = user?.jornada || [{entrada: '08:00', saida: '17:00'}];
      const jornadaTexto = userJornada.map((j: any) => `${j.entrada} - ${j.saida}`).reduce((acc: string, curr: string, index: number) => {
        if (index === 0) return curr;
        if (index % 2 === 0) return acc + '\n' + curr;
        return acc + ', ' + curr;
      }, '');
      
      data.push([
        user?.nome || '',
        jornadaTexto,
        record.origem && record.destino ? `${record.origem} → ${record.destino}` : '-',
        record.abertura?.dataHora ? new Date(record.abertura.dataHora).toLocaleString('pt-BR') : '',
        record.fechamento?.dataHora ? new Date(record.fechamento.dataHora).toLocaleString('pt-BR') : 'Em aberto'
      ]);
    });
    
    return data;
  };

  const openJornadaModal = (type: string) => {
    setExportType(type);
    // Se há usuário selecionado, usar sua jornada automaticamente
    if (jornadasFilters.selectedUser) {
      const selectedUser = users.find(u => u.uid === jornadasFilters.selectedUser);
      if (selectedUser?.jornada) {
        let totalMinutos = 0;
        selectedUser.jornada.forEach((j: any) => {
          const [entradaH, entradaM] = j.entrada.split(':').map(Number);
          const [saidaH, saidaM] = j.saida.split(':').map(Number);
          const entradaMin = entradaH * 60 + entradaM;
          const saidaMin = saidaH * 60 + saidaM;
          totalMinutos += saidaMin - entradaMin;
        });
        const horas = Math.floor(totalMinutos / 60);
        const minutos = totalMinutos % 60;
        setJornadaNormal(`${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`);
      }
    }
    setShowJornadaModal(true);
  };

  const calculateWorkHours = (abertura: string, fechamento: string) => {
    if (!abertura || !fechamento) return 0;
    const start = new Date(abertura);
    const end = new Date(fechamento);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60); // horas
  };

  const getJornadaDataWithHours = () => {
    const filteredRecords = records.filter((record: any) => {
      if (jornadasFilters.selectedUser && record.userId !== jornadasFilters.selectedUser) {
        return false;
      }
      
      if (jornadasFilters.startDate || jornadasFilters.endDate) {
        const recordDate = new Date(record.abertura?.dataHora);
        if (jornadasFilters.startDate && recordDate < new Date(jornadasFilters.startDate)) {
          return false;
        }
        if (jornadasFilters.endDate && recordDate > new Date(jornadasFilters.endDate + 'T23:59:59')) {
          return false;
        }
      }
      
      return true;
    });
    
    // Agrupar por usuário e data
    const groupedData: any = {};
    
    filteredRecords.forEach(record => {
      const user = users.find(u => u.uid === record.userId);
      const userName = user?.nome || '';
      const date = record.abertura?.dataHora ? new Date(record.abertura.dataHora).toLocaleDateString('pt-BR') : '';
      const key = `${userName}-${date}`;
      
      if (!groupedData[key]) {
        groupedData[key] = {
          nome: userName,
          data: date,
          horarios: []
        };
      }
      
      if (record.abertura?.dataHora) {
        const entrada = new Date(record.abertura.dataHora);
        const saida = record.fechamento?.dataHora ? new Date(record.fechamento.dataHora) : null;
        
        groupedData[key].horarios.push({
          entrada,
          saida,
          entradaTexto: entrada.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit', hour12: false}),
          saidaTexto: saida ? saida.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit', hour12: false}) : 'Em aberto'
        });
      }
    });
    
    // Determinar número máximo de entradas/saídas para criar colunas dinâmicas
    let maxHorarios = 0;
    Object.values(groupedData).forEach((group: any) => {
      group.horarios.sort((a: any, b: any) => a.entrada.getTime() - b.entrada.getTime());
      maxHorarios = Math.max(maxHorarios, group.horarios.length);
    });
    
    // Criar cabeçalho dinâmico
    const headers = ['Nome', 'Jornada', 'Data'];
    for (let i = 0; i < maxHorarios; i++) {
      headers.push(`Entrada ${i + 1}`);
      headers.push(`Saída ${i + 1}`);
    }
    headers.push('Horas Trabalhadas', 'Jornada Normal', 'Diferença');
    
    const data = [];
    data.push(headers);
    
    // Ordenar por nome alfabeticamente
    const sortedGroups = Object.values(groupedData).sort((a: any, b: any) => a.nome.localeCompare(b.nome));
    
    sortedGroups.forEach((group: any) => {
      // Calcular total de horas
      let totalMinutos = 0;
      group.horarios.forEach((h: any) => {
        if (h.saida) {
          totalMinutos += (h.saida.getTime() - h.entrada.getTime()) / (1000 * 60);
        }
      });
      
      const horasTrabalhadas = Math.floor(totalMinutos / 60);
      const minutosTrabalhados = Math.floor(totalMinutos % 60);
      const horasTrabalhadasTexto = `${horasTrabalhadas.toString().padStart(2, '0')}:${minutosTrabalhados.toString().padStart(2, '0')}`;
      
      // Buscar jornada configurada do usuário
      const user = users.find(u => u.nome === group.nome);
      const userJornada = user?.jornada || [{entrada: '08:00', saida: '17:00'}];
      
      // Formatar jornada do usuário para exibição
      const jornadaCompleta = userJornada.map((j: any) => `${j.entrada} - ${j.saida}`).join(', ');
      const jornadaKey = `${group.nome}-${group.data}`;
      const isExpanded = expandedJornadas[jornadaKey];
      const jornadaTexto = jornadaCompleta.length > 20 && !isExpanded ? 
        jornadaCompleta.substring(0, 17) + '...' : jornadaCompleta;
      
      // Calcular total de minutos da jornada normal do usuário
      let jornadaNormalMinutos = 0;
      userJornada.forEach((j: any) => {
        const [entradaH, entradaM] = j.entrada.split(':').map(Number);
        const [saidaH, saidaM] = j.saida.split(':').map(Number);
        const entradaMin = entradaH * 60 + entradaM;
        const saidaMin = saidaH * 60 + saidaM;
        jornadaNormalMinutos += saidaMin - entradaMin;
      });
      
      const jornadaNormalHoras = Math.floor(jornadaNormalMinutos / 60);
      const jornadaNormalMin = jornadaNormalMinutos % 60;
      const jornadaNormalTexto = `${jornadaNormalHoras.toString().padStart(2, '0')}:${jornadaNormalMin.toString().padStart(2, '0')}`;
      
      const diferencaMinutos = totalMinutos - jornadaNormalMinutos;
      const diferencaHoras = Math.floor(Math.abs(diferencaMinutos) / 60);
      const diferencaMin = Math.floor(Math.abs(diferencaMinutos) % 60);
      const sinal = diferencaMinutos >= 0 ? '+' : '-';
      const diferencaTexto = `${sinal}${diferencaHoras.toString().padStart(2, '0')}:${diferencaMin.toString().padStart(2, '0')}`;
      
      const row = [group.nome, jornadaTexto, group.data];
      
      // Adicionar entradas e saídas em ordem cronológica
      for (let i = 0; i < maxHorarios; i++) {
        if (i < group.horarios.length) {
          row.push(group.horarios[i].entradaTexto);
          row.push(group.horarios[i].saidaTexto);
        } else {
          row.push('-');
          row.push('-');
        }
      }
      
      row.push(horasTrabalhadasTexto, jornadaNormalTexto, diferencaTexto);
      data.push(row);
    });
    
    return data;
  };

  const exportJornadasCSV = (): void => {
    const data = getJornadaDataWithHours();
    
    // Se tem filtro por usuário, adicionar rodapé personalizado
    if (jornadasFilters.selectedUser) {
      const selectedUser = users.find(u => u.uid === jornadasFilters.selectedUser);
      data.push(['']);
      data.push(['']);
      data.push([`Data de Exportação: ${new Date().toLocaleString('pt-BR')}`]);
      data.push([`Funcionário: ${selectedUser?.nome || 'N/A'}`]);
      data.push([`Período: ${jornadasFilters.startDate ? new Date(jornadasFilters.startDate).toLocaleDateString('pt-BR') : 'Todas'} até ${jornadasFilters.endDate ? new Date(jornadasFilters.endDate).toLocaleDateString('pt-BR') : 'Todas'}`]);
      data.push([`Jornada Normal: ${jornadaNormal}`]);
      data.push(['']);
      data.push(['Assinatura: _________________________________']);
    }
    
    const csvString = data.map((row: any) => row.map((cell: any) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'controle-jornadas.csv';
    a.click();
    setShowJornadaModal(false);
  };

  const exportJornadasExcel = (): void => {
    const XLSX = require('xlsx');
    const data = getJornadaDataWithHours();
    
    // Se tem filtro por usuário, adicionar rodapé personalizado
    if (jornadasFilters.selectedUser) {
      const selectedUser = users.find(u => u.uid === jornadasFilters.selectedUser);
      data.push(['']);
      data.push(['']);
      data.push([`Data de Exportação: ${new Date().toLocaleString('pt-BR')}`]);
      data.push([`Funcionário: ${selectedUser?.nome || 'N/A'}`]);
      data.push([`Período: ${jornadasFilters.startDate ? new Date(jornadasFilters.startDate).toLocaleDateString('pt-BR') : 'Todas'} até ${jornadasFilters.endDate ? new Date(jornadasFilters.endDate).toLocaleDateString('pt-BR') : 'Todas'}`]);
      data.push([`Jornada Normal: ${jornadaNormal}`]);
      data.push(['']);
      data.push(['Assinatura: _________________________________']);
    }
    
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Controle Jornadas');
    XLSX.writeFile(wb, 'controle-jornadas.xlsx');
    setShowJornadaModal(false);
  };

  const exportJornadasPDF = (): void => {
    const data = getJornadaDataWithHours();
    const doc = new (require('jspdf').jsPDF)();
    
    doc.setFontSize(16);
    doc.text('Controle de Jornadas', 14, 22);
    doc.setFontSize(10);
    doc.text(`Jornada Normal: ${jornadaNormal}`, 14, 32);
    
    let y = 45;
    
    data.slice(1).forEach((row: any, index: number) => {
      if (row.some((cell: any) => cell && cell.toString().trim())) {
        doc.setFontSize(10);
        doc.text(`${row[0]} - ${row[1]}`, 14, y);
        y += 6;
        doc.text(`Entrada: ${row[2]} | Saída: ${row[3]}`, 14, y);
        y += 6;
        doc.text(`Trabalhadas: ${row[4]} | Normal: ${row[5]} | Diferença: ${row[6]}`, 14, y);
        y += 10;
        
        doc.line(14, y - 3, 190, y - 3);
        y += 3;
        
        if (y > 250) {
          doc.addPage();
          y = 20;
        }
      }
    });
    
    // Rodapé se tem filtro por usuário
    if (jornadasFilters.selectedUser) {
      const selectedUser = users.find(u => u.uid === jornadasFilters.selectedUser);
      y += 20;
      if (y > 230) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(10);
      doc.text(`Data de Exportação: ${new Date().toLocaleString('pt-BR')}`, 14, y);
      doc.text(`Funcionário: ${selectedUser?.nome || 'N/A'}`, 14, y + 10);
      doc.text(`Período: ${jornadasFilters.startDate ? new Date(jornadasFilters.startDate).toLocaleDateString('pt-BR') : 'Todas'} até ${jornadasFilters.endDate ? new Date(jornadasFilters.endDate).toLocaleDateString('pt-BR') : 'Todas'}`, 14, y + 20);
      doc.text(`Jornada Normal: ${jornadaNormal}`, 14, y + 30);
      doc.text('Assinatura: _________________________________', 14, y + 50);
    }
    
    doc.save('controle-jornadas.pdf');
    setShowJornadaModal(false);
  };

  function JornadasSection() {
    return (
      <div>
        <div className="chart-filters">
          <input
            type="date"
            value={jornadasFilters.startDate}
            onChange={(e) => setJornadasFilters(prev => ({...prev, startDate: e.target.value}))}
            placeholder="Data inicial"
            className="input"
          />
          <input
            type="date"
            value={jornadasFilters.endDate}
            onChange={(e) => setJornadasFilters(prev => ({...prev, endDate: e.target.value}))}
            placeholder="Data final"
            className="input"
          />
          <select
            value={jornadasFilters.selectedUser}
            onChange={(e) => setJornadasFilters(prev => ({...prev, selectedUser: e.target.value}))}
            className="input"
          >
            <option value="">Todos os usuários</option>
            {users.sort((a, b) => (a.nome || a.email).localeCompare(b.nome || b.email)).map((user: any) => (
              <option key={user.uid} value={user.uid}>{user.nome || user.email}</option>
            ))}
          </select>
          <button onClick={() => setJornadasFilters({startDate: '', endDate: '', selectedUser: ''})} className="btn-secondary">
            Limpar
          </button>
        </div>
        <div className="jornadas-scroll-container">
          {/* Scroll horizontal superior */}
          <div 
            className="jornadas-top-scroll" 
            ref={(el) => {
              if (el) {
                const bottomScroll = el.parentElement?.querySelector('.jornadas-bottom-scroll');
                el.onscroll = () => {
                  if (bottomScroll) {
                    bottomScroll.scrollLeft = el.scrollLeft;
                  }
                };
              }
            }}
          >
            <div 
              className="jornadas-top-scroll-content" 
              ref={(el) => {
                if (el) {
                  const table = el.parentElement?.parentElement?.querySelector('table');
                  if (table) {
                    el.style.width = table.scrollWidth + 'px';
                  }
                }
              }}
            ></div>
          </div>
          
          {/* Tabela com scroll inferior */}
          <div 
            className="jornadas-bottom-scroll records-table"
            ref={(el) => {
              if (el) {
                const topScroll = el.parentElement?.querySelector('.jornadas-top-scroll');
                el.onscroll = () => {
                  if (topScroll) {
                    topScroll.scrollLeft = el.scrollLeft;
                  }
                };
              }
            }}
          >
            <table className="jornadas-table">
              <thead>
                {(() => {
                  const data = getJornadaDataWithHours();
                  const headers = data[0] || [];
                  return (
                    <tr>
                      {headers.map((header: string, index: number) => {
                        // Formatar cabeçalhos com quebra de linha apenas para Entrada/Saída
                        if (header.includes('Entrada') || header.includes('Saída')) {
                          const parts = header.split(' ');
                          return (
                            <th key={index}>
                              <div className="jornadas-header">
                                <span className="header-word">{parts[0]}</span>
                                <span className="header-number">{parts[1]}</span>
                              </div>
                            </th>
                          );
                        }
                        return <th key={index}>{header}</th>;
                      })}
                    </tr>
                  );
                })()}
              </thead>
              <tbody>
                {(() => {
                  const data = getJornadaDataWithHours();
                  const headers = data[0] || [];
                  return data.slice(1).map((row: any, index: number) => {
                    const jornadaKey = `${row[0]}-${row[2]}`;
                    return (
                      <tr key={index}>
                        {row.map((cell: any, cellIndex: number) => {
                          if (cellIndex === 1) { // Coluna Jornada
                            const isLong = cell.length > 15;
                            const isExpanded = expandedJornadas[jornadaKey];
                            const displayText = isLong && !isExpanded ? cell.substring(0, 12) : cell;
                            return (
                              <td key={cellIndex} style={{whiteSpace: isExpanded ? 'normal' : 'nowrap'}}>
                                <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                                  <span style={{wordBreak: isExpanded ? 'break-word' : 'normal'}}>{displayText}</span>
                                  {isLong && (
                                    <button 
                                      onClick={() => setExpandedJornadas(prev => ({...prev, [jornadaKey]: !prev[jornadaKey]}))}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#007bff',
                                        fontSize: '12px',
                                        padding: '2px 4px',
                                        flexShrink: 0
                                      }}
                                      title={isExpanded ? 'Recolher' : 'Expandir'}
                                    >
                                      {isExpanded ? '−' : '+'}
                                    </button>
                                  )}
                                </div>
                              </td>
                            );
                          }
                          return <td key={cellIndex}>{cell}</td>;
                        })}
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  const exportPDF = (): void => {
    const { data, selectedUser } = getFilteredData();
    
    const doc = new (require('jspdf').jsPDF)();
    
    // Título
    doc.setFontSize(16);
    doc.text('Relatório de Registros', 14, 22);
    
    let y = 40;
    doc.setFontSize(10);
    
    // Dados em formato de lista
    data.slice(1).forEach((row: any, index: number) => {
      if (row.some((cell: any) => cell && cell.toString().trim())) {
        // Cabeçalho do registro
        doc.setFontSize(12);
        doc.text(`Registro ${index + 1}`, 14, y);
        y += 8;
        
        doc.setFontSize(10);
        doc.text(`Nome: ${row[0] || '-'}`, 14, y);
        y += 6;
        doc.text(`Tipo: ${row[1] || '-'}`, 14, y);
        y += 6;
        doc.text(`Van: ${row[2] || '-'}`, 14, y);
        y += 6;
        doc.text(`Rota: ${row[3] || '-'}`, 14, y);
        y += 6;
        doc.text(`KM Inicial: ${row[4] || '-'}`, 14, y);
        y += 6;
        doc.text(`Data Abertura: ${row[5] || '-'}`, 14, y);
        y += 6;
        doc.text(`KM Final: ${row[6] || 'Em aberto'}`, 14, y);
        y += 6;
        doc.text(`Data Fechamento: ${row[7] || 'Em aberto'}`, 14, y);
        y += 6;
        doc.text(`Distância: ${row[8] || '-'}`, 14, y);
        y += 6;
        doc.text(`Observações: ${row[9] || '-'}`, 14, y);
        y += 12;
        
        // Linha separadora
        doc.line(14, y - 6, 190, y - 6);
        y += 6;
        
        if (y > 250) {
          doc.addPage();
          y = 20;
        }
      }
    });
    
    // Rodapé se tem filtro por usuário
    if (selectedUser) {
      y += 20;
      if (y > 230) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(10);
      doc.text(`Data de Exportação: ${new Date().toLocaleString('pt-BR')}`, 14, y);
      doc.text(`Funcionário: ${selectedUser?.nome || 'N/A'}`, 14, y + 10);
      doc.text(`Período: ${recordFilters.startDate ? new Date(recordFilters.startDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'Todas'} até ${recordFilters.endDate ? new Date(recordFilters.endDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'Todas'}`, 14, y + 20);
      doc.text('Assinatura: _________________________________', 14, y + 40);
    }
    
    doc.save('registros.pdf');
  };

  const logout = () => {
    auth.signOut();
    router.push('/login');
  };

  const refreshData = () => {
    loadUsers();
    loadRecords();
  };

  const refreshAllData = () => {
    loadUsers();
    loadRecords();
    setCurrentPage(1); // Reset para primeira página
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getFilteredRecords = (): any[] => {
    return records.filter((record: any) => {
      if (chartFilters.selectedUser && record.userId !== chartFilters.selectedUser) {
        return false;
      }
      
      if (chartFilters.startDate || chartFilters.endDate) {
        const recordDate = new Date(record.abertura?.dataHora);
        if (chartFilters.startDate && recordDate < new Date(chartFilters.startDate + 'T00:00:00-03:00')) {
          return false;
        }
        if (chartFilters.endDate && recordDate > new Date(chartFilters.endDate + 'T23:59:59-03:00')) {
          return false;
        }
      }
      
      return true;
    });
  };

  const getUserStats = (): any[] => {
    const filteredRecords = getFilteredRecords();
    
    const motoristaRecords = filteredRecords.filter((r: any) => {
      const user = users.find(u => u.uid === r.userId);
      return user && (user.tipo === 'motorista' || !user.tipo);
    });
    
    const copilotoRecords = filteredRecords.filter((r: any) => {
      const user = users.find(u => u.uid === r.userId);
      return user && user.tipo === 'copiloto';
    });
    
    const totalRecords = motoristaRecords.length + copilotoRecords.length;
    const stats: any[] = [];
    
    if (motoristaRecords.length > 0) {
      stats.push({
        email: `Motoristas (${motoristaRecords.length})`,
        count: motoristaRecords.length,
        percentage: totalRecords > 0 ? (motoristaRecords.length / totalRecords * 100) : 0
      });
    }
    
    if (copilotoRecords.length > 0) {
      stats.push({
        email: `Monitoras (${copilotoRecords.length})`,
        count: copilotoRecords.length,
        percentage: totalRecords > 0 ? (copilotoRecords.length / totalRecords * 100) : 0
      });
    }
    
    return stats;
  };

  const generatePieSlices = (): any[] => {
    const userStats = getUserStats();
    const colors = ['#007bff', '#28a745'];
    let cumulativePercentage = 0;
    
    return userStats.map((stat: any, index: number) => {
      const startAngle = (cumulativePercentage / 100) * 360 - 90;
      const endAngle = ((cumulativePercentage + stat.percentage) / 100) * 360 - 90;
      cumulativePercentage += stat.percentage;
      
      const startAngleRad = (startAngle * Math.PI) / 180;
      const endAngleRad = (endAngle * Math.PI) / 180;
      
      const largeArcFlag = stat.percentage > 50 ? "1" : "0";
      
      const x1 = 100 + 80 * Math.cos(startAngleRad);
      const y1 = 100 + 80 * Math.sin(startAngleRad);
      const x2 = 100 + 80 * Math.cos(endAngleRad);
      const y2 = 100 + 80 * Math.sin(endAngleRad);
      
      const pathData = [
        "M", 100, 100,
        "L", x1, y1,
        "A", 80, 80, 0, largeArcFlag, 1, x2, y2,
        "Z"
      ].join(" ");
      
      return (
        <path
          key={stat.email}
          d={pathData}
          fill={colors[index % colors.length]}
          stroke="white"
          strokeWidth="2"
        />
      );
    });
  };

  const generatePieLegend = (): any => {
    const userStats = getUserStats();
    const colors = ['#007bff', '#28a745', '#dc3545', '#ffc107', '#6c757d', '#17a2b8'];
    
    return (
      <div className="pie-legend-container">
        {userStats.map((stat: any, index: number) => (
          <div key={stat.email} className="pie-legend-item">
            <div 
              className="pie-legend-color" 
              style={{ backgroundColor: colors[index % colors.length] }}
            ></div>
            <span>{stat.email}: {stat.count} ({stat.percentage.toFixed(1)}%)</span>
          </div>
        ))}
      </div>
    );
  };

  const generateVanMotoristaChart = (): any => {
    const filteredRecords = getFilteredRecords();
    
    const vanStats: any = {};
    
    filteredRecords.forEach(record => {
      const user = users.find(u => u.uid === record.userId);
      const vanPlaca = record.placa || 'Van não identificada';
      const userName = user?.nome || 'Usuário';
      const userTipo = user?.tipo || 'motorista';
      
      const key = `${vanPlaca} - ${userName} (${userTipo})`;
      
      if (!vanStats[key]) {
        vanStats[key] = {
          registros: 0,
          kmTotal: 0,
          vanPlaca,
          userName,
          userTipo
        };
      }
      
      vanStats[key].registros++;
      
      if (record.fechamento?.kmFinal && record.abertura?.kmInicial) {
        vanStats[key].kmTotal += (record.fechamento.kmFinal - record.abertura.kmInicial);
      }
    });
    
    const statsArray = Object.values(vanStats).sort((a: any, b: any) => b.kmTotal - a.kmTotal);
    const maxKm = Math.max(...(statsArray as any[]).map((s: any) => s.kmTotal), 1);
    
    return (
      <div className="bar-chart-container">
        {(statsArray as any[]).map((stat: any, index: number) => (
          <div key={`${stat.vanPlaca}-${stat.userName}`} className="bar-item">
            <div className="bar-label">
              {stat.vanPlaca} - {stat.userName}
              <br />
              <small>{formatUserType(stat.userTipo)} • {stat.registros} registros</small>
            </div>
            <div className="bar-wrapper">
              <div 
                className="bar" 
                style={{ width: `${(stat.kmTotal / maxKm) * 100}%` }}
              ></div>
              <span className="bar-value">{stat.kmTotal} km</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const generateLast7DaysPieChart = (): any[] => {
    const today = new Date();
    const last7Days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      last7Days.push(date.toISOString().split('T')[0]);
    }
    
    const dayStats = last7Days.map(day => {
      const dayRecords = records.filter((record: any) => {
        const user = users.find(u => u.uid === record.userId);
        if (!user || user.tipo === 'copiloto' || !record.fechamento?.kmFinal) return false;
        
        const recordDate = new Date(record.abertura?.dataHora).toISOString().split('T')[0];
        return recordDate === day;
      });
      
      const totalKm = dayRecords.reduce((sum: number, record: any) => {
        return sum + (record.fechamento.kmFinal - record.abertura.kmInicial);
      }, 0);
      
      return {
        day: new Date(day).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
        totalKm
      };
    });
    
    const totalKm = dayStats.reduce((sum, day) => sum + day.totalKm, 0);
    const colors = ['#007bff', '#28a745', '#dc3545', '#ffc107', '#6c757d', '#17a2b8', '#e83e8c'];
    let cumulativePercentage = 0;
    
    return dayStats.filter(day => day.totalKm > 0).map((day, index) => {
      const percentage = totalKm > 0 ? (day.totalKm / totalKm) * 100 : 0;
      const startAngle = (cumulativePercentage / 100) * 360 - 90;
      const endAngle = ((cumulativePercentage + percentage) / 100) * 360 - 90;
      cumulativePercentage += percentage;
      
      const startAngleRad = (startAngle * Math.PI) / 180;
      const endAngleRad = (endAngle * Math.PI) / 180;
      
      const largeArcFlag = percentage > 50 ? "1" : "0";
      
      const x1 = 100 + 80 * Math.cos(startAngleRad);
      const y1 = 100 + 80 * Math.sin(startAngleRad);
      const x2 = 100 + 80 * Math.cos(endAngleRad);
      const y2 = 100 + 80 * Math.sin(endAngleRad);
      
      const pathData = [
        "M", 100, 100,
        "L", x1, y1,
        "A", 80, 80, 0, largeArcFlag, 1, x2, y2,
        "Z"
      ].join(" ");
      
      return (
        <path
          key={day.day}
          d={pathData}
          fill={colors[index % colors.length]}
          stroke="white"
          strokeWidth="2"
        />
      );
    });
  };
  
  const generateLast7DaysLegend = (): any => {
    const today = new Date();
    const last7Days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      last7Days.push(date.toISOString().split('T')[0]);
    }
    
    const dayStats = last7Days.map(day => {
      const dayRecords = records.filter((record: any) => {
        const user = users.find(u => u.uid === record.userId);
        if (!user || user.tipo === 'copiloto' || !record.fechamento?.kmFinal) return false;
        
        const recordDate = new Date(record.abertura?.dataHora).toISOString().split('T')[0];
        return recordDate === day;
      });
      
      const totalKm = dayRecords.reduce((sum: number, record: any) => {
        return sum + (record.fechamento.kmFinal - record.abertura.kmInicial);
      }, 0);
      
      return {
        day: new Date(day).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
        totalKm
      };
    });
    
    const totalKm = dayStats.reduce((sum, day) => sum + day.totalKm, 0);
    const colors = ['#007bff', '#28a745', '#dc3545', '#ffc107', '#6c757d', '#17a2b8', '#e83e8c'];
    
    return (
      <div className="pie-legend-container">
        {dayStats.filter(day => day.totalKm > 0).map((day, index) => {
          const percentage = totalKm > 0 ? (day.totalKm / totalKm) * 100 : 0;
          return (
            <div key={day.day} className="pie-legend-item">
              <div 
                className="pie-legend-color" 
                style={{ backgroundColor: colors[index % colors.length] }}
              ></div>
              <span>{day.day}: {day.totalKm} km ({percentage.toFixed(1)}%)</span>
            </div>
          );
        })}
      </div>
    );
  };
  
  const generateWeekdayChart = (): any => {
    const weekdays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
    const weekdayStats = weekdays.map((weekday, index) => {
      const motoristaKm = records.filter((record: any) => {
        const user = users.find(u => u.uid === record.userId);
        if (!user || user.tipo === 'copiloto' || !record.fechamento?.kmFinal) return false;
        
        const recordDate = new Date(record.abertura?.dataHora);
        const dayOfWeek = recordDate.getDay(); // 0 = domingo, 1 = segunda, etc.
        return dayOfWeek === index + 1; // index + 1 porque segunda = 1
      }).reduce((sum: number, record: any) => {
        return sum + (record.fechamento.kmFinal - record.abertura.kmInicial);
      }, 0);
      
      const mentoraFechamentos = records.filter((record: any) => {
        const user = users.find(u => u.uid === record.userId);
        if (!user || user.tipo !== 'copiloto' || !record.fechamento) return false;
        
        const recordDate = new Date(record.abertura?.dataHora);
        const dayOfWeek = recordDate.getDay();
        return dayOfWeek === index + 1;
      }).length;
      
      return { weekday, motoristaKm, mentoraFechamentos };
    });
    
    const maxValue = Math.max(
      ...weekdayStats.map(s => s.motoristaKm),
      ...weekdayStats.map(s => s.mentoraFechamentos * 10), // Multiplicar por 10 para visualização
      1
    );
    
    return (
      <div className="bar-chart-container">
        {weekdayStats.map((stat, index) => (
          <div key={stat.weekday} className="bar-item">
            <div className="bar-label">{stat.weekday}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div className="bar-wrapper">
                <div 
                  className="bar" 
                  style={{ 
                    width: `${(stat.motoristaKm / maxValue) * 100}%`,
                    background: 'linear-gradient(90deg, #007bff, #0056b3)'
                  }}
                ></div>
                <span className="bar-value">Motoristas: {stat.motoristaKm} km</span>
              </div>
              <div className="bar-wrapper">
                <div 
                  className="bar" 
                  style={{ 
                    width: `${((stat.mentoraFechamentos * 10) / maxValue) * 100}%`,
                    background: 'linear-gradient(90deg, #28a745, #1e7e34)'
                  }}
                ></div>
                <span className="bar-value">Monitoras: {stat.mentoraFechamentos} fechamentos</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  const generateVanMotoristaOnlyChart = (): any => {
    const filteredRecords = getFilteredRecords().filter(record => {
      const user = users.find(u => u.uid === record.userId);
      return user && (user.tipo === 'motorista' || !user.tipo);
    });
    
    const vanStats: any = {};
    
    filteredRecords.forEach(record => {
      const user = users.find(u => u.uid === record.userId);
      const vanPlaca = record.placa || 'Van não identificada';
      const userName = user?.nome || 'Usuário';
      
      const key = `${vanPlaca} - ${userName}`;
      
      if (!vanStats[key]) {
        vanStats[key] = {
          registros: 0,
          kmTotal: 0,
          vanPlaca,
          userName
        };
      }
      
      vanStats[key].registros++;
      
      if (record.fechamento?.kmFinal && record.abertura?.kmInicial) {
        vanStats[key].kmTotal += (record.fechamento.kmFinal - record.abertura.kmInicial);
      }
    });
    
    const statsArray = Object.values(vanStats).sort((a: any, b: any) => b.kmTotal - a.kmTotal);
    const maxKm = Math.max(...(statsArray as any[]).map((s: any) => s.kmTotal), 1);
    
    return (
      <div className="bar-chart-container">
        {(statsArray as any[]).map((stat: any, index: number) => (
          <div key={`${stat.vanPlaca}-${stat.userName}`} className="bar-item">
            <div className="bar-label">
              {stat.vanPlaca} - {stat.userName}
              <br />
              <small>Motorista • {stat.registros} registros</small>
            </div>
            <div className="bar-wrapper">
              <div 
                className="bar" 
                style={{ 
                  width: `${(stat.kmTotal / maxKm) * 100}%`,
                  background: 'linear-gradient(90deg, #007bff, #0056b3)'
                }}
              ></div>
              <span className="bar-value">{stat.kmTotal} km</span>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  const generateMonitoraChart = (): any => {
    const filteredRecords = getFilteredRecords().filter(record => {
      const user = users.find(u => u.uid === record.userId);
      return user && user.tipo === 'copiloto';
    });
    
    const monitoraStats: any = {};
    
    filteredRecords.forEach(record => {
      const user = users.find(u => u.uid === record.userId);
      const userName = user?.nome || 'Usuário';
      
      if (!monitoraStats[userName]) {
        monitoraStats[userName] = {
          registros: 0,
          userName
        };
      }
      
      monitoraStats[userName].registros++;
    });
    
    const statsArray = Object.values(monitoraStats).sort((a: any, b: any) => b.registros - a.registros);
    const maxRegistros = Math.max(...(statsArray as any[]).map((s: any) => s.registros), 1);
    
    return (
      <div className="bar-chart-container">
        {(statsArray as any[]).map((stat: any, index: number) => (
          <div key={stat.userName} className="bar-item">
            <div className="bar-label">
              {stat.userName}
              <br />
              <small>Monitora • {stat.registros} registros</small>
            </div>
            <div className="bar-wrapper">
              <div 
                className="bar" 
                style={{ 
                  width: `${(stat.registros / maxRegistros) * 100}%`,
                  background: 'linear-gradient(90deg, #28a745, #1e7e34)'
                }}
              ></div>
              <span className="bar-value">{stat.registros} registros</span>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  const generateVanUserChart = (): any => {
    const filteredRecords = getFilteredRecords();
    
    const vanStats: any = {};
    
    filteredRecords.forEach(record => {
      const user = users.find(u => u.uid === record.userId);
      const vanPlaca = record.placa || 'Van não identificada';
      const userName = user?.nome || 'Usuário';
      const userTipo = user?.tipo || 'motorista';
      
      const key = `${vanPlaca} - ${userName}`;
      
      if (!vanStats[key]) {
        vanStats[key] = {
          registros: 0,
          kmTotal: 0,
          vanPlaca,
          userName,
          userTipo: formatUserType(userTipo)
        };
      }
      
      vanStats[key].registros++;
      
      if (record.fechamento?.kmFinal && record.abertura?.kmInicial && userTipo !== 'copiloto') {
        vanStats[key].kmTotal += (record.fechamento.kmFinal - record.abertura.kmInicial);
      }
    });
    
    const statsArray = Object.values(vanStats).sort((a: any, b: any) => {
      if (a.userTipo === 'Monitora' && b.userTipo !== 'Monitora') return 1;
      if (a.userTipo !== 'Monitora' && b.userTipo === 'Monitora') return -1;
      return b.kmTotal - a.kmTotal;
    });
    
    const maxValue = Math.max(...(statsArray as any[]).map((s: any) => 
      s.userTipo === 'Monitora' ? s.registros * 10 : s.kmTotal
    ), 1);
    
    return (
      <div className="bar-chart-container">
        {(statsArray as any[]).map((stat: any, index: number) => (
          <div key={`${stat.vanPlaca}-${stat.userName}`} className="bar-item">
            <div className="bar-label">
              {stat.vanPlaca} - {stat.userName}
              <br />
              <small>{stat.userTipo} • {stat.registros} registros</small>
            </div>
            <div className="bar-wrapper">
              <div 
                className="bar" 
                style={{ 
                  width: `${((stat.userTipo === 'Mentora' ? stat.registros * 10 : stat.kmTotal) / maxValue) * 100}%`,
                  background: stat.userTipo === 'Monitora' ? 
                    'linear-gradient(90deg, #28a745, #1e7e34)' : 
                    'linear-gradient(90deg, #007bff, #0056b3)'
                }}
              ></div>
              <span className="bar-value">
                {stat.userTipo === 'Monitora' ? `${stat.registros} registros` : `${stat.kmTotal} km`}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!user) return <div>Carregando...</div>;

  return (
    <div className="admin-container">
      <header className="header" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <div style={{display: 'flex', alignItems: 'center'}}>
          <img src="/logoOfi.png" alt="Logo" style={{height: '45px', marginRight: '12px'}} />
          <h1>Painel Administrativo</h1>
        </div>
        <div className="header-buttons">
          <button onClick={() => router.push('/help')} className="btn-secondary">📚 Ajuda</button>
          <button onClick={refreshAllData} className="btn-primary">Atualizar</button>
          <button onClick={logout} className="btn-secondary">Sair</button>
        </div>
      </header>

      <section className="admin-section">
        <div className="section-header" onClick={() => toggleSection('createUser')}>
          <h2>Criar Usuário</h2>
          <span className="toggle-icon">{expandedSections.createUser ? '−' : '+'}</span>
        </div>
        {expandedSections.createUser && (
        <div className="form-group">
          <input
            type="text"
            value={newUserNome}
            onChange={(e) => setNewUserNome(e.target.value)}
            placeholder="Nome completo"
            className="input"
          />
          <input
            type="email"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            placeholder="E-mail"
            className="input"
          />
          <input
            type="password"
            value={newUserPassword}
            onChange={(e) => setNewUserPassword(e.target.value)}
            placeholder="Senha"
            className="input"
          />
          <select
            value={newUserPerfil}
            onChange={(e) => setNewUserPerfil(e.target.value)}
            className="input"
          >
            <option value="user">👤 Usuário Normal</option>
            <option value="admin">👑 Administrador</option>
          </select>
          {newUserPerfil === 'user' && (
            <select
              value={newUserTipo}
              onChange={(e) => setNewUserTipo(e.target.value)}
              className="input"
            >
              <option value="motorista">🚗 Motorista</option>
              <option value="copiloto">👥 Monitora</option>
            </select>
          )}
          <div style={{width: '100%', marginTop: '10px'}}>
            <label>Jornada de trabalho:</label>
            {newUserJornada.map((horario, index) => (
              <div key={index} style={{display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px'}}>
                <input
                  type="time"
                  value={horario.entrada}
                  onChange={(e) => updateJornadaHorario(index, 'entrada', e.target.value)}
                  className="input"
                  style={{flex: 1}}
                />
                <span>até</span>
                <input
                  type="time"
                  value={horario.saida}
                  onChange={(e) => updateJornadaHorario(index, 'saida', e.target.value)}
                  className="input"
                  style={{flex: 1}}
                />
                {newUserJornada.length > 1 && (
                  <button 
                    onClick={() => removeJornadaHorario(index)}
                    className="btn-danger"
                    style={{padding: '5px 10px', fontSize: '12px'}}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button 
              onClick={addJornadaHorario}
              className="btn-secondary"
              style={{marginTop: '5px'}}
            >
              + Adicionar Horário
            </button>
          </div>
          <button onClick={handleCreateUser} disabled={loading} className="btn-primary">
            {loading ? 'Criando...' : 'Criar Usuário'}
          </button>
        </div>
        )}
      </section>

      <section className="admin-section">
        <div className="section-header" onClick={() => toggleSection('vans')}>
          <h2>Gerenciar Vans</h2>
          <span className="toggle-icon">{expandedSections.vans ? '−' : '+'}</span>
        </div>
        {expandedSections.vans && <VanManagement />}
      </section>

      <section className="admin-section">
        <div className="section-header" onClick={() => toggleSection('rotas')}>
          <h2>Gerenciar Rotas</h2>
          <span className="toggle-icon">{expandedSections.rotas ? '−' : '+'}</span>
        </div>
        {expandedSections.rotas && <RotaManagement />}
      </section>

      <section className="admin-section">
        <div className="section-header" onClick={() => toggleSection('users')}>
          <h2>Usuários ({users.length})</h2>
          <span className="toggle-icon">{expandedSections.users ? '−' : '+'}</span>
        </div>
        {expandedSections.users && (
        <div>
          <div className="filter-section">
            <input
              type="text"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              placeholder="Filtrar por nome..."
              className="input"
            />
          </div>
          <div className="users-list">
          {users.filter((user: any) => 
            !userFilter || 
            user.nome?.toLowerCase().includes(userFilter.toLowerCase()) ||
            user.email?.toLowerCase().includes(userFilter.toLowerCase())
          ).map((user: any) => (
            <div key={user.id} className="user-item">
              <div className="user-info">
                <span className="user-name">{user.nome}</span>
                <span className="user-email">{user.email}</span>
                <div className="user-badges">
                  <span className={`badge ${user.perfil}`}>{user.perfil}</span>
                  {user.perfil === 'user' && (
                    <span className={`badge tipo-${user.tipo}`}>{formatUserType(user.tipo)}</span>
                  )}
                  {user.jornada && (
                    <span className="badge" style={{backgroundColor: '#6c757d', color: 'white'}}>
                      Jornada: {(() => {
                        let totalMinutos = 0;
                        user.jornada.forEach((j: any) => {
                          const [entradaH, entradaM] = j.entrada.split(':').map(Number);
                          const [saidaH, saidaM] = j.saida.split(':').map(Number);
                          const entradaMin = entradaH * 60 + entradaM;
                          const saidaMin = saidaH * 60 + saidaM;
                          totalMinutos += saidaMin - entradaMin;
                        });
                        const horas = Math.floor(totalMinutos / 60);
                        const minutos = totalMinutos % 60;
                        return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
                      })()}
                    </span>
                  )}
                </div>
              </div>
              <div className="user-actions">
                <button 
                  onClick={() => setEditingUser(user)} 
                  className="btn-secondary"
                >
                  Alterar Senha
                </button>
                <button 
                  onClick={() => {
                    setEditingUserName(user);
                    setNewName(user.nome || '');
                  }} 
                  className="btn-secondary"
                >
                  Alterar Nome
                </button>
                {user.perfil === 'user' && (
                  <button 
                    onClick={() => {
                      setEditingUserTipo(user);
                      setNewTipo(user.tipo || 'motorista');
                    }} 
                    className="btn-secondary"
                  >
                    Alterar Tipo
                  </button>
                )}
                <button 
                  onClick={() => {
                    setEditingUserJornada(user);
                    setNewJornada(user.jornada || [{entrada: '08:00', saida: '17:00'}]);
                  }} 
                  className="btn-secondary"
                >
                  Alterar Jornada
                </button>
                <button 
                  onClick={() => handleDeleteUser(user)} 
                  className="btn-danger"
                >
                  Deletar
                </button>
              </div>
            </div>
          ))}
          </div>
        </div>
        )}
        
        {editingUser && (
          <div className="modal">
            <div className="modal-content">
              <h3>Alterar senha - {editingUser.email}</h3>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nova senha (mínimo 6 caracteres)"
                className="input"
                minLength={6}
              />
              <div className="modal-actions">
                <button onClick={handleChangePassword} disabled={loading || newPassword.length < 6} className="btn-primary">
                  {loading ? 'Alterando...' : 'Alterar'}
                </button>
                <button onClick={() => { setEditingUser(null); setNewPassword(''); }} className="btn-secondary">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
        
        {editingUserName && (
          <div className="modal">
            <div className="modal-content">
              <h3>Alterar nome - {editingUserName.email}</h3>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome completo"
                className="input"
              />
              <div className="modal-actions">
                <button onClick={handleChangeName} disabled={loading} className="btn-primary">
                  {loading ? 'Alterando...' : 'Alterar'}
                </button>
                <button onClick={() => { setEditingUserName(null); setNewName(''); }} className="btn-secondary">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
        
        {editingUserTipo && (
          <div className="modal">
            <div className="modal-content">
              <h3>Alterar tipo - {editingUserTipo.email}</h3>
              <select
                value={newTipo}
                onChange={(e) => setNewTipo(e.target.value)}
                className="input"
              >
                <option value="motorista">🚗 Motorista</option>
                <option value="copiloto">👥 Monitora</option>
              </select>
              <div className="modal-actions">
                <button onClick={handleChangeTipo} disabled={loading} className="btn-primary">
                  {loading ? 'Alterando...' : 'Alterar'}
                </button>
                <button onClick={() => { setEditingUserTipo(null); setNewTipo(''); }} className="btn-secondary">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
        
        {editingUserJornada && (
          <div className="modal">
            <div className="modal-content">
              <h3>Alterar jornada - {editingUserJornada.nome || editingUserJornada.email}</h3>
              <div style={{marginBottom: '15px'}}>
                <label>Horários de trabalho:</label>
                {newJornada.map((horario, index) => (
                  <div key={index} style={{display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px'}}>
                    <input
                      type="time"
                      value={horario.entrada}
                      onChange={(e) => {
                        const updated = [...newJornada];
                        updated[index].entrada = e.target.value;
                        setNewJornada(updated);
                      }}
                      className="input"
                      style={{flex: 1}}
                    />
                    <span>até</span>
                    <input
                      type="time"
                      value={horario.saida}
                      onChange={(e) => {
                        const updated = [...newJornada];
                        updated[index].saida = e.target.value;
                        setNewJornada(updated);
                      }}
                      className="input"
                      style={{flex: 1}}
                    />
                    {newJornada.length > 1 && (
                      <button 
                        onClick={() => {
                          const updated = newJornada.filter((_, i) => i !== index);
                          setNewJornada(updated);
                        }}
                        className="btn-danger"
                        style={{padding: '5px 10px', fontSize: '12px'}}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button 
                  onClick={() => setNewJornada([...newJornada, {entrada: '08:00', saida: '17:00'}])}
                  className="btn-secondary"
                  style={{marginTop: '10px'}}
                >
                  + Adicionar Horário
                </button>
              </div>
              <div className="modal-actions">
                <button onClick={handleChangeJornada} disabled={loading} className="btn-primary">
                  {loading ? 'Alterando...' : 'Alterar'}
                </button>
                <button onClick={() => { 
                  setEditingUserJornada(null); 
                  setNewJornada([{entrada: '08:00', saida: '17:00'}]); 
                }} className="btn-secondary">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
        

      </section>

      <section className="admin-section">
        <div className="section-header" onClick={() => toggleSection('records')}>
          <h2>Registros ({records.length})</h2>
          <div className="section-actions" onClick={(e) => e.stopPropagation()}>
            <button onClick={exportCSV} className="btn-secondary">CSV</button>
            <button onClick={exportExcel} className="btn-secondary">Excel</button>
            <button onClick={exportPDF} className="btn-secondary">PDF</button>
            <span className="toggle-icon">{expandedSections.records ? '−' : '+'}</span>
          </div>
        </div>
        {expandedSections.records && (
        <div>
          <div className="chart-filters">
            <input
              type="date"
              value={recordFilters.startDate}
              onChange={(e) => setRecordFilters(prev => ({...prev, startDate: e.target.value}))}
              placeholder="Data inicial"
              className="input"
            />
            <input
              type="date"
              value={recordFilters.endDate}
              onChange={(e) => setRecordFilters(prev => ({...prev, endDate: e.target.value}))}
              placeholder="Data final"
              className="input"
            />
            <select
              value={recordFilters.selectedUser}
              onChange={(e) => setRecordFilters(prev => ({...prev, selectedUser: e.target.value}))}
              className="input"
            >
              <option value="">Todos os usuários</option>
              {users.sort((a, b) => (a.nome || a.email).localeCompare(b.nome || b.email)).map((user: any) => (
                <option key={user.uid} value={user.uid}>{user.nome || user.email}</option>
              ))}
            </select>
            <input
              type="text"
              value={recordFilters.rotaSearch}
              onChange={(e) => setRecordFilters(prev => ({...prev, rotaSearch: e.target.value}))}
              placeholder="Buscar rota (ex: São Paulo, Rio)"
              className="input"
            />
            <label style={{display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px'}}>
              <input
                type="checkbox"
                checked={recordFilters.showOnlyOpen}
                onChange={(e) => setRecordFilters(prev => ({...prev, showOnlyOpen: e.target.checked}))}
              />
              Apenas em aberto
            </label>
            <button onClick={() => setRecordFilters({startDate: '', endDate: '', selectedUser: '', showOnlyOpen: false, rotaSearch: ''})} className="btn-secondary">
              Limpar
            </button>
          </div>
          <div className="records-table">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Van</th>
                  <th>Rota</th>
                  <th>KM Inicial</th>
                  <th>Data Abertura</th>
                  <th>KM Final</th>
                  <th>Data Fechamento</th>
                  <th>Distância</th>
                  <th>Diário</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {records.filter((record: any) => {
                  if (recordFilters.selectedUser && record.userId !== recordFilters.selectedUser) {
                    return false;
                  }
                  
                  if (recordFilters.startDate || recordFilters.endDate) {
                    const recordDate = new Date(record.abertura?.dataHora);
                    
                    if (recordFilters.startDate) {
                      const startDate = new Date(recordFilters.startDate + 'T00:00:00-03:00');
                      if (recordDate < startDate) {
                        return false;
                      }
                    }
                    if (recordFilters.endDate) {
                      const endDate = new Date(recordFilters.endDate + 'T23:59:59-03:00');
                      if (recordDate > endDate) {
                        return false;
                      }
                    }
                  }
                  
                  if (recordFilters.showOnlyOpen && record.fechamento) {
                    return false;
                  }
                  
                  if (recordFilters.rotaSearch) {
                    const rota = `${record.origem || ''} ${record.destino || ''}`.toLowerCase();
                    if (!rota.includes(recordFilters.rotaSearch.toLowerCase())) {
                      return false;
                    }
                  }
                  
                  return true;
                }).slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage).map((record: any) => {
                  const user = users.find(u => u.uid === record.userId);
                  const distancia = record.fechamento?.kmFinal && record.abertura?.kmInicial 
                    ? record.fechamento.kmFinal - record.abertura.kmInicial 
                    : null;
                  return (
                    <tr key={record.id}>
                      <td>{user?.nome || ''}</td>
                      <td>{formatUserType(user?.tipo || 'motorista').toUpperCase()}</td>
                      <td>{user?.tipo === 'copiloto' ? '-' : (record.placa?.toUpperCase() || '-')}</td>
                      <td>{record.origem && record.destino ? `${record.origem} → ${record.destino}` : '-'}</td>
                      <td>{user?.tipo === 'copiloto' ? '-' : (record.abertura?.kmInicial || '')}</td>
                      <td>{record.abertura?.dataHora ? new Date(record.abertura.dataHora).toLocaleString('pt-BR', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'}) : ''}</td>
                      <td>{user?.tipo === 'copiloto' ? '-' : (record.fechamento?.kmFinal || 'Em aberto')}</td>
                      <td>{record.fechamento?.dataHora ? new Date(record.fechamento.dataHora).toLocaleString('pt-BR', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'}) : 'Em aberto'}</td>
                      <td>{user?.tipo === 'copiloto' || !distancia ? '-' : `${distancia} km`}</td>
                      <td>{record.fechamento?.diarioBordo || '-'}</td>
                      <td>
                        <div className="record-actions">
                          <button 
                            onClick={() => {
                              setEditingRecord(record);
                              const formatDateForInput = (dateString: string) => {
                                if (!dateString) return '';
                                const date = new Date(dateString);
                                // Ajustar para fuso horário brasileiro (UTC-3)
                                const offsetMs = date.getTimezoneOffset() * 60 * 1000;
                                const localDate = new Date(date.getTime() - offsetMs);
                                return localDate.toISOString().slice(0, 16);
                              };
                              
                              setEditRecordData({
                                kmInicial: record.abertura?.kmInicial?.toString() || '',
                                kmFinal: record.fechamento?.kmFinal?.toString() || '',
                                dataAbertura: formatDateForInput(record.abertura?.dataHora),
                                dataFechamento: formatDateForInput(record.fechamento?.dataHora),
                                diarioBordo: record.fechamento?.diarioBordo || ''
                              });
                            }} 
                            className="btn-secondary btn-small"
                          >
                            Editar
                          </button>
                          <button 
                            onClick={() => handleCancelRecord(record)} 
                            className="btn-danger btn-small"
                          >
                            Deletar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* Paginação */}
            {(() => {
              const filteredRecordsForPagination = records.filter((record: any) => {
                if (recordFilters.selectedUser && record.userId !== recordFilters.selectedUser) {
                  return false;
                }
                
                if (recordFilters.startDate || recordFilters.endDate) {
                  const recordDate = new Date(record.abertura?.dataHora);
                  
                  if (recordFilters.startDate) {
                    const startDate = new Date(recordFilters.startDate + 'T00:00:00-03:00');
                    if (recordDate < startDate) {
                      return false;
                    }
                  }
                  if (recordFilters.endDate) {
                    const endDate = new Date(recordFilters.endDate + 'T23:59:59-03:00');
                    if (recordDate > endDate) {
                      return false;
                    }
                  }
                }
                
                if (recordFilters.showOnlyOpen && record.fechamento) {
                  return false;
                }
                
                if (recordFilters.rotaSearch) {
                  const rota = `${record.origem || ''} ${record.destino || ''}`.toLowerCase();
                  if (!rota.includes(recordFilters.rotaSearch.toLowerCase())) {
                    return false;
                  }
                }
                
                return true;
              });
              
              const totalPages = Math.ceil(filteredRecordsForPagination.length / recordsPerPage);
              
              return (
                <div className="pagination" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '20px'}}>
                  <button 
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} 
                    disabled={currentPage === 1}
                    className="btn-secondary"
                  >
                    Anterior
                  </button>
                  <span>Página {currentPage} de {totalPages}</span>
                  <button 
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} 
                    disabled={currentPage >= totalPages}
                    className="btn-secondary"
                  >
                    Próxima
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
        )}
      </section>
      
      {editingRecord && (
        <div className="modal">
          <div className="modal-content">
            <h3>Editar Registro</h3>
            <div className="form-group">
              <div style={{marginBottom: '15px'}}>
                <label>KM Inicial:</label>
                <input
                  type="number"
                  value={editRecordData.kmInicial}
                  onChange={(e) => setEditRecordData(prev => ({...prev, kmInicial: e.target.value}))}
                  className="input"
                  style={{width: '100%', marginTop: '5px'}}
                />
              </div>
              <div style={{marginBottom: '15px'}}>
                <label>Data/Hora Abertura:</label>
                <div style={{display: 'flex', gap: '10px', marginTop: '5px'}}>
                  <input
                    type="date"
                    value={editRecordData.dataAbertura.split('T')[0] || ''}
                    onChange={(e) => {
                      const time = editRecordData.dataAbertura.split('T')[1] || '00:00';
                      setEditRecordData(prev => ({...prev, dataAbertura: `${e.target.value}T${time}`}));
                    }}
                    className="input"
                    style={{flex: 1}}
                  />
                  <input
                    type="time"
                    value={editRecordData.dataAbertura.split('T')[1] || ''}
                    onChange={(e) => {
                      const date = editRecordData.dataAbertura.split('T')[0] || new Date().toISOString().split('T')[0];
                      setEditRecordData(prev => ({...prev, dataAbertura: `${date}T${e.target.value}`}));
                    }}
                    className="input"
                    style={{flex: 1}}
                  />
                </div>
              </div>
              <div style={{marginBottom: '15px'}}>
                <label>KM Final:</label>
                <input
                  type="number"
                  value={editRecordData.kmFinal}
                  onChange={(e) => setEditRecordData(prev => ({...prev, kmFinal: e.target.value}))}
                  className="input"
                  style={{width: '100%', marginTop: '5px'}}
                />
              </div>
              <div style={{marginBottom: '15px'}}>
                <label>Data/Hora Fechamento:</label>
                <div style={{display: 'flex', gap: '10px', marginTop: '5px'}}>
                  <input
                    type="date"
                    value={editRecordData.dataFechamento.split('T')[0] || ''}
                    onChange={(e) => {
                      const time = editRecordData.dataFechamento.split('T')[1] || '00:00';
                      setEditRecordData(prev => ({...prev, dataFechamento: `${e.target.value}T${time}`}));
                    }}
                    className="input"
                    style={{flex: 1}}
                  />
                  <input
                    type="time"
                    value={editRecordData.dataFechamento.split('T')[1] || ''}
                    onChange={(e) => {
                      const date = editRecordData.dataFechamento.split('T')[0] || new Date().toISOString().split('T')[0];
                      setEditRecordData(prev => ({...prev, dataFechamento: `${date}T${e.target.value}`}));
                    }}
                    className="input"
                    style={{flex: 1}}
                  />
                </div>
              </div>
              <div>
                <label>Diário de Bordo:</label>
                <textarea
                  value={editRecordData.diarioBordo}
                  onChange={(e) => setEditRecordData(prev => ({...prev, diarioBordo: e.target.value}))}
                  className="input"
                  style={{width: '100%', height: '80px', marginTop: '5px'}}
                  placeholder="Observações da viagem..."
                />
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={handleEditRecord} disabled={loading} className="btn-primary">
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
              <button onClick={() => {
                setEditingRecord(null);
                setEditRecordData({kmInicial: '', kmFinal: '', dataAbertura: '', dataFechamento: '', diarioBordo: ''});
              }} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="admin-section">
        <div className="section-header" onClick={() => toggleSection('jornadas')}>
          <h2>Relatório de Jornadas</h2>
          <div className="section-actions" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => openJornadaModal('csv')} className="btn-secondary">CSV</button>
            <button onClick={() => openJornadaModal('excel')} className="btn-secondary">Excel</button>
            <button onClick={() => openJornadaModal('pdf')} className="btn-secondary">PDF</button>
            <span className="toggle-icon">{expandedSections.jornadas ? '−' : '+'}</span>
          </div>
        </div>
        {expandedSections.jornadas && <JornadasSection />}
      </section>

      <section className="admin-section">
        <div className="section-header" onClick={() => toggleSection('dashboard')}>
          <h2>Dashboard - Registros em Aberto</h2>
          <span className="toggle-icon">{expandedSections.dashboard ? '−' : '+'}</span>
        </div>
        {expandedSections.dashboard && (
        <div className="dashboard-section" style={{padding: '20px'}}>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
            {/* Dashboard Motoristas */}
            <div className="dashboard-card" style={{background: '#e7f3ff', padding: '20px', borderRadius: '8px', border: '2px solid #007bff'}}>
              <h3 style={{color: '#0056b3', marginBottom: '15px'}}>🚗 Motoristas em Aberto</h3>
              <div style={{fontSize: '2em', fontWeight: 'bold', color: '#007bff', marginBottom: '15px'}}>
                {openRecords.filter(r => {
                  const user = users.find(u => u.uid === r.userId);
                  return user && (user.tipo === 'motorista' || !user.tipo);
                }).length}
              </div>
              <div className="records-list" style={{maxHeight: '300px', overflowY: 'auto'}}>
                {openRecords.filter(r => {
                  const user = users.find(u => u.uid === r.userId);
                  return user && (user.tipo === 'motorista' || !user.tipo);
                }).map((record: any) => {
                  const user = users.find(u => u.uid === record.userId);
                  return (
                    <div key={record.id} style={{padding: '10px', background: 'white', marginBottom: '8px', borderRadius: '4px', fontSize: '14px'}}>
                      <strong>{user?.nome}</strong><br/>
                      Van: {record.placa?.toUpperCase() || 'N/A'}<br/>
                      Rota: {record.origem && record.destino ? `${record.origem} → ${record.destino}` : 'N/A'}<br/>
                      Abertura: {record.abertura?.dataHora ? new Date(record.abertura.dataHora).toLocaleString('pt-BR') : 'N/A'}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Dashboard Mentoras */}
            <div className="dashboard-card" style={{background: '#d4edda', padding: '20px', borderRadius: '8px', border: '2px solid #28a745'}}>
              <h3 style={{color: '#155724', marginBottom: '15px'}}>👥 Monitoras em Aberto</h3>
              <div style={{fontSize: '2em', fontWeight: 'bold', color: '#28a745', marginBottom: '15px'}}>
                {openRecords.filter(r => {
                  const user = users.find(u => u.uid === r.userId);
                  return user && user.tipo === 'copiloto';
                }).length}
              </div>
              <div className="records-list" style={{maxHeight: '300px', overflowY: 'auto'}}>
                {openRecords.filter(r => {
                  const user = users.find(u => u.uid === r.userId);
                  return user && user.tipo === 'copiloto';
                }).map((record: any) => {
                  const user = users.find(u => u.uid === record.userId);
                  return (
                    <div key={record.id} style={{padding: '10px', background: 'white', marginBottom: '8px', borderRadius: '4px', fontSize: '14px'}}>
                      <strong>{user?.nome}</strong><br/>
                      Rota: {record.origem && record.destino ? `${record.origem} → ${record.destino}` : 'N/A'}<br/>
                      Abertura: {record.abertura?.dataHora ? new Date(record.abertura.dataHora).toLocaleString('pt-BR') : 'N/A'}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div style={{marginTop: '20px', textAlign: 'center', fontSize: '12px', color: '#666'}}>
            Última atualização: {new Date().toLocaleTimeString('pt-BR')} (Atualiza automaticamente a cada 5 minutos)
          </div>
        </div>
        )}
      </section>

      <section className="admin-section">
        <div className="section-header" onClick={() => toggleSection('charts')}>
          <h2>Gráficos</h2>
          <span className="toggle-icon">{expandedSections.charts ? '−' : '+'}</span>
        </div>
        {expandedSections.charts && (
        <div className="charts-section">
          <div className="chart-filters">
            <input
              type="date"
              value={chartFilters.startDate}
              onChange={(e) => setChartFilters(prev => ({...prev, startDate: e.target.value}))}
              placeholder="Data inicial"
              className="input"
            />
            <input
              type="date"
              value={chartFilters.endDate}
              onChange={(e) => setChartFilters(prev => ({...prev, endDate: e.target.value}))}
              placeholder="Data final"
              className="input"
            />
            <select
              value={chartFilters.selectedUser}
              onChange={(e) => setChartFilters(prev => ({...prev, selectedUser: e.target.value}))}
              className="input"
            >
              <option value="">Todos os usuários</option>
              {users.map((user: any) => (
                <option key={user.uid} value={user.uid}>
                  {user.nome || user.email} - {formatUserType(user.tipo || 'motorista')}
                </option>
              ))}
            </select>
            <button onClick={() => setChartFilters({startDate: '', endDate: '', selectedUser: ''})} className="btn-secondary">
              Limpar
            </button>
          </div>
          
          
          <div className="charts-container">
            <div className="chart-item">
              <h3>Comparação KM Últimos 7 Dias - Motoristas (Pizza)</h3>
              <div className="pie-chart-wrapper">
                <svg className="pie-chart-svg" width="200" height="200" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="80" fill="#f8f9fa" stroke="#dee2e6" strokeWidth="1"/>
                  {generateLast7DaysPieChart()}
                </svg>
                <div className="pie-legend">
                  {generateLast7DaysLegend()}
                </div>
              </div>
            </div>
            
            <div className="chart-item">
              <h3>KM por Dia da Semana - Motoristas vs Monitoras (Barras)</h3>
              <div className="bar-chart">
                {generateWeekdayChart()}
              </div>
            </div>
            
            <div className="chart-item">
              <h3>Registros por Van x Motorista (Barras)</h3>
              <div className="bar-chart">
                {generateVanMotoristaOnlyChart()}
              </div>
            </div>
            
            <div className="chart-item">
              <h3>Monitora x Registros (Barras)</h3>
              <div className="bar-chart">
                {generateMonitoraChart()}
              </div>
            </div>
          </div>
        </div>
        )}
      </section>

      {showJornadaModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Configurar Jornada Normal</h3>
            <div className="form-group">
              <label>Jornada Normal (horas por dia):</label>
              <input
                type="text"
                value={jornadaNormal}
                onChange={(e) => {
                  let value = e.target.value.replace(/[^0-9:]/g, '');
                  if (value.length === 2 && !value.includes(':')) {
                    value = value + ':';
                  }
                  if (value.length <= 5) {
                    setJornadaNormal(value);
                  }
                }}
                placeholder="08:00"
                maxLength={5}
                className="input"
                readOnly={jornadasFilters.selectedUser ? true : false}
              />
              <small>
                {jornadasFilters.selectedUser ? 
                  'Jornada preenchida automaticamente com base no usuário selecionado' :
                  'Formato: HH:MM (ex: 08:00 para 8 horas, 08:30 para 8h30min)'
                }
              </small>
            </div>
            <div className="modal-actions">
              <button 
                onClick={() => {
                  if (exportType === 'csv') exportJornadasCSV();
                  else if (exportType === 'excel') exportJornadasExcel();
                  else if (exportType === 'pdf') exportJornadasPDF();
                }} 
                className="btn-primary"
              >
                Exportar {exportType.toUpperCase()}
              </button>
              <button onClick={() => setShowJornadaModal(false)} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}