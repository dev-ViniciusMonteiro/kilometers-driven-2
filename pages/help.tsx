import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Help() {
  const [activeSection, setActiveSection] = useState('overview');
  const router = useRouter();

  const sections = {
    overview: 'Visão Geral',
    motorista: 'Fluxo Motorista',
    copiloto: 'Fluxo Copiloto',
    admin: 'Painel Admin',
    troubleshooting: 'Solução de Problemas'
  };

  return (
    <div className="help-container">
      <header className="help-header">
        <h1>📚 Manual do Sistema de Quilometragem</h1>
        <button onClick={() => router.back()} className="btn-secondary">← Voltar</button>
      </header>

      <div className="help-content">
        <nav className="help-nav">
          {Object.entries(sections).map(([key, title]: [string, string]) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`nav-item ${activeSection === key ? 'active' : ''}`}
            >
              {title}
            </button>
          ))}
        </nav>

        <main className="help-main">
          {activeSection === 'overview' && (
            <div className="help-section">
              <h2>🎯 Visão Geral do Sistema</h2>
              
              <div className="info-box">
                <h3>📋 Objetivo</h3>
                <p>Sistema para controle de quilometragem de vans com diferentes perfis de usuário e validações rigorosas.</p>
              </div>

              <div className="info-box">
                <h3>👥 Perfis de Usuário</h3>
                <ul>
                  <li><strong>🚗 Motorista:</strong> Inicia e finaliza viagens, controla KM das vans</li>
                  <li><strong>👥 Copiloto:</strong> Bate ponto de entrada/saída, depende do motorista</li>
                  <li><strong>👑 Admin:</strong> Gerencia usuários, vans e visualiza relatórios</li>
                </ul>
              </div>

              <div className="flowchart">
                <h3>🔄 Fluxo Geral</h3>
                <div className="flow-diagram">
                  <div className="flow-step">
                    <div className="step-box motorista">Motorista Inicia</div>
                    <div className="arrow">↓</div>
                  </div>
                  <div className="flow-step">
                    <div className="step-box copiloto">Copiloto pode Iniciar</div>
                    <div className="arrow">↓</div>
                  </div>
                  <div className="flow-step">
                    <div className="step-box viagem">Viagem em Andamento</div>
                    <div className="arrow">↓</div>
                  </div>
                  <div className="flow-step">
                    <div className="step-box motorista">Motorista Finaliza</div>
                    <div className="arrow">↓</div>
                  </div>
                  <div className="flow-step">
                    <div className="step-box copiloto">Copiloto pode Finalizar</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'motorista' && (
            <div className="help-section">
              <h2>🚗 Fluxo do Motorista</h2>
              
              <div className="step-guide">
                <div className="step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h3>🚀 Iniciar Viagem</h3>
                    <ul>
                      <li>Selecionar van disponível</li>
                      <li>Confirmar KM inicial (deve ser &ge; KM atual da van)</li>
                      <li>Preencher diário de bordo (opcional)</li>
                      <li>Clicar "INICIAR VIAGEM"</li>
                    </ul>
                  </div>
                </div>

                <div className="step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h3>🛣️ Durante a Viagem</h3>
                    <ul>
                      <li>Van fica indisponível para outros motoristas</li>
                      <li>Copilotos podem "bater ponto" na mesma van</li>
                      <li>Sistema mostra viagem em andamento</li>
                    </ul>
                  </div>
                </div>

                <div className="step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h3>🏁 Finalizar Viagem</h3>
                    <ul>
                      <li>Informar KM final (deve ser &gt; KM inicial)</li>
                      <li>Adicionar observações no diário</li>
                      <li>Clicar "FINALIZAR VIAGEM"</li>
                      <li>Van atualiza KM atual automaticamente</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="warning-box">
                <h3>⚠️ Regras Importantes</h3>
                <ul>
                  <li>Só pode ter 1 viagem aberta por vez</li>
                  <li>KM final sempre &gt; KM inicial</li>
                  <li>KM inicial deve ser &ge; KM atual da van</li>
                  <li>Ao finalizar, van fica disponível para outros</li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === 'copiloto' && (
            <div className="help-section">
              <h2>👥 Fluxo do Copiloto</h2>
              
              <div className="dependency-diagram">
                <h3>🔗 Dependência do Motorista</h3>
                <div className="dependency-flow">
                  <div className="dep-step">
                    <div className="dep-box motorista-action">Motorista Inicia Van</div>
                    <div className="dep-arrow">→</div>
                    <div className="dep-box copiloto-action">Copiloto Vê Van na Lista</div>
                  </div>
                  <div className="dep-step">
                    <div className="dep-box motorista-action">Motorista Finaliza</div>
                    <div className="dep-arrow">→</div>
                    <div className="dep-box copiloto-action">Copiloto Pode Finalizar</div>
                  </div>
                </div>
              </div>

              <div className="step-guide">
                <div className="step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h3>📥 Bater Ponto Entrada</h3>
                    <ul>
                      <li>Aguardar motorista iniciar uma van</li>
                      <li>Selecionar van (mostra nome do motorista)</li>
                      <li>KM preenchido automaticamente</li>
                      <li>Clicar "BATER PONTO ENTRADA"</li>
                    </ul>
                  </div>
                </div>

                <div className="step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h3>📤 Bater Ponto Saída</h3>
                    <ul>
                      <li>Aguardar motorista finalizar a viagem</li>
                      <li>Botão liberado automaticamente</li>
                      <li>KM final preenchido automaticamente</li>
                      <li>Clicar "BATER PONTO SAÍDA"</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="info-box">
                <h3>🎯 Estados do Botão</h3>
                <ul>
                  <li><strong>🔒 Bloqueado:</strong> "Aguarde motorista iniciar/finalizar"</li>
                  <li><strong>✅ Liberado:</strong> Pode bater ponto</li>
                  <li><strong>⏳ Aguardando:</strong> Motorista ainda não finalizou</li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === 'admin' && (
            <div className="help-section">
              <h2>👑 Painel Administrativo</h2>
              
              <div className="admin-features">
                <div className="feature-card">
                  <h3>👤 Gerenciar Usuários</h3>
                  <ul>
                    <li>Criar novos usuários (motorista/copiloto/admin)</li>
                    <li>Alterar senhas e nomes</li>
                    <li>Mudar tipo (motorista ↔ copiloto)</li>
                    <li>Deletar usuários</li>
                    <li>Filtrar por nome</li>
                  </ul>
                </div>

                <div className="feature-card">
                  <h3>🚐 Gerenciar Vans</h3>
                  <ul>
                    <li>Cadastrar novas vans</li>
                    <li>Editar KM atual</li>
                    <li>Deletar vans</li>
                    <li>Visualizar status</li>
                  </ul>
                </div>

                <div className="feature-card">
                  <h3>📊 Relatórios</h3>
                  <ul>
                    <li>Visualizar todos os registros</li>
                    <li>Filtrar por usuário e data</li>
                    <li>Exportar CSV personalizado</li>
                    <li>Gráficos de produtividade</li>
                    <li>Deletar registros incorretos</li>
                  </ul>
                </div>
              </div>

              <div className="csv-info">
                <h3>📄 Exportação CSV</h3>
                <p>Quando filtrado por usuário, o CSV inclui:</p>
                <ul>
                  <li>Dados da tabela</li>
                  <li>Data de exportação</li>
                  <li>Nome do funcionário</li>
                  <li>Período filtrado</li>
                  <li>Campo para assinatura</li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === 'troubleshooting' && (
            <div className="help-section">
              <h2>🔧 Solução de Problemas</h2>
              
              <div className="problem-solution">
                <div className="problem">
                  <h3>❌ Copiloto não consegue iniciar</h3>
                  <div className="solution">
                    <strong>Solução:</strong>
                    <ul>
                      <li>Verificar se algum motorista iniciou uma van</li>
                      <li>Lista vazia = nenhum motorista ativo</li>
                      <li>Aguardar motorista iniciar viagem</li>
                    </ul>
                  </div>
                </div>

                <div className="problem">
                  <h3>❌ Copiloto não consegue finalizar</h3>
                  <div className="solution">
                    <strong>Solução:</strong>
                    <ul>
                      <li>Verificar se motorista finalizou a viagem</li>
                      <li>Botão mostra "Aguarde motorista finalizar"</li>
                      <li>Sistema atualiza automaticamente a cada 5s</li>
                    </ul>
                  </div>
                </div>

                <div className="problem">
                  <h3>❌ KM inválido</h3>
                  <div className="solution">
                    <strong>Solução:</strong>
                    <ul>
                      <li>KM inicial deve ser &ge; KM atual da van</li>
                      <li>KM final deve ser &gt; KM inicial</li>
                      <li>Admin pode corrigir KM da van se necessário</li>
                    </ul>
                  </div>
                </div>

                <div className="problem">
                  <h3>❌ Registro incorreto</h3>
                  <div className="solution">
                    <strong>Solução:</strong>
                    <ul>
                      <li>Admin pode deletar registros na aba "Registros"</li>
                      <li>Botão "Deletar" em cada linha</li>
                      <li>Ação irreversível - confirmar antes</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="tips-box">
                <h3>💡 Dicas Importantes</h3>
                <ul>
                  <li>Sempre orientar sobre a sequência: Motorista → Copiloto</li>
                  <li>KM deve ser crescente e realista</li>
                  <li>Diário de bordo é opcional mas recomendado</li>
                  <li>Sistema atualiza automaticamente - não recarregar página</li>
                  <li>Em caso de erro, contatar admin para correção</li>
                </ul>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}