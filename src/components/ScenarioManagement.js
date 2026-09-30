import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ScenarioManagement() {
  const [scenarios, setScenarios] = useState([]);
  const [activeScenario, setActiveScenario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_SUPABASE_URL}/rest/v1/scenarios`,
        {
          headers: {
            'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
        }
      );
      setScenarios(response.data);
      const active = response.data.find((s) => s.is_active);
      setActiveScenario(active);
    } catch (err) {
      setError('Failed to load scenarios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateScenario = async (scenarioId) => {
    const confirmed = window.confirm(
      'Switching scenarios will cancel all active bookings from the previous scenario. Continue?'
    );

    if (!confirmed) return;

    setSwitching(true);
    setMessage('');
    setError('');

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/scenarios/${scenarioId}/activate`
      );

      setMessage(response.data.message);
      await fetchScenarios();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to activate scenario');
    } finally {
      setSwitching(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6B4E8A' }}>
        Loading scenarios...
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '30px',
      marginBottom: '30px',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
      border: '1px solid #E8D4C8',
    }}>
      <h2 style={{
        fontSize: '22px',
        color: '#1a2a4e',
        marginTop: 0,
        marginBottom: '10px',
        fontWeight: '700',
      }}>
        Scenario Management
      </h2>
      <p style={{
        fontSize: '14px',
        color: '#666',
        marginBottom: '25px',
      }}>
        Current Active: <span style={{ fontWeight: '700', color: '#6B4E8A' }}>
          {activeScenario ? activeScenario.name : 'None'}
        </span>
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '12px',
        marginBottom: '25px',
      }}>
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => handleActivateScenario(scenario.id)}
            disabled={switching || scenario.is_active}
            style={{
              padding: '14px 20px',
              backgroundColor: scenario.is_active ? '#6B4E8A' : '#F5F5F5',
              color: scenario.is_active ? 'white' : '#1a2a4e',
              border: '2px solid ' + (scenario.is_active ? '#6B4E8A' : '#E8D4C8'),
              borderRadius: '8px',
              cursor: scenario.is_active ? 'default' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.3s',
              opacity: switching ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!scenario.is_active && !switching) {
                e.target.style.backgroundColor = '#E8D4C8';
                e.target.style.borderColor = '#C5587A';
              }
            }}
            onMouseLeave={(e) => {
              if (!scenario.is_active && !switching) {
                e.target.style.backgroundColor = '#F5F5F5';
                e.target.style.borderColor = '#E8D4C8';
              }
            }}
          >
            {scenario.name}
            
          </button>
        ))}
      </div>

      {message && (
        <div style={{
          padding: '14px 16px',
          backgroundColor: '#E8F5E9',
          border: '1px solid #4CAF50',
          borderRadius: '8px',
          color: '#2E7D32',
          fontSize: '14px',
          marginBottom: '15px',
        }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{
          padding: '14px 16px',
          backgroundColor: '#FFEBEE',
          border: '1px solid #F44336',
          borderRadius: '8px',
          color: '#C62828',
          fontSize: '14px',
        }}>
          {error}
        </div>
      )}
    </div>
  );
}

export default ScenarioManagement;