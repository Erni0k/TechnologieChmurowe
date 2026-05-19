import { useState, useEffect } from 'react';
import api from '../api';

export default function TaskList({ username, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/api/tasks');
      setTasks(res.data);
    } catch {
      setError('Nie udało się pobrać zadań');
    }
  };

  const createTask = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/api/tasks', { title, description });
      setTasks([res.data, ...tasks]);
      setTitle('');
      setDescription('');
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd tworzenia zadania');
    }
  };

  const toggleTask = async (task) => {
    try {
      const res = await api.put(`/api/tasks/${task.id}`, { completed: !task.completed });
      setTasks(tasks.map((t) => (t.id === task.id ? res.data : t)));
    } catch {
      setError('Błąd aktualizacji zadania');
    }
  };

  const deleteTask = async (id) => {
    try {
      await api.delete(`/api/tasks/${id}`);
      setTasks(tasks.filter((t) => t.id !== id));
    } catch {
      setError('Błąd usuwania zadania');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    onLogout();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Zadania – {username}</h2>
        <button style={styles.logoutBtn} onClick={logout}>Wyloguj</button>
      </div>

      <form onSubmit={createTask} style={styles.form}>
        <input
          style={styles.input}
          placeholder="Tytuł zadania"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          style={styles.input}
          placeholder="Opis (opcjonalny)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button style={styles.addBtn} type="submit">Dodaj</button>
      </form>

      {error && <p style={styles.error}>{error}</p>}

      <ul style={styles.list}>
        {tasks.map((task) => (
          <li key={task.id} style={styles.item}>
            <label style={styles.label}>
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task)}
              />
              <span style={task.completed ? styles.done : {}}>{task.title}</span>
              {task.description && <small style={styles.desc}> – {task.description}</small>}
            </label>
            <button style={styles.deleteBtn} onClick={() => deleteTask(task.id)}>Usuń</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

const styles = {
  container: { maxWidth: 600, margin: '40px auto', padding: 24 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  form: { display: 'flex', gap: 8, marginBottom: 16 },
  input: { flex: 1, padding: '8px 12px', fontSize: 14, borderRadius: 4, border: '1px solid #ccc' },
  addBtn: { padding: '8px 16px', background: '#0078d4', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' },
  logoutBtn: { padding: '6px 12px', background: '#d13438', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' },
  list: { listStyle: 'none', padding: 0 },
  item: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #eee' },
  label: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' },
  done: { textDecoration: 'line-through', color: '#888' },
  desc: { color: '#666' },
  deleteBtn: { background: 'none', border: 'none', color: '#d13438', cursor: 'pointer', fontSize: 14 },
  error: { color: 'red' },
};
