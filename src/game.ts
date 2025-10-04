import { Ctrl } from './ctrl';
import { Game } from './interfaces';
import { Api as CgApi } from 'chessground/api';
import { Config as CgConfig } from 'chessground/config';
import { Stream } from './ndJsonStream';
import { Color, Key } from 'chessground/types';
import { opposite, parseUci } from 'chessops/util';
import { Chess, defaultSetup } from 'chessops';
import { makeFen, parseFen } from 'chessops/fen';
import { chessgroundDests } from 'chessops/compat';
import { visualizationTrainer } from './pieceSetManager';

export interface BoardCtrl {
  chess: Chess;
  ground?: CgApi;
  chessgroundConfig: () => CgConfig;
  setGround: (cg: CgApi) => void;
}

export class GameCtrl implements BoardCtrl {
  game: Game;
  pov: Color;
  chess: Chess = Chess.default();
  lastMove?: [Key, Key];
  lastUpdateAt: number = Date.now();
  ground?: CgApi;
  redrawInterval: ReturnType<typeof setInterval>;
  private lastMoveCount: number = 0;

  constructor(game: Game, readonly stream: Stream, private root: Ctrl) {
    this.game = game;
    this.pov = this.game.black.id == this.root.auth.me?.id ? 'black' : 'white';
    this.onUpdate();
    this.redrawInterval = setInterval(root.redraw, 100);
    
    // Subscribe to visualization trainer changes
    visualizationTrainer.subscribe(() => {
      this.root.redraw();
    });
  }

  onUnmount = () => {
    this.stream.close();
    clearInterval(this.redrawInterval);
  };

  private onUpdate = () => {
    const setup = this.game.initialFen == 'startpos' ? defaultSetup() : parseFen(this.game.initialFen).unwrap();
    this.chess = Chess.fromSetup(setup).unwrap();
    const moves = this.game.state.moves.split(' ').filter((m: string) => m);
    
    // Check if there's a new move to speak
    const currentMoveCount = moves.length;
    if (currentMoveCount > this.lastMoveCount) {
      const lastMove = moves[moves.length - 1];
      const color = currentMoveCount % 2 === 1 ? 'white' : 'black';
      const algebraic = this.uciToAlgebraic(lastMove);
      this.speakMove(algebraic, color);
      this.lastMoveCount = currentMoveCount;
    }
    
    moves.forEach((uci: string) => this.chess.play(parseUci(uci)!));
    const lastMove = moves[moves.length - 1];
    this.lastMove = lastMove && [lastMove.substr(0, 2) as Key, lastMove.substr(2, 2) as Key];
    this.lastUpdateAt = Date.now();
    this.ground?.set(this.chessgroundConfig());
    if (this.chess.turn == this.pov) this.ground?.playPremove();
  };

  timeOf = (color: Color) => this.game.state[`${color[0]}time`];

  userMove = async (orig: Key, dest: Key) => {
    this.ground?.set({ turnColor: opposite(this.pov) });
    await this.root.auth.fetchBody(`/api/board/game/${this.game.id}/move/${orig}${dest}`, { method: 'post' });
  };

  resign = async () => {
    await this.root.auth.fetchBody(`/api/board/game/${this.game.id}/resign`, { method: 'post' });
  };

  playing = () => this.game.state.status == 'started';

  chessgroundConfig = () => ({
    orientation: this.pov,
    fen: makeFen(this.chess.toSetup()),
    lastMove: this.lastMove,
    turnColor: this.chess.turn,
    check: !!this.chess.isCheck(),
    movable: {
      free: false,
      color: this.playing() ? this.pov : undefined,
      dests: chessgroundDests(this.chess),
    },
    events: {
      move: this.userMove,
    },
  });

  setGround = (cg: CgApi) => (this.ground = cg);

  // Convert UCI notation to algebraic notation
  private uciToAlgebraic = (uci: string): string => {
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

  // Text-to-speech functionality
  private speakMove = (move: string, color: 'white' | 'black') => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(`${color} plays ${move}`);
      utterance.rate = 0.8;
      utterance.pitch = color === 'white' ? 1.1 : 0.9;
      utterance.volume = 0.7;
      speechSynthesis.speak(utterance);
    }
  };

  static open = (root: Ctrl, id: string): Promise<GameCtrl> =>
    new Promise<GameCtrl>(async resolve => {
      let ctrl: GameCtrl;
      let stream: Stream;
      const handler = (msg: any) => {
        if (ctrl) ctrl.handle(msg);
        else {
          // Gets the gameFull object from the first message of the stream,
          // make a GameCtrl from it, then forward the next messages to the ctrl
          ctrl = new GameCtrl(msg, stream, root);
          resolve(ctrl);
        }
      };
      stream = await root.auth.openStream(`/api/board/game/stream/${id}`, {}, handler);
    });

  private handle = (msg: any) => {
    switch (msg.type) {
      case 'gameFull':
        this.game = msg;
        this.onUpdate();
        this.root.redraw();
        break;
      case 'gameState':
        this.game.state = msg;
        this.onUpdate();
        this.root.redraw();
        break;
      default:
        console.error(`Unknown message type: ${msg.type}`, msg);
    }
  };
}
