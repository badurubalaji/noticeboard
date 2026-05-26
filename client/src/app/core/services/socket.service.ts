import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

declare const io: any;

type EventName = 'board:updated' | 'notice:created' | 'notice:updated' | 'notice:deleted';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: any = null;
  private pendingBoardUpdateCallbacks: Array<() => void> = [];
  readonly connected = signal(false);

  connect(boardId: string): void {
    if (this.socket) this.disconnect();

    if (typeof io === 'undefined') {
      const script = document.createElement('script');
      script.src = `${environment.wsUrl || ''}/socket.io/socket.io.js`;
      script.onload = () => this.initSocket(boardId);
      script.onerror = () => console.warn('socket.io client failed to load — live updates disabled');
      document.head.appendChild(script);
    } else {
      this.initSocket(boardId);
    }
  }

  private initSocket(boardId: string): void {
    this.socket = io(environment.wsUrl || window.location.origin, {
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      this.connected.set(true);
      this.socket.emit('join:board', boardId);
    });

    this.socket.on('disconnect', () => {
      this.connected.set(false);
    });

    // Replay any callbacks registered before the socket was ready
    const events: EventName[] = ['board:updated', 'notice:created', 'notice:updated', 'notice:deleted'];
    for (const cb of this.pendingBoardUpdateCallbacks) {
      for (const ev of events) this.socket.on(ev, cb);
    }
  }

  onBoardUpdate(callback: () => void): void {
    if (this.socket) {
      this.socket.on('board:updated', callback);
      this.socket.on('notice:created', callback);
      this.socket.on('notice:updated', callback);
      this.socket.on('notice:deleted', callback);
    } else {
      this.pendingBoardUpdateCallbacks.push(callback);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected.set(false);
    }
    this.pendingBoardUpdateCallbacks = [];
  }
}
