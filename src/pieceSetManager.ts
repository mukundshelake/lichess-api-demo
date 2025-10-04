// Chess visualization training system for progressive blindfold practice
export type VisualizationMode = 
  | 'standard'     // Normal detailed pieces
  | 'minimal'      // Simple circular pieces with symbols
  | 'checkers'     // All pieces look like checker pieces
  | 'monochrome'   // Both colors look the same
  | 'invisible'    // No pieces visible until interaction
  | 'memory'       // Pieces disappear after initial view
  | 'blindfold';   // Complete blindfold mode

export interface VisualizationSettings {
  mode: VisualizationMode;
  showMoves: boolean;
  showTargets: boolean;
  memoryTime?: number; // for memory mode
}

export class VisualizationTrainer {
  private currentMode: VisualizationMode = 'standard';
  private settings: VisualizationSettings = {
    mode: 'standard',
    showMoves: true,
    showTargets: true,
    memoryTime: 5000
  };
  private callbacks: Array<(settings: VisualizationSettings) => void> = [];
  private memoryTimer?: ReturnType<typeof setTimeout>;

  private modeDescriptions = {
    standard: 'Standard - Full detailed pieces',
    minimal: 'Minimal - Simple circular pieces',
    checkers: 'Checkers - All pieces look like checkers',
    monochrome: 'Monochrome - Both colors look identical',
    invisible: 'Invisible - Pieces show only on interaction',
    memory: 'Memory - Pieces disappear after time',
    blindfold: 'Blindfold - Complete visualization training'
  };

  getCurrentMode(): VisualizationMode {
    return this.currentMode;
  }

  getSettings(): VisualizationSettings {
    return { ...this.settings };
  }

  getModeDescription(): string {
    return this.modeDescriptions[this.currentMode];
  }

  getAllModes(): Array<{value: VisualizationMode, label: string}> {
    return Object.entries(this.modeDescriptions).map(([value, label]) => ({
      value: value as VisualizationMode,
      label
    }));
  }

  setMode(mode: VisualizationMode): void {
    if (this.currentMode !== mode) {
      this.currentMode = mode;
      this.settings.mode = mode;
      this.clearMemoryTimer();
      this.notifyListeners();
      this.updateBoardMode();
      
      // Special handling for memory mode
      if (mode === 'memory' && this.settings.memoryTime) {
        this.startMemoryTimer();
      }
    }
  }

  cycleMode(): void {
    const modes: VisualizationMode[] = ['standard', 'minimal', 'checkers', 'monochrome', 'invisible', 'memory', 'blindfold'];
    const currentIndex = modes.indexOf(this.currentMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    this.setMode(modes[nextIndex]);
  }

  toggleShowMoves(): void {
    this.settings.showMoves = !this.settings.showMoves;
    this.notifyListeners();
    this.updateBoardMode();
  }

  toggleShowTargets(): void {
    this.settings.showTargets = !this.settings.showTargets;
    this.notifyListeners();
    this.updateBoardMode();
  }

  setMemoryTime(seconds: number): void {
    this.settings.memoryTime = seconds * 1000;
    if (this.currentMode === 'memory') {
      this.clearMemoryTimer();
      this.startMemoryTimer();
    }
  }

  subscribe(callback: (settings: VisualizationSettings) => void): void {
    this.callbacks.push(callback);
  }

  unsubscribe(callback: (settings: VisualizationSettings) => void): void {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  private notifyListeners(): void {
    this.callbacks.forEach(callback => callback(this.getSettings()));
  }

  private startMemoryTimer(): void {
    if (this.settings.memoryTime) {
      this.memoryTimer = setTimeout(() => {
        this.updateBoardMode('memory-hidden');
      }, this.settings.memoryTime);
    }
  }

  private clearMemoryTimer(): void {
    if (this.memoryTimer) {
      clearTimeout(this.memoryTimer);
      this.memoryTimer = undefined;
    }
  }

  private updateBoardMode(subMode?: string): void {
    const boardElement = document.querySelector('.cg-wrap');
    if (boardElement) {
      // Remove all mode classes
      boardElement.classList.remove(
        'viz-standard', 'viz-minimal', 'viz-checkers', 'viz-monochrome', 
        'viz-invisible', 'viz-memory', 'viz-memory-hidden', 'viz-blindfold'
      );
      
      // Add current mode class
      const modeClass = subMode || this.currentMode;
      boardElement.classList.add(`viz-${modeClass}`);
      
      // Add settings classes
      if (!this.settings.showMoves) {
        boardElement.classList.add('hide-moves');
      } else {
        boardElement.classList.remove('hide-moves');
      }
      
      if (!this.settings.showTargets) {
        boardElement.classList.add('hide-targets');
      } else {
        boardElement.classList.remove('hide-targets');
      }
    }
  }

  // Initialize the board with current mode
  initializeBoard(): void {
    this.updateBoardMode();
  }

  // Reset memory mode (useful when game state changes)
  resetMemoryMode(): void {
    if (this.currentMode === 'memory') {
      this.clearMemoryTimer();
      this.updateBoardMode();
      this.startMemoryTimer();
    }
  }

  // Handle piece interaction (for invisible mode)
  onPieceInteraction(square: string): void {
    if (this.currentMode === 'invisible') {
      const pieceElement = document.querySelector(`[data-square="${square}"] piece`);
      if (pieceElement) {
        pieceElement.classList.add('temporarily-visible');
        setTimeout(() => {
          pieceElement.classList.remove('temporarily-visible');
        }, 2000);
      }
    }
  }
}

// Global instance
export const visualizationTrainer = new VisualizationTrainer();

// Legacy compatibility
export type PieceSet = 'cburnett' | 'transp';
export const pieceSetManager = {
  getCurrentPieceSet: () => visualizationTrainer.getCurrentMode() === 'standard' ? 'cburnett' : 'transp',
  setPieceSet: (set: PieceSet) => visualizationTrainer.setMode(set === 'cburnett' ? 'standard' : 'minimal'),
  togglePieceSet: () => visualizationTrainer.setMode(visualizationTrainer.getCurrentMode() === 'standard' ? 'minimal' : 'standard'),
  subscribe: (callback: any) => visualizationTrainer.subscribe(callback),
  unsubscribe: (callback: any) => visualizationTrainer.unsubscribe(callback),
  initializeBoardPieceSet: () => visualizationTrainer.initializeBoard()
};