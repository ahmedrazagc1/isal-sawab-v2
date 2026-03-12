import React, { useState, useEffect } from 'react';

// CLAUDE API KEY YAHAN DALO
const CLAUDE_API_KEY = "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"; 

const App = () => {
  const [input, setInput] = useState('');
  const [data, setData] = useState({ quran: 0, durood: 0, kalma: 0, istighfar: 0, other: 0 });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('sawabData_Claude');
    if (saved) setData(JSON.parse(saved));
  }, []);

  // Backup Manual Logic: Agar AI fail ho jaye
  const manualBackup = (text) => {
    const num = text.match(/\d+/) ? parseInt(text.match(/\d+/)[0]) : 1;
    const lowerText = text.toLowerCase();
    if (lowerText.includes('quran')) return { quran: num };
    if (lowerText.includes('durood')) return { durood: num };
    if (lowerText.includes('kalma')) return { kalma: num };
    if (lowerText.includes('istighfar')) return { istighfar: num };
    return { other: num };
  };

  const processWithClaude = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setStatus('Claude Analysis Kar Raha Hai...');

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'dangerously-allow-browser': 'true' // React testing ke liye zaruri hai
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 100,
          messages: [{ role: "user", content: `Extract counts from: "${input}". Return ONLY JSON: {"quran":0, "durood":0, "kalma":0, "istighfar":0, "other":0}. Convert words like "ek", "hundred" to numbers.` }]
        })
      });

      const result = await response.json();
      let extracted;
      
      try {
        const rawText = result.content[0].text;
        extracted = JSON.parse(rawText.match(/\{.*\}/s)[0]);
      } catch (e) {
        extracted = manualBackup(input);
      }

      const newData = {
        quran: data.quran + (extracted.quran || 0),
        durood: data.durood + (extracted.durood || 0),
        kalma: data.kalma + (extracted.kalma || 0),
        istighfar: data.istighfar + (extracted.istighfar || 0),
        other: data.other + (extracted.other || 0),
      };

      setData(newData);
      localStorage.setItem('sawabData_Claude', JSON.stringify(newData));
      setStatus('✅ MashAllah! Record Update Ho Gaya.');
      setInput('');
    } catch (err) {
      console.error(err);
      setStatus('⚠️ Connection Problem! Key check karein.');
    }
    setLoading(false);
  };

  return (
    <div style={{ backgroundColor: '#020617', color: '#38bdf8', minHeight: '100vh', padding: '20px', direction: 'rtl', textAlign: 'center', fontFamily: 'system-ui' }}>
      <div style={{ border: '2px solid #38bdf8', borderRadius: '20px', padding: '20px', maxWidth: '450px', margin: 'auto', background: '#0f172a', boxShadow: '0 0 20px rgba(56,189,248,0.2)' }}>
        <h2 style={{ color: '#94a3b8' }}>مجموعی ثواب (Claude AI Edition)</h2>
        <h1 style={{ fontSize: '65px', color: '#f0abfc', margin: '10px 0' }}>{Object.values(data).reduce((a, b) => a + b, 0)}</h1>
      </div>

      <div style={{ marginTop: '25px' }}>
        <textarea 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Yahan likhein: maslan '100 durood' ya 'aik quran'..."
          style={{ width: '90%', maxWidth: '450px', height: '100px', borderRadius: '12px', padding: '15px', background: '#1e293b', color: 'white', border: '1px solid #334155', fontSize: '18px' }}
        />
        <br/>
        <button 
          onClick={processWithClaude}
          disabled={loading}
          style={{ marginTop: '15px', padding: '15px 40px', fontSize: '20px', borderRadius: '10px', background: '#38bdf8', color: '#020617', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
        >
          {loading ? 'AI Soch Raha Hai...' : 'ثواب جمع کریں ✨'}
        </button>
        <p style={{ color: '#94a3b8' }}>{status}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', maxWidth: '450px', margin: '30px auto' }}>
        {Object.entries(data).map(([k, v]) => (
          <div key={k} style={{ background: '#1e293b', padding: '15px', borderRadius: '12px', borderBottom: '4px solid #38bdf8' }}>
            <div style={{ fontSize: '14px', color: '#94a3b8' }}>{k.toUpperCase()}</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
