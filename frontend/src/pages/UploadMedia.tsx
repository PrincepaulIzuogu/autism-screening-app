import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AppLayout from '../components/AppLayout';

const moods = ['Happy', 'Cry', 'Surprised', 'Angry', 'Fear', 'Love', 'Neutral'];

interface CustomStimulus {
  id: number;
  mood: string;
  filename: string;
  url: string;
}

const UploadMedia = () => {
  const [selectedMood, setSelectedMood] = useState('Happy');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [customStimuli, setCustomStimuli] = useState<CustomStimulus[]>([]);

  useEffect(() => {
    const fetchStimuli = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:8000/my-stimuli', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCustomStimuli(res.data);
      } catch (err) {
        console.error('Failed to fetch custom stimuli', err);
      }
    };

    fetchStimuli();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select a file first.');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mood', selectedMood);

      const res = await axios.post('http://localhost:8000/upload-stimulus', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessage('✅ Upload successful!');
      setFile(null);

      // refresh custom stimuli list
      const refresh = await axios.get('http://localhost:8000/my-stimuli', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCustomStimuli(refresh.data);
    } catch (err) {
      console.error(err);
      setMessage('❌ Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">📤 Upload Custom Stimulus</h2>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Select Mood</label>
          <select
            className="w-full border border-gray-300 px-3 py-2 rounded"
            value={selectedMood}
            onChange={(e) => setSelectedMood(e.target.value)}
          >
            {moods.map((mood) => (
              <option key={mood} value={mood}>{mood}</option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Choose File (gif/mp4)</label>
          <input
            type="file"
            accept="image/gif,video/mp4"
            onChange={handleFileChange}
            className="w-full"
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={uploading}
          className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>

        {message && <p className="mt-4 text-center text-sm text-gray-700">{message}</p>}

        <div className="mt-8">
          <h3 className="text-xl font-medium mb-2">🎞️ Your Custom Stimuli</h3>
          {customStimuli.length > 0 ? (
            <ul className="space-y-2">
              {customStimuli.map((stimulus) => (
                <li key={stimulus.id} className="text-sm text-gray-800">
                  ✅ {stimulus.mood} — <a href={stimulus.url} target="_blank" rel="noreferrer" className="text-blue-600 underline">{stimulus.filename}</a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">You haven’t uploaded any custom stimuli yet.</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default UploadMedia;
