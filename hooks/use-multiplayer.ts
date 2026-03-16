import { useState, useEffect, useRef, useCallback } from 'react';
import type { DataConnection } from 'peerjs';

export type MultiplayerRole = "host" | "guest" | null;

export interface PlayerStats {
  winStreak: number;
  gamesPlayed: number;
  bestTime?: number;
}

export interface OpponentData {
  stats: PlayerStats | null;
  progress: number; // 0 to 81
  isHost: boolean;
  hasWon: boolean;
  puzzle?: (number | null)[][];
  solution?: (number | null)[][];
}

export function useMultiplayer() {
  const [peerId, setPeerId] = useState<string | null>(null);
  const [connection, setConnection] = useState<DataConnection | null>(null);
  const [role, setRole] = useState<MultiplayerRole>(null);
  const [opponent, setOpponent] = useState<OpponentData>({
    stats: null,
    progress: 0,
    isHost: false,
    hasWon: false
  });
  
  const peerRef = useRef<any>(null); // Type 'any' for dynamically imported Peer
  const onReceiveBoardRef = useRef<((puzzle: (number | null)[][], solution: (number | null)[][]) => void) | null>(null);
  
  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;
    
    // Dynamically import peerjs
    import('peerjs').then(({ default: Peer }) => {
      const peer = new Peer();
      peerRef.current = peer;
      
      peer.on('open', (id: string) => {
        setPeerId(id);
      });
      
      peer.on('connection', (conn: DataConnection) => {
        // Someone connected to us (we are the host)
        setupConnection(conn, "host");
      });
      
      peer.on('error', (err: any) => {
        console.error("PeerJS error", err);
      });
    });
    
    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setupConnection = (conn: DataConnection, assignedRole: MultiplayerRole) => {
    setConnection(conn);
    setRole(assignedRole);
    
    conn.on('open', () => {
      console.log('Connected to peer');
      // Send initial stats when connected
      const stats = {
          winStreak: parseInt(localStorage.getItem('sudoku-win-streak') || '0'),
          gamesPlayed: parseInt(localStorage.getItem('sudoku-games-played') || '0'),
          bestTime: parseInt(localStorage.getItem('sudoku-best-time') || '0'),
      };
      conn.send({ type: 'INIT_STATS', data: stats });
    });
    
    conn.on('data', (data: any) => {
      if (data.type === 'INIT_STATS') {
        setOpponent(prev => ({ ...prev, stats: data.data }));
      } else if (data.type === 'PROGRESS') {
        setOpponent(prev => ({ ...prev, progress: data.data }));
      } else if (data.type === 'WIN') {
        setOpponent(prev => ({ ...prev, hasWon: true }));
      } else if (data.type === 'INIT_BOARD') {
        // Handle receiving board from host
        onReceiveBoardRef.current?.(data.puzzle, data.solution);
      }
    });
    
    conn.on('close', () => {
      console.log('Connection closed');
      setConnection(null);
      setRole(null);
    });
  };

  const connectToHost = useCallback((hostId: string) => {
    if (!peerRef.current) return;
    const conn = peerRef.current.connect(hostId);
    setupConnection(conn, "guest");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const disconnect = useCallback(() => {
    if (connection) {
      connection.close();
      setConnection(null);
      setRole(null);
      setOpponent({
        stats: null,
        progress: 0,
        isHost: false,
        hasWon: false
      });
    }
  }, [connection]);

  const sendProgress = useCallback((progress: number) => {
    if (connection) {
      connection.send({ type: 'PROGRESS', data: progress });
    }
  }, [connection]);

  const sendWinState = useCallback(() => {
    if (connection) {
      connection.send({ type: 'WIN', data: true });
    }
  }, [connection]);

  const sendInitialBoard = useCallback((puzzle: (number | null)[][], solution: (number | null)[][]) => {
     if (connection) {
       connection.send({ type: 'INIT_BOARD', puzzle, solution });
     }
  }, [connection]);

  return {
    peerId,
    connection,
    role,
    opponent,
    connectToHost,
    disconnect,
    sendProgress,
    sendWinState,
    sendInitialBoard,
    onReceiveBoardRef
  };
}
