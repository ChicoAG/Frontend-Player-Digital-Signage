import React, { useEffect, useState, useRef } from 'react';
import './DesignViewer.css';

const ShapeRenderer = ({ shape }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Effect for rotating media
    useEffect(() => {
        if (shape.medias && shape.medias.length > 1) {
            const currentMedia = shape.medias[currentIndex];
            // Gunakan durasi dari media jika ada, jika tidak default 1 detik (1000ms)
            const duration = (currentMedia && currentMedia.duration && currentMedia.duration > 0) 
                ? currentMedia.duration * 1000 
                : 1000;

            const timer = setTimeout(() => {
                setCurrentIndex((prevIndex) => (prevIndex + 1) % shape.medias.length);
            }, duration);
            
            return () => clearTimeout(timer);
        }
    }, [currentIndex, shape.medias]);

    const style = {
        position: 'absolute',
        left: `${shape.x}px`,
        top: `${shape.y}px`,
        width: `${shape.width}px`,
        height: `${shape.height}px`,
        backgroundColor: shape.shapeType === 'color' ? (shape.color || 'transparent') : 'transparent',
        zIndex: shape.zIndex || 1,
        overflow: 'hidden'
    };

    let item = null;
    if (shape.medias && shape.medias.length > 0) {
        item = shape.medias[currentIndex];
    } else if (shape.type) {
        item = {
            type: shape.type === 'marquee' ? 'text' : shape.type,
            content: shape.text,
            url: shape.url,
            font: shape.fontFamily || shape.fontSize ? 'Arial' : 'Arial',
            size: shape.fontSize || 24,
            color: shape.color || '#000000',
            isMoving: shape.type === 'marquee',
            speed: shape.speed || 5
        };
    }

    if (!item) return <div style={style}></div>;

    return (
        <div style={style}>
            {(() => {
                if (item.type === 'text') {
                    const textStyle = {
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: item.font,
                        fontSize: `${item.size}px`,
                        color: item.color,
                        pointerEvents: 'none',
                        overflow: 'hidden',
                        padding: '8px',
                        boxSizing: 'border-box',
                        lineHeight: '1.5',
                        textAlign: 'center',
                        wordBreak: 'break-word',
                    };

                    if (item.isMoving) {
                        const marqueeStyle = { ...textStyle };
                        delete marqueeStyle.display;
                        delete marqueeStyle.alignItems;
                        delete marqueeStyle.justifyContent;
                        
                        return (
                            <marquee style={marqueeStyle} scrollamount={Math.ceil((item.speed || 50) / 10)}>
                                {item.content}
                            </marquee>
                        );
                    } else {
                        return (
                            <div style={textStyle}>
                                {item.content}
                            </div>
                        );
                    }
                } else {
                    // image or video
                    const isVideo = item.url?.toLowerCase().match(/\.(mp4|webm|ogg)$/);
                    if (isVideo) {
                        return (
                            <video
                                src={item.url}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
                                autoPlay muted loop
                            />
                        );
                    } else {
                        return (
                            <img
                                src={item.url}
                                alt="media"
                                style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
                            />
                        );
                    }
                }
            })()}
        </div>
    );
};

const DesignViewer = ({ designData }) => {
    const { canvas_data = {}, width = 1920, height = 1080 } = designData || {};
    
    // Parse canvas_data if it's a string
    let shapes = [];
    let canvasBg = '#FFFFFF';
    
    try {
        let parsedCanvas = canvas_data;
        if (typeof parsedCanvas === 'string') {
            parsedCanvas = JSON.parse(parsedCanvas);
        }
        // Jika masih berupa string (karena double stringify), parse lagi
        if (typeof parsedCanvas === 'string') {
            parsedCanvas = JSON.parse(parsedCanvas);
        }
        
        shapes = parsedCanvas.shapes || [];
        canvasBg = parsedCanvas.canvasBg || '#FFFFFF';
    } catch (e) {
        console.error("Failed to parse canvas_data", e);
    }

    const [scale, setScale] = useState(1);
    const containerRef = useRef(null);

    // Calculate scale to fit the screen
    useEffect(() => {
        const updateScale = () => {
            if (containerRef.current) {
                const containerWidth = window.innerWidth;
                const containerHeight = window.innerHeight;
                const scaleX = containerWidth / width;
                const scaleY = containerHeight / height; 
                const minScale = Math.min(scaleX, scaleY);
                setScale(minScale);
            }
        };

        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, [width, height]);

    const getBackgroundStyle = () => {
        if (!canvasBg) return { backgroundColor: '#FFFFFF' };
        if (typeof canvasBg === 'string') {
            if (canvasBg.startsWith('linear-gradient') || canvasBg.startsWith('radial-gradient')) {
                return { background: canvasBg };
            }
            return { backgroundColor: canvasBg };
        }

        if (canvasBg.type === 'solid') {
            return { backgroundColor: canvasBg.solidColor || '#FFFFFF' };
        }
        if (canvasBg.type === 'gradient') {
            return { background: `linear-gradient(${canvasBg.gradientDirection || 'to bottom'}, ${canvasBg.gradientColor1}, ${canvasBg.gradientColor2})` };
        }
        if (canvasBg.type === 'image' && canvasBg.imageUrl) {
            return { background: `url(${canvasBg.imageUrl}) center/cover no-repeat` };
        }
        return { backgroundColor: '#FFFFFF' };
    };

    return (
        <div className="design-viewer-container" ref={containerRef}>
            <div
                className="design-canvas"
                style={{
                    width: `${width}px`,
                    height: `${height}px`,
                    transform: `translate(-50%, -50%) scale(${scale})`,
                    transformOrigin: 'center center',
                    ...getBackgroundStyle()
                }}
            >
                {shapes.map((shape) => (
                    <ShapeRenderer key={shape.id || Math.random()} shape={shape} />
                ))}
            </div>
        </div>
    );
};

export default DesignViewer;
