import React, { useContext, useState, useRef, ChangeEvent, useEffect } from 'react'; // Added useEffect
    import { Shield, Users, Calendar, BarChart2, Plus, AlertCircle } from 'lucide-react'; // Added AlertCircle
    import { TeamContext } from '../context/TeamContext';

    interface HeaderProps {
      currentPage: string;
      setCurrentPage: (page: string) => void;
    }

    const HeaderNavLink: React.FC<{
      page: string;
      currentPage: string;
      setCurrentPage: (page: string) => void;
      children: React.ReactNode;
      icon?: React.ReactNode;
    }> = ({ page, currentPage, setCurrentPage, children, icon }) => {
      const isActive = currentPage === page;
      return (
        <button
          onClick={() => setCurrentPage(page)}
          className={`flex-1 flex flex-col items-center justify-center px-2 py-2 text-xs font-medium transition-opacity ${
            isActive ? 'opacity-100' : 'opacity-70 hover:opacity-90'
          }`}
          aria-current={isActive ? 'page' : undefined}
        >
          {icon && <span className="mb-0.5">{icon}</span>}
          {children}
        </button>
      );
    };


    const Header: React.FC<HeaderProps> = ({ currentPage, setCurrentPage }) => {
      const { teamName, setTeamName, teamLogo, setTeamLogo } = useContext(TeamContext);
      const [isEditingName, setIsEditingName] = useState(false);
      const [newName, setNewName] = useState(teamName);
      const fileInputRef = useRef<HTMLInputElement>(null);
      const [localError, setLocalError] = useState<string | null>(null); // Local error state
      const [isSavingName, setIsSavingName] = useState(false); // Loading state for name save
      const [isSavingLogo, setIsSavingLogo] = useState(false); // Loading state for logo save

      // Update local state if teamName changes in context (e.g., initial load)
      useEffect(() => {
        setNewName(teamName);
      }, [teamName]);

      const showBottomNav = ['team', 'schedule', 'stats'].includes(currentPage);

      const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewName(e.target.value);
      };

      const handleNameSave = async () => {
        if (newName.trim() && newName !== teamName) {
          setIsSavingName(true);
          setLocalError(null);
          const result = await setTeamName(newName.trim());
          setIsSavingName(false);
          if (result instanceof Error) {
            setLocalError(result.message || 'Failed to update team name.');
            setNewName(teamName); // Revert input on error
          } else {
            setLocalError(null); // Clear error on success
          }
        } else {
          setNewName(teamName); // Revert if empty or unchanged
        }
        setIsEditingName(false);
      };

      const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
          handleNameSave();
        } else if (e.key === 'Escape') {
          setNewName(teamName); // Revert on escape
          setIsEditingName(false);
          setLocalError(null);
        }
      };

      const handleLogoClick = () => {
        if (isSavingLogo || isSavingName) return; // Prevent opening file dialog while saving
        fileInputRef.current?.click();
      };

      const handleLogoChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onloadstart = () => {
            setIsSavingLogo(true);
            setLocalError(null);
          };
          reader.onloadend = async () => {
            const newLogoDataUrl = reader.result as string;
            const result = await setTeamLogo(newLogoDataUrl); // Update DB/context
            setIsSavingLogo(false);
            if (result instanceof Error) {
              setLocalError(result.message || 'Failed to update logo.');
              // Optionally revert local logo state if needed, but setTeamLogo already handles it
            } else {
              setLocalError(null); // Clear error on success
            }
          };
          reader.onerror = () => {
            setIsSavingLogo(false);
            setLocalError("Failed to read logo file.");
          };
          reader.readAsDataURL(file);
        }
         // Reset file input value so the same file can be selected again
         if (fileInputRef.current) {
            fileInputRef.current.value = '';
         }
      };

      return (
        <header className="bg-red-700 text-white sticky top-0 z-20 shadow">
          {/* Top part */}
          <div className="p-4 flex justify-between items-center">
            {/* Team Logo and Name Section */}
            <div className="flex items-center space-x-2 flex-grow min-w-0 mr-2"> {/* Added flex-grow, min-w-0, mr-2 */}
              {/* Logo/Placeholder */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleLogoChange}
                accept="image/*"
                className="hidden"
                disabled={isSavingLogo || isSavingName}
              />
              <button
                onClick={handleLogoClick}
                className="relative w-10 h-10 flex items-center justify-center text-white hover:opacity-80 transition cursor-pointer overflow-hidden flex-shrink-0 p-1 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Change team logo"
                disabled={isSavingLogo || isSavingName}
              >
                {teamLogo ? (
                  <img src={teamLogo} alt="Team Logo" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <Shield size={24} className="text-white opacity-60" />
                    <Plus size={14} className="absolute text-white" />
                  </div>
                )}
                {/* Loading spinner for logo */}
                {isSavingLogo && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
              </button>

              {/* Team Name / Input */}
              <div className="flex-grow min-w-0 relative"> {/* Added relative positioning */}
                {isEditingName ? (
                  <input
                    type="text"
                    value={newName}
                    onChange={handleNameChange}
                    onBlur={handleNameSave}
                    onKeyDown={handleNameKeyDown}
                    className="text-lg font-semibold bg-red-800 border-b border-white focus:outline-none px-1 py-0.5 text-white w-full" // Ensure input takes width
                    autoFocus
                    disabled={isSavingName}
                  />
                ) : (
                  <div className="flex items-center space-x-1">
                    <span
                      className="font-semibold text-lg cursor-pointer hover:opacity-80 truncate" // Added truncate
                      onClick={() => !isSavingName && setIsEditingName(true)} // Trigger edit on click
                      title={teamName || 'Your Team'} // Show full name on hover
                    >
                      {teamName || 'Your Team'}
                    </span>
                    {/* Loading spinner for name */}
                    {isSavingName && (
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Lineup Button */}
            <button
              onClick={() => setCurrentPage('lineup')}
              className="hover:opacity-80 transition-opacity p-1 rounded-full hover:bg-red-600 flex-shrink-0" // Added flex-shrink-0
              aria-label="Edit Lineup"
              disabled={isSavingLogo || isSavingName}
            >
              <img src="/lineup-icon.svg" alt="Lineup" className="w-6 h-6 invert" />
            </button>
          </div>

          {/* Error Display Area Below Header */}
          {localError && (
            <div className="bg-red-900 text-white px-4 py-1 text-xs flex items-center space-x-1 justify-center" role="alert">
               <AlertCircle size={14} />
               <span>{localError}</span>
               <button onClick={() => setLocalError(null)} className="ml-auto text-white opacity-70 hover:opacity-100">&times;</button>
            </div>
          )}


          {/* Bottom navigation part */}
          {showBottomNav && (
            <nav className="flex justify-around items-stretch border-t border-red-600">
              <HeaderNavLink page="team" currentPage={currentPage} setCurrentPage={setCurrentPage} icon={<Users size={18}/>}>
                Team
              </HeaderNavLink>
              <HeaderNavLink page="schedule" currentPage={currentPage} setCurrentPage={setCurrentPage} icon={<Calendar size={18}/>}>
                Schedule
              </HeaderNavLink>
              <HeaderNavLink page="stats" currentPage={currentPage} setCurrentPage={setCurrentPage} icon={<BarChart2 size={18}/>}>
                Stats
              </HeaderNavLink>
            </nav>
          )}
        </header>
      );
    };

    export default Header;
