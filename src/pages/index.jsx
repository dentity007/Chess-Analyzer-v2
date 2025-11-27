import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import GameAnalysis from "./GameAnalysis";

import Analysis from "./Analysis";

import Statistics from "./Statistics";

import Home from "./Home";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    GameAnalysis: GameAnalysis,
    
    Analysis: Analysis,
    
    Statistics: Statistics,
    
    Home: Home,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/GameAnalysis" element={<GameAnalysis />} />
                
                <Route path="/Analysis" element={<Analysis />} />
                
                <Route path="/Statistics" element={<Statistics />} />
                
                <Route path="/Home" element={<Home />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}