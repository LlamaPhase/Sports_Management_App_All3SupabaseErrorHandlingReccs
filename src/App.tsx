import React, { useState, useEffect, useContext } from 'react'; // Added useContext
    import { Session } from '@supabase/supabase-js';
    import { supabase } from './lib/supabaseClient';
    import Layout from './components/Layout';
    import TeamPage from './pages/TeamPage';
    import SchedulePage from './pages/SchedulePage';
    import StatsPage from './pages/StatsPage';
    import LineupPage from './pages/LineupPage';
    import GamePage from './pages/GamePage';
    import AuthPage from './pages/AuthPage';
    import { TeamProvider, TeamContext } from './context/TeamContext'; // Import TeamContext
    import { DndProvider } from 'react-dnd';
    import { HTML5Backend } from 'react-dnd-html5-backend';

    // Separate component to consume context and render main app
    const AppContent: React.FC = () => {
      const { isLoading, error } = useContext(TeamContext); // Get loading and error state
      const [session, setSession] = useState<Session | null>(null);
      const [authLoading, setAuthLoading] = useState(true); // Separate loading for auth check
      const [currentPage, _setCurrentPage] = useState('team');
      const [previousPage, setPreviousPage] = useState<string | null>(null);
      const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

      useEffect(() => {
        setAuthLoading(true); // Start auth loading check
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
          setAuthLoading(false); // Finish auth loading check
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session);
          if (!session) {
            _setCurrentPage('team');
            setPreviousPage(null);
            setSelectedGameId(null);
          }
          // No need to setAuthLoading here as it's for the initial check
        });

        return () => subscription.unsubscribe();
      }, []);

      const setCurrentPage = (newPage: string) => {
        if (newPage !== currentPage) {
          setPreviousPage(currentPage);
          _setCurrentPage(newPage);
        }
      };

      const selectGame = (gameId: string) => {
        setSelectedGameId(gameId);
        setCurrentPage('game');
      };

      const renderPage = () => {
        switch (currentPage) {
          case 'team': return <TeamPage />;
          case 'schedule': return <SchedulePage />;
          case 'stats': return <StatsPage />;
          case 'lineup': return <LineupPage previousPage={previousPage} />;
          case 'game': return <GamePage gameId={selectedGameId} previousPage={previousPage} />;
          default: return <TeamPage />;
        }
      };

      const showMainLayout = currentPage !== 'game';

      // --- Render Logic ---

      // 1. Show loading if either auth check or initial data fetch is happening
      if (authLoading || (session && isLoading)) {
        return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading application data...</div>;
      }

      // 2. Show error if initial data fetch failed
      if (session && error) {
         return <div className="min-h-screen flex flex-col items-center justify-center text-red-600 p-4">
            <p className="font-semibold">Error loading data:</p>
            <p className="text-sm">{error}</p>
            <button
                onClick={() => supabase.auth.signOut()} // Allow user to sign out if stuck
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
                Sign Out
            </button>
         </div>;
      }

      // 3. Show Auth page if no session
      if (!session) {
        return <AuthPage />;
      }

      // 4. Show main application content if session exists and data is loaded (or loading finished without error)
      return (
        <>
          {showMainLayout ? (
            <Layout currentPage={currentPage} setCurrentPage={setCurrentPage}>
              {renderPage()}
            </Layout>
          ) : (
            <div className="min-h-screen bg-gray-100 flex flex-col">
              <main className="flex-grow flex flex-col">
                {renderPage()}
              </main>
            </div>
          )}
        </>
      );
    };


    // Main App component wraps Provider and Content
    function App() {
      // These state variables are now managed within AppContent
      // const [currentPage, _setCurrentPage] = useState('team');
      // const [previousPage, setPreviousPage] = useState<string | null>(null);
      // const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

      // Dummy functions passed to Provider, actual implementation is in AppContent
      // This is slightly awkward, might refactor later if needed, but works for now.
      const dummySetCurrentPage = () => {};
      const dummySelectGame = () => {};


      return (
        <DndProvider backend={HTML5Backend}>
          {/* TeamProvider now wraps AppContent */}
          <TeamProvider setCurrentPage={dummySetCurrentPage} selectGame={dummySelectGame}>
             <AppContent />
          </TeamProvider>
        </DndProvider>
      );
    }

    export default App;
