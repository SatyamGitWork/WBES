import { useEffect, useState } from 'react';

export const DesktopGate = ({ children }: { children: React.ReactNode }) => {
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkIsDesktop = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      const isNarrowScreen = window.innerWidth < 1024;
      
      setIsDesktop(!isMobileDevice && !isNarrowScreen);
    };

    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);

    return () => {
      window.removeEventListener('resize', checkIsDesktop);
    };
  }, []);

  if (!isDesktop) {
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-6 text-center text-white">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent mb-6">
          <rect width="20" height="14" x="2" y="3" rx="2" ry="2" />
          <line x1="8" x2="16" y1="21" y2="21" />
          <line x1="12" x2="12" y1="17" y2="21" />
        </svg>
        <h1 className="text-3xl font-bold mb-4">Desktop Required</h1>
        <p className="text-white/80 max-w-md text-lg">
          ExamPro is designed for desktop environments to ensure a secure and optimal examination experience. 
          Please access this application from a laptop or desktop computer with a screen width of at least 1024px.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
