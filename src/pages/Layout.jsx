
import React from 'react';

export default function Layout({ children, currentPageName }) {
  return (
    <div className="min-h-screen bg-stone-950">
      <style>{`
        :root {
          --background: 12 6% 4%;
          --foreground: 60 9% 98%;
          --card: 12 6% 10%;
          --card-foreground: 60 9% 98%;
          --popover: 12 6% 10%;
          --popover-foreground: 60 9% 98%;
          --primary: 43 96% 56%;
          --primary-foreground: 12 6% 4%;
          --secondary: 12 6% 15%;
          --secondary-foreground: 60 9% 98%;
          --muted: 12 6% 15%;
          --muted-foreground: 60 5% 64%;
          --accent: 12 6% 15%;
          --accent-foreground: 60 9% 98%;
          --destructive: 0 62% 30%;
          --destructive-foreground: 60 9% 98%;
          --border: 12 6% 20%;
          --input: 12 6% 20%;
          --ring: 43 96% 56%;
        }
        
        body {
          background: #0c0a09;
          color: #fafaf9;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #1c1917;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #44403c;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #57534e;
        }

        /* Chess piece animations */
        @keyframes piece-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        
        .piece-animate:hover {
          animation: piece-bounce 0.3s ease-in-out;
        }
      `}</style>
      {children}
    </div>
  );
}
