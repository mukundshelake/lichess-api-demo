import { Color } from 'chessground/types';
import { opposite } from 'chessground/util';
import { h } from 'snabbdom';
import { GameCtrl } from '../game';
import { Renderer } from '../interfaces';
import { clockContent } from './clock';
import '../../scss/_game.scss';
import { renderBoard, renderPlayer } from './board';
import { visualizationTrainer, pieceSetManager } from '../pieceSetManager';

export const renderGame: (ctrl: GameCtrl) => Renderer = ctrl => _ =>
  [
    h(
      `div.game-layout.game-layout--${ctrl.game.id}`,
      {
        hook: {
          destroy: ctrl.onUnmount,
        },
      },
      [
        // Main game area
        h('div.game-main', [
          // Left side - Board and players
          h('div.game-board-section', [
            renderGamePlayer(ctrl, opposite(ctrl.pov)),
            renderBoard(ctrl),
            renderGamePlayer(ctrl, ctrl.pov),
          ]),
          
          // Right side - Game info and controls
          h('div.game-sidebar', [
            h('div.game-sidebar-top', [
              renderMoveList(ctrl),
              renderVisualizationControls(),
            ]),
            h('div.game-sidebar-bottom', [
              ctrl.playing() ? renderGameActions(ctrl) : renderState(ctrl),
            ]),
          ]),
        ]),
      ]
    ),
  ];

const renderMoveList = (ctrl: GameCtrl) => {
  const moves = ctrl.game.state.moves.split(' ').filter((m: string) => m);
  const moveHistory = [];
  
  for (let i = 0; i < moves.length; i += 2) {
    const moveNumber = Math.floor(i / 2) + 1;
    const whiteMove = moves[i] ? uciToAlgebraic(moves[i]) : '';
    const blackMove = moves[i + 1] ? uciToAlgebraic(moves[i + 1]) : '';
    
    moveHistory.push(
      h('div.move-pair', [
        h('span.move-number', `${moveNumber}.`),
        h('span.move.white-move', whiteMove),
        blackMove && h('span.move.black-move', blackMove),
      ])
    );
  }
  
  return h('div.move-list-container', [
    h('div.move-list-header', 'Moves'),
    h('div.move-list', moveHistory.slice(-8)), // Show last 8 move pairs
  ]);
};

// Simple UCI to algebraic conversion
const uciToAlgebraic = (uci: string): string => {
  if (!uci || uci.length < 4) return '';
  const from = uci.substring(0, 2);
  const to = uci.substring(2, 4);
  return `${from}-${to}`;
};

const renderGameActions = (ctrl: GameCtrl) =>
  h('div.game-actions', [
    h('div.action-buttons', [
      h('button.btn.btn-danger.btn-sm', {
        attrs: { type: 'button', disabled: !ctrl.playing() },
        on: {
          click() {
            if (confirm('Confirm resign?')) ctrl.resign();
          },
        },
      }, ctrl.chess.fullmoves > 1 ? '🏳️ Resign' : '❌ Abort'),
      h('button.btn.btn-secondary.btn-sm', {
        attrs: { disabled: !ctrl.playing() }
      }, '🤝 Draw'),
    ]),
  ]);

const renderButtons = (ctrl: GameCtrl) =>
  h('div.game-controls', [
    h('div.btn-group.mt-4', [
      h(
        'button.btn.btn-secondary',
        {
          attrs: { type: 'button', disabled: !ctrl.playing() },
          on: {
            click() {
              if (confirm('Confirm?')) ctrl.resign();
            },
          },
        },
        ctrl.chess.fullmoves > 1 ? 'Resign' : 'Abort'
      ),
    ]),
  ]);

const renderVisualizationControls = () =>
  h('div.visualization-controls', [
    h('div.controls-header', 'Visualization Training'),
    
    h('div.current-mode-display', [
      h('span.mode-label', 'Current Mode:'),
      h('span.mode-value', visualizationTrainer.getCurrentMode().toUpperCase()),
    ]),
    
    h('div.mode-selector', [
      h('label.control-label', 'Switch Mode:'),
      h('select.form-select.form-select-sm', {
        on: {
          change(e: Event) {
            const target = e.target as HTMLSelectElement;
            visualizationTrainer.setMode(target.value as any);
          }
        }
      }, 
      visualizationTrainer.getAllModes().map(mode =>
        h('option', {
          attrs: { 
            value: mode.value,
            selected: mode.value === visualizationTrainer.getCurrentMode()
          }
        }, mode.label)
      )),
    ]),
    
    h('div.mode-description', [
      h('small', visualizationTrainer.getModeDescription()),
    ]),

    // Memory mode timer (only show when in memory mode)
    visualizationTrainer.getCurrentMode() === 'memory' ? 
      h('div.memory-controls', [
        h('label.control-label', 'Memory Time:'),
        h('div.range-control', [
          h('input.form-range', {
            attrs: { 
              type: 'range',
              min: '1',
              max: '30',
              value: (visualizationTrainer.getSettings().memoryTime || 5000) / 1000,
              step: '1'
            },
            on: {
              input(e: Event) {
                const target = e.target as HTMLInputElement;
                visualizationTrainer.setMemoryTime(parseInt(target.value));
              }
            }
          }),
          h('span.range-value', `${(visualizationTrainer.getSettings().memoryTime || 5000) / 1000}s`),
        ]),
      ]) : null,
      
    h('div.quick-actions', [
      h('button.btn.btn-outline-light.btn-sm', {
        on: { click: () => visualizationTrainer.cycleMode() },
        attrs: { title: 'Cycle through visualization modes' }
      }, '🔄 Next Mode'),
    ]),
  ]);

const renderState = (ctrl: GameCtrl) => h('div.game-page__state', ctrl.game.state.status);

const renderGamePlayer = (ctrl: GameCtrl, color: Color) => {
  const p = ctrl.game[color];
  const clock = clockContent(
    ctrl.timeOf(color),
    color == ctrl.chess.turn && ctrl.chess.fullmoves > 1 && ctrl.playing() ? ctrl.lastUpdateAt - Date.now() : 0
  );
  return renderPlayer(ctrl, color, clock, p.name, p.title, p.rating, p.aiLevel);
};
