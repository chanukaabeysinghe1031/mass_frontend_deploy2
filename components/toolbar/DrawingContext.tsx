import React, {forwardRef, useEffect, useImperativeHandle, useRef, useState} from 'react';
import {saveUrlToSupabase, uploadImageToCloudinary} from "@/components/apis/Apis";
import useSupabaseClient from "@/lib/supabase/client";

interface DrawingCanvasProps {
    imageUrl: string | null;
    setImageUrl: React.Dispatch<React.SetStateAction<string | null>>;
    brushSize: number;
    tool: string;
    user: any;
    mode: string;
    selectedTab: string;
}

const DrawingCanvas = forwardRef(({
                                      imageUrl,
                                      setImageUrl,
                                      brushSize,
                                      tool,
                                      user,
                                      mode,
                                      selectedTab
                                  }: DrawingCanvasProps, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const maskCtxRef = useRef<CanvasRenderingContext2D | null>(null);
    const isDrawingRef = useRef<boolean>(false);
    const [mousePosition, setMousePosition] = useState<{ x: number, y: number } | null>(null);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'done' | 'failed'>('idle');

    const supabase = useSupabaseClient();

    const initializeCanvas = () => {
        const canvas = canvasRef.current;
        const maskCanvas = maskCanvasRef.current;
        const img = imgRef.current;
        if (canvas && maskCanvas && img) {
            canvas.width = img.width;
            canvas.height = img.height;
            maskCanvas.width = img.width;
            maskCanvas.height = img.height;
            const ctx = canvas.getContext('2d');
            const maskCtx = maskCanvas.getContext('2d');
            if (ctx && maskCtx) {
                ctxRef.current = ctx;
                maskCtxRef.current = maskCtx;
                ctx.lineWidth = brushSize;
                ctx.lineCap = 'round';
                maskCtx.lineWidth = brushSize;
                maskCtx.lineCap = 'round';
                maskCtx.fillStyle = 'black';
                maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height); // Fill mask canvas with black
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                setToolAndBrush(ctx, maskCtx);
            }
        }
    };

    const setToolAndBrush = (ctx: CanvasRenderingContext2D, maskCtx: CanvasRenderingContext2D) => {
        ctx.strokeStyle = tool === 'brush' ? 'white' : 'white'; // Use white for brush, white for eraser
        maskCtx.strokeStyle = tool === 'brush' ? 'white' : 'black'; // Use white for brush, black for eraser
        ctx.globalCompositeOperation = 'source-over';
        maskCtx.globalCompositeOperation = 'source-over';
    };

    useEffect(() => {
        initializeCanvas();
    }, [imageUrl]);

    useEffect(() => {
        if (ctxRef.current && maskCtxRef.current) {
            ctxRef.current.lineWidth = brushSize;
            maskCtxRef.current.lineWidth = brushSize;
        }
    }, [brushSize]);

    useEffect(() => {
        if (ctxRef.current && maskCtxRef.current) {
            setToolAndBrush(ctxRef.current, maskCtxRef.current);
        }
    }, [tool]);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (tool === 'none') return;
        const {offsetX, offsetY} = e.nativeEvent;
        if (ctxRef.current && maskCtxRef.current) {
            ctxRef.current.beginPath();
            maskCtxRef.current.beginPath();
            ctxRef.current.moveTo(offsetX, offsetY);
            maskCtxRef.current.moveTo(offsetX, offsetY);
            isDrawingRef.current = true;
        }
    };

    const finishDrawing = () => {
        if (isDrawingRef.current && ctxRef.current && maskCtxRef.current) {
            ctxRef.current.closePath();
            maskCtxRef.current.closePath();
            isDrawingRef.current = false;
        }
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawingRef.current || !ctxRef.current || !maskCtxRef.current) return;
        const {offsetX, offsetY} = e.nativeEvent;
        if (tool === 'brush') {
            ctxRef.current.lineTo(offsetX, offsetY);
            maskCtxRef.current.lineTo(offsetX, offsetY);
            ctxRef.current.stroke();
            maskCtxRef.current.stroke();
        } else if (tool === 'eraser') {
            ctxRef.current.clearRect(offsetX - brushSize / 2, offsetY - brushSize / 2, brushSize, brushSize);
            maskCtxRef.current.lineTo(offsetX, offsetY);
            maskCtxRef.current.stroke();
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const {offsetX, offsetY} = e.nativeEvent;
        setMousePosition({x: offsetX, y: offsetY});
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadStatus('uploading');
            try {
                // Upload the image to Cloudinary
                const url = await uploadImageToCloudinary(file);
                if (url) {
                    // Update the imageUrl with the Cloudinary URL
                    setImageUrl(url);
                    setUploadStatus('done');

                    const data = await saveUrlToSupabase(supabase, 'images', url, user.id, true, 'input');
                    if (Array.isArray(data)) {
                        console.log('Saved to Supabase:', data);
                    }
                }
            } catch (error) {
                console.error('Failed to upload image:', error);
                setUploadStatus('failed');
            }
        }
    };

    useImperativeHandle(ref, () => ({
        getCanvasDataUrl: () => {
            if (maskCanvasRef.current) {
                return maskCanvasRef.current.toDataURL('image/png');
            }
            return '';
        },
        resetCanvas: () => {
            initializeCanvas();
        }
    }));

    const renderUploadStatus = () => {
        switch (uploadStatus) {
            case 'uploading':
                return '⏳ Uploading...';
            case 'done':
                return '✅ Upload Successful!';
            case 'failed':
                return '❌ Upload Failed!';
            default:
                return null;
        }
    };

    return (
        <div className="relative flex">
            <div className="relative">
                {imageUrl && <img ref={imgRef} src={imageUrl} alt="Selected"
                                  className="w-[500px]"
                                  crossOrigin="anonymous" onLoad={initializeCanvas}/>}
                <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full"
                    style={{background: 'transparent'}}
                    onMouseDown={startDrawing}
                    onMouseUp={finishDrawing}
                    onMouseMove={(e) => {
                        draw(e);
                        handleMouseMove(e);
                    }}
                />
                <canvas
                    ref={maskCanvasRef}
                    className="hidden"
                />
                {mousePosition && tool !== 'none' && (
                    <div
                        style={{
                            position: 'absolute',
                            top: mousePosition.y - brushSize / 2,
                            left: mousePosition.x - brushSize / 2,
                            width: brushSize,
                            height: brushSize,
                            borderRadius: '50%',
                            border: '1px solid black',
                            pointerEvents: 'none'
                        }}
                    />
                )}
            </div>
            {/*show this only if mode is "Edit (Inpaint/Outpaint)" and selectedTab is "Design"*/}
            {mode === 'Edit (Inpaint/Outpaint)' && selectedTab === 'Design' && (
                <div className="fixed right-0">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className=""
                    />
                    <div className="mt-2">
                        {renderUploadStatus()}
                    </div>
                </div>
            )}
        </div>
    );
});

DrawingCanvas.displayName = 'DrawingCanvas';

export default DrawingCanvas;
