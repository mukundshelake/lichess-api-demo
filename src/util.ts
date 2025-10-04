export const formData = (data: any): FormData => {
  const formData = new FormData();
  for (const k of Object.keys(data)) formData.append(k, data[k]);
  return formData;
};

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Convert UCI notation to algebraic notation
export const uciToAlgebraic = (uci: string): string => {
  if (!uci || uci.length < 4) return '';
  
  const from = uci.substring(0, 2);
  const to = uci.substring(2, 4);
  const promotion = uci.length > 4 ? uci.substring(4) : '';
  
  // Simple conversion - in a real app you'd need full chess logic
  // This is a basic implementation for demonstration
  let move = from + '-' + to;
  if (promotion) {
    move += '=' + promotion.toUpperCase();
  }
  
  return move;
};

// Text-to-speech functionality
export const speakMove = (move: string, color: 'white' | 'black') => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(`${color} plays ${move}`);
    utterance.rate = 0.8;
    utterance.pitch = color === 'white' ? 1.1 : 0.9;
    utterance.volume = 0.7;
    speechSynthesis.speak(utterance);
  }
};

// Get the last move from moves array
export const getLastMove = (moves: string[]): { uci: string; algebraic: string; color: 'white' | 'black' } | null => {
  if (!moves || moves.length === 0) return null;
  
  const lastUci = moves[moves.length - 1];
  const isWhiteMove = moves.length % 2 === 1;
  
  return {
    uci: lastUci,
    algebraic: uciToAlgebraic(lastUci),
    color: isWhiteMove ? 'white' : 'black'
  };
};
