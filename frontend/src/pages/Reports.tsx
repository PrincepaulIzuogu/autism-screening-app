import React, { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface ScreeningSession {
  timestamp: string;
  stimulus: string;
  gaze_direction: string;
  left_pupil_size: number;
  right_pupil_size: number;
  asd_flag: string;
}

interface ApiResponse {
  sessions: ScreeningSession[];
  decision: 'Signs of ASD detected' | 'No concerning signs detected' | 'No data available';
}

const Reports = () => {
  const [sessions, setSessions] = useState<ScreeningSession[]>([]);
  const [decision, setDecision] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get<ApiResponse>('http://localhost:8000/screening-sessions', {
          headers: { Authorization: `Bearer ${token}` },
        });

        setSessions(response.data.sessions);
        setDecision(response.data.decision);
      } catch (error) {
        console.error('Failed to fetch reports', error);
        setDecision('Error fetching data.');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const chartData = sessions.map((session, index) => ({
    id: index,
    date: new Date(session.timestamp).toLocaleString(),
    avg_pupil: (
      (session.left_pupil_size + session.right_pupil_size) / 2
    ).toFixed(2),
  }));

  return (
    <AppLayout>
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">📊 Screening Report</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <div className={`mb-4 text-xl font-medium ${
              decision === 'Signs of ASD detected' ? 'text-red-600' :
              decision === 'No data available' ? 'text-gray-600' :
              'text-green-700'
            }`}>
              {decision === 'Signs of ASD detected'
                ? '⚠️ Signs of ASD detected'
                : decision === 'No data available'
                ? 'ℹ️ No data available'
                : '✅ No concerning signs detected'}
            </div>

            {sessions.length > 0 && (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 'auto']} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="avg_pupil" stroke="#8884d8" name="Avg Pupil Size" />
                  </LineChart>
                </ResponsiveContainer>

                <table className="table-auto w-full mt-8 border border-collapse border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border p-2">Date</th>
                      <th className="border p-2">Stimulus</th>
                      <th className="border p-2">Gaze</th>
                      <th className="border p-2">Left Pupil</th>
                      <th className="border p-2">Right Pupil</th>
                      <th className="border p-2">ASD Flag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s, index) => (
                      <tr key={index}>
                        <td className="border p-2">{new Date(s.timestamp).toLocaleString()}</td>
                        <td className="border p-2">{s.stimulus}</td>
                        <td className="border p-2">{s.gaze_direction}</td>
                        <td className="border p-2">{s.left_pupil_size.toFixed(2)}</td>
                        <td className="border p-2">{s.right_pupil_size.toFixed(2)}</td>
                        <td className="border p-2">{s.asd_flag}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Reports;
