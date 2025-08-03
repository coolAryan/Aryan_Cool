import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from '../components/Navbar.tsx';
import PortfolioPage from '../components/PortfolioPage.tsx';
import GamePage from '../components/GamePage.tsx';


const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-slate-900 text-slate-300 font-sans">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<PortfolioPage />} />
            <Route path="/game" element={<GamePage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;