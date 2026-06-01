import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Copy, Check, ShieldAlert } from 'lucide-react';

function ApiTester() {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('openai/gpt-4o-mini');
  const [prompt, setPrompt] = useState('Hello! Please confirm you are working by telling me one interesting fact about real estate. Keep it to 2-3 sentences.');
  const [temperature, setTemperature] = useState(0.7);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: 'idle', message: 'Ready to test. Click the button below.' });
  const [response, setResponse] = useState(null);
  const [copied, setCopied] = useState(false);

  const runTest = async () => {
    if (!apiKey || !prompt) {
      setStatus({ type: 'error', message: '⚠️ Please fill in the API key and prompt.' });
      return;
    }

    setLoading(true);
    setStatus({ type: 'loading', message: 'Connecting to OpenRouter...' });
    setResponse(null);

    const startTime = Date.now();

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.href,
          'X-Title': 'Urbanova AI Tester'
        },
        body: JSON.stringify({
          model,
          temperature,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      const data = await res.json();

      if (!res.ok) {
        const errMsg = data?.error?.message || `HTTP ${res.status}`;
        setStatus({ type: 'error', message: `❌ API Error: ${errMsg}` });
        setResponse({
          text: JSON.stringify(data, null, 2),
          meta: { status: res.status }
        });
        return;
      }

      const message = data.choices?.[0]?.message?.content || '(No content)';
      const usage = data.usage || {};
      const modelUsed = data.model || model;

      setStatus({ type: 'success', message: `✅ Success! API key is valid. Response in ${elapsed}s` });
      setResponse({
        text: message,
        meta: {
          model: modelUsed,
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
          time: `${elapsed}s`
        }
      });

    } catch (err) {
      setStatus({ type: 'error', message: `❌ Network error: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (response?.text) {
      navigator.clipboard.writeText(response.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '100px', paddingBottom: '100px', maxWidth: '800px' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', color: 'var(--accent)', padding: '0.35rem 1rem', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
          <Activity size={14} /> Live API Test
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>OpenRouter <span style={{ color: 'var(--accent)' }}>AI Tester</span></h1>
        <p style={{ color: 'var(--text-secondary)' }}>Send a prompt to any model and verify your API key instantly.</p>
      </div>

      <motion.div 
        className="liquid-glass" 
        style={{ padding: '2.5rem', marginBottom: '2rem' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '0.5rem', letterSpacing: '0.04em' }}>🔑 OpenRouter API Key</label>
          <input 
            type="password" 
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{ marginBottom: 0 }}
            placeholder="sk-or-v1-..." 
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '0.5rem', letterSpacing: '0.04em' }}>🤖 Model</label>
            <select value={model} onChange={(e) => setModel(e.target.value)} style={{ marginBottom: 0, cursor: 'pointer' }}>
              <option value="openai/gpt-4o-mini">GPT-4o Mini (Fast & Cheap)</option>
              <option value="openai/gpt-4o">GPT-4o</option>
              <option value="anthropic/claude-3.5-haiku">Claude 3.5 Haiku</option>
              <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
              <option value="google/gemini-2.0-flash-001">Gemini 2.0 Flash</option>
              <option value="meta-llama/llama-3.1-8b-instruct:free">Llama 3.1 8B (FREE)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '0.5rem', letterSpacing: '0.04em' }}>🌡️ Temperature: {temperature}</label>
            <input 
              type="range" 
              min="0" max="2" step="0.1" 
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              style={{ padding: '0.55rem 0', cursor: 'pointer', background: 'transparent', boxShadow: 'none' }} 
            />
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '0.5rem', letterSpacing: '0.04em' }}>💬 Prompt</label>
          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            style={{ minHeight: '120px', resize: 'vertical', marginBottom: 0 }}
          />
        </div>

        {/* Status Bar */}
        <div style={{ 
            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', borderRadius: '12px', marginBottom: '2rem', transition: 'all 0.3s',
            background: status.type === 'error' ? 'rgba(239,68,68,0.1)' : status.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${status.type === 'error' ? 'rgba(239,68,68,0.3)' : status.type === 'success' ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`
          }}>
          <div style={{ 
            width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
            background: status.type === 'error' ? '#ef4444' : status.type === 'success' ? '#22c55e' : status.type === 'loading' ? 'var(--accent)' : 'var(--text-secondary)',
            boxShadow: status.type !== 'idle' ? `0 0 10px ${status.type === 'error' ? '#ef4444' : status.type === 'success' ? '#22c55e' : 'var(--accent)'}` : 'none'
          }}></div>
          <span style={{ fontSize: '0.9rem', color: status.type === 'error' ? '#ef4444' : status.type === 'success' ? '#22c55e' : 'var(--text-primary)' }}>
            {status.message}
          </span>
        </div>

        <button 
          onClick={runTest} 
          disabled={loading}
          style={{ 
            width: '100%', padding: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
            background: 'linear-gradient(135deg, #c9a227, #e6c84d)', color: '#000', fontSize: '1.05rem', boxShadow: '0 8px 25px rgba(212,175,55,0.35)',
            opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? (
            <Activity className="animate-spin" size={20} />
          ) : (
            <ShieldAlert size={20} />
          )}
          {loading ? 'TESTING API...' : 'TEST API KEY NOW'}
        </button>
      </motion.div>

      {/* Response Area */}
      {response && (
        <motion.div 
          className="liquid-glass" 
          style={{ padding: '2rem' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#22c55e' }}>●</span> Response Output
            </h3>
            <button 
              onClick={handleCopy}
              style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: 'none' }}
            >
              {copied ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy Text'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {Object.entries(response.meta).map(([key, value]) => (
              value && (
                <div key={key} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', padding: '0.4rem 0.8rem', borderRadius: '100px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {key}: <span style={{ color: 'var(--text-primary)' }}>{value}</span>
                </div>
              )
            ))}
          </div>

          <div style={{ 
            background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem',
            fontSize: '1rem', lineHeight: 1.7, color: '#e2e8f0', whiteSpace: 'pre-wrap', maxHeight: '500px', overflowY: 'auto'
          }}>
            {response.text}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default ApiTester;
