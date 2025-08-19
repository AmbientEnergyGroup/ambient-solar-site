import dynamic from 'next/dynamic';

// Lazy load heavy components
export const LazyMessagesButton = dynamic(() => import('./MessagesButton'), {
  loading: () => <div className="w-8 h-8 bg-gray-300 rounded animate-pulse" />,
  ssr: false
});

export const LazyGoogleSheetsImport = dynamic(() => import('./GoogleSheetsImport'), {
  loading: () => <div className="p-4 bg-gray-200 rounded animate-pulse" />,
  ssr: false
});

export const LazyVoiceRecorder = dynamic(() => import('./VoiceRecorder'), {
  loading: () => <div className="w-full h-12 bg-gray-200 rounded animate-pulse" />,
  ssr: false
});

export const LazyAuthDiagnostic = dynamic(() => import('./AuthDiagnostic'), {
  loading: () => <div className="p-4 bg-gray-200 rounded animate-pulse" />,
  ssr: false
});

export const LazyProductionAuthCheck = dynamic(() => import('./ProductionAuthCheck'), {
  loading: () => <div className="p-4 bg-gray-200 rounded animate-pulse" />,
  ssr: false
}); 