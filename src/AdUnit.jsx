import { useEffect, useRef } from 'react';

/**
 * Google AdSense Ad Unit Component
 * 
 * Props:
 * - slot: Your ad unit slot ID (from AdSense dashboard)
 * - format: 'auto' | 'rectangle' | 'horizontal' | 'vertical'
 * - style: additional styles for the container
 * 
 * HOW TO GET YOUR SLOT IDs:
 * 1. Go to https://adsense.google.com
 * 2. Ads → By ad unit → Create new ad unit
 * 3. Choose "Display ads" 
 * 4. Copy the data-ad-slot value
 */
export default function AdUnit({ slot = '6207711192', format = 'auto', style = {} }) {
  const adRef = useRef(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      if (window.adsbygoogle && adRef.current) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushed.current = true;
      }
    } catch (e) {
      console.log('AdSense not loaded yet — this is normal in development');
    }
  }, []);

  return (
    <div className="ad-container" style={style}>
      <div style={{ width: '100%' }}>
        <div className="ad-label">Advertisement</div>
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: '100%' }}
          data-ad-client="ca-pub-9916636519741270"
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive="true"
          ref={adRef}
        />
      </div>
    </div>
  );
}
