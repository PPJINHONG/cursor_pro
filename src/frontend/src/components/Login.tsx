import React, { useState } from 'react';
import './Login.css';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async () => {
    if (!username || !password) {
      setMessage('Username and password are required');
      return;
    }

    try {
      // FastAPI 백엔드로 로그인 요청
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        // 로그인 성공 시 토큰 저장
        localStorage.setItem('token', data.token);
        // 메인 페이지로 리다이렉트
        window.location.href = '/dashboard';
      } else {
        setMessage('Invalid username or password');
      }
    } catch (error) {
      setMessage('Login failed. Please try again.');
    }
  };

  const handleSignUp = () => {
    window.location.href = '/signup';
  };

  return (
    <div className="container-box">
      {/* 왼쪽 회사 이름 */}
      <div className="company-title">
        <h1>Cloud Operation Center</h1>
        <small>클라우드운영센터</small>
      </div>

      {/* 오른쪽 로그인 카드 */}
      <div className="login-card">
        <div className="mb-3">
          <input
            type="text"
            id="username"
            className="form-control"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          />
        </div>
        <div className="mb-3">
          <input
            type="password"
            id="password"
            className="form-control"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          />
        </div>
        <button className="btn btn-custom w-100" onClick={handleLogin}>
          Login
        </button>
        <p id="message" className="text-danger text-center mt-2">
          {message}
        </p>
        <hr />
        <button className="btn btn-outline-custom w-100" onClick={handleSignUp}>
          Sign Up
        </button>
      </div>
    </div>
  );
};

export default Login; 