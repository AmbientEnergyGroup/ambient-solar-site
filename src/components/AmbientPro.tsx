import AmbientLogo from './AmbientLogo';

interface AmbientProProps {
  darkMode?: boolean;
}

export default function AmbientPro({ darkMode = true }: AmbientProProps) {
  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center">
        <AmbientLogo theme={darkMode ? 'dark' : 'light'} />
        <span className={`ml-1 font-bold text-2xl ${darkMode ? 'text-cyan-500' : 'text-cyan-500'}`}>Pro</span>
      </div>
    </div>
  );
} 