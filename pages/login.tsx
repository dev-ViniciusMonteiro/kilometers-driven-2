import { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { loginUser } from '../lib/auth';

interface LoginForm {
  email: string;
  password: string;
}

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { register, handleSubmit } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError('');
    
    try {
      const { profile } = await loginUser(data.email, data.password);
      router.push(profile === 'admin' ? '/admin' : '/home');
    } catch (err) {
      console.error('Erro no login:', err);
      setError('Email ou senha inválidos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit(onSubmit)} className="login-form">
        <div style={{textAlign: 'center', marginBottom: '30px'}}>
          <img src="/logoOfi.png" alt="Logo" style={{height: '100px', marginBottom: '15px'}} />
          <h1>Login</h1>
        </div>
        
        <input
          {...register('email', { required: true })}
          type="email"
          placeholder="E-mail"
          className="input"
        />
        
        <input
          {...register('password', { required: true })}
          type="password"
          placeholder="Senha"
          className="input"
        />
        
        {error && <p className="error">{error}</p>}
        
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Entrando...' : 'Login'}
        </button>
      </form>
    </div>
  );
}