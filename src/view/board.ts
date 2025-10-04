import { Chessground } from 'chessground';
import { Color } from 'chessops';
import { h, VNode } from 'snabbdom';
import { BoardCtrl } from '../game';
import { visualizationTrainer } from '../pieceSetManager';

export const renderBoard = (ctrl: BoardCtrl) =>
  h(
    'div.game-page__board',
    h(
      'div.cg-wrap',
      {
        hook: {
          insert(vnode) {
            ctrl.setGround(Chessground(vnode.elm as HTMLElement, ctrl.chessgroundConfig()));
            // Initialize visualization trainer on board creation
            visualizationTrainer.initializeBoard();
          },
        },
      },
      'loading...'
    )
  );

export const renderPlayer = (
  ctrl: BoardCtrl,
  color: Color,
  clock: VNode,
  name: string,
  title?: string,
  rating?: number,
  aiLevel?: number
) => {
  // Get last move information
  const game = (ctrl as any).game;
  const moves = game?.state?.moves ? game.state.moves.split(' ').filter((m: string) => m) : [];
  const lastMoveForColor = getLastMoveForColor(moves, color);
  
  return h(
    'div.game-page__player',
    {
      class: {
        turn: ctrl.chess.turn == color,
      },
    },
    [
      h('div.game-page__player__user', [
        title && h('span.game-page__player__user__title.display-5', title),
        h('span.game-page__player__user__name.display-5', aiLevel ? `Stockfish level ${aiLevel}` : name || 'Anon'),
        h('span.game-page__player__user__rating', rating || ''),
        lastMoveForColor && h('span.game-page__player__user__lastmove', `Last: ${lastMoveForColor}`),
      ]),
      h('div.game-page__player__clock.display-6', clock),
    ]
  );
};

// Helper function to get the last move for a specific color
const getLastMoveForColor = (moves: string[], color: Color): string | null => {
  if (!moves || moves.length === 0) return null;
  
  // Find the last move for this color
  const isWhite = color === 'white';
  for (let i = moves.length - 1; i >= 0; i--) {
    const isWhiteMove = (i + 1) % 2 === 1; // Move index + 1 to get move number
    if (isWhiteMove === isWhite) {
      return uciToAlgebraic(moves[i]);
    }
  }
  return null;
};

// Import the utility function
const uciToAlgebraic = (uci: string): string => {
  if (!uci || uci.length < 4) return '';
  
  const from = uci.substring(0, 2);
  const to = uci.substring(2, 4);
  const promotion = uci.length > 4 ? uci.substring(4) : '';
  
  let move = from + '-' + to;
  if (promotion) {
    move += '=' + promotion.toUpperCase();
  }
  
  return move;
};
