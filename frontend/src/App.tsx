import { HashRouter, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Chat from './pages/Chat';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </HashRouter>
  );
}
