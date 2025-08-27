import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth, db } from '../lib/firebase';
import { createUser } from '../lib/auth';
import { getAllRecords } from '../lib/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';

export default function Admin() {
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    createUser: false,
    users: false,
    records: false,
    charts: false
  });
  const [chartFilters, setChartFilters] = useState({
    startDate: '',
    endDate: '',
    selectedUser: ''
  });
  const [recordFilters, setRecordFilters] = useState({
    startDate: '',
    endDate: '',
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
          email: userEmail
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
    if (!newUserEmail || !newUserPassword) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newUserEmail, password: newUserPassword })
      });
      
      if (response.ok) {
        const userData = await response.json();
        loadUsers();
        alert(`Usuário criado com sucesso!\n\nEmail: ${newUserEmail}\nSenha: ${newUserPassword}\n\nCopie estes dados para o cliente.`);
        setNewUserEmail('');
        setNewUserPassword('');
      } else {
        alert('Erro ao criar usuário');
      }
    } catch (error) {
      alert('Erro ao criar usuário');
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
    const csvContent = [
      ['Identificador', 'KM Inicial', 'Data Abertura', 'KM Final', 'Data Fechamento'],
      ...records.map(record => {
        const user = users.find(u => u.uid === record.userId);
        return [
          user?.email || record.userId,
          record.abertura?.kmInicial || '',
          record.abertura?.dataHora ? new Date(record.abertura.dataHora).toLocaleString() : '',
          record.fechamento?.kmFinal || 'Em aberto',
          record.fechamento?.dataHora ? new Date(record.fechamento.dataHora).toLocaleString() : 'Em aberto'
        ];
      })
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
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
    return users.map(user => {
      const userRecords = filteredRecords.filter(r => r.userId === user.uid);
      return {
        email: user.email,
        count: userRecords.length,
        percentage: filteredRecords.length > 0 ? (userRecords.length / filteredRecords.length * 100) : 0
      };
    }).filter(stat => stat.count > 0);
  };

  const generatePieSlices = () => {
    const userStats = getUserStats();
    const colors = ['#007bff', '#28a745', '#dc3545', '#ffc107', '#6c757d', '#17a2b8'];
    let cumulativePercentage = 0;
    
    return userStats.map((stat, index) => {
      const startAngle = (cumulativePercentage / 100) * 360;
      const endAngle = ((cumulativePercentage + stat.percentage) / 100) * 360;
      cumulativePercentage += stat.percentage;
      
      const startAngleRad = (startAngle * Math.PI) / 180;
      const endAngleRad = (endAngle * Math.PI) / 180;
      
      const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
      
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

  const generateBarChart = () => {
    const filteredRecords = getFilteredRecords();
    const userKmStats = users.map(user => {
      const userRecords = filteredRecords.filter(r => r.userId === user.uid && r.fechamento?.kmFinal);
      const totalKm = userRecords.reduce((sum, record) => {
        return sum + (record.fechamento.kmFinal - record.abertura.kmInicial);
      }, 0);
      return {
        email: user.email,
        totalKm
      };
    }).filter(stat => stat.totalKm > 0);

    const maxKm = Math.max(...userKmStats.map(s => s.totalKm), 1);
    
    return (
      <div className="bar-chart-container">
        {userKmStats.map((stat, index) => (
          <div key={stat.email} className="bar-item">
            <div className="bar-label">{stat.email}</div>
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
          <button onClick={refreshData} className="btn-primary">Refresh</button>
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
          <button onClick={handleCreateUser} disabled={loading} className="btn-primary">
            {loading ? 'Criando...' : 'Criar Usuário'}
          </button>
        </div>
        )}
      </section>

      <section className="admin-section">
        <div className="section-header" onClick={() => toggleSection('users')}>
          <h2>Usuários ({users.length})</h2>
          <span className="toggle-icon">{expandedSections.users ? '−' : '+'}</span>
        </div>
        {expandedSections.users && (
        <div className="users-list">
          {users.map(user => (
            <div key={user.id} className="user-item">
              <div className="user-info">
                <span className="user-email">{user.email}</span>
                <span className={`badge ${user.perfil}`}>{user.perfil}</span>
              </div>
              <button 
                onClick={() => setEditingUser(user)} 
                className="btn-secondary"
              >
                Alterar Senha
              </button>
            </div>
          ))}
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
                <option key={user.uid} value={user.uid}>{user.email}</option>
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
                  <th>Identificador</th>
                  <th>KM Inicial</th>
                  <th>Data Abertura</th>
                  <th>KM Final</th>
                  <th>Data Fechamento</th>
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
                  return (
                    <tr key={record.id}>
                      <td>{user?.email || record.userId}</td>
                      <td>{record.abertura?.kmInicial}</td>
                      <td>{record.abertura?.dataHora ? new Date(record.abertura.dataHora).toLocaleString() : ''}</td>
                      <td>{record.fechamento?.kmFinal || 'Em aberto'}</td>
                      <td>{record.fechamento?.dataHora ? new Date(record.fechamento.dataHora).toLocaleString() : 'Em aberto'}</td>
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
                <option key={user.uid} value={user.uid}>{user.email}</option>
              ))}
            </select>
            <button onClick={() => setChartFilters({startDate: '', endDate: '', selectedUser: ''})} className="btn-secondary">
              Limpar
            </button>
          </div>
          <div className="charts-container">
            {!chartFilters.selectedUser && (
            <div className="chart-item">
              <h3>Registros por Usuário (Pizza)</h3>
              <div className="pie-chart-wrapper">
                <svg className="pie-chart-svg" width="150" height="150" viewBox="0 0 200 200">
                  {generatePieSlices()}
                </svg>
                <div className="pie-legend">
                  {generatePieLegend()}
                </div>
              </div>
            </div>
            )}
            <div className="chart-item">
              <h3>Total KM por Usuário (Barras)</h3>
              <div className="bar-chart">
                {generateBarChart()}
              </div>
            </div>
          </div>
        </div>
        )}
      </section>
    </div>
  );
}