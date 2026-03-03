
import React, { useRef } from 'react';
import { useKarCard } from './hooks/useKarCard';
import { CanvasEditor, type CanvasEditorRef } from './components/CanvasEditor';
import { ControlPanel } from './components/ControlPanel';

function App() {
  const canvasRef = useRef<CanvasEditorRef>(null);
  const {
    image,
    setImage, // Precisamos expor o setImage no hook se não estiver (está!)
    data,
    updateData,
    config,
    updateConfig,
    discountPercentage,
    format,
    setFormat,
    background,
    setBackground,
    restoreDefaults,
    isProcessing,
    removeImageBackground,
    adjustments,
    setAdjustments,
    resetAdjustments
  } = useKarCard();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setImage(url);
    }
  };

  const handleDownload = () => {
    canvasRef.current?.downloadImage();
  };

  return (
    <div className="flex flex-col-reverse md:flex-row min-h-screen md:h-screen w-full bg-black text-white font-sans md:overflow-hidden">
      {/* Sidebar de Controles */}
      <aside className="w-full md:w-[400px] shrink-0 h-auto md:h-full border-t md:border-t-0 md:border-r border-gray-800 bg-gray-900 z-10 shadow-xl md:overflow-y-auto">
        <ControlPanel
          state={{ image, data, config, format, background, adjustments }}
          onUpdateData={updateData}
          onUpdateConfig={updateConfig}
          onUpdateFormat={setFormat}
          onUpdateBackground={setBackground}
          onRestoreDefaults={restoreDefaults}
          onImageUpload={handleImageUpload}
          onDownload={handleDownload}
          isProcessing={isProcessing}
          onRemoveBackground={removeImageBackground}
          onRemoveImage={() => setImage(null)}
          onUpdateAdjustments={setAdjustments}
          onResetAdjustments={resetAdjustments}
        />
      </aside>

      {/* Área de Visualização */}
      <main className="flex-1 flex flex-col items-center justify-center bg-zinc-950 relative min-h-[60vh] md:min-h-0 md:h-auto py-8 md:py-0">
        {/* Grid Background para dar um toque técnico */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        />

        <div className="relative group perspective-1000">
          <CanvasEditor
            ref={canvasRef}
            state={{ image, data, config, format, background, adjustments }}
            discountPercentage={discountPercentage}
          />
          <p className="text-gray-500 text-sm">
            Preview • {format === 'story' ? '1080x1920 (9:16)' : '1080x1350 (4:5)'}
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;
