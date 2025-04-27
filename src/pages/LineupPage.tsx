import React, { useContext, useState, useMemo, useRef, useEffect, useCallback } from 'react'; // Added useCallback
    import { TeamContext, Player } from '../context/TeamContext';
    import { useDrop, useDrag, DropTargetMonitor, DragSourceMonitor } from 'react-dnd';
    import PlayerIcon from '../components/PlayerIcon';
    import { Save, Download, RotateCcw, ArrowLeft, AlertCircle } from 'lucide-react'; // Added AlertCircle
    import SaveLineupModal from '../components/SaveLineupModal';
    import LoadLineupModal from '../components/LoadLineupModal';

    const ItemTypes = { PLAYER: 'player', };
    interface LineupPageProps { previousPage: string | null; }
    interface DraggablePlayerProps { player: Player; location: 'field' | 'bench'; fieldWidth: number; fieldHeight: number; }
    const ICON_WIDTH_APPROX = 40;
    const ICON_HEIGHT_APPROX = 58;

    const DraggablePlayer: React.FC<DraggablePlayerProps> = ({ player, location, fieldWidth, fieldHeight }) => { /* ... */ };
    interface DropZoneProps { children: React.ReactNode; onDropPlayer: ( item: { id: string; location: 'field' | 'bench'; position?: { x: number; y: number } }, dropXPercent?: number, dropYPercent?: number ) => void; className?: string; location: 'field' | 'bench'; fieldRef?: React.RefObject<HTMLDivElement>; }
    const DropZone: React.FC<DropZoneProps> = ({ children, onDropPlayer, className, location, fieldRef }) => { /* ... */ };

    const LineupPage: React.FC<LineupPageProps> = ({ previousPage }) => {
      const { players, movePlayer, swapPlayers, savedLineups, saveLineup, loadLineup, deleteLineup, resetLineup, setCurrentPage } = useContext(TeamContext);
      const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
      const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
      const fieldContainerRef = useRef<HTMLDivElement>(null);
      const fieldItselfRef = useRef<HTMLDivElement>(null);
      const benchContainerRef = useRef<HTMLDivElement>(null);
      const [fieldDimensions, setFieldDimensions] = useState({ width: 0, height: 0 });
      const [localError, setLocalError] = useState<string | null>(null); // Local error state
      const [isActionLoading, setIsActionLoading] = useState(false); // Loading state for actions

      useEffect(() => { /* ... (dimension calculation) ... */ }, [fieldDimensions.width, fieldDimensions.height]);

      const fieldPlayers = players.filter(p => p.location === 'field');
      const benchPlayers = useMemo(() => players.filter(p => p.location === 'bench').sort((a, b) => a.firstName.localeCompare(b.firstName)), [players]);

      // --- Action Wrapper ---
      const handleAsyncAction = useCallback(async (action: () => Promise<any>) => {
        setIsActionLoading(true);
        setLocalError(null);
        try {
          const result = await action();
          if (result instanceof Error) {
            setLocalError(result.message || 'An error occurred.');
          } else {
            setLocalError(null); // Clear error on success
          }
        } catch (err: any) {
          console.error("Unexpected error during action:", err);
          setLocalError(err.message || 'An unexpected error occurred.');
        } finally {
          setIsActionLoading(false);
        }
      }, []); // Empty dependency array

      const handleDrop = useCallback(( item: { id: string; location: 'field' | 'bench'; position?: { x: number; y: number } }, targetLocation: 'field' | 'bench', xPercent?: number, yPercent?: number ) => {
        if (isActionLoading) return; // Prevent drops while another action is processing
        handleAsyncAction(async () => {
            const droppedPlayerId = item.id;
            const sourceLocation = item.location;
            let res1: Error | null = null;
            let res2: Error | null = null;

            if (targetLocation === 'field' && xPercent !== undefined && yPercent !== undefined) {
              const iconWidthPercent = fieldDimensions.width > 0 ? (ICON_WIDTH_APPROX / fieldDimensions.width) * 100 : 5;
              const iconHeightPercent = fieldDimensions.height > 0 ? (ICON_HEIGHT_APPROX / fieldDimensions.height) * 100 : 5;
              const targetPlayer = fieldPlayers.find(p => { if (!p.position || p.id === droppedPlayerId) return false; const pLeft = p.position.x - iconWidthPercent / 2; const pRight = p.position.x + iconWidthPercent / 2; const pTop = p.position.y - iconHeightPercent / 2; const pBottom = p.position.y + iconHeightPercent / 2; return xPercent > pLeft && xPercent < pRight && yPercent > pTop && yPercent < pBottom; });
              if (targetPlayer) {
                console.log(`Swapping ${droppedPlayerId} with ${targetPlayer.id}`);
                res1 = await swapPlayers(droppedPlayerId, targetPlayer.id);
              } else {
                console.log(`Moving ${droppedPlayerId} to ${xPercent}, ${yPercent}`);
                res1 = await movePlayer(droppedPlayerId, 'field', { x: xPercent, y: yPercent });
              }
            } else if (targetLocation === 'bench') {
              if (sourceLocation === 'field') {
                 res1 = await movePlayer(droppedPlayerId, 'bench');
              }
            }
            return res1 || res2; // Return the first error encountered, or null
        });
      }, [fieldDimensions, fieldPlayers, movePlayer, swapPlayers, handleAsyncAction, isActionLoading]);

      const handleSaveClick = () => setIsSaveModalOpen(true);
      const handleLoadClick = () => setIsLoadModalOpen(true);
      const handleResetClick = () => { if (!isActionLoading && window.confirm('Are you sure you want to move all players to the bench?')) { handleAsyncAction(resetLineup); } };
      // Modal handlers will now use context directly and manage their own errors/loading
      const handleSaveLineup = (name: string) => { /* Now handled inside SaveLineupModal */ };
      const handleLoadLineup = (id: string) => { /* Now handled inside LoadLineupModal */ };
      const handleDeleteLineup = (id: string) => { /* Now handled inside LoadLineupModal */ };

      const handleGoBack = () => { if (typeof setCurrentPage === 'function') { setCurrentPage(previousPage || 'team'); } else { console.error("setCurrentPage is not a function in TeamContext"); } };
      const approxFixedElementsHeightPortrait = 220;

      return (
        <div className="flex flex-col flex-grow">
           {/* Back Button Area */}
           <div className="pt-1 pb-2 px-2 flex items-center flex-shrink-0">
             <button onClick={handleGoBack} className="text-gray-600 hover:text-gray-900 p-1 rounded-full hover:bg-gray-200" aria-label="Go Back" disabled={isActionLoading}>
               <ArrowLeft size={20} />
             </button>
           </div>

           {/* Error Display Area */}
           {localError && (
             <div className="mx-4 mb-2 bg-red-100 border border-red-400 text-red-700 px-3 py-1.5 rounded relative text-xs flex items-center space-x-2" role="alert">
                <AlertCircle size={14} />
                <span>{localError}</span>
                <button onClick={() => setLocalError(null)} className="ml-auto text-red-700 opacity-70 hover:opacity-100">&times;</button>
             </div>
           )}

          {/* Field and Bench Container */}
          <div className="flex flex-col md:flex-row flex-grow md:space-x-4">
            {/* Field Area Wrapper */}
            <div ref={fieldContainerRef} className="relative w-full md:w-2/3 mx-auto my-2 md:my-0 md:mx-0 flex flex-col md:order-1 md:max-h-none" style={{ aspectRatio: '1 / 1', maxHeight: `calc(100vh - ${approxFixedElementsHeightPortrait}px)` }}>
              {/* Field Drop Zone */}
              <DropZone onDropPlayer={(item, xPct, yPct) => handleDrop(item, 'field', xPct, yPct)} fieldRef={fieldItselfRef} className="bg-green-600 w-full h-full rounded-lg shadow-inner flex-grow overflow-hidden" location="field">
                  {fieldPlayers.map((player) => ( <DraggablePlayer key={player.id} player={player} location="field" fieldWidth={fieldDimensions.width} fieldHeight={fieldDimensions.height} /> ))}
              </DropZone>
               {/* Lineup Action Icons */}
               <div className="absolute top-2 right-2 flex space-x-1 bg-white/70 p-1 rounded shadow z-20">
                  <button onClick={handleSaveClick} className="text-gray-700 hover:text-blue-600 p-1.5 disabled:opacity-50" title="Save Lineup" disabled={isActionLoading}><Save size={18} /></button>
                  <button onClick={handleLoadClick} className="text-gray-700 hover:text-blue-600 p-1.5 disabled:opacity-50" title="Load Lineup" disabled={isActionLoading}><Download size={18} /></button>
                  <button onClick={handleResetClick} className="text-gray-700 hover:text-red-600 p-1.5 disabled:opacity-50" title="Reset Lineup" disabled={isActionLoading}><RotateCcw size={18} /></button>
               </div>
               {/* Action Loading Overlay */}
               {isActionLoading && (
                   <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-40 rounded-lg">
                       <svg className="animate-spin h-8 w-8 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                       </svg>
                   </div>
               )}
            </div>

            {/* Bench Area */}
            <div ref={benchContainerRef} className="bg-gray-200 p-3 mt-3 md:mt-0 rounded-lg shadow flex-shrink-0 md:w-1/3 md:order-2 md:flex md:flex-col">
              <h2 className="text-base font-semibold mb-2 border-b pb-1 text-gray-700 flex-shrink-0">Bench</h2>
              <DropZone onDropPlayer={(item) => handleDrop(item, 'bench')} className="min-h-[60px] flex flex-wrap gap-x-3 gap-y-1 flex-grow md:overflow-y-auto" location="bench">
                {benchPlayers.length === 0 ? ( <p className="text-gray-500 w-full text-center text-sm py-2">Bench is empty.</p> ) : ( benchPlayers.map((player) => ( <DraggablePlayer key={player.id} player={player} location="bench" fieldWidth={0} fieldHeight={0} /> )) )}
              </DropZone>
            </div>
          </div>

          {/* Modals */}
          <SaveLineupModal isOpen={isSaveModalOpen} onClose={() => setIsSaveModalOpen(false)} />
          <LoadLineupModal isOpen={isLoadModalOpen} onClose={() => setIsLoadModalOpen(false)} savedLineups={savedLineups} />
        </div>
      );
    };

    export default LineupPage;
