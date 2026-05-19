import { useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import TaskList from './components/TaskList';

export default function App() {
  const [username, setUsername] = useState(() => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.username;
    } catch {
      return null;
    }
  });
  const [showRegister, setShowRegister] = useState(false);

  if (username) {
    return <TaskList username={username} onLogout={() => setUsername(null)} />;
  }

  if (showRegister) {
    return (
      <Register
        onLogin={setUsername}
        onSwitch={() => setShowRegister(false)}
      />
    );
  }

  return (
    <Login
      onLogin={setUsername}
      onSwitch={() => setShowRegister(true)}
    />
  );
}
