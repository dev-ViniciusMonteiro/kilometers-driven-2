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
                onClick={() => handleDeleteRota(rota.id)} 
                className="btn-danger btn-small"
              >
                Deletar
              </button>
            </div>
          </div>
        )) : <p>Nenhuma rota cadastrada</p>}
      </div>
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
          className="input"
          style={{width: '300px'}}
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
                className="input"
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
  // Função helper para de-para copiloto -> mentora
  const formatUserType = (tipo: string) => {
    return tipo === 'copiloto' ? 'mentora' : tipo;
  };

  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserNome, setNewUserNome] = useState('');
  const [newUserPerfil, setNewUserPerfil] = useState('user');
  const [newUserTipo, setNewUserTipo] = useState('motorista');
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [editingUserName, setEditingUserName] = useState<any>(null);
  const [newName, setNewName] = useState('');
  const [editingUserTipo, setEditingUserTipo] = useState<any>(null);
  const [newTipo, setNewTipo] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    createUser: false,
    vans: false,
    rotas: false,
    users: false,
    records: false,
    charts: false,
    jornadas: false
  });
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
          tipo: userData.tipo || 'motorista'
        };
      });
      
      setUsers(usersData);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const loadRecords = async () => {
    const recordsData = await getAllRecords(50);
    setRecords(recordsData);
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword || !newUserNome) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newUserEmail, password: newUserPassword, nome: newUserNome, perfil: newUserPerfil, tipo: newUserTipo })
      });
      
      if (response.ok) {
        const userData = await response.json();
        loadUsers();
        const tipoTexto = newUserPerfil === 'admin' ? 'Administrador' : (newUserTipo === 'motorista' ? 'Motorista' : 'Mentora');
        alert(`Usuário criado com sucesso!\n\nNome: ${newUserNome}\nEmail: ${newUserEmail}\nSenha: ${newUserPassword}\nTipo: ${tipoTexto}\n\nCopie estes dados para o cliente.`);
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserNome('');
        setNewUserPerfil('user');
        setNewUserTipo('motorista');
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
          const startDate = new Date(recordFilters.startDate + 'T00:00:00');
          if (recordDate < startDate) {
            return false;
          }
        }
        if (recordFilters.endDate) {
          const endDate = new Date(recordFilters.endDate + 'T23:59:59');
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
      data.push([`Período: ${recordFilters.startDate ? new Date(recordFilters.startDate).toLocaleDateString('pt-BR') : 'Todas'} até ${recordFilters.endDate ? new Date(recordFilters.endDate).toLocaleDateString('pt-BR') : 'Todas'}`]);
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
      data.push([`Período: ${recordFilters.startDate ? new Date(recordFilters.startDate).toLocaleDateString('pt-BR') : 'Todas'} até ${recordFilters.endDate ? new Date(recordFilters.endDate).toLocaleDateString('pt-BR') : 'Todas'}`]);
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
    data.push(['Nome', 'Rota', 'Data Abertura', 'Data Fechamento']);
    
    filteredRecords.forEach(record => {
      const user = users.find(u => u.uid === record.userId);
      data.push([
        user?.nome || '',
        record.origem && record.destino ? `${record.origem} → ${record.destino}` : '-',
        record.abertura?.dataHora ? new Date(record.abertura.dataHora).toLocaleString('pt-BR') : '',
        record.fechamento?.dataHora ? new Date(record.fechamento.dataHora).toLocaleString('pt-BR') : 'Em aberto'
      ]);
    });
    
    return data;
  };

  const openJornadaModal = (type: string) => {
    setExportType(type);
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
    
    const data = [];
    data.push(['Nome', 'Data', 'Entrada', 'Saída', 'Horas Trabalhadas', 'Jornada Normal', 'Diferença']);
    
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
          entradas: [],
          saidas: []
        };
      }
      
      if (record.abertura?.dataHora) {
        groupedData[key].entradas.push(new Date(record.abertura.dataHora).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit', hour12: false}));
      }
      if (record.fechamento?.dataHora) {
        groupedData[key].saidas.push(new Date(record.fechamento.dataHora).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit', hour12: false}));
      }
    });
    
    Object.values(groupedData).forEach((group: any) => {
      const entradas = group.entradas.join(', ');
      const saidas = group.saidas.join(', ');
      
      // Calcular total de horas (simplificado)
      let totalHoras = 0;
      const registrosDoDia = filteredRecords.filter(r => {
        const user = users.find(u => u.uid === r.userId);
        const date = r.abertura?.dataHora ? new Date(r.abertura.dataHora).toLocaleDateString('pt-BR') : '';
        return user?.nome === group.nome && date === group.data && r.fechamento?.dataHora;
      });
      
      registrosDoDia.forEach(r => {
        totalHoras += calculateWorkHours(r.abertura.dataHora, r.fechamento.dataHora);
      });
      
      const [horas, minutos] = jornadaNormal.split(':').map(Number);
      const jornadaNormalHoras = horas + (minutos / 60);
      const diferenca = totalHoras - jornadaNormalHoras;
      const diferencaTexto = diferenca > 0 ? `+${diferenca.toFixed(2)}h` : `${diferenca.toFixed(2)}h`;
      
      data.push([
        group.nome,
        group.data,
        entradas,
        saidas,
        `${totalHoras.toFixed(2)}h`,
        jornadaNormal,
        diferencaTexto
      ]);
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
            {users.map((user: any) => (
              <option key={user.uid} value={user.uid}>{user.nome || user.email}</option>
            ))}
          </select>
          <button onClick={() => setJornadasFilters({startDate: '', endDate: '', selectedUser: ''})} className="btn-secondary">
            Limpar
          </button>
        </div>
        <div className="records-table">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Rota</th>
                <th>Data Abertura</th>
                <th>Data Fechamento</th>
              </tr>
            </thead>
            <tbody>
              {records.filter((record: any) => {
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
              }).map((record: any) => {
                const user = users.find(u => u.uid === record.userId);
                return (
                  <tr key={record.id}>
                    <td>{user?.nome || ''}</td>
                    <td>{record.origem && record.destino ? `${record.origem} → ${record.destino}` : '-'}</td>
                    <td>{record.abertura?.dataHora ? new Date(record.abertura.dataHora).toLocaleString('pt-BR') : ''}</td>
                    <td>{record.fechamento?.dataHora ? new Date(record.fechamento.dataHora).toLocaleString('pt-BR') : 'Em aberto'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
      doc.text(`Período: ${recordFilters.startDate ? new Date(recordFilters.startDate).toLocaleDateString('pt-BR') : 'Todas'} até ${recordFilters.endDate ? new Date(recordFilters.endDate).toLocaleDateString('pt-BR') : 'Todas'}`, 14, y + 20);
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
    // Trigger refresh for VanManagement component
    window.location.reload();
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
        if (chartFilters.startDate && recordDate < new Date(chartFilters.startDate)) {
          return false;
        }
        if (chartFilters.endDate && recordDate > new Date(chartFilters.endDate + 'T23:59:59')) {
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
        email: `Mentoras (${copilotoRecords.length})`,
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

  const generateBarChart = (): any => {
    const filteredRecords = getFilteredRecords();
    
    const motoristaRecords = filteredRecords.filter((r: any) => {
      const user = users.find(u => u.uid === r.userId);
      return user && (user.tipo === 'motorista' || !user.tipo) && r.fechamento?.kmFinal;
    });
    
    const copilotoRecords = filteredRecords.filter((r: any) => {
      const user = users.find(u => u.uid === r.userId);
      return user && user.tipo === 'copiloto' && r.fechamento?.kmFinal;
    });
    
    const motoristaKm = motoristaRecords.reduce((sum: number, record: any) => {
      return sum + (record.fechamento.kmFinal - record.abertura.kmInicial);
    }, 0);
    
    const copilotoKm = copilotoRecords.reduce((sum: number, record: any) => {
      return sum + (record.fechamento.kmFinal - record.abertura.kmInicial);
    }, 0);
    
    const motoristaViagens = motoristaRecords.length;
    const copilotoViagens = copilotoRecords.length;
    
    const stats: any[] = [];
    if (motoristaKm > 0) stats.push({ label: 'Motoristas', totalKm: motoristaKm, count: motoristaViagens });
    if (copilotoKm > 0) stats.push({ label: 'Mentoras', totalKm: copilotoKm, count: copilotoViagens });
    
    const maxKm = Math.max(...stats.map((s: any) => s.totalKm), 1);
    
    return (
      <div className="bar-chart-container">
        {(stats as any[]).map((stat: any, index: number) => (
          <div key={stat.label} className="bar-item">
            <div className="bar-label">{stat.label} ({stat.count} viagens)</div>
            <div className="bar-wrapper">
              <div 
                className="bar" 
                style={{ width: `${(stat.totalKm / maxKm) * 100}%` }}
              ></div>
              <span className="bar-value">{stat.totalKm} km</span>
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
              <option value="copiloto">👥 Mentora</option>
            </select>
          )}
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
                <option value="copiloto">👥 Mentora</option>
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
              {users.map((user: any) => (
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
                      const startDate = new Date(recordFilters.startDate + 'T00:00:00');
                      if (recordDate < startDate) {
                        return false;
                      }
                    }
                    if (recordFilters.endDate) {
                      const endDate = new Date(recordFilters.endDate + 'T23:59:59');
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
                }).map((record: any) => {
                  const user = users.find(u => u.uid === record.userId);
                  const distancia = record.fechamento?.kmFinal && record.abertura?.kmInicial 
                    ? record.fechamento.kmFinal - record.abertura.kmInicial 
                    : null;
                  return (
                    <tr key={record.id}>
                      <td>{user?.nome || ''}</td>
                      <td>{formatUserType(user?.tipo || 'motorista')}</td>
                      <td>{user?.tipo === 'copiloto' ? '-' : (record.placa || '-')}</td>
                      <td>{record.origem && record.destino ? `${record.origem} → ${record.destino}` : '-'}</td>
                      <td>{user?.tipo === 'copiloto' ? '-' : (record.abertura?.kmInicial || '')}</td>
                      <td>{record.abertura?.dataHora ? new Date(record.abertura.dataHora).toLocaleString('pt-BR') : ''}</td>
                      <td>{user?.tipo === 'copiloto' ? '-' : (record.fechamento?.kmFinal || 'Em aberto')}</td>
                      <td>{record.fechamento?.dataHora ? new Date(record.fechamento.dataHora).toLocaleString('pt-BR') : 'Em aberto'}</td>
                      <td>{user?.tipo === 'copiloto' || !distancia ? '-' : `${distancia} km`}</td>
                      <td>{record.fechamento?.diarioBordo || '-'}</td>
                      <td>
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
                          style={{marginRight: '5px'}}
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => handleCancelRecord(record)} 
                          className="btn-danger btn-small"
                        >
                          Deletar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
            {!chartFilters.selectedUser && (
            <div className="chart-item">
              <h3>Registros por Tipo (Pizza)</h3>
              <div className="pie-chart-wrapper">
                <svg className="pie-chart-svg" width="200" height="200" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="80" fill="#f8f9fa" stroke="#dee2e6" strokeWidth="1"/>
                  {generatePieSlices()}
                </svg>
                <div className="pie-legend">
                  {generatePieLegend()}
                </div>
              </div>
            </div>
            )}
            <div className="chart-item">
              <h3>Total KM por Tipo (Barras)</h3>
              <div className="bar-chart">
                {generateBarChart()}
              </div>
            </div>
            <div className="chart-item">
              <h3>Registros por Van x Motorista (Barras)</h3>
              <div className="bar-chart">
                {generateVanMotoristaChart()}
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
              />
              <small>Formato: HH:MM (ex: 08:00 para 8 horas, 08:30 para 8h30min)</small>
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