import React, { useState, useEffect } from 'react';

// YAHAN APNI GEMINI API KEY DALO
const GEMINI_API_KEY = "AIzaSyApOheLiHFf_fEx_cvbr0vu950ly7rqsBQ"; 

const App = () => {
  const [input, setInput] = useState('');
  const [data, setData] = useState({ quran: 0, durood: 0, kalma: 0, istighfar: 0, other: 0 });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('sawabData');
    if (saved) setData(JSON.parse(saved));
  }, []);

  const processWithAI = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setStatus('AI Soch raha hai...');

    const prompt = `Extract Islamic acts and their counts from this text: "${input}". 
    Respond ONLY in this JSON format: {"quran": 0, "durood": 0, "kalma": 0, "istighfar": 0, "other": 0}.
    Translate words like "ek", "do", "ten", "one", "hundred" into numbers. 
    If someone says "1 quran" or "ek quran", put 1 in quran. 
    If no act is found, return all zeros. JSON ONLY.`;

    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      const result = await resp.json();
      const aiText = result.candidates[0].content.parts[0].text;
      const cleanedJson = aiText.replace(/```json|```/g, "").trim();
      const extracted = JSON.parse(cleanedJson);

      if (Object.values(extracted).every(v => v === 0)) {
        setStatus('❌ AI ko koi ginti nahi mili. Dobara likhein (e.g. 100 durood)');
      } else {
        const newData = {
          quran: data.quran + (extracted.quran || 0),
          durood: data.durood + (extracted.durood || 0),
          kalma: data.kalma + (extracted.kalma || 0),
          istighfar: data.istighfar + (extracted.istighfar || 0),
          other: data.other + (extracted.other || 0),
        };
        setData(newData);
        localStorage.setItem('sawabData', JSON.stringify(newData));
        setInput('');
        setStatus('✅ MashAllah! Sawab add ho gaya.');
      }
    } catch (err) {
      console.error(err);
      setStatus('⚠️ API Error! Key check karein ya dobara try karein.');
    }
    setLoading(false);
  };

  const totalSawab = Object.values(data).reduce((a, b) => a + b, 0);

  return (
    <div style={{ backgroundColor: '#0a192f', color: '#e6f1ff', minHeight: '100vh', padding: '20px', fontFamily: 'Arial', textAlign: 'center', direction: 'rtl' }}>
      <div style={{ border: '2px solid #64ffda', borderRadius: '15px', padding: '30px', maxWidth: '500px', margin: '0 auto', backgroundColor: '#112240' }}>
        <h2 style={{ color: '#64ffda' }}>مجموعی ثواب</h2>
        <h1 style={{ fontSize: '60px', color: '#f3d874' }}>{totalSawab}</h1>
      </div>

      <div style={{ marginTop: '30px' }}>
        <textarea 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="مثلاً: میں نے 100 بار درود شریف پڑھا..."
          style={{ width: '100%', maxWidth: '500px', height: '100px', borderRadius: '10px', padding: '15px', fontSize: '18px', border: '2px solid #f3d874', backgroundColor: '#112240', color: 'white' }}
        />
        <br />
        <button 
          onClick={processWithAI}
          disabled={loading}
          style={{ marginTop: '15px', padding: '12px 40px', fontSize: '18px', borderRadius: '8px', cursor: 'pointer', backgroundColor: '#f3d874', color: '#0a192f', border: 'none', fontWeight: 'bold' }}
        >
          {loading ? 'انتظار کریں...' : 'ثواب بھیجیں 🚀'}
        </button>
        <p style={{ marginTop: '15px', color: '#ccd6f6' }}>{status}</p>
      </div>

      <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', maxWidth: '500px', margin: '30px auto' }}>
        {Object.entries(data).map(([key, val]) => (
          <div key={key} style={{ padding: '15px', backgroundColor: '#1d2d50', borderRadius: '10px', border: '1px solid #64ffda' }}>
            <span style={{ textTransform: 'capitalize', color: '#64ffda' }}>{key === 'quran' ? 'قرآن پاک' : key === 'durood' ? 'درود شریف' : key === 'kalma' ? 'کلمہ طیبہ' : key === 'istighfar' ? 'استغفار' : 'دیگر'}</span>
            <h3 style={{ margin: '5px 0' }}>{val}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
