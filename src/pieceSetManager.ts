// Piece set management for dynamic switching
export type PieceSet = 'cburnett' | 'transp';

export class PieceSetManager {
  private currentPieceSet: PieceSet = 'cburnett';
  private callbacks: Array<(pieceSet: PieceSet) => void> = [];

  getCurrentPieceSet(): PieceSet {
    return this.currentPieceSet;
  }

  setPieceSet(pieceSet: PieceSet): void {
    if (this.currentPieceSet !== pieceSet) {
      this.currentPieceSet = pieceSet;
      this.notifyListeners();
      this.updateBoardPieceSet();
    }
  }

  togglePieceSet(): void {
    const newPieceSet = this.currentPieceSet === 'cburnett' ? 'transp' : 'cburnett';
    this.setPieceSet(newPieceSet);
  }

  subscribe(callback: (pieceSet: PieceSet) => void): void {
    this.callbacks.push(callback);
  }

  unsubscribe(callback: (pieceSet: PieceSet) => void): void {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  private notifyListeners(): void {
    this.callbacks.forEach(callback => callback(this.currentPieceSet));
  }

  private updateBoardPieceSet(): void {
    const boardElement = document.querySelector('.cg-wrap');
    if (boardElement) {
      // Remove all piece set classes
      boardElement.classList.remove('piece-set-cburnett', 'piece-set-transp');
      // Add the current piece set class
      boardElement.classList.add(`piece-set-${this.currentPieceSet}`);
    }
  }

  // Initialize the piece set on the board
  initializeBoardPieceSet(): void {
    this.updateBoardPieceSet();
  }
}

// Global instance
export const pieceSetManager = new PieceSetManager();