import React from 'react';
import CreateSecret from './components/CreateSecret';
import ViewSecret from './components/ViewSecret';

function App() {
  const secretMatch = window.location.pathname.match(/^\/view\/([^/]+)\/?$/);
  const content = secretMatch
    ? <ViewSecret id={decodeURIComponent(secretMatch[1])} hash={window.location.hash} />
    : <CreateSecret />;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
        <div className="bg-shape bg-shape-1" />
        <div className="bg-shape bg-shape-2" />



        {/* Main Content */}
        <main
          className="flex-grow flex flex-col items-center w-full relative z-10 px-4 min-h-0"
          style={{ paddingTop: '12vh', paddingBottom: '12vh' }}
        >

          {/* Logo Section */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <img
              src="/logo.png"
              alt="Whisper Logo"
              className="h-12 md:h-16 w-auto max-w-[240px] object-contain mb-6 drop-shadow-[0_0_15px_rgba(0,255,157,0.6)]"
            />
            <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400 drop-shadow-sm">
                Secure Secret Sharing
              </span>
            </h2>
          </div>

          {/* Content Container - Centers vertically */}
          <div className="flex-grow flex items-center justify-center w-full my-8">
            {content}
          </div>

          {/* Footer Slogan */}
          <div className="text-center space-y-8 shrink-0">
            <div className="text-sm md:text-base text-gray-500 font-mono tracking-[0.3em] uppercase opacity-70">
              Secure • Ephemeral • Anonymous
            </div>

            <div className="flex items-center justify-center gap-6 text-sm font-mono">
              <a
                href="https://andri.is"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-primary-color transition-colors"
              >
                Made by Andri.is
              </a>
              <span className="text-gray-700">•</span>
              <a
                href="https://github.com/andripetur/Whisper"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-white transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-6 text-center text-gray-600 text-xs font-mono">
        </footer>
    </div>
  );
}

export default App;
