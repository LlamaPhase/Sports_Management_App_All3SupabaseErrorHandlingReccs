import React, { useState, useEffect, useContext } from 'react';
    import { Users, Calendar, Clock, Home, Plane, X, Trophy, Repeat, AlertCircle } from 'lucide-react'; // Added AlertCircle
    import { Game, TeamContext } from '../context/TeamContext';

    interface EditGameModalProps {
      isOpen: boolean;
      onClose: () => void;
      game: Game | null;
      // Removed onUpdateGame prop
    }

    const EditGameModal: React.FC<EditGameModalProps> = ({ isOpen, onClose, game }) => {
      const { updateGame, gameHistory } = useContext(TeamContext); // Get updateGame from context
      const [opponent, setOpponent] = useState('');
      const [date, setDate] = useState('');
      const [time, setTime] = useState('');
      const [location, setLocation] = useState<'home' | 'away'>('home');
      const [season, setSeason] = useState('');
      const [competition, setCompetition] = useState('');
      const [localError, setLocalError] = useState<string | null>(null); // Local error state
      const [isSubmitting, setIsSubmitting] = useState(false); // Loading state

      useEffect(() => {
        if (isOpen && game) {
          setOpponent(game.opponent);
          setDate(game.date);
          setTime(game.time);
          setLocation(game.location);
          setSeason(game.season || '');
          setCompetition(game.competition || '');
          setLocalError(null);
          setIsSubmitting(false);
        }
        if (!isOpen) {
            setOpponent(''); setDate(''); setTime(''); setLocation('home'); setSeason(''); setCompetition('');
            setLocalError(null); setIsSubmitting(false);
        }
      }, [isOpen, game]);

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (game && opponent.trim() && date) {
          setIsSubmitting(true);
          setLocalError(null);
          const result = await updateGame(game.id, {
            opponent: opponent.trim(),
            date,
            time,
            location,
            season: season,
            competition: competition,
          });
          setIsSubmitting(false);
          if (result instanceof Error) {
            setLocalError(result.message || 'Failed to update game.');
          } else {
            onClose();
          }
        } else {
          setLocalError("Please enter opponent name and date.");
        }
      };

      if (!isOpen || !game) return null;

      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Game</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700" disabled={isSubmitting}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Display */}
              {localError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded relative text-sm flex items-center space-x-2" role="alert">
                   <AlertCircle size={16} />
                   <span>{localError}</span>
                </div>
              )}

              {/* Location Buttons */}
              <div className="mb-4">
                 <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                 <div className="flex space-x-3">
                    <button type="button" onClick={() => setLocation('home')} className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 border rounded-md transition-colors ${ location === 'home' ? 'bg-red-100 border-red-300 text-red-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100' }`} disabled={isSubmitting}>
                        <Home size={18} /> <span>Home</span>
                    </button>
                    <button type="button" onClick={() => setLocation('away')} className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 border rounded-md transition-colors ${ location === 'away' ? 'bg-blue-100 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100' }`} disabled={isSubmitting}>
                        <Plane size={18} /> <span>Away</span>
                    </button>
                 </div>
               </div>

              {/* Opponent Input */}
              <div>
                <label htmlFor="editOpponent" className="block text-sm font-medium text-gray-700 mb-1">Opponent</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Users size={18} className="text-gray-400" /></span>
                  <input type="text" id="editOpponent" value={opponent} onChange={(e) => setOpponent(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500" placeholder="e.g., Rival Team" required disabled={isSubmitting} />
                </div>
              </div>
              {/* Date Input */}
              <div>
                <label htmlFor="editDate" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Calendar size={18} className="text-gray-400" /></span>
                  <input type="date" id="editDate" value={date} onChange={(e) => setDate(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500" required disabled={isSubmitting} />
                </div>
              </div>
              {/* Time Input */}
              <div>
                <label htmlFor="editTime" className="block text-sm font-medium text-gray-700 mb-1">Time (Optional)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Clock size={18} className="text-gray-400" /></span>
                  <input type="time" id="editTime" value={time} onChange={(e) => setTime(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500" disabled={isSubmitting} />
                </div>
              </div>

              {/* Competition */}
              <div>
                <label htmlFor="editCompetition" className="block text-sm font-medium text-gray-700 mb-1">Competition (Optional)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Trophy size={18} className="text-gray-400" /></span>
                  <input type="text" id="editCompetition" list="edit-competition-history" value={competition} onChange={(e) => setCompetition(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500" placeholder="e.g., League Playoffs" disabled={isSubmitting} />
                  <datalist id="edit-competition-history">
                    {gameHistory.competitions.map((comp, index) => ( <option key={index} value={comp} /> ))}
                  </datalist>
                </div>
              </div>

              {/* Season */}
              <div>
                <label htmlFor="editSeason" className="block text-sm font-medium text-gray-700 mb-1">Season (Optional)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Repeat size={18} className="text-gray-400" /></span>
                  <input type="text" id="editSeason" list="edit-season-history" value={season} onChange={(e) => setSeason(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500" placeholder="e.g., Fall 2024" disabled={isSubmitting} />
                  <datalist id="edit-season-history">
                    {gameHistory.seasons.map((s, index) => ( <option key={index} value={s} /> ))}
                  </datalist>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition" disabled={isSubmitting}>Cancel</button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition flex items-center justify-center min-w-[130px] disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                     <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                   ) : (
                     'Save Changes'
                   )}
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    };

    export default EditGameModal;
