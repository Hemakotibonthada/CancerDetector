// ============================================================================
// Media Components - Image Viewer, PDF Viewer, Charts, etc.
// ============================================================================
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, IconButton, Tooltip, Slider, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, AppBar,
  Toolbar, Stack, Chip, Avatar, Divider, LinearProgress,
  CircularProgress, Fade, Grow, useTheme, alpha, Grid,
  ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import {
  ZoomIn, ZoomOut, RotateLeft, RotateRight, Fullscreen,
  FullscreenExit, Close, Download, Share, Print, FlipCameraAndroid,
  Brightness5, Contrast, Tune, CropFree, FitScreen,
  NavigateBefore, NavigateNext, Delete, OpenInNew,
  PlayArrow, Pause, VolumeUp, VolumeOff, Speed,
  SkipPrevious, SkipNext, Replay10, Forward10,
  PictureAsPdf, Image as ImageIcon, VideoLibrary, AudioFile,
  Visibility, VisibilityOff, Compare, PhotoCamera,
  InvertColors, Opacity, CenterFocusWeak, Timeline,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// MEDICAL IMAGE VIEWER
// ============================================================================
interface ImageViewerProps {
  src: string;
  alt?: string;
  title?: string;
  annotations?: {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    color?: string;
    confidence?: number;
  }[];
  onAnnotationClick?: (id: string) => void;
  showControls?: boolean;
  showAnnotations?: boolean;
  maxZoom?: number;
  minZoom?: number;
  onClose?: () => void;
  gallery?: { src: string; alt?: string; thumbnail?: string }[];
  galleryIndex?: number;
  onGalleryChange?: (index: number) => void;
  sx?: any;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  src, alt = 'Image', title, annotations = [], onAnnotationClick,
  showControls = true, showAnnotations: initialShowAnnotations = true,
  maxZoom = 5, minZoom = 0.25, onClose, gallery, galleryIndex = 0,
  onGalleryChange, sx,
}) => {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showAnnotationsState, setShowAnnotationsState] = useState(initialShowAnnotations);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [invert, setInvert] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [currentImage, setCurrentImage] = useState(src);
  const [currentIndex, setCurrentIndex] = useState(galleryIndex);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    setCurrentImage(src);
    setImageLoading(true);
  }, [src]);

  useEffect(() => {
    if (gallery && gallery[currentIndex]) {
      setCurrentImage(gallery[currentIndex].src);
      setImageLoading(true);
      onGalleryChange?.(currentIndex);
    }
  }, [currentIndex, gallery]);

  const handleZoomIn = () => setZoom(Math.min(zoom * 1.3, maxZoom));
  const handleZoomOut = () => setZoom(Math.max(zoom / 1.3, minZoom));
  const handleRotateLeft = () => setRotation(rotation - 90);
  const handleRotateRight = () => setRotation(rotation + 90);
  const handleFitToScreen = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  };
  const handleResetAdjustments = () => {
    setBrightness(100);
    setContrast(100);
    setInvert(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const newZoom = e.deltaY < 0 ? zoom * 1.1 : zoom / 1.1;
    setZoom(Math.max(minZoom, Math.min(maxZoom, newZoom)));
  };

  const toggleFullscreen = () => {
    if (!isFullscreen && containerRef.current) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const navigateGallery = (direction: 'prev' | 'next') => {
    if (!gallery) return;
    const newIndex = direction === 'prev'
      ? (currentIndex - 1 + gallery.length) % gallery.length
      : (currentIndex + 1) % gallery.length;
    setCurrentIndex(newIndex);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentImage;
    link.download = alt || 'image';
    link.click();
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh;">
            <img src="${currentImage}" style="max-width:100%; max-height:100vh;" />
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.onload = () => printWindow.print();
    }
  };

  return (
    <Paper
      ref={containerRef}
      elevation={0}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        bgcolor: '#1a1a2e',
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        ...sx,
      }}
    >
      {/* Toolbar */}
      {showControls && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {title && (
              <Typography variant="subtitle2" color="white" fontWeight={600}>
                {title}
              </Typography>
            )}
            {gallery && (
              <Chip
                label={`${currentIndex + 1} / ${gallery.length}`}
                size="small"
                sx={{ bgcolor: alpha('#fff', 0.2), color: 'white' }}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Zoom In">
              <IconButton onClick={handleZoomIn} size="small" sx={{ color: 'white' }}>
                <ZoomIn />
              </IconButton>
            </Tooltip>
            <Tooltip title="Zoom Out">
              <IconButton onClick={handleZoomOut} size="small" sx={{ color: 'white' }}>
                <ZoomOut />
              </IconButton>
            </Tooltip>
            <Tooltip title="Rotate Left">
              <IconButton onClick={handleRotateLeft} size="small" sx={{ color: 'white' }}>
                <RotateLeft />
              </IconButton>
            </Tooltip>
            <Tooltip title="Rotate Right">
              <IconButton onClick={handleRotateRight} size="small" sx={{ color: 'white' }}>
                <RotateRight />
              </IconButton>
            </Tooltip>
            <Tooltip title="Fit to Screen">
              <IconButton onClick={handleFitToScreen} size="small" sx={{ color: 'white' }}>
                <FitScreen />
              </IconButton>
            </Tooltip>
            <Tooltip title={showAnnotationsState ? 'Hide Annotations' : 'Show Annotations'}>
              <IconButton onClick={() => setShowAnnotationsState(!showAnnotationsState)} size="small" sx={{ color: 'white' }}>
                {showAnnotationsState ? <Visibility /> : <VisibilityOff />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Image Adjustments">
              <IconButton onClick={() => setShowAdjustments(!showAdjustments)} size="small" sx={{ color: 'white' }}>
                <Tune />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download">
              <IconButton onClick={handleDownload} size="small" sx={{ color: 'white' }}>
                <Download />
              </IconButton>
            </Tooltip>
            <Tooltip title="Print">
              <IconButton onClick={handlePrint} size="small" sx={{ color: 'white' }}>
                <Print />
              </IconButton>
            </Tooltip>
            <Tooltip title="Fullscreen">
              <IconButton onClick={toggleFullscreen} size="small" sx={{ color: 'white' }}>
                {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
              </IconButton>
            </Tooltip>
            {onClose && (
              <Tooltip title="Close">
                <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}>
                  <Close />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      )}

      {/* Adjustments Panel */}
      <AnimatePresence>
        {showAdjustments && (
          <motion.div
            initial={{ opacity: 0, x: 200 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 200 }}
          >
            <Box
              sx={{
                position: 'absolute',
                right: 16,
                top: 60,
                bgcolor: alpha('#000', 0.8),
                borderRadius: 2,
                p: 2,
                zIndex: 10,
                minWidth: 200,
              }}
            >
              <Typography variant="caption" color="white" fontWeight={600} gutterBottom>
                Brightness: {brightness}%
              </Typography>
              <Slider
                value={brightness}
                onChange={(_, v) => setBrightness(v as number)}
                min={0}
                max={200}
                size="small"
                sx={{ color: 'white' }}
              />
              <Typography variant="caption" color="white" fontWeight={600} gutterBottom>
                Contrast: {contrast}%
              </Typography>
              <Slider
                value={contrast}
                onChange={(_, v) => setContrast(v as number)}
                min={0}
                max={200}
                size="small"
                sx={{ color: 'white' }}
              />
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Button
                  size="small"
                  variant={invert ? 'contained' : 'outlined'}
                  onClick={() => setInvert(!invert)}
                  startIcon={<InvertColors />}
                  sx={{ color: 'white', borderColor: 'white', fontSize: '0.7rem' }}
                >
                  Invert
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleResetAdjustments}
                  sx={{ color: 'white', borderColor: 'white', fontSize: '0.7rem' }}
                >
                  Reset
                </Button>
              </Box>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image */}
      <Box
        sx={{
          width: '100%',
          height: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          position: 'relative',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {imageLoading && (
          <Box sx={{ position: 'absolute', zIndex: 5 }}>
            <CircularProgress sx={{ color: 'white' }} />
          </Box>
        )}
        <img
          src={currentImage}
          alt={alt}
          onLoad={() => setImageLoading(false)}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
            filter: `brightness(${brightness}%) contrast(${contrast}%) ${invert ? 'invert(1)' : ''}`,
            transition: isDragging ? 'none' : 'transform 0.2s ease',
            opacity: imageLoading ? 0 : 1,
          }}
          draggable={false}
        />

        {/* Annotations */}
        {showAnnotationsState && annotations.map((ann) => (
          <Box
            key={ann.id}
            onClick={(e) => {
              e.stopPropagation();
              onAnnotationClick?.(ann.id);
            }}
            sx={{
              position: 'absolute',
              left: `${ann.x}%`,
              top: `${ann.y}%`,
              width: `${ann.width}%`,
              height: `${ann.height}%`,
              border: `2px solid ${ann.color || '#ff4444'}`,
              borderRadius: 1,
              cursor: 'pointer',
              transform: `scale(${1 / zoom})`,
              transition: 'all 0.2s',
              '&:hover': {
                borderWidth: 3,
                bgcolor: alpha(ann.color || '#ff4444', 0.15),
              },
            }}
          >
            <Chip
              label={`${ann.label}${ann.confidence ? ` (${(ann.confidence * 100).toFixed(0)}%)` : ''}`}
              size="small"
              sx={{
                position: 'absolute',
                top: -28,
                left: 0,
                bgcolor: ann.color || '#ff4444',
                color: 'white',
                fontSize: '0.65rem',
                height: 22,
              }}
            />
          </Box>
        ))}
      </Box>

      {/* Gallery Navigation */}
      {gallery && gallery.length > 1 && (
        <>
          <IconButton
            onClick={() => navigateGallery('prev')}
            sx={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: alpha('#000', 0.5),
              color: 'white',
              '&:hover': { bgcolor: alpha('#000', 0.7) },
            }}
          >
            <NavigateBefore />
          </IconButton>
          <IconButton
            onClick={() => navigateGallery('next')}
            sx={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: alpha('#000', 0.5),
              color: 'white',
              '&:hover': { bgcolor: alpha('#000', 0.7) },
            }}
          >
            <NavigateNext />
          </IconButton>
        </>
      )}

      {/* Zoom Info */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          display: 'flex',
          gap: 0.5,
        }}
      >
        <Chip
          label={`${Math.round(zoom * 100)}%`}
          size="small"
          sx={{ bgcolor: alpha('#000', 0.6), color: 'white', fontSize: '0.7rem' }}
        />
        {rotation !== 0 && (
          <Chip
            label={`${rotation}°`}
            size="small"
            sx={{ bgcolor: alpha('#000', 0.6), color: 'white', fontSize: '0.7rem' }}
          />
        )}
      </Box>

      {/* Thumbnail Strip */}
      {gallery && gallery.length > 1 && (
        <Box
          sx={{
            display: 'flex',
            gap: 0.5,
            p: 1,
            overflowX: 'auto',
            bgcolor: alpha('#000', 0.8),
          }}
        >
          {gallery.map((img, index) => (
            <Box
              key={index}
              onClick={() => setCurrentIndex(index)}
              sx={{
                width: 56,
                height: 56,
                flexShrink: 0,
                borderRadius: 1,
                overflow: 'hidden',
                cursor: 'pointer',
                border: index === currentIndex
                  ? `2px solid ${theme.palette.primary.main}`
                  : '2px solid transparent',
                opacity: index === currentIndex ? 1 : 0.6,
                transition: 'all 0.2s',
                '&:hover': { opacity: 1 },
              }}
            >
              <img
                src={img.thumbnail || img.src}
                alt={img.alt || `Thumbnail ${index + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
};

// ============================================================================
// VIDEO PLAYER
// ============================================================================
interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  onEnded?: () => void;
  sx?: any;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src, poster, title, autoPlay = false, muted: initialMuted = false,
  loop = false, controls = true, onEnded, sx,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(initialMuted);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const theme = useTheme();
  const controlsTimeout = useRef<NodeJS.Timeout>();

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (_: any, value: number | number[]) => {
    if (!videoRef.current) return;
    const time = value as number;
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (_: any, value: number | number[]) => {
    if (!videoRef.current) return;
    const vol = value as number;
    videoRef.current.volume = vol;
    setVolume(vol);
    setIsMuted(vol === 0);
  };

  const handlePlaybackRate = () => {
    const rates = [0.5, 1, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const newRate = rates[(currentIndex + 1) % rates.length];
    if (videoRef.current) videoRef.current.playbackRate = newRate;
    setPlaybackRate(newRate);
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
    }
  };

  const formatTime = (time: number): string => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 3,
        bgcolor: '#000',
        border: `1px solid ${theme.palette.divider}`,
        ...sx,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        muted={initialMuted}
        loop={loop}
        style={{ width: '100%', display: 'block', cursor: 'pointer' }}
        onClick={togglePlay}
        onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}
        onLoadedMetadata={() => videoRef.current && setDuration(videoRef.current.duration)}
        onEnded={() => { setIsPlaying(false); onEnded?.(); }}
      />

      {/* Custom Controls */}
      {controls && (
        <Fade in={showControls}>
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
              p: 1.5,
              pt: 4,
            }}
          >
            {title && (
              <Typography variant="subtitle2" color="white" sx={{ mb: 1, fontWeight: 600 }}>
                {title}
              </Typography>
            )}

            {/* Progress */}
            <Slider
              value={currentTime}
              min={0}
              max={duration || 100}
              onChange={handleSeek}
              size="small"
              sx={{
                color: theme.palette.primary.main,
                padding: '4px 0',
                '& .MuiSlider-thumb': { width: 12, height: 12 },
                '& .MuiSlider-rail': { opacity: 0.3 },
              }}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconButton size="small" onClick={() => skip(-10)} sx={{ color: 'white' }}>
                  <Replay10 fontSize="small" />
                </IconButton>
                <IconButton onClick={togglePlay} sx={{ color: 'white' }}>
                  {isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>
                <IconButton size="small" onClick={() => skip(10)} sx={{ color: 'white' }}>
                  <Forward10 fontSize="small" />
                </IconButton>
                <Typography variant="caption" color="white" sx={{ ml: 1 }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Tooltip title={`${playbackRate}x`}>
                  <IconButton size="small" onClick={handlePlaybackRate} sx={{ color: 'white' }}>
                    <Speed fontSize="small" />
                  </IconButton>
                </Tooltip>
                <IconButton size="small" onClick={toggleMute} sx={{ color: 'white' }}>
                  {isMuted ? <VolumeOff fontSize="small" /> : <VolumeUp fontSize="small" />}
                </IconButton>
                <Slider
                  value={isMuted ? 0 : volume}
                  min={0}
                  max={1}
                  step={0.1}
                  onChange={handleVolumeChange}
                  size="small"
                  sx={{ width: 60, color: 'white', mx: 0.5 }}
                />
              </Box>
            </Box>
          </Box>
        </Fade>
      )}

      {/* Play Button Overlay */}
      {!isPlaying && (
        <Box
          onClick={togglePlay}
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            cursor: 'pointer',
          }}
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: alpha(theme.palette.primary.main, 0.9),
              }}
            >
              <PlayArrow sx={{ fontSize: 36 }} />
            </Avatar>
          </motion.div>
        </Box>
      )}
    </Paper>
  );
};

// ============================================================================
// AUDIO PLAYER
// ============================================================================
interface AudioPlayerProps {
  src: string;
  title?: string;
  artist?: string;
  coverArt?: string;
  autoPlay?: boolean;
  compact?: boolean;
  sx?: any;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src, title = 'Audio', artist, coverArt, autoPlay = false,
  compact = false, sx,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const theme = useTheme();

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time: number): string => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: compact ? 1 : 2,
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        ...sx,
      }}
    >
      <audio
        ref={audioRef}
        src={src}
        autoPlay={autoPlay}
        onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
        onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
        onEnded={() => setIsPlaying(false)}
      />

      {coverArt && !compact && (
        <Avatar
          src={coverArt}
          variant="rounded"
          sx={{ width: 56, height: 56 }}
        />
      )}

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={togglePlay} size={compact ? 'small' : 'medium'} color="primary">
            {isPlaying ? <Pause /> : <PlayArrow />}
          </IconButton>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {!compact && (
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.5 }}>
                <Typography variant="body2" fontWeight={600} noWrap>{title}</Typography>
                {artist && (
                  <Typography variant="caption" color="text.secondary" noWrap>{artist}</Typography>
                )}
              </Box>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 36 }}>
                {formatTime(currentTime)}
              </Typography>
              <Slider
                value={currentTime}
                min={0}
                max={duration || 100}
                onChange={(_, v) => {
                  if (audioRef.current) audioRef.current.currentTime = v as number;
                }}
                size="small"
                sx={{ flex: 1 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 36 }}>
                {formatTime(duration)}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

// ============================================================================
// DOCUMENT PREVIEW
// ============================================================================
interface DocumentPreviewProps {
  type: 'pdf' | 'image' | 'video' | 'audio' | 'document';
  src: string;
  title?: string;
  size?: string;
  uploadDate?: string;
  onView?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  sx?: any;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  type, src, title = 'Document', size, uploadDate,
  onView, onDownload, onDelete, sx,
}) => {
  const theme = useTheme();

  const typeIcons: Record<string, { icon: React.ReactNode; color: string }> = {
    pdf: { icon: <PictureAsPdf />, color: '#f44336' },
    image: { icon: <ImageIcon />, color: '#4caf50' },
    video: { icon: <VideoLibrary />, color: '#9c27b0' },
    audio: { icon: <AudioFile />, color: '#2196f3' },
    document: { icon: <PictureAsPdf />, color: '#ff9800' },
  };

  const config = typeIcons[type] || typeIcons.document;

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        transition: 'all 0.2s',
        cursor: onView ? 'pointer' : 'default',
        '&:hover': onView ? {
          borderColor: theme.palette.primary.main,
          boxShadow: `0 0 0 1px ${theme.palette.primary.main}`,
        } : {},
        ...sx,
      }}
      onClick={onView}
    >
      <Avatar
        variant="rounded"
        sx={{
          width: 44,
          height: 44,
          bgcolor: alpha(config.color, 0.1),
          color: config.color,
        }}
      >
        {config.icon}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} noWrap>{title}</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {size && <Typography variant="caption" color="text.secondary">{size}</Typography>}
          {uploadDate && <Typography variant="caption" color="text.secondary">{uploadDate}</Typography>}
          <Chip label={type.toUpperCase()} size="small" sx={{ height: 18, fontSize: '0.6rem' }} />
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
        {onView && (
          <Tooltip title="View">
            <IconButton size="small" onClick={onView}>
              <OpenInNew fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {onDownload && (
          <Tooltip title="Download">
            <IconButton size="small" onClick={onDownload}>
              <Download fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {onDelete && (
          <Tooltip title="Delete">
            <IconButton size="small" onClick={onDelete} color="error">
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Paper>
  );
};

// ============================================================================
// IMAGE COMPARISON SLIDER
// ============================================================================
interface ImageComparisonProps {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
  initialPosition?: number;
  sx?: any;
}

export const ImageComparison: React.FC<ImageComparisonProps> = ({
  beforeSrc, afterSrc, beforeLabel = 'Before', afterLabel = 'After',
  initialPosition = 50, sx,
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, pos)));
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleMove(e.clientX);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => isDragging && handleMove(e.clientX);
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMove]);

  return (
    <Paper
      ref={containerRef}
      elevation={0}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        cursor: 'col-resize',
        userSelect: 'none',
        height: 400,
        ...sx,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* After Image (full) */}
      <Box sx={{ position: 'absolute', inset: 0 }}>
        <img src={afterSrc} alt={afterLabel} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </Box>

      {/* Before Image (clipped) */}
      <Box sx={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <img src={beforeSrc} alt={beforeLabel} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </Box>

      {/* Divider Line */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${position}%`,
          width: 3,
          bgcolor: 'white',
          transform: 'translateX(-50%)',
          boxShadow: '0 0 8px rgba(0,0,0,0.4)',
          zIndex: 2,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 36,
            height: 36,
            borderRadius: '50%',
            bgcolor: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 2,
          }}
        >
          <Compare sx={{ fontSize: 18, color: theme.palette.primary.main }} />
        </Box>
      </Box>

      {/* Labels */}
      <Chip
        label={beforeLabel}
        size="small"
        sx={{
          position: 'absolute',
          top: 12,
          left: 12,
          bgcolor: alpha('#000', 0.6),
          color: 'white',
          zIndex: 1,
        }}
      />
      <Chip
        label={afterLabel}
        size="small"
        sx={{
          position: 'absolute',
          top: 12,
          right: 12,
          bgcolor: alpha('#000', 0.6),
          color: 'white',
          zIndex: 1,
        }}
      />
    </Paper>
  );
};

// ============================================================================
// EXPORT ALL
// ============================================================================
export default {
  ImageViewer,
  VideoPlayer,
  AudioPlayer,
  DocumentPreview,
  ImageComparison,
};
