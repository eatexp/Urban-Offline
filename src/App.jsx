import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Guides from './pages/Guides';
import Map from './pages/Map';
import Resources from './pages/Resources';
import ArticleView from './pages/ArticleView';

import Health from './pages/Health';
import TriagePage from './pages/TriagePage';
import Survival from './pages/Survival';
import Law from './pages/Law';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="guides" element={<Guides />} />
          <Route path="map" element={<Map />} />
          <Route path="resources" element={<Resources />} />

          <Route path="article/:slug" element={<ArticleView />} />
          <Route path="health" element={<Health />} />
          <Route path="triage/:storyId" element={<TriagePage />} />
          <Route path="survival" element={<Survival />} />
          <Route path="law" element={<Law />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
