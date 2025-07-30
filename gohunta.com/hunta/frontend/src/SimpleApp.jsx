import React from 'react';

function SimpleApp() {
  const testAPI = async () => {
    try {
      const response = await fetch('https://hunta-backend-prod.findrawdogfood.workers.dev/api/dogs/list');
      const data = await response.json();
      console.log('API Response:', data);
      alert('API working! Check console for data.');
    } catch (error) {
      console.error('API Error:', error);
      alert('API Error: ' + error.message);
    }
  };

  return (
    <div style={{ 
      padding: '2rem', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '0 auto' 
    }}>
      <h1 style={{ color: '#2D5530', textAlign: 'center' }}>🎯 HUNTA</h1>
      <h2 style={{ color: '#6b7280', textAlign: 'center' }}>Elite Dog Hunting Platform</h2>
      
      <div style={{ 
        background: '#10b981', 
        color: 'white', 
        padding: '1rem', 
        borderRadius: '0.5rem',
        textAlign: 'center',
        margin: '2rem 0'
      }}>
        ✅ REACT APP LOADING SUCCESSFULLY
      </div>

      <div style={{ 
        background: 'white', 
        padding: '2rem', 
        borderRadius: '0.5rem', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <h3>Core Features</h3>
        <div>🐕 Pack & Profile Management</div>
        <div>🗺️ Hunt Route Planner with GPS</div>
        <div>🏆 Trial & Event Listings</div>
        <div>⚡ Gear Reviews & Loadouts</div>
        <div>📚 Ethics Knowledge Base</div>
        <div>📸 Brag Board & Journal</div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <button 
          onClick={testAPI}
          style={{
            background: '#2D5530',
            color: 'white',
            padding: '1rem 2rem',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            cursor: 'pointer'
          }}
        >
          Test Backend API
        </button>
      </div>

      <div style={{ 
        background: '#f0f9f1', 
        padding: '1rem', 
        borderRadius: '0.5rem', 
        marginTop: '2rem' 
      }}>
        <h3>System Status</h3>
        <p><strong>Frontend:</strong> React App Running ✅</p>
        <p><strong>Backend:</strong> https://hunta-backend-prod.findrawdogfood.workers.dev</p>
        <p><strong>API Integration:</strong> Click button to test</p>
      </div>
    </div>
  );
}

export default SimpleApp;