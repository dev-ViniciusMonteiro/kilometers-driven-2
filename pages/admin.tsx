import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../lib/firebase';
import { createUser } from '../lib/auth';
import { getAllRecords } from '../lib/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';

function VanManagement() {
  const [vans, setVans] = useState<any[]>([]);
  const [newVanPlaca, setNewVanPlaca] = useState('');
  const [newVanKm, setNewVanKm] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editingVan, setEditingVan] = useState<any>(null);
  const [editVanKm, setEditVanKm] = useState('');

  useEffect(() => {
    loadVans();
  }, []);

  const loadVans = async () => {
    try {
      const response = await fetch('/api/vans/list');
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
    if (!editingVan || !editVanKm) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/vans/update-km', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingVan.id, kmAtual: parseInt(editVanKm) })
      });
      
      if (response.ok) {
        alert('KM atualizado com sucesso!');
        setEditingVan(null);
        setEditVanKm('');
        loadVans();
      } else {
        alert('Erro ao atualizar KM');
      }
    } catch (error) {
      alert('Erro ao atualizar KM');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVan = async (vanId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta van?')) return;
    
    try {
      const response = await fetch('/api/vans/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: vanId })
      });
      
      if (response.ok) {
        loadVans();
        alert('Van deletada com sucesso!');
      } else {
        alert('Erro ao deletar van');
      }
    } catch (error) {
      alert('Erro ao deletar van');
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
        />
        <input
          type="number"
          value={newVanKm}
          onChange={(e) => setNewVanKm(Number(e.target.value))}
          placeholder="KM inicial"
          className="input"
        />
        <button onClick={handleCreateVan} disabled={loading} className="btn-primary">
          {loading ? 'Cadastrando...' : 'Cadastrar Van'}
        </button>
      </div>

      <div className="vans-list" style={{padding: '20px', paddingTop: '0'}}>
        <h3>Vans Cadastradas ({Array.isArray(vans) ? vans.length : 0})</h3>
        {Array.isArray(vans) && vans.length > 0 ? vans.map(van => (
          <div key={van.id} className="van-item">
            <div className="van-info">
              <span className="van-placa">{van.placa}</span>
              <span className="van-km">KM Atual: {van.kmAtual}</span>
            </div>
            <div className="van-actions">
              <button 
                onClick={() => {
                  setEditingVan(van);
                  setEditVanKm(van.kmAtual.toString());
                }} 
                className="btn-secondary btn-small"
              >
                Editar
              </button>
              <button 
                onClick={() => handleDeleteVan(van.id)} 
                className="btn-danger btn-small"
              >
                Deletar
              </button>
            </div>
          </div>
        )) : <p>Nenhuma van cadastrada</p>}
      </div>
      
      {editingVan && (
        <div className="modal">
          <div className="modal-content">
            <h3>Editar Van - {editingVan.placa}</h3>
            <div className="form-group">
              <label>KM Atual:</label>
              <input
                type="number"
                value={editVanKm}
                onChange={(e) => setEditVanKm(e.target.value)}
                placeholder={editingVan.kmAtual.toString()}
                className="input"
              />
            </div>
            <div className="modal-actions">
              <button onClick={handleEditVan} disabled={!editVanKm || loading} className="btn-primary">
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
              <button onClick={() => { 
                setEditingVan(null); 
                setEditVanKm(''); 
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
    users: false,
    records: false,
    charts: false
  });
  const [chartFilters, setChartFilters] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    selectedUser: ''
  });
  const [recordFilters, setRecordFilters] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    selectedUser: ''
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
      const userIds = snapshot.docs.map(doc => doc.data().uid);
      
      const response = await fetch('/api/users/get-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds })
      });
      
      const emailData = await response.json();
      
      const usersData = snapshot.docs.map(doc => {
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
        const tipoTexto = newUserPerfil === 'admin' ? 'Administrador' : (newUserTipo === 'motorista' ? 'Motorista' : 'Copiloto');
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

  const exportCSV = () => {
    const filteredRecords = records.filter(record => {
      if (recordFilters.selectedUser && record.userId !== recordFilters.selectedUser) {
        return false;
      }
      
      if (recordFilters.startDate || recordFilters.endDate) {
        const recordDate = new Date(record.abertura?.dataHora);
        if (recordFilters.startDate && recordDate < new Date(recordFilters.startDate)) {
          return false;
        }
        if (recordFilters.endDate && recordDate > new Date(recordFilters.endDate + 'T23:59:59')) {
          return false;
        }
      }
      
      return true;
    });
    
    const csvContent = [];
    
    csvContent.push(['Nome', 'Tipo', 'KM Inicial', 'Data Abertura', 'KM Final', 'Data Fechamento', 'Distância', 'Diário']);
    
    filteredRecords.forEach(record => {
      const user = users.find(u => u.uid === record.userId);
      const distancia = record.fechamento?.kmFinal && record.abertura?.kmInicial 
        ? record.fechamento.kmFinal - record.abertura.kmInicial 
        : null;
      csvContent.push([
        user?.nome || '',
        user?.tipo || 'motorista',
        record.abertura?.kmInicial || '',
        record.abertura?.dataHora ? new Date(record.abertura.dataHora).toLocaleString('pt-BR') : '',
        record.fechamento?.kmFinal || 'Em aberto',
        record.fechamento?.dataHora ? new Date(record.fechamento.dataHora).toLocaleString('pt-BR') : 'Em aberto',
        distancia ? `${distancia} km` : '-',
        record.fechamento?.diarioBordo || '-'
      ]);
    });
    
    // Se tem filtro por usuário, adicionar rodapé personalizado
    if (recordFilters.selectedUser) {
      const selectedUser = users.find(u => u.uid === recordFilters.selectedUser);
      csvContent.push(['']);
      csvContent.push(['']);
      csvContent.push([`Data de Exportação: ${new Date().toLocaleString('pt-BR')}`]);
      csvContent.push([`Funcionário: ${selectedUser?.nome || 'N/A'}`]);
      csvContent.push([`Período: ${recordFilters.startDate || 'Todas'} até ${recordFilters.endDate || 'Todas'}`]);
      csvContent.push(['']);
      csvContent.push(['Assinatura: _________________________________']);
    }
    
    const csvString = csvContent.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'registros.csv';
    a.click();
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

  const getFilteredRecords = () => {
    return records.filter(record => {
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

  const getUserStats = () => {
    const filteredRecords = getFilteredRecords();
    
    const motoristaRecords = filteredRecords.filter(r => {
      const user = users.find(u => u.uid === r.userId);
      return user && (user.tipo === 'motorista' || !user.tipo);
    });
    
    const copilotoRecords = filteredRecords.filter(r => {
      const user = users.find(u => u.uid === r.userId);
      return user && user.tipo === 'copiloto';
    });
    
    const totalRecords = motoristaRecords.length + copilotoRecords.length;
    const stats = [];
    
    if (motoristaRecords.length > 0) {
      stats.push({
        email: `Motoristas (${motoristaRecords.length})`,
        count: motoristaRecords.length,
        percentage: totalRecords > 0 ? (motoristaRecords.length / totalRecords * 100) : 0
      });
    }
    
    if (copilotoRecords.length > 0) {
      stats.push({
        email: `Copilotos (${copilotoRecords.length})`,
        count: copilotoRecords.length,
        percentage: totalRecords > 0 ? (copilotoRecords.length / totalRecords * 100) : 0
      });
    }
    
    return stats;
  };

  const generatePieSlices = () => {
    const userStats = getUserStats();
    const colors = ['#007bff', '#28a745'];
    let cumulativePercentage = 0;
    
    return userStats.map((stat, index) => {
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

  const generatePieLegend = () => {
    const userStats = getUserStats();
    const colors = ['#007bff', '#28a745', '#dc3545', '#ffc107', '#6c757d', '#17a2b8'];
    
    return (
      <div className="pie-legend-container">
        {userStats.map((stat, index) => (
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

  const generateVanMotoristaChart = () => {
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
    const maxKm = Math.max(...statsArray.map((s: any) => s.kmTotal), 1);
    
    return (
      <div className="bar-chart-container">
        {statsArray.map((stat: any, index: number) => (
          <div key={`${stat.vanPlaca}-${stat.userName}`} className="bar-item">
            <div className="bar-label">
              {stat.vanPlaca} - {stat.userName}
              <br />
              <small>{stat.userTipo} • {stat.registros} registros</small>
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

  const generateBarChart = () => {
    const filteredRecords = getFilteredRecords();
    
    const motoristaRecords = filteredRecords.filter(r => {
      const user = users.find(u => u.uid === r.userId);
      return user && (user.tipo === 'motorista' || !user.tipo) && r.fechamento?.kmFinal;
    });
    
    const copilotoRecords = filteredRecords.filter(r => {
      const user = users.find(u => u.uid === r.userId);
      return user && user.tipo === 'copiloto' && r.fechamento?.kmFinal;
    });
    
    const motoristaKm = motoristaRecords.reduce((sum, record) => {
      return sum + (record.fechamento.kmFinal - record.abertura.kmInicial);
    }, 0);
    
    const copilotoKm = copilotoRecords.reduce((sum, record) => {
      return sum + (record.fechamento.kmFinal - record.abertura.kmInicial);
    }, 0);
    
    const motoristaViagens = motoristaRecords.length;
    const copilotoViagens = copilotoRecords.length;
    
    const stats: any[] = [];
    if (motoristaKm > 0) stats.push({ label: 'Motoristas', totalKm: motoristaKm, count: motoristaViagens });
    if (copilotoKm > 0) stats.push({ label: 'Copilotos', totalKm: copilotoKm, count: copilotoViagens });
    
    const maxKm = Math.max(...stats.map((s: any) => s.totalKm), 1);
    
    return (
      <div className="bar-chart-container">
        {stats.map((stat: any, index: number) => (
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
      <header className="header">
        <h1>Painel Administrativo</h1>
        <div className="header-buttons">
          <button onClick={() => router.push('/help')} className="btn-secondary">📚 Ajuda</button>
          <button onClick={refreshAllData} className="btn-primary">Refresh</button>
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
              <option value="copiloto">👥 Copiloto</option>
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
          {users.filter(user => 
            !userFilter || 
            user.nome?.toLowerCase().includes(userFilter.toLowerCase()) ||
            user.email?.toLowerCase().includes(userFilter.toLowerCase())
          ).map(user => (
            <div key={user.id} className="user-item">
              <div className="user-info">
                <span className="user-name">{user.nome}</span>
                <span className="user-email">{user.email}</span>
                <div className="user-badges">
                  <span className={`badge ${user.perfil}`}>{user.perfil}</span>
                  {user.perfil === 'user' && (
                    <span className={`badge tipo-${user.tipo}`}>{user.tipo}</span>
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
                <option value="copiloto">👥 Copiloto</option>
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
            <button onClick={exportCSV} className="btn-primary">Exportar CSV</button>
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
              {users.map(user => (
                <option key={user.uid} value={user.uid}>{user.nome || user.email}</option>
              ))}
            </select>
            <button onClick={() => setRecordFilters({startDate: '', endDate: '', selectedUser: ''})} className="btn-secondary">
              Limpar
            </button>
          </div>
          <div className="records-table">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Tipo</th>
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
                {records.filter(record => {
                  if (recordFilters.selectedUser && record.userId !== recordFilters.selectedUser) {
                    return false;
                  }
                  
                  if (recordFilters.startDate || recordFilters.endDate) {
                    const recordDate = new Date(record.abertura?.dataHora);
                    if (recordFilters.startDate && recordDate < new Date(recordFilters.startDate)) {
                      return false;
                    }
                    if (recordFilters.endDate && recordDate > new Date(recordFilters.endDate + 'T23:59:59')) {
                      return false;
                    }
                  }
                  
                  return true;
                }).map(record => {
                  const user = users.find(u => u.uid === record.userId);
                  const distancia = record.fechamento?.kmFinal && record.abertura?.kmInicial 
                    ? record.fechamento.kmFinal - record.abertura.kmInicial 
                    : null;
                  return (
                    <tr key={record.id}>
                      <td>{user?.nome || ''}</td>
                      <td>{user?.tipo || 'motorista'}</td>
                      <td>{record.abertura?.kmInicial}</td>
                      <td>{record.abertura?.dataHora ? new Date(record.abertura.dataHora).toLocaleString('pt-BR') : ''}</td>
                      <td>{record.fechamento?.kmFinal || 'Em aberto'}</td>
                      <td>{record.fechamento?.dataHora ? new Date(record.fechamento.dataHora).toLocaleString('pt-BR') : 'Em aberto'}</td>
                      <td>{distancia ? `${distancia} km` : '-'}</td>
                      <td>{record.fechamento?.diarioBordo || '-'}</td>
                      <td>
                        <button 
                          onClick={() => handleCancelRecord(record)} 
                          className="btn-danger"
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
              {users.map(user => (
                <option key={user.uid} value={user.uid}>
                  {user.nome || user.email} - {user.tipo || 'motorista'}
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
    </div>
  );
}