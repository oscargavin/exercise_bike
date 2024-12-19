import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import JSZip from 'jszip';

const ExportDataButton = ({ token }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/user/sessions/export', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch session data');
      }

      const data = await response.json();

      // Create sessions metadata CSV
      let sessionsContent = 'session_id,started_at,exercise_time\n';

      // Create time series CSV
      let timeseriesContent = 'session_id,timestamp,speed,cadence,resistance,heart_rate\n';

      // Process each session
      data.sessions.forEach(session => {
        // Add session metadata row
        sessionsContent += `${session.session_id},${session.started_at},${session.exercise_time}\n`;

        // Add time series rows
        for (let i = 0; i < session.timestamps.length; i++) {
          timeseriesContent += `${session.session_id},${session.timestamps[i]},${session.speed_data[i]},${session.cadence_data[i]},${session.resistance_data[i]},${session.heart_rate_data[i]}\n`;
        }
      });

      // Create and download both files in a zip
      const zip = new JSZip();

      // Add files to zip
      zip.file('sessions.csv', sessionsContent);
      zip.file('timeseries.csv', timeseriesContent);

      // Generate and download zip
      const zipContent = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(zipContent);
      link.setAttribute('href', url);
      link.setAttribute('download', `my_exercise_data_${new Date().toISOString().split('T')[0]}.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Error exporting sessions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isLoading}
      className="flex items-center px-6 py-2 font-medium rounded-xl transition-all duration-200 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Download className="w-4 h-4 mr-2" />
      )}
      {isLoading ? 'Exporting...' : 'Export My Data'}
    </button>
  );
};

export default ExportDataButton;