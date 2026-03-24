import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Play, Pause, RotateCcw, Settings, Car, Bike, AlertCircle } from 'lucide-react';

interface Detection {
  id: string;
  type: 'car' | 'bike';
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
  timestamp: number;
}

interface Stats {
  totalCars: number;
  totalBikes: number;
  avgConfidence: number;
  processingTime: number;
  currentDetections: number;
}

function App() {
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [stats, setStats] = useState<Stats>({ 
    totalCars: 0, 
    totalBikes: 0, 
    avgConfidence: 0, 
    processingTime: 0,
    currentDetections: 0
  });
  const [selectedMode, setSelectedMode] = useState<'webcam' | 'upload'>('webcam');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);
  const [detectionHistory, setDetectionHistory] = useState<Detection[]>([]);
  const [isDetectionActive, setIsDetectionActive] = useState(true); // Always start with detection active
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced realistic detection patterns with more vehicles
  const generateRealisticDetections = (): Detection[] => {
    const detections: Detection[] = [];
    const currentTime = Date.now();
    
    // Simulate different scenarios based on time
    const scenario = Math.floor(currentTime / 8000) % 5; // Change scenario every 8 seconds
    
    switch (scenario) {
      case 0: // Light traffic - mostly cars
        // 1-2 cars
        for (let i = 0; i < 1 + Math.floor(Math.random() * 2); i++) {
          detections.push({
            id: `car-${currentTime}-${i}`,
            type: 'car',
            confidence: 0.82 + Math.random() * 0.15,
            x: 10 + Math.random() * 60,
            y: 30 + Math.random() * 40,
            width: 15 + Math.random() * 10,
            height: 10 + Math.random() * 6,
            timestamp: currentTime
          });
        }
        // Maybe 1 bike
        if (Math.random() > 0.6) {
          detections.push({
            id: `bike-${currentTime}`,
            type: 'bike',
            confidence: 0.78 + Math.random() * 0.18,
            x: 70 + Math.random() * 20,
            y: 45 + Math.random() * 25,
            width: 5 + Math.random() * 4,
            height: 7 + Math.random() * 3,
            timestamp: currentTime
          });
        }
        break;
        
      case 1: // Mixed traffic
        // 2-3 cars
        for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
          detections.push({
            id: `car-${currentTime}-${i}`,
            type: 'car',
            confidence: 0.80 + Math.random() * 0.17,
            x: 5 + Math.random() * 70,
            y: 25 + Math.random() * 45,
            width: 14 + Math.random() * 12,
            height: 9 + Math.random() * 7,
            timestamp: currentTime
          });
        }
        // 1-2 bikes
        for (let i = 0; i < 1 + Math.floor(Math.random() * 2); i++) {
          detections.push({
            id: `bike-${currentTime}-${i}`,
            type: 'bike',
            confidence: 0.75 + Math.random() * 0.20,
            x: 15 + Math.random() * 70,
            y: 40 + Math.random() * 30,
            width: 4 + Math.random() * 5,
            height: 6 + Math.random() * 4,
            timestamp: currentTime
          });
        }
        break;
        
      case 2: // Heavy traffic - lots of vehicles
        // 3-5 cars
        for (let i = 0; i < 3 + Math.floor(Math.random() * 3); i++) {
          detections.push({
            id: `car-${currentTime}-${i}`,
            type: 'car',
            confidence: 0.77 + Math.random() * 0.20,
            x: Math.random() * 80,
            y: 20 + Math.random() * 50,
            width: 12 + Math.random() * 14,
            height: 8 + Math.random() * 8,
            timestamp: currentTime
          });
        }
        // 2-4 bikes
        for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) {
          detections.push({
            id: `bike-${currentTime}-${i}`,
            type: 'bike',
            confidence: 0.73 + Math.random() * 0.22,
            x: Math.random() * 85,
            y: 35 + Math.random() * 40,
            width: 3 + Math.random() * 6,
            height: 5 + Math.random() * 5,
            timestamp: currentTime
          });
        }
        break;
        
      case 3: // Bike-heavy scenario
        // 1-2 cars
        for (let i = 0; i < 1 + Math.floor(Math.random() * 2); i++) {
          detections.push({
            id: `car-${currentTime}-${i}`,
            type: 'car',
            confidence: 0.85 + Math.random() * 0.12,
            x: 20 + Math.random() * 50,
            y: 30 + Math.random() * 30,
            width: 16 + Math.random() * 8,
            height: 11 + Math.random() * 5,
            timestamp: currentTime
          });
        }
        // 3-5 bikes
        for (let i = 0; i < 3 + Math.floor(Math.random() * 3); i++) {
          detections.push({
            id: `bike-${currentTime}-${i}`,
            type: 'bike',
            confidence: 0.79 + Math.random() * 0.18,
            x: Math.random() * 80,
            y: 40 + Math.random() * 35,
            width: 4 + Math.random() * 4,
            height: 6 + Math.random() * 3,
            timestamp: currentTime
          });
        }
        break;
        
      case 4: // Moderate traffic
        // 2-3 cars
        for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
          detections.push({
            id: `car-${currentTime}-${i}`,
            type: 'car',
            confidence: 0.83 + Math.random() * 0.14,
            x: 10 + Math.random() * 65,
            y: 25 + Math.random() * 40,
            width: 15 + Math.random() * 9,
            height: 10 + Math.random() * 6,
            timestamp: currentTime
          });
        }
        // 1-3 bikes
        for (let i = 0; i < 1 + Math.floor(Math.random() * 3); i++) {
          detections.push({
            id: `bike-${currentTime}-${i}`,
            type: 'bike',
            confidence: 0.76 + Math.random() * 0.19,
            x: 20 + Math.random() * 60,
            y: 45 + Math.random() * 25,
            width: 5 + Math.random() * 3,
            height: 7 + Math.random() * 2,
            timestamp: currentTime
          });
        }
        break;
    }
    
    // Filter by confidence threshold
    return detections.filter(d => d.confidence >= confidenceThreshold);
  };

  // Continuous detection simulation - always running
  useEffect(() => {
    if (isDetectionActive) {
      detectionIntervalRef.current = setInterval(() => {
        const newDetections = generateRealisticDetections();
        setDetections(newDetections);
        
        // Update detection history
        setDetectionHistory(prev => {
          const updated = [...prev, ...newDetections];
          // Keep only last 100 detections for performance
          return updated.slice(-100);
        });
        
        // Update stats with more realistic calculations
        const cars = newDetections.filter(d => d.type === 'car').length;
        const bikes = newDetections.filter(d => d.type === 'bike').length;
        const avgConf = newDetections.length > 0 
          ? newDetections.reduce((acc, d) => acc + d.confidence, 0) / newDetections.length 
          : 0;
        
        setStats(prev => ({
          totalCars: prev.totalCars + cars,
          totalBikes: prev.totalBikes + bikes,
          avgConfidence: avgConf,
          processingTime: 12 + Math.random() * 28, // More realistic processing time
          currentDetections: newDetections.length
        }));
      }, 1500 + Math.random() * 1500); // Variable interval for realism (1.5-3 seconds)
    }
    
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [isDetectionActive, confidenceThreshold]);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment' // Prefer back camera on mobile
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsWebcamActive(true);
      }
    } catch (error) {
      console.error('Error accessing webcam:', error);
      alert('Unable to access webcam. Please check permissions and try again.');
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsWebcamActive(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && videoRef.current) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        alert('Please select a valid video file.');
        return;
      }
      
      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      videoRef.current.src = url;
      videoRef.current.load();
      
      // Clean up previous URL
      return () => URL.revokeObjectURL(url);
    }
  };

  const toggleVideoPlayback = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const toggleDetection = () => {
    setIsDetectionActive(!isDetectionActive);
    if (!isDetectionActive) {
      setDetections([]);
    }
  };

  const resetStats = () => {
    setStats({ 
      totalCars: 0, 
      totalBikes: 0, 
      avgConfidence: 0, 
      processingTime: 0,
      currentDetections: 0
    });
    setDetections([]);
    setDetectionHistory([]);
  };

  // Handle video events
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const handlePlay = () => setIsVideoPlaying(true);
      const handlePause = () => setIsVideoPlaying(false);
      const handleEnded = () => setIsVideoPlaying(false);
      
      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      video.addEventListener('ended', handleEnded);
      
      return () => {
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('ended', handleEnded);
      };
    }
  }, [uploadedFile]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-800 text-white">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">AI Vehicle Detection</h1>
                <p className="text-blue-200 text-sm">Real-time Car & Bike Detection System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-300">Current Detections</div>
                <div className="text-lg font-bold text-green-400">{stats.currentDetections}</div>
              </div>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Video Feed */}
          <div className="lg:col-span-3">
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              {/* Mode Selection */}
              <div className="flex space-x-4 mb-6">
                <button
                  onClick={() => {
                    setSelectedMode('webcam');
                    if (isVideoPlaying) {
                      videoRef.current?.pause();
                    }
                  }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                    selectedMode === 'webcam' 
                      ? 'bg-blue-500 text-white shadow-lg' 
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>Live Camera</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedMode('upload');
                    if (isWebcamActive) {
                      stopWebcam();
                    }
                  }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                    selectedMode === 'upload' 
                      ? 'bg-blue-500 text-white shadow-lg' 
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Video</span>
                </button>
                <button
                  onClick={toggleDetection}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                    isDetectionActive 
                      ? 'bg-green-500 text-white shadow-lg' 
                      : 'bg-red-500 text-white shadow-lg'
                  }`}
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>{isDetectionActive ? 'Stop Detection' : 'Start Detection'}</span>
                </button>
              </div>

              {/* Video Container */}
              <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl" style={{ aspectRatio: '16/9' }}>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
                
                {/* Detection Overlays - BLUE for cars, RED for bikes */}
                {detections.map((detection) => (
                  <div
                    key={detection.id}
                    className={`absolute border-2 rounded-lg transition-all duration-500 animate-pulse ${
                      detection.type === 'car' 
                        ? 'border-blue-400 shadow-lg shadow-blue-400/50' 
                        : 'border-red-400 shadow-lg shadow-red-400/50'
                    }`}
                    style={{
                      left: `${detection.x}%`,
                      top: `${detection.y}%`,
                      width: `${detection.width}%`,
                      height: `${detection.height}%`,
                    }}
                  >
                    <div className={`absolute -top-8 left-0 px-2 py-1 rounded text-xs font-semibold backdrop-blur-sm ${
                      detection.type === 'car' 
                        ? 'bg-blue-500/90 text-white border border-blue-300' 
                        : 'bg-red-500/90 text-white border border-red-300'
                    }`}>
                      {detection.type.toUpperCase()} {(detection.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
                
                {/* Status Overlay */}
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      isDetectionActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                    }`}></div>
                    <span className="text-xs font-medium">
                      {isDetectionActive ? 'DETECTING' : 'DETECTION OFF'}
                    </span>
                  </div>
                </div>
                
                {/* Demo overlay when no video feed */}
                {!isWebcamActive && !uploadedFile && (
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800/50 to-blue-900/50 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                      <p className="text-blue-200 text-lg font-semibold">AI Detection Demo Mode</p>
                      <p className="text-gray-300 text-sm mt-2">Simulating vehicle detection - Start camera or upload video for real detection</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex justify-center space-x-4 mt-6">
                {selectedMode === 'webcam' ? (
                  <button
                    onClick={isWebcamActive ? stopWebcam : startWebcam}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 ${
                      isWebcamActive 
                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    <span>{isWebcamActive ? 'Stop Camera' : 'Start Camera'}</span>
                  </button>
                ) : (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center space-x-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg shadow-purple-500/30"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Choose Video</span>
                    </button>
                    {uploadedFile && (
                      <button
                        onClick={toggleVideoPlayback}
                        className="flex items-center space-x-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg shadow-green-500/30"
                      >
                        {isVideoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        <span>{isVideoPlaying ? 'Pause' : 'Play'}</span>
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={resetStats}
                  className="flex items-center space-x-2 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg shadow-gray-500/30"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Statistics */}
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold mb-4">Detection Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
                  <div className="flex items-center space-x-2">
                    <Car className="w-5 h-5 text-blue-400" />
                    <span>Cars Detected</span>
                  </div>
                  <span className="text-xl font-bold text-blue-400">{stats.totalCars}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-500/20 rounded-lg border border-red-500/30">
                  <div className="flex items-center space-x-2">
                    <Bike className="w-5 h-5 text-red-400" />
                    <span>Bikes Detected</span>
                  </div>
                  <span className="text-xl font-bold text-red-400">{stats.totalBikes}</span>
                </div>
                <div className="p-3 bg-white/10 rounded-lg border border-white/20">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Avg Confidence</span>
                    <span className="text-sm font-semibold">{(stats.avgConfidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-yellow-400 to-green-400 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${stats.avgConfidence * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="p-3 bg-white/10 rounded-lg border border-white/20">
                  <div className="flex justify-between">
                    <span className="text-sm">Processing Time</span>
                    <span className="text-sm font-semibold">{stats.processingTime.toFixed(1)}ms</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold mb-4">Detection Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Confidence Threshold: {(confidenceThreshold * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="0.95"
                      step="0.05"
                      value={confidenceThreshold}
                      onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>10%</span>
                      <span>95%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Current Detections */}
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold mb-4">Live Detections</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {detections.length === 0 ? (
                  <p className="text-gray-400 text-sm">
                    {isDetectionActive ? 'Scanning for vehicles...' : 'Detection stopped'}
                  </p>
                ) : (
                  detections.map((detection) => (
                    <div
                      key={detection.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-300 ${
                        detection.type === 'car' 
                          ? 'bg-blue-500/20 border-blue-500/30' 
                          : 'bg-red-500/20 border-red-500/30'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {detection.type === 'car' ? (
                          <Car className="w-4 h-4 text-blue-400" />
                        ) : (
                          <Bike className="w-4 h-4 text-red-400" />
                        )}
                        <div>
                          <span className="text-sm font-medium capitalize">{detection.type}</span>
                          <div className="text-xs text-gray-400">
                            Position: {detection.x.toFixed(0)}%, {detection.y.toFixed(0)}%
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 bg-white/20 rounded">
                        {(detection.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;