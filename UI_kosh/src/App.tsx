import { useState } from 'react';
import AutoMLWizard from './pages/model-exchange/tools/AutoMLWizard';
import Dashboard from './pages/model-exchange/Dashboard';

function App() {
  const [view, setView] = useState<'dashboard' | 'wizard'>('dashboard');

  if (view === 'wizard') {
    return <AutoMLWizard onBack={() => setView('dashboard')} />;
  }

  return <Dashboard onStartProject={() => setView('wizard')} />;
}

export default App;
