// client/src/pages/GenerateDPR.js
import React, { useState, useEffect } from 'react';

const GenerateDPR = () => {
  const [formData, setFormData] = useState({
    projectName: '',
    date: '',
    subNo: '',
    weather: '',
    temperature: '',
    humidity: '',
    start: '',
    finish: '',
    remarks: '',
    labourReport: [{ contractor: '', bigaari: '', mistry: '', baai: '', timings: '', hours: '' }],
    toolsUsed: [{ srNo: '', unit: '', qty: '', description: '' }],
    deliveryReport: [{ srNo: '', unit: '', qty: '', description: '' }],
    todayWork: '',
    completedWork: '',
    nextWork: ''
  });

  const [aiSuggestions, setAiSuggestions] = useState([]);

  useEffect(() => {
    if (formData.date) fetchWeather();
    generateAISuggestions();
  }, [formData]);

  const handleChange = (e, field, index, section) => {
    if (section) {
      const updated = [...formData[section]];
      updated[index][field] = e.target.value;
      setFormData({ ...formData, [section]: updated });
    } else {
      setFormData({ ...formData, [field]: e.target.value });
    }
  };

const addRow = (section) => {
  const sectionData = formData[section] || [];

  const fallbackTemplates = {
    labourReport: { contractor: '', bigaari: '', mistry: '', baai: '', timings: '', hours: '' },
    toolsUsed: { srNo: '', unit: '', qty: '', description: '' },
    deliveryReport: { srNo: '', unit: '', qty: '', description: '' },
  };

  const template = sectionData[0] || fallbackTemplates[section] || {};
  const blankRow = Object.fromEntries(Object.keys(template).map(k => [k, '']));
  setFormData({ ...formData, [section]: [...sectionData, blankRow] });
};


  const handleSave = async () => {
    if (!formData.projectName || !formData.date) return alert('Please fill Project Name and Date');

    try {
      const res = await fetch('http://localhost:5000/api/dpr/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await res.json();
      if (res.ok) {
        alert('✅ DPR saved successfully!');
      } else {
        alert('❌ Error: ' + result.error);
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('❌ Failed to save DPR');
    }
  };

  const handleDownload = () => {
    if (!formData.date) return alert('Please select a date before downloading.');
    const url = `http://localhost:5000/api/dpr/export?date=${formData.date}`;
    window.open(url, '_blank');
  };

  const startVoiceInput = (field) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert('🎤 Voice recognition not supported');

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';

    recognition.onresult = (e) => {
      const spoken = e.results[0][0].transcript;
      setFormData(prev => ({ ...prev, [field]: (prev[field] || '') + ' ' + spoken }));
    };
    recognition.start();
  };

  const fetchWeather = async () => {
    const city = 'Pune'; // You can make this dynamic
    const apiKey = '5cd75099f817f020ac0a67ec8b940a5f';
    try {
      const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Pune&appid=5cd75099f817f020ac0a67ec8b940a5f&units=metric
`);
      const data = await res.json();
      setFormData(prev => ({
        ...prev,
        weather: data.weather[0].main,
        temperature: `${data.main.temp} °C`,
        humidity: `${data.main.humidity} %`
      }));
    } catch (err) {
      console.error('Failed to fetch weather:', err);
    }
  };

  const generateAISuggestions = () => {
    const suggestions = [];
    if (!formData.weather) suggestions.push('🌤 Click to auto-fetch weather');
    if (!formData.todayWork) suggestions.push('🛠 Add details for today’s work');
    if (formData.labourReport.length === 0) suggestions.push('👷 No labour rows added');
    setAiSuggestions(suggestions);
  };

  const renderTable = (title, section, columns) => (
    <div className="mb-4">
      <h5>{title}</h5>
      <table className="table table-bordered">
        <thead>
          <tr>{columns.map((col, i) => <th key={i}>{col.label}</th>)}</tr>
        </thead>
        <tbody>
          {formData[section].map((row, idx) => (
            <tr key={idx}>
              {columns.map(col => (
                <td key={col.field}>
                  <input type="text" className="form-control" value={row[col.field]} onChange={e => handleChange(e, col.field, idx, section)} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <button className="btn btn-sm btn-outline-primary" onClick={() => addRow(section)}>Add Row</button>
    </div>
  );

  return (
    <div className="container py-4">
      <h3 className="mb-4">📝 Daily Progress Report</h3>

      <div className="row mb-3">
        <div className="col-md-4">
          <label>Project Name</label>
          <input className="form-control" value={formData.projectName} onChange={e => handleChange(e, 'projectName')} />
        </div>
        <div className="col-md-4">
          <label>Date</label>
          <input type="date" className="form-control" value={formData.date} onChange={e => handleChange(e, 'date')} />
        </div>
        <div className="col-md-4">
          <label>Sub No</label>
          <input className="form-control" value={formData.subNo} onChange={e => handleChange(e, 'subNo')} />
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-3">
          <label>Weather</label>
          <input className="form-control" value={formData.weather} onChange={e => handleChange(e, 'weather')} />
          <button className="btn btn-sm btn-info mt-1" onClick={fetchWeather}>Fetch Weather</button>
        </div>
        <div className="col-md-3">
          <label>Temperature</label>
          <input className="form-control" value={formData.temperature} onChange={e => handleChange(e, 'temperature')} />
        </div>
        <div className="col-md-3">
          <label>Humidity</label>
          <input className="form-control" value={formData.humidity} onChange={e => handleChange(e, 'humidity')} />
        </div>
        <div className="col-md-3">
          <label>Start - Finish</label>
          <div className="d-flex gap-2">
            <input type="time" className="form-control" value={formData.start} onChange={e => handleChange(e, 'start')} />
            <input type="time" className="form-control" value={formData.finish} onChange={e => handleChange(e, 'finish')} />
          </div>
        </div>
      </div>

      <div className="mb-3">
        <label>Remarks</label>
        <textarea className="form-control" rows={3} value={formData.remarks} onChange={e => handleChange(e, 'remarks')} />
        <button className="btn btn-sm btn-outline-secondary mt-1" onClick={() => startVoiceInput('remarks')}>🎤 Speak</button>
      </div>

      {renderTable('Labour Report', 'labourReport', [
        { label: 'Contractor Name', field: 'contractor' },
        { label: 'Bigaari', field: 'bigaari' },
        { label: 'Mistry', field: 'mistry' },
        { label: 'Baai', field: 'baai' },
        { label: 'Timings', field: 'timings' },
        { label: 'Hours', field: 'hours' }
      ])}

      {renderTable('Material & Tools Used', 'toolsUsed', [
        { label: 'Sr.No', field: 'srNo' },
        { label: 'Unit', field: 'unit' },
        { label: 'Qty', field: 'qty' },
        { label: 'Description', field: 'description' }
      ])}

      {renderTable('Material Delivery Report', 'deliveryReport', [
        { label: 'Sr.No', field: 'srNo' },
        { label: 'Unit', field: 'unit' },
        { label: 'Qty', field: 'qty' },
        { label: 'Description', field: 'description' }
      ])}

      <div className="mb-3">
        <label>Today's Work</label>
        <textarea className="form-control" value={formData.todayWork} onChange={e => handleChange(e, 'todayWork')} />
        <button className="btn btn-sm btn-outline-secondary mt-1" onClick={() => startVoiceInput('todayWork')}>🎤 Speak</button>
      </div>
      <div className="mb-3">
        <label>Work Completed</label>
        <textarea className="form-control" value={formData.completedWork} onChange={e => handleChange(e, 'completedWork')} />
        <button className="btn btn-sm btn-outline-secondary mt-1" onClick={() => startVoiceInput('completedWork')}>🎤 Speak</button>
      </div>
      <div className="mb-3">
        <label>Next Day Work</label>
        <textarea className="form-control" value={formData.nextWork} onChange={e => handleChange(e, 'nextWork')} />
        <button className="btn btn-sm btn-outline-secondary mt-1" onClick={() => startVoiceInput('nextWork')}>🎤 Speak</button>
      </div>

      {aiSuggestions.length > 0 && (
        <div className="alert alert-warning">
          <strong>🤖 AI Suggestions:</strong>
          <ul className="mb-0">
            {aiSuggestions.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}

      <div className="text-center">
        <button className="btn btn-primary" onClick={handleSave}>💾 Save DPR</button>
        <button className="btn btn-success ms-2" onClick={handleDownload}>⬇️ Download as Excel</button>
      </div>
    </div>
  );
};

export default GenerateDPR;
