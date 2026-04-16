import React from 'react';

const SafeLottie = ({ animationData }) => {
  // We inject the JSON directly into an isolated HTML document
  const jsonString = JSON.stringify(animationData);
  
  const srcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { margin: 0; overflow: hidden; display: flex; justify-content: center; align-items: center; height: 100vh; background: transparent; }
          #lottie { width: 100%; height: 100%; }
        </style>
      </head>
      <body>
        <div id="lottie"></div>
        <script src="/lottie.min.js"></script>
        <script>
          try {
            const animData = ${jsonString}; 
            lottie.loadAnimation({
              container: document.getElementById('lottie'),
              renderer: 'svg',
              loop: true,
              autoplay: true,
              animationData: animData
            });
          } catch(e) { console.error("Animation error", e); }
        </script>
      </body>
    </html>
  `;

  return (
    <iframe 
      srcDoc={srcDoc} 
      style={{ width: "100%", height: "100%", border: "none", pointerEvents: "none" }} 
      title="Lottie Animation"
    />
  );
};

export default SafeLottie;