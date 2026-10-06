import React, { useState, useEffect } from 'react';
import axios from 'axios';

// ─── Reusable Confirm Modal ───────────────────────────────────────────────
function ConfirmModal({ isOpen, title, message, confirmLabel = 'Confirm', confirmColor = '#E67E22', onConfirm, onCancel, loading }) {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.45)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'white', borderRadius: '14px', padding: '32px',
        maxWidth: '440px', width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        animation: 'modalSlideUp 0.25s ease-out',
      }}>
        <h3 style={{ fontSize: '20px', color: '#1a2a4e', marginTop: 0, marginBottom: '12px', fontWeight: '700' }}>
          {title}
        </h3>
        <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.6', marginBottom: '28px' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: '10px 22px', backgroundColor: '#F0F0F0', color: '#1a2a4e',
              border: '1px solid #DDD', borderRadius: '7px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px', fontWeight: '600', transition: 'all 0.2s',
              opacity: loading ? 0.6 : 1,
            }}
            onMouseEnter={(e) => { if (!loading) e.target.style.backgroundColor = '#E0E0E0'; }}
            onMouseLeave={(e) => { if (!loading) e.target.style.backgroundColor = '#F0F0F0'; }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '10px 22px',
              backgroundColor: loading ? '#CCC' : confirmColor,
              color: 'white', border: 'none', borderRadius: '7px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px', fontWeight: '600', transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { if (!loading) e.target.style.opacity = '0.85'; }}
            onMouseLeave={(e) => { if (!loading) e.target.style.opacity = '1'; }}
          >
            {loading ? 'Switching...' : confirmLabel}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────

function ScenarioManagement() {
  const [scenarios, setScenarios] = useState([]);
  const [activeScenario, setActiveScenario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Scenario switch modal state
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [pendingScenarioId, setPendingScenarioId] = useState(null);
  const [pendingScenarioName, setPendingScenarioName] = useState('');

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

  const handleActivateScenario = (scenarioId) => {
    const scenario = scenarios.find((s) => s.id === scenarioId);
    setPendingScenarioId(scenarioId);
    setPendingScenarioName(scenario?.name || '');
    setShowSwitchModal(true);
  };

  const handleConfirmSwitch = async () => {
    if (!pendingScenarioId) return;
    setSwitching(true);
    setMessage('');
    setError('');
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/scenarios/${pendingScenarioId}/activate`
      );
      setMessage(response.data.message);
      await fetchScenarios();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to activate scenario');
    } finally {
      setSwitching(false);
      setShowSwitchModal(false);
      setPendingScenarioId(null);
      setPendingScenarioName('');
    }
  };

  const handleCancelSwitch = () => {
    setShowSwitchModal(false);
    setPendingScenarioId(null);
    setPendingScenarioName('');
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
      <ConfirmModal
        isOpen={showSwitchModal}
        title="Switch Scenario"
        message={`Switching to "${pendingScenarioName}" will cancel ALL active bookings from the current scenario. This cannot be undone. Are you sure?`}
        confirmLabel="Yes, Switch Scenario"
        confirmColor="#E67E22"
        onConfirm={handleConfirmSwitch}
        onCancel={handleCancelSwitch}
        loading={switching}
      />
    </div>
  );
}

export default ScenarioManagement;