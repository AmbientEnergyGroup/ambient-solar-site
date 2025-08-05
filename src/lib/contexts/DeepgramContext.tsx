"use client";

// Mock types to replace @deepgram/sdk
enum SOCKET_STATES {
  closed = "closed",
  open = "open",
  connecting = "connecting"
}

interface LiveTranscriptionEvents {
  // Mock interface
}

interface DeepgramContextType {
  connectToDeepgram: () => Promise<void>;
  disconnectFromDeepgram: () => void;
  connectionState: SOCKET_STATES;
  realtimeTranscript: string;
  error: string | null;
}

import { createContext, useContext, useState, ReactNode, FunctionComponent, useRef } from "react";

const DeepgramContext = createContext<DeepgramContextType | undefined>(undefined);

interface DeepgramContextProviderProps {
  children: ReactNode;
}

const getApiKey = async (): Promise<string> => {
  // Mock API key for now
  return "mock-api-key";
};

const DeepgramContextProvider: FunctionComponent<DeepgramContextProviderProps> = ({ children }) => {
  const [connection, setConnection] = useState<WebSocket | null>(null);
  const [connectionState, setConnectionState] = useState<SOCKET_STATES>(SOCKET_STATES.closed);
  const [realtimeTranscript, setRealtimeTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<MediaRecorder | null>(null);

  const connectToDeepgram = async () => {
    try {
      setError(null);
      setRealtimeTranscript("");
      setError("Voice recording is temporarily disabled. Please use text input instead.");
      setConnectionState(SOCKET_STATES.closed);
    } catch (error) {
      console.error("Error starting voice recognition:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
      setConnectionState(SOCKET_STATES.closed);
    }
  };

  const disconnectFromDeepgram = () => {
    if (connection) {
      connection.close();
      setConnection(null);
    }
    if (audioRef.current) {
      audioRef.current.stop();
    }
    setRealtimeTranscript("");
    setError(null);
    setConnectionState(SOCKET_STATES.closed);
  };

  const value: DeepgramContextType = {
    connectToDeepgram,
    disconnectFromDeepgram,
    connectionState,
    realtimeTranscript,
    error,
  };

  return (
    <DeepgramContext.Provider value={value}>
      {children}
    </DeepgramContext.Provider>
  );
};

// Make sure to wrap your application in a DeepgramContextProvider to use the deepgram.
function useDeepgram(): DeepgramContextType {
  const context = useContext(DeepgramContext);
  if (context === undefined) {
    throw new Error("useDeepgram must be used within a DeepgramContextProvider");
  }
  return context;
}

export {
  DeepgramContextProvider,
  useDeepgram,
  SOCKET_STATES,
};
