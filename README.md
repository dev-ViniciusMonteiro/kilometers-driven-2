# Sistema de Quilometragem

Sistema Next.js para controle de quilometragem com Firebase.

## Configuração

1. Instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente no arquivo `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

3. Execute o projeto:
```bash
npm run dev
```

## Estrutura

- `/login` - Autenticação de usuários
- `/home` - Interface para usuários normais
- `/admin` - Painel administrativo

## Firestore Collections

### usuarios
```json
{
  "uid": "UID_DO_FIREBASE",
  "perfil": "admin" // ou "user"
}
```

### registros
```json
{
  "userId": "UID_DO_FIREBASE",
  "abertura": {
    "kmInicial": 1234,
    "dataHora": "2025-08-27T12:00:00Z"
  },
  "fechamento": {
    "kmFinal": 1245,
    "dataHora": "2025-08-27T18:00:00Z"
  }
}
```

## Funcionalidades

- Autenticação Firebase
- Controle de perfis (admin/user)
- Registro de quilometragem
- Painel administrativo
- Exportação CSV
- Paginação de registros