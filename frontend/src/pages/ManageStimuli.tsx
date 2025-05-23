import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AppLayout from '../components/AppLayout';

const moods = [
  'Happy',
  'Cry',
  'Surprised',
  'Angry',
  'Fear',
  'Love',
  'Neutral',
];

const ManageStimuli = () => {
  const [stimuli, setStimuli] = useState<Record<string, string[]>>({});
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const stored = localStorage.getItem('selectedStimuli');
    return stored ? JSON.parse(stored) : moods.reduce((acc, mood) => ({ ...acc, [mood]: 'Default' }), {});
  });

  useEffect(() => {
    const fetchStimuli = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:8000/my-stimuli', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const grouped: Record<string, string[]> = {};
        moods.forEach(m => grouped[m] = []);
        res.data.forEach((item: any) => {
          grouped[item.mood].push(item.filename);
        });
        setStimuli(grouped);
      } catch (err) {
        console.error('Failed to fetch stimuli:', err);
      }
    };
    fetchStimuli();
  }, []);

  const handleChange = (mood: string, value: string) => {
    const updated = { ...selected, [mood]: value };
    setSelected(updated);
    localStorage.setItem('selectedStimuli', JSON.stringify(updated));
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">🎛 Manage Stimuli</h2>

        {moods.map(mood => (
          <div key={mood} className="mb-4">
            <label className="block mb-1 font-medium text-gray-700">{mood}</label>
            <select
              value={selected[mood] || 'Default'}
              onChange={(e) => handleChange(mood, e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded"
            >
              <option value="Default">Default</option>
              {(stimuli[mood] || []).map((s, i) => (
                <option key={i} value={s}>{s}</option>
              ))}
            </select>
            {(stimuli[mood] || []).length === 0 && (
              <p className="text-sm text-gray-500 mt-1">No custom stimuli.</p>
            )}
          </div>
        ))}
      </div>
    </AppLayout>
  );
};

export default ManageStimuli;
