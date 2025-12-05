// packages/client/src/App.tsx
import { useState, useEffect } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import { type User, API_PREFIX } from 'shared'; // Import Type และตัวแปรจาก shared

function App() {
  const [backendUser, setBackendUser] = useState<User | null>(null);

  useEffect(() => {
    fetch(`${API_PREFIX}/user`) // ใช้ API_PREFIX และ Proxy
      .then((res) => res.json())
      .then((data: User) => {
        setBackendUser(data);
      });
  }, []);

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Bun Monorepo Demo</h1>
      {backendUser ? (
        <div className="card">
          <h2>Data from Elysia Backend:</h2>
          <p>ID: **{backendUser.id}**</p>
          <p>Name: **{backendUser.name}**</p>
          <p>Role (Shared Type): **{backendUser.role}**</p>
        </div>
      ) : (
        <p>Loading backend data...</p>
      )}
    </>
  );
}

export default App;