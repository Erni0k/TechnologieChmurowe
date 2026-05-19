import { useState } from 'react';
import api from '../api';

export default function Login({ onLogin, onSwitch }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/api/auth/login', { username, password });
      localStorage.setItem('token', res.data.token);
      onLogin(res.data.username);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div style={styles.container}>
      <h2>Logowanie</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          style={styles.input}
          placeholder="Nazwa użytkownika"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          style={styles.input}
          type="password"
          placeholder="Hasło"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p style={styles.error}>{error}</p>}
        <button style={styles.button} type="submit">Zaloguj</button>
      </form>
      <p>Nie masz konta? <button style={styles.link} onClick={onSwitch}>Zarejestruj się</button></p>
    </div>
  );
}

const styles = {
  container: { maxWidth: 400, margin: '80px auto', padding: 24, border: '1px solid #ddd', borderRadius: 8 },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  input: { padding: '8px 12px', fontSize: 14, borderRadius: 4, border: '1px solid #ccc' },
  button: { padding: '10px', background: '#0078d4', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' },
  link: { background: 'none', border: 'none', color: '#0078d4', cursor: 'pointer', textDecoration: 'underline' },
  error: { color: 'red', margin: 0 },
};
