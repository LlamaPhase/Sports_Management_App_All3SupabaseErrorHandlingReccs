import React, { createContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
    import { supabase } from '../lib/supabaseClient';
    import { Session, User, PostgrestError } from '@supabase/supabase-js'; // Import PostgrestError
    import { v4 as uuidv4 } from 'uuid';

    // --- Database Type Mapping ---
    // ... (interfaces remain the same) ...
    interface TeamRecord { id: string; user_id: string; name: string; logo_url: string | null; created_at: string; }
    interface PlayerRecord { id: string; team_id: string; first_name: string; last_name: string; player_number: string | null; location: 'bench' | 'field'; position: { x: number; y: number } | null; created_at: string; updated_at: string; }
    interface GameRecord { id: string; team_id: string; opponent: string; game_date: string; game_time: string | null; location: 'home' | 'away'; season: string | null; competition: string | null; home_score: number; away_score: number; timer_status: 'stopped' | 'running'; timer_start_time: string | null; timer_elapsed_seconds: number; is_explicitly_finished: boolean; created_at: string; updated_at: string; }
    interface GameLineupRecord { id: string; game_id: string; player_id: string; location: 'field' | 'bench' | 'inactive'; position: { x: number; y: number } | null; initial_position: { x: number; y: number } | null; playtime_seconds: number; playtimer_start_time: string | null; is_starter: boolean; subbed_on_count: number; subbed_off_count: number; created_at: string; updated_at: string; }
    interface GameEventRecord { id: string; game_id: string; type: 'goal' | 'substitution'; team: 'home' | 'away'; scorer_player_id: string | null; assist_player_id: string | null; player_in_id: string | null; player_out_id: string | null; event_timestamp: string; game_seconds: number; created_at: string; }
    interface SavedLineupRecord { id: string; team_id: string; name: string; lineup_data: PlayerLineupStructure[]; created_at: string; }

    // --- Frontend Types ---
    // ... (interfaces remain the same) ...
    export interface Player { id: string; firstName: string; lastName: string; number: string; location: 'bench' | 'field'; position?: { x: number; y: number }; }
    export interface PlayerLineupState { id: string; location: 'bench' | 'field' | 'inactive'; position?: { x: number; y: number }; initialPosition?: { x: number; y: number }; playtimeSeconds: number; playtimerStartTime: number | null; isStarter: boolean; subbedOnCount: number; subbedOffCount: number; }
    export type PlayerLineupStructure = Pick<PlayerLineupState, 'id' | 'location' | 'position'>;
    export interface GameEvent { id: string; type: 'goal' | 'substitution'; team: 'home' | 'away'; scorerPlayerId?: string | null; assistPlayerId?: string | null; playerInId?: string; playerOutId?: string; timestamp: number; gameSeconds: number; }
    export interface Game { id: string; opponent: string; date: string; time: string; location: 'home' | 'away'; season?: string; competition?: string; homeScore: number; awayScore: number; timerStatus: 'stopped' | 'running'; timerStartTime: number | null; timerElapsedSeconds: number; isExplicitlyFinished: boolean; lineup?: PlayerLineupState[] | null; events?: GameEvent[]; }
    export interface SavedLineup { id: string; name: string; players: PlayerLineupStructure[]; }
    export interface GameHistory { seasons: string[]; competitions: string[]; }

    // --- Context Props Interface ---
    // ... (interface remains the same) ...
    interface TeamContextProps { teamId: string | null; teamName: string; setTeamName: (name: string) => Promise<Error | null>; teamLogo: string | null; setTeamLogo: (logo: string | null) => Promise<Error | null>; players: Player[]; addPlayer: (firstName: string, lastName: string, number: string) => Promise<Error | null>; updatePlayer: (id: string, updates: Partial<Pick<Player, 'firstName' | 'lastName' | 'number' | 'location' | 'position'>>) => Promise<Error | null>; deletePlayer: (id: string) => Promise<Error | null>; games: Game[]; addGame: (opponent: string, date: string, time: string, location: 'home' | 'away', season?: string, competition?: string) => Promise<string | Error | null>; updateGame: (id: string, updates: Partial<Omit<Game, 'id' | 'lineup' | 'events'>>) => Promise<Error | null>; deleteGame: (id: string) => Promise<Error | null>; startGameTimer: (gameId: string) => Promise<Error | null>; stopGameTimer: (gameId: string) => Promise<Error | null>; markGameAsFinished: (gameId: string) => Promise<Error | null>; resetGameLineup: (gameId: string) => Promise<PlayerLineupState[] | Error | null>; movePlayerInGame: (gameId: string, playerId: string, sourceLocation: PlayerLineupState['location'], targetLocation: PlayerLineupState['location'], newPosition?: { x: number; y: number }) => Promise<Error | null>; movePlayer: (playerId: string, targetLocation: 'bench' | 'field', position?: { x: number; y: number }) => Promise<Error | null>; swapPlayers: (player1Id: string, player2Id: string) => Promise<Error | null>; savedLineups: SavedLineup[]; saveLineup: (name: string) => Promise<Error | null>; loadLineup: (lineupId: string) => Promise<boolean | Error>; deleteLineup: (lineupId: string) => Promise<Error | null>; resetLineup: () => Promise<Error | null>; setCurrentPage: (page: string) => void; selectGame: (gameId: string) => void; gameHistory: GameHistory; getMostRecentSeason: () => string | undefined; getMostRecentCompetition: () => string | undefined; addGameEvent: (gameId: string, eventData: Omit<GameEvent, 'id' | 'timestamp'>) => Promise<Error | null>; removeLastGameEvent: (gameId: string, team: 'home' | 'away', type: 'goal' | 'substitution') => Promise<Error | null>; isLoading: boolean; error: string | null; fetchTeamData: (user: User) => Promise<void>; clearTeamData: () => void; }

    // --- Context ---
    // ... (createContext remains the same) ...
    export const TeamContext = createContext<TeamContextProps>({ teamId: null, teamName: '', setTeamName: async () => null, teamLogo: null, setTeamLogo: async () => null, players: [], addPlayer: async () => null, updatePlayer: async () => null, deletePlayer: async () => null, games: [], addGame: async () => null, updateGame: async () => null, deleteGame: async () => null, startGameTimer: async () => null, stopGameTimer: async () => null, markGameAsFinished: async () => null, resetGameLineup: async () => null, movePlayerInGame: async () => null, movePlayer: async () => null, swapPlayers: async () => null, savedLineups: [], saveLineup: async () => null, loadLineup: async () => false, deleteLineup: async () => null, resetLineup: async () => null, setCurrentPage: () => { console.warn("Default setCurrentPage context function called."); }, selectGame: () => { console.warn("Default selectGame context function called."); }, gameHistory: { seasons: [], competitions: [] }, getMostRecentSeason: () => undefined, getMostRecentCompetition: () => undefined, addGameEvent: async () => null, removeLastGameEvent: async () => null, isLoading: true, error: null, fetchTeamData: async () => {}, clearTeamData: () => {}, });

    // --- Provider ---
    interface TeamProviderProps { children: ReactNode; setCurrentPage: (page: string) => void; selectGame: (gameId: string) => void; }
    const formatDbTimeToInput = (dbTime: string | null): string => { /* ... */ };
    const formatTimestampForDb = (timestamp: number | null): string | null => { /* ... */ };
    const parseTimestampFromDb = (isoString: string | null): number | null => { /* ... */ };

    // --- NEW: Supabase Error Parsing Helper ---
    const parseSupabaseError = (error: any): string => {
      if (error instanceof PostgrestError) {
        console.error("Supabase Postgrest Error:", error);
        switch (error.code) {
          case '23505': // unique_violation
            if (error.details?.includes('saved_lineups_team_id_name_key')) {
              return 'A lineup with this name already exists.';
            }
            // Add more specific unique constraint checks if needed (e.g., player number)
            return 'This item already exists or conflicts with another item.';
          case '23503': // foreign_key_violation
            return 'Could not perform action due to related data. Please check dependencies.';
          case '42501': // permission_denied (RLS)
            return 'You do not have permission to perform this action.';
          case 'PGRST116': // Not found single item
             return 'The requested item could not be found.';
          // Add more specific codes as needed
          default:
            return error.message || 'A database error occurred.';
        }
      } else if (error instanceof Error) {
        // Network errors or other JS errors
        console.error("Generic/Network Error:", error);
        if (error.message.toLowerCase().includes('network request failed') || error.message.toLowerCase().includes('failed to fetch')) {
          return 'Network error. Please check your connection and try again.';
        }
        return error.message || 'An unexpected error occurred.';
      } else {
        console.error("Unknown Error Type:", error);
        return 'An unknown error occurred.';
      }
    };
    // --- End Helper ---


    export const TeamProvider: React.FC<TeamProviderProps> = ({ children, setCurrentPage, selectGame }) => {
      const [teamId, setTeamId] = useState<string | null>(null);
      const [teamName, setTeamNameState] = useState<string>('');
      const [teamLogo, setTeamLogoState] = useState<string | null>(null);
      const [players, setPlayersState] = useState<Player[]>([]);
      const [games, setGamesState] = useState<Game[]>([]);
      const [savedLineups, setSavedLineupsState] = useState<SavedLineup[]>([]);
      const [gameHistory, setGameHistoryState] = useState<GameHistory>({ seasons: [], competitions: [] });
      const [isLoading, setIsLoading] = useState<boolean>(true);
      const [error, setError] = useState<string | null>(null); // Keep for initial load errors
      const [session, setSession] = useState<Session | null>(null);

      // --- Auth Listener ---
      useEffect(() => { /* ... (no changes needed here) ... */ }, []);

      // --- Data Fetching ---
      const fetchTeamData = useCallback(async (user: User) => {
        if (!user) { clearTeamData(); setIsLoading(false); return; }
        setIsLoading(true); setError(null); console.log("Fetching team data for user:", user.id);
        try {
          // ... (fetch logic remains the same) ...
          const { data: teamData, error: teamError } = await supabase.from('teams').select('*').eq('user_id', user.id).single();
          if (teamError || !teamData) { /* ... */ throw teamError || new Error('Team data could not be fetched.'); }
          const currentTeamId = teamData.id; setTeamId(currentTeamId); setTeamNameState(teamData.name || 'Your Team'); setTeamLogoState(teamData.logo_url);
          const [playersRes, gamesRes, savedLineupsRes] = await Promise.all([ /* ... */ ]);
          if (playersRes.error) throw playersRes.error; if (gamesRes.error) throw gamesRes.error; if (savedLineupsRes.error) throw savedLineupsRes.error;
          const fetchedPlayers: Player[] = (playersRes.data || []).map((p: PlayerRecord) => ({ /* ... */ })); setPlayersState(fetchedPlayers);
          const fetchedGames: Game[] = (gamesRes.data || []).map((g: GameRecord) => ({ /* ... */ })); setGamesState(fetchedGames);
          const fetchedSavedLineups: SavedLineup[] = (savedLineupsRes.data || []).map((sl: SavedLineupRecord) => ({ /* ... */ })); setSavedLineupsState(fetchedSavedLineups);
          updateHistoryFromGames(fetchedGames);
        } catch (err: any) {
          console.error("Error fetching team data:", err);
          // Use the parser for the initial load error message
          setError(parseSupabaseError(err));
          clearTeamData();
        } finally {
          setIsLoading(false);
        }
      }, []);

      const clearTeamData = () => { /* ... (no changes needed here) ... */ };

      // --- Data Modification Functions (Using Error Parser) ---

      const setTeamName = async (name: string): Promise<Error | null> => {
        if (!teamId) return new Error("No team loaded.");
        try {
          const { error } = await supabase.from('teams').update({ name: name }).eq('id', teamId);
          if (error) throw error;
          setTeamNameState(name);
          return null; // Success
        } catch (err: any) {
          console.error("Error updating team name:", err);
          return new Error(parseSupabaseError(err)); // Return parsed error
        }
      };

      const setTeamLogo = async (logo: string | null): Promise<Error | null> => {
        if (!teamId) return new Error("No team loaded.");
        try {
          const { error } = await supabase.from('teams').update({ logo_url: logo }).eq('id', teamId);
          if (error) throw error;
          setTeamLogoState(logo);
          return null; // Success
        } catch (err: any) {
          console.error("Error updating team logo:", err);
          return new Error(parseSupabaseError(err)); // Return parsed error
        }
      };

      const addPlayer = async (firstName: string, lastName: string, number: string): Promise<Error | null> => {
        if (!teamId) return new Error("No team loaded.");
        try {
          const { data, error } = await supabase.from('players').insert({ team_id: teamId, first_name: firstName, last_name: lastName, player_number: number || null, location: 'bench', position: null, }).select().single();
          if (error) throw error;
          if (data) { const newPlayer: Player = { id: data.id, firstName: data.first_name, lastName: data.last_name, number: data.player_number || '', location: data.location || 'bench', position: data.position || undefined, }; setPlayersState(prev => [...prev, newPlayer].sort((a, b) => a.firstName.localeCompare(b.firstName))); }
          return null; // Success
        } catch (err: any) {
          console.error("Error adding player:", err);
          return new Error(parseSupabaseError(err)); // Return parsed error
        }
      };

      const updatePlayer = async (id: string, updates: Partial<Pick<Player, 'firstName' | 'lastName' | 'number' | 'location' | 'position'>>): Promise<Error | null> => {
        if (!teamId) return new Error("No team loaded.");
        try {
          const dbUpdates: Partial<PlayerRecord> = {};
          if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName; if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName; if (updates.number !== undefined) dbUpdates.player_number = updates.number || null; if (updates.location !== undefined) dbUpdates.location = updates.location; if (updates.position !== undefined) dbUpdates.position = updates.position || null; dbUpdates.updated_at = new Date().toISOString();
          const { error } = await supabase.from('players').update(dbUpdates).eq('id', id).eq('team_id', teamId);
          if (error) throw error;
          setPlayersState(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p).sort((a, b) => a.firstName.localeCompare(b.firstName)));
          return null; // Success
        } catch (err: any) {
          console.error("Error updating player:", err);
          return new Error(parseSupabaseError(err)); // Return parsed error
        }
      };

      const deletePlayer = async (id: string): Promise<Error | null> => {
        if (!teamId) return new Error("No team loaded.");
        try {
          const { error } = await supabase.from('players').delete().eq('id', id).eq('team_id', teamId);
          if (error) throw error;
          setPlayersState(prev => prev.filter(p => p.id !== id));
          setSavedLineupsState(prev => prev.map(sl => ({ ...sl, players: sl.players.filter(p => p.id !== id) })));
          return null; // Success
        } catch (err: any) {
          console.error("Error deleting player:", err);
          return new Error(parseSupabaseError(err)); // Return parsed error
        }
      };

      const addGame = async (opponent: string, date: string, time: string, location: 'home' | 'away', season?: string, competition?: string): Promise<string | Error | null> => {
        if (!teamId) return new Error("No team loaded.");
        try {
          const { data, error } = await supabase.from('games').insert({ team_id: teamId, opponent: opponent, game_date: date, game_time: time || null, location: location, season: season || null, competition: competition || null, }).select().single();
          if (error) throw error;
          if (data) {
            const newGame: Game = { id: data.id, opponent: data.opponent, date: data.game_date, time: formatDbTimeToInput(data.game_time), location: data.location, season: data.season || '', competition: data.competition || '', homeScore: data.home_score, awayScore: data.away_score, timerStatus: data.timer_status, timerStartTime: parseTimestampFromDb(data.timer_start_time), timerElapsedSeconds: data.timer_elapsed_seconds, isExplicitlyFinished: data.is_explicitly_finished, lineup: null, events: [], };
            setGamesState(prev => [...prev, newGame].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())); updateHistoryFromGames([...games, newGame]);
            const lineupInserts = players.map(p => ({ game_id: newGame.id, player_id: p.id, location: 'bench', playtime_seconds: 0, is_starter: false, subbed_on_count: 0, subbed_off_count: 0, }));
            const { error: lineupError } = await supabase.from('game_lineups').insert(lineupInserts);
            if (lineupError) { console.error("Error creating default lineup entries:", lineupError); return new Error(parseSupabaseError(lineupError)); } // Return parsed error
            return newGame.id; // Success, return ID
          }
          return null; // Should not happen if insert succeeds
        } catch (err: any) {
          console.error("Error adding game:", err);
          return new Error(parseSupabaseError(err)); // Return parsed error
        }
      };

      const updateGame = async (id: string, updates: Partial<Omit<Game, 'id' | 'lineup' | 'events'>>): Promise<Error | null> => {
        if (!teamId) return new Error("No team loaded.");
        try {
          const dbUpdates: Partial<GameRecord> = {};
          if (updates.opponent !== undefined) dbUpdates.opponent = updates.opponent; if (updates.date !== undefined) dbUpdates.game_date = updates.date; if (updates.time !== undefined) dbUpdates.game_time = updates.time || null; if (updates.location !== undefined) dbUpdates.location = updates.location; if (updates.season !== undefined) dbUpdates.season = updates.season || null; if (updates.competition !== undefined) dbUpdates.competition = updates.competition || null; if (updates.homeScore !== undefined) dbUpdates.home_score = updates.homeScore; if (updates.awayScore !== undefined) dbUpdates.away_score = updates.awayScore; if (updates.timerStatus !== undefined) dbUpdates.timer_status = updates.timerStatus; if (updates.timerStartTime !== undefined) dbUpdates.timer_start_time = formatTimestampForDb(updates.timerStartTime); if (updates.timerElapsedSeconds !== undefined) dbUpdates.timer_elapsed_seconds = updates.timerElapsedSeconds; if (updates.isExplicitlyFinished !== undefined) dbUpdates.is_explicitly_finished = updates.isExplicitlyFinished; dbUpdates.updated_at = new Date().toISOString();
          const { error } = await supabase.from('games').update(dbUpdates).eq('id', id).eq('team_id', teamId);
          if (error) throw error;
          const updatedGames = games.map(g => g.id === id ? { ...g, ...updates } : g).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); setGamesState(updatedGames); updateHistoryFromGames(updatedGames);
          return null; // Success
        } catch (err: any) {
          console.error("Error updating game:", err);
          return new Error(parseSupabaseError(err)); // Return parsed error
        }
      };

      const deleteGame = async (id: string): Promise<Error | null> => {
        if (!teamId) return new Error("No team loaded.");
        try {
          const { error } = await supabase.from('games').delete().eq('id', id).eq('team_id', teamId);
          if (error) throw error;
          const updatedGames = games.filter(g => g.id !== id); setGamesState(updatedGames); updateHistoryFromGames(updatedGames);
          return null; // Success
        } catch (err: any) {
          console.error("Error deleting game:", err);
          return new Error(parseSupabaseError(err)); // Return parsed error
        }
      };

      // --- Game Specific Actions (Returning Errors) ---

      const startGameTimer = async (gameId: string): Promise<Error | null> => {
        if (!teamId) return new Error("No team loaded.");
        const now = Date.now(); const nowISO = formatTimestampForDb(now); const game = games.find(g => g.id === gameId); if (!game || game.isExplicitlyFinished) return new Error("Game not found or already finished.");
        try {
          const { error: gameUpdateError } = await supabase.from('games').update({ timer_status: 'running', timer_start_time: nowISO, updated_at: nowISO }).eq('id', gameId).eq('team_id', teamId); if (gameUpdateError) throw gameUpdateError;
          const { data: lineupData, error: lineupFetchError } = await supabase.from('game_lineups').select('id, player_id, location, is_starter, initial_position, position').eq('game_id', gameId); if (lineupFetchError) throw lineupFetchError;
          const lineupUpdates = (lineupData || []).filter(p => p.location === 'field').map(p => { const isStartingFresh = (game.timerElapsedSeconds ?? 0) === 0 && !game.timerStartTime; return { id: p.id, playtimer_start_time: nowISO, is_starter: isStartingFresh ? (p.location === 'field' || p.location === 'bench') : p.is_starter, initial_position: isStartingFresh && p.location === 'field' ? p.position : p.initial_position, updated_at: nowISO }; });
          if (lineupUpdates.length > 0) { const { error: lineupUpdateError } = await supabase.from('game_lineups').upsert(lineupUpdates, { onConflict: 'id' }); if (lineupUpdateError) throw lineupUpdateError; }
          setGamesState(prev => prev.map(g => { if (g.id === gameId) { const newLineup = g.lineup?.map(p => { const dbLineup = lineupData?.find(dbl => dbl.player_id === p.id); if (!dbLineup) return p; const isStartingFresh = (g.timerElapsedSeconds ?? 0) === 0 && !g.timerStartTime; return { ...p, playtimerStartTime: p.location === 'field' ? now : p.playtimerStartTime, isStarter: isStartingFresh ? (p.location === 'field' || p.location === 'bench') : p.isStarter, initialPosition: isStartingFresh && p.location === 'field' ? p.position : p.initialPosition, }; }) ?? null; return { ...g, timerStatus: 'running', timerStartTime: now, lineup: newLineup }; } return g; }));
          return null; // Success
        } catch (err: any) { console.error("Error starting game timer:", err); return new Error(parseSupabaseError(err)); } // Return parsed error
      };

      const stopGameTimer = async (gameId: string): Promise<Error | null> => {
         if (!teamId) return new Error("No team loaded.");
         const now = Date.now(); const nowISO = formatTimestampForDb(now); const game = games.find(g => g.id === gameId); if (!game || game.timerStatus !== 'running' || !game.timerStartTime) return new Error("Game not found or timer not running.");
         const elapsed = (now - game.timerStartTime) / 1000; const newElapsedSeconds = Math.round((game.timerElapsedSeconds || 0) + elapsed);
         try {
             const { error: gameUpdateError } = await supabase.from('games').update({ timer_status: 'stopped', timer_start_time: null, timer_elapsed_seconds: newElapsedSeconds, updated_at: nowISO }).eq('id', gameId).eq('team_id', teamId); if (gameUpdateError) throw gameUpdateError;
             const { data: lineupData, error: lineupFetchError } = await supabase.from('game_lineups').select('id, player_id, location, playtime_seconds, playtimer_start_time').eq('game_id', gameId).in('location', ['field', 'inactive']); if (lineupFetchError) throw lineupFetchError;
             const lineupUpdates = (lineupData || []).filter(p => p.playtimer_start_time !== null).map(p => { const playerStartTime = parseTimestampFromDb(p.playtimer_start_time); const playerElapsed = playerStartTime ? (now - playerStartTime) / 1000 : 0; const currentPlaytime = p.playtime_seconds ?? 0; const newPlaytime = Math.round(currentPlaytime + playerElapsed); return { id: p.id, playtime_seconds: newPlaytime, playtimer_start_time: null, updated_at: nowISO }; });
             if (lineupUpdates.length > 0) { const { error: lineupUpdateError } = await supabase.from('game_lineups').upsert(lineupUpdates, { onConflict: 'id' }); if (lineupUpdateError) throw lineupUpdateError; }
             setGamesState(prev => prev.map(g => { if (g.id === gameId) { const newLineup = g.lineup?.map(p => { if ((p.location === 'field' || p.location === 'inactive') && p.playtimerStartTime) { const playerElapsed = (now - p.playtimerStartTime) / 1000; const newPlaytime = Math.round(p.playtimeSeconds + playerElapsed); return { ...p, playtimeSeconds: newPlaytime, playtimerStartTime: null }; } return p; }) ?? null; return { ...g, timerStatus: 'stopped', timerStartTime: null, timerElapsedSeconds: newElapsedSeconds, lineup: newLineup }; } return g; }));
             return null; // Success
         } catch (err: any) { console.error("Error stopping game timer:", err); return new Error(parseSupabaseError(err)); } // Return parsed error
      };

      const markGameAsFinished = async (gameId: string): Promise<Error | null> => {
        if (!teamId) return new Error("No team loaded.");
        const now = Date.now(); const nowISO = formatTimestampForDb(now); const game = games.find(g => g.id === gameId); if (!game) return new Error("Game not found.");
        let finalElapsedSeconds = game.timerElapsedSeconds ?? 0; let lineupUpdates: any[] = [];
        try {
            if (game.timerStatus === 'running' && game.timerStartTime) {
                const elapsed = (now - game.timerStartTime) / 1000; finalElapsedSeconds = Math.round((game.timerElapsedSeconds || 0) + elapsed);
                const { data: lineupData, error: lineupFetchError } = await supabase.from('game_lineups').select('id, player_id, location, playtime_seconds, playtimer_start_time').eq('game_id', gameId).in('location', ['field', 'inactive']).neq('playtimer_start_time', null); if (lineupFetchError) throw lineupFetchError;
                lineupUpdates = (lineupData || []).map(p => { const playerStartTime = parseTimestampFromDb(p.playtimer_start_time); const playerElapsed = playerStartTime ? (now - playerStartTime) / 1000 : 0; const currentPlaytime = p.playtime_seconds ?? 0; const newPlaytime = Math.round(currentPlaytime + playerElapsed); return { id: p.id, playtime_seconds: newPlaytime, playtimer_start_time: null, updated_at: nowISO }; });
            } else {
                 const { data: lineupData, error: lineupFetchError } = await supabase.from('game_lineups').select('id').eq('game_id', gameId).neq('playtimer_start_time', null); if (lineupFetchError) throw lineupFetchError; lineupUpdates = (lineupData || []).map(p => ({ id: p.id, playtimer_start_time: null, updated_at: nowISO }));
            }
            if (lineupUpdates.length > 0) { const { error: lineupUpdateError } = await supabase.from('game_lineups').upsert(lineupUpdates, { onConflict: 'id' }); if (lineupUpdateError) throw lineupUpdateError; }
            const { error: gameUpdateError } = await supabase.from('games').update({ timer_status: 'stopped', timer_start_time: null, timer_elapsed_seconds: finalElapsedSeconds, is_explicitly_finished: true, updated_at: nowISO }).eq('id', gameId).eq('team_id', teamId); if (gameUpdateError) throw gameUpdateError;
            setGamesState(prev => prev.map(g => { if (g.id === gameId) { const finalLineup = g.lineup?.map(p => ({ ...p, playtimerStartTime: null })) ?? null; return { ...g, timerStatus: 'stopped', timerStartTime: null, timerElapsedSeconds: finalElapsedSeconds, isExplicitlyFinished: true, lineup: finalLineup }; } return g; }));
            return null; // Success
        } catch (err: any) { console.error("Error marking game as finished:", err); return new Error(parseSupabaseError(err)); } // Return parsed error
      };

      const resetGameLineup = async (gameId: string): Promise<PlayerLineupState[] | Error | null> => {
        if (!teamId) return new Error("No team loaded.");
        try {
            const { error: deleteError } = await supabase.from('game_lineups').delete().eq('game_id', gameId); if (deleteError) throw deleteError;
            const lineupInserts = players.map(p => ({ game_id: gameId, player_id: p.id, location: 'bench', playtime_seconds: 0, is_starter: false, subbed_on_count: 0, subbed_off_count: 0, }));
            const { data: insertedLineups, error: insertError } = await supabase.from('game_lineups').insert(lineupInserts).select(); if (insertError) throw insertError;
            const { error: gameResetError } = await supabase.from('games').update({ home_score: 0, away_score: 0, timer_status: 'stopped', timer_start_time: null, timer_elapsed_seconds: 0, is_explicitly_finished: false, updated_at: new Date().toISOString() }).eq('id', gameId); if (gameResetError) throw gameResetError;
            const { error: eventDeleteError } = await supabase.from('game_events').delete().eq('game_id', gameId); if (eventDeleteError) throw eventDeleteError;
            const defaultLineupState: PlayerLineupState[] = (insertedLineups || []).map((p: GameLineupRecord) => ({ id: p.player_id, location: 'bench', position: undefined, initialPosition: undefined, playtimeSeconds: 0, playtimerStartTime: null, isStarter: false, subbedOnCount: 0, subbedOffCount: 0, }));
            setGamesState(prev => prev.map(g => g.id === gameId ? { ...g, lineup: defaultLineupState, timerElapsedSeconds: 0, timerStartTime: null, timerStatus: 'stopped', isExplicitlyFinished: false, homeScore: 0, awayScore: 0, events: [] } : g));
            return defaultLineupState; // Success, return lineup
        } catch (err: any) { console.error("Error resetting game lineup:", err); return new Error(parseSupabaseError(err)); } // Return parsed error
      };

      const movePlayerInGame = async (gameId: string, playerId: string, sourceLocation: PlayerLineupState['location'], targetLocation: PlayerLineupState['location'], newPosition?: { x: number; y: number }): Promise<Error | null> => {
        if (!teamId) return new Error("No team loaded.");
        const now = Date.now(); const nowISO = formatTimestampForDb(now); const game = games.find(g => g.id === gameId); if (!game) return new Error("Game not found.");
        try {
            const { data: currentLineupData, error: fetchError } = await supabase.from('game_lineups').select('*').eq('game_id', gameId).eq('player_id', playerId).single(); if (fetchError || !currentLineupData) throw fetchError || new Error("Player lineup state not found");
            let updatedPlaytime = currentLineupData.playtime_seconds; let updatedStartTimeISO = currentLineupData.playtimer_start_time; let updatedSubOn = currentLineupData.subbed_on_count; let updatedSubOff = currentLineupData.subbed_off_count; let substitutionEventData: Omit<GameEventRecord, 'id' | 'created_at' | 'event_timestamp'> | null = null;
            const currentStartTime = parseTimestampFromDb(currentLineupData.playtimer_start_time); if ((sourceLocation === 'field' || sourceLocation === 'inactive') && currentStartTime) { const elapsed = (now - currentStartTime) / 1000; updatedPlaytime = Math.round(currentLineupData.playtime_seconds + elapsed); updatedStartTimeISO = null; }
            if (targetLocation === 'field' && game.timerStatus === 'running' && updatedStartTimeISO === null) { updatedStartTimeISO = nowISO; } else if (targetLocation !== 'field') { updatedStartTimeISO = null; }
            const isGameActive = game.timerStatus === 'running' || (game.timerStatus === 'stopped' && (game.timerElapsedSeconds ?? 0) > 0);
            if (isGameActive) { let currentSeconds = game.timerElapsedSeconds ?? 0; if (game.timerStatus === 'running' && game.timerStartTime) { currentSeconds += (Date.now() - game.timerStartTime) / 1000; } const eventSeconds = Math.round(currentSeconds); const eventTeam = (game.location === 'home') ? 'home' : 'away'; if (sourceLocation === 'bench' && targetLocation === 'field') { updatedSubOn++; substitutionEventData = { game_id: gameId, type: 'substitution', team: eventTeam, player_in_id: playerId, player_out_id: null, scorer_player_id: null, assist_player_id: null, game_seconds: eventSeconds }; } else if (sourceLocation === 'field' && targetLocation === 'bench') { updatedSubOff++; substitutionEventData = { game_id: gameId, type: 'substitution', team: eventTeam, player_in_id: null, player_out_id: playerId, scorer_player_id: null, assist_player_id: null, game_seconds: eventSeconds }; } }
            const { error: updateError } = await supabase.from('game_lineups').update({ location: targetLocation, position: targetLocation === 'field' ? newPosition : null, playtime_seconds: updatedPlaytime, playtimer_start_time: updatedStartTimeISO, subbed_on_count: updatedSubOn, subbed_off_count: updatedSubOff, updated_at: nowISO }).eq('id', currentLineupData.id); if (updateError) throw updateError;
            if (substitutionEventData) { const { error: eventError } = await supabase.from('game_events').insert(substitutionEventData); if (eventError) { console.error("Error inserting substitution event:", eventError); /* Optionally return error here? */ } }
            setGamesState(prev => prev.map(g => { if (g.id === gameId) { const newLineup = g.lineup?.map(p => { if (p.id === playerId) { return { ...p, location: targetLocation, position: targetLocation === 'field' ? newPosition : undefined, playtimeSeconds: updatedPlaytime, playtimerStartTime: parseTimestampFromDb(updatedStartTimeISO), subbedOnCount: updatedSubOn, subbedOffCount: updatedSubOff, }; } return p; }) ?? null; const newEvents = [...(g.events || [])]; if (substitutionEventData) { newEvents.push({ id: uuidv4(), type: 'substitution', team: substitutionEventData.team, playerInId: substitutionEventData.player_in_id ?? undefined, playerOutId: substitutionEventData.player_out_id ?? undefined, timestamp: now, gameSeconds: substitutionEventData.game_seconds, }); } return { ...g, lineup: newLineup, events: newEvents }; } return g; }));
            return null; // Success
        } catch (err: any) { console.error("Error moving player in game:", err); return new Error(parseSupabaseError(err)); } // Return parsed error
      };

      // --- Global Lineup Actions (Returning Errors) ---

      const movePlayer = async (playerId: string, targetLocation: 'bench' | 'field', position?: { x: number; y: number }): Promise<Error | null> => {
        // This function now directly returns the result of updatePlayer
        return await updatePlayer(playerId, { location: targetLocation, position: position });
      };

      const swapPlayers = async (player1Id: string, player2Id: string): Promise<Error | null> => {
        const p1 = players.find(p => p.id === player1Id); const p2 = players.find(p => p.id === player2Id); if (!p1 || !p2) return new Error("One or both players not found.");
        try {
            // Use Promise.allSettled to see results of both updates
            const results = await Promise.allSettled([
                updatePlayer(p1.id, { location: p2.location, position: p2.position }),
                updatePlayer(p2.id, { location: p1.location, position: p1.position })
            ]);
            // Check if any promise was rejected
            const firstError = results.find(res => res.status === 'rejected') as PromiseRejectedResult | undefined;
            if (firstError) {
                // If an error occurred, return the parsed error reason
                console.error("Error swapping players:", firstError.reason);
                // Attempt to revert? Difficult. For now, just report the first error.
                return new Error(parseSupabaseError(firstError.reason));
            }
            return null; // Success if both settled successfully
        } catch (err: any) {
            // This catch block might not be reached if using allSettled, but keep for safety
            console.error("Unexpected error during swapPlayers:", err);
            return new Error(parseSupabaseError(err));
        }
      };

      const saveLineup = async (name: string): Promise<Error | null> => {
        if (!teamId || !name.trim()) return new Error("Team ID missing or name is empty.");
        try {
          const lineupToSave: PlayerLineupStructure[] = players.map(({ id, location, position }) => ({ id, location: location || 'bench', position: position || undefined, }));
          const { data, error } = await supabase.from('saved_lineups').upsert({ team_id: teamId, name: name.trim(), lineup_data: lineupToSave }, { onConflict: 'team_id, name' }).select().single();
          if (error) throw error;
          if (data) { const saved: SavedLineup = { id: data.id, name: data.name, players: data.lineup_data }; setSavedLineupsState(prev => { const filtered = prev.filter(l => l.name !== saved.name); return [...filtered, saved].sort((a,b) => a.name.localeCompare(b.name)); }); }
          return null; // Success
        } catch (err: any) { console.error("Error saving lineup:", err); return new Error(parseSupabaseError(err)); } // Return parsed error
      };

      const loadLineup = async (lineupId: string): Promise<boolean | Error> => {
        if (!teamId) return new Error("No team loaded.");
        try {
            const lineupToLoad = savedLineups.find(l => l.id === lineupId); if (!lineupToLoad) throw new Error("Saved lineup not found locally.");
            const savedPlayerStates = new Map( lineupToLoad.players.map(p => [p.id, { location: p.location, position: p.position }]) );
            const playerUpdates = players.map(player => { const savedState = savedPlayerStates.get(player.id); return { id: player.id, location: savedState?.location || 'bench', position: savedState?.position || null, updated_at: new Date().toISOString() }; });
            const { error } = await supabase.from('players').upsert(playerUpdates, { onConflict: 'id' }); if (error) throw error;
            setPlayersState(currentPlayers => currentPlayers.map(player => { const savedState = savedPlayerStates.get(player.id); return savedState ? { ...player, location: savedState.location, position: savedState.position } : { ...player, location: 'bench', position: undefined }; }).sort((a, b) => a.firstName.localeCompare(b.firstName)) );
            return true; // Success
        } catch (err: any) { console.error("Error loading lineup:", err); return new Error(parseSupabaseError(err)); } // Return parsed error
      };

      const deleteLineup = async (lineupId: string): Promise<Error | null> => {
        if (!teamId) return new Error("No team loaded.");
        try {
            const { error } = await supabase.from('saved_lineups').delete().eq('id', lineupId).eq('team_id', teamId); if (error) throw error;
            setSavedLineupsState(prev => prev.filter(l => l.id !== lineupId));
            return null; // Success
        } catch (err: any) { console.error("Error deleting lineup:", err); return new Error(parseSupabaseError(err)); } // Return parsed error
      };

      const resetLineup = async (): Promise<Error | null> => {
        if (!teamId) return new Error("No team loaded.");
        try {
            const playerUpdates = players.map(player => ({ id: player.id, location: 'bench', position: null, updated_at: new Date().toISOString() }));
            const { error } = await supabase.from('players').upsert(playerUpdates, { onConflict: 'id' }); if (error) throw error;
            setPlayersState(prev => prev.map(p => ({ ...p, location: 'bench', position: undefined })));
            return null; // Success
        } catch (err: any) { console.error("Error resetting lineup:", err); return new Error(parseSupabaseError(err)); } // Return parsed error
      };

      // --- Game Event Actions (Returning Errors) ---

      const addGameEvent = async (gameId: string, eventData: Omit<GameEvent, 'id' | 'timestamp'>): Promise<Error | null> => {
        if (!teamId) return new Error("No team loaded.");
        const game = games.find(g => g.id === gameId); if (!game) return new Error("Game not found.");
        try {
            const { data: insertedEvent, error: insertError } = await supabase.from('game_events').insert({ game_id: gameId, type: eventData.type, team: eventData.team, scorer_player_id: eventData.scorerPlayerId || null, assist_player_id: eventData.assistPlayerId || null, player_in_id: eventData.playerInId || null, player_out_id: eventData.playerOutId || null, game_seconds: eventData.gameSeconds, }).select().single(); if (insertError) throw insertError;
            let scoreUpdate: Partial<GameRecord> | null = null;
            if (eventData.type === 'goal') { scoreUpdate = { home_score: eventData.team === 'home' ? game.homeScore + 1 : game.homeScore, away_score: eventData.team === 'away' ? game.awayScore + 1 : game.awayScore, updated_at: new Date().toISOString() }; const { error: scoreUpdateError } = await supabase.from('games').update(scoreUpdate).eq('id', gameId); if (scoreUpdateError) { console.error("Error updating score after goal event:", scoreUpdateError); /* Optionally return error? */ } }
            setGamesState(prev => prev.map(g => { if (g.id === gameId) { const newEvent: GameEvent = { id: insertedEvent.id, type: eventData.type, team: eventData.team, scorerPlayerId: eventData.scorerPlayerId, assistPlayerId: eventData.assistPlayerId, playerInId: eventData.playerInId, playerOutId: eventData.playerOutId, timestamp: parseTimestampFromDb(insertedEvent.event_timestamp) ?? Date.now(), gameSeconds: eventData.gameSeconds, }; const updatedEvents = [...(g.events || []), newEvent]; const updatedScore = scoreUpdate ? { homeScore: scoreUpdate.home_score ?? g.homeScore, awayScore: scoreUpdate.away_score ?? g.awayScore } : {}; return { ...g, ...updatedScore, events: updatedEvents }; } return g; }));
            return null; // Success
        } catch (err: any) { console.error("Error adding game event:", err); return new Error(parseSupabaseError(err)); } // Return parsed error
      };

      const removeLastGameEvent = async (gameId: string, team: 'home' | 'away', type: 'goal' | 'substitution'): Promise<Error | null> => {
         if (!teamId) return new Error("No team loaded.");
         const game = games.find(g => g.id === gameId); if (!game) return new Error("Game not found.");
         try {
             const { data: events, error: fetchError } = await supabase.from('game_events').select('id, type, team, game_seconds').eq('game_id', gameId).eq('team', team).eq('type', type).order('event_timestamp', { ascending: false }).limit(1); if (fetchError) throw fetchError;
             if (!events || events.length === 0) { console.log(`No ${type} event found for team ${team} in game ${gameId} to remove.`); return null; } // Not an error, just nothing to remove
             const eventToRemove = events[0];
             const { error: deleteError } = await supabase.from('game_events').delete().eq('id', eventToRemove.id); if (deleteError) throw deleteError;
             let scoreUpdate: Partial<GameRecord> | null = null;
             if (type === 'goal') { scoreUpdate = { home_score: team === 'home' ? Math.max(0, game.homeScore - 1) : game.homeScore, away_score: team === 'away' ? Math.max(0, game.awayScore - 1) : game.awayScore, updated_at: new Date().toISOString() }; const { error: scoreUpdateError } = await supabase.from('games').update(scoreUpdate).eq('id', gameId); if (scoreUpdateError) { console.error("Error updating score after removing goal event:", scoreUpdateError); /* Optionally return error? */ } }
             setGamesState(prev => prev.map(g => { if (g.id === gameId) { const updatedEvents = (g.events || []).filter(ev => ev.id !== eventToRemove.id); const updatedScore = scoreUpdate ? { homeScore: scoreUpdate.home_score ?? g.homeScore, awayScore: scoreUpdate.away_score ?? g.awayScore } : {}; return { ...g, ...updatedScore, events: updatedEvents }; } return g; }));
             return null; // Success
         } catch (err: any) { console.error("Error removing last game event:", err); return new Error(parseSupabaseError(err)); } // Return parsed error
      };


      // --- History Getters (Derived from state) ---
      const getMostRecentSeason = (): string | undefined => gameHistory.seasons[0];
      const getMostRecentCompetition = (): string | undefined => gameHistory.competitions[0];

      // --- Context Value ---
      const contextValue: TeamContextProps = {
        teamId, teamName, setTeamName, teamLogo, setTeamLogo,
        players, addPlayer, updatePlayer, deletePlayer,
        games, addGame, updateGame, deleteGame,
        startGameTimer, stopGameTimer, markGameAsFinished,
        resetGameLineup, movePlayerInGame,
        // startPlayerTimerInGame, stopPlayerTimerInGame, // Removed for now
        movePlayer, swapPlayers,
        savedLineups, saveLineup, loadLineup, deleteLineup, resetLineup,
        setCurrentPage, selectGame,
        gameHistory, getMostRecentSeason, getMostRecentCompetition,
        addGameEvent, removeLastGameEvent,
        isLoading, error, fetchTeamData, clearTeamData,
      };

      return <TeamContext.Provider value={contextValue}>{children}</TeamContext.Provider>;
    };
