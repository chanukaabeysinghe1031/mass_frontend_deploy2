'use client';

import {useEffect, useRef, useState} from 'react';
import NavBar from '@/components/navbar/NavBar';
import Toolbar from '@/components/toolbar/Toolbar';
import InputSection from '@/components/input_section/InputSection';
import DrawingCanvas from '@/components/toolbar/DrawingContext';
import {generateImage, saveUrlToSupabase, uploadImageToCloudinary} from '@/components/apis/Apis';
import useSupabaseClient from "@/lib/supabase/client";
import {usePathname} from 'next/navigation';
import Modal from "@/app/create/[id]/Modal";


const BASE_URL = process.env.NEXT_PUBLIC_MAIN_BACKEND_URL;

export default function Create({user}: { user: any }) {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState<string>('');
    const [selectedModel, setSelectedModel] = useState<string>('sd-getai');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
    const [files, setFiles] = useState<any[]>([]);
    const [selectedImage, setSelectedImage] = useState<any>(null);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [mode, setMode] = useState<string>('Text to Image'); // Text and Image to Image // Edit (Inpaint/Outpaint)
    const [selectedTab, setSelectedTab] = useState<string>('Design');
    const [brushSize, setBrushSize] = useState<number>(30);
    const [tool, setTool] = useState<string>('brush');
    const [isLoading, setIsLoading] = useState<boolean>(false); // Loading state

    const [dimensions, setDimensions] = useState({width: 1024, height: 1024, linkDimensions: true});
    const [imageDimensions, setImageDimensions] = useState({width: 1024, height: 1024});

    const [aspectRatio, setAspectRatio] = useState<string>("1:1");
    const [style, setStyle] = useState<string>('');

    const canvasRef = useRef<any>(null);

    const supabase = useSupabaseClient();
    const pathname = usePathname();
    const session_id = pathname.split('/').pop() || '';

    useEffect(() => {
        const fetchFiles = async () => {
            const {data, error} = await supabase.from('images').select('*').eq("ref", true);
            if (error) {
                console.error('Error fetching files from Supabase', error);
            } else {
                setFiles(data || []);
            }
        };
        fetchFiles();
    }, [supabase]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (imageFile) {
            const url = await uploadImageToCloudinary(imageFile);
            if (url) {
                setUploadedImageUrl(url);
                const data = await saveUrlToSupabase(supabase, 'images', url, user.id, true, 'ref');
                if (Array.isArray(data)) { // Ensure data is an array before spreading
                    setFiles([...files, ...data]);
                }
            }
        }
    };

    const handleGenerateImage = async () => {
        setIsLoading(true); // Start loading state
        console.log("Generating image with input:", inputValue);
        console.log("Mode", mode);

        try {
            if (mode === 'Edit (Inpaint/Outpaint)') {
                console.log("Generating image with Inpaint and Outpaint");
                console.log("Canvas ref", canvasRef.current);
                const maskDataUrl = canvasRef.current ? canvasRef.current.getCanvasDataUrl() : '';
                console.log("maskDataUrl", maskDataUrl);
                const maskUrl = await uploadImageToCloudinary(maskDataUrl);
                console.log("maskUrl", maskUrl);
                if (maskUrl) {
                    await saveUrlToSupabase(supabase, 'images', maskUrl, user.id, false, 'mask');

                    const data = await generateImage(`${BASE_URL}/inpaintAndOutpaint`, {
                        file1: imageUrl,
                        file2: maskUrl,
                        prompt: inputValue,
                        sharpness: '5',
                        cn_type1: 'ImagePrompt',
                        base_model_name: 'model_name',
                        style_selections: 'style',
                        performance_selection: 'performance',
                        image_number: '1',
                        negative_prompt: '',
                        image_strength: '0.8',
                        cfg_scale: '7',
                        samples: '1',
                        steps: '50',
                        init_image_mode: 'IMAGE_STRENGTH',
                        clip_guidance_preset: 'FAST_BLUE',
                        mask_source: 'MASK_IMAGE',
                        model_id: selectedModel,
                        user_id: user.id
                    });
                    console.log("Generating image with Inpaint and Outpaint successful");

                    if (data && data[0]) {
                        const generatedImageUrl = data[0].url;
                        setImageUrl(generatedImageUrl);

                        console.log("Generated image URL:", generatedImageUrl);
                        if (generatedImageUrl) {
                            const {data, error} = await supabase
                                .from('messages')
                                .insert([{
                                    session_id: session_id, text: inputValue, type: mode, gen_img_id: generatedImageUrl,
                                    input_img_id: imageUrl, ref_img_id: maskUrl, model_id: selectedModel
                                }])
                                .select();

                            if (error) {
                                console.error(`Error saving the message to Supabase`, error);
                                return null;
                            } else {
                                console.log(`Message saved to Supabase`, data);
                                return data;
                            }
                        }
                    }
                }
            } else if (mode === 'Text and Image to Image' && selectedImage) {
                console.log("Generating image with Text and Image");
                const data = await generateImage(`${BASE_URL}/textAndImageToImage`, {
                    model_id: selectedModel,
                    user_id: user.id,
                    image_url: selectedImage.url,
                    prompt: inputValue,
                    sharpness: '5',
                    cn_type1: 'ImagePrompt',
                    base_model_name: 'model_name',
                    style_selections: 'style',
                    performance_selection: 'performance',
                    image_number: '1',
                    negative_prompt: '',
                    image_strength: '0.8',
                    cfg_scale: '7',
                    samples: '1',
                    steps: '50',
                    init_image_mode: 'IMAGE_STRENGTH'
                });

                console.log("data", data);
                if (data && data[0]) {
                    const generatedImageUrl = data[0].url;
                    setImageUrl(generatedImageUrl);

                    console.log("Generated image URL:", generatedImageUrl);
                    if (generatedImageUrl) {
                        const {data, error} = await supabase
                            .from('messages')
                            .insert([{
                                session_id: session_id, text: inputValue, type: mode, gen_img_id: generatedImageUrl,
                                // input_img_id: imageUrl,
                                ref_img_id: selectedImage.url, model_id: selectedModel
                            }])
                            .select();

                        if (error) {
                            console.error(`Error saving the message to Supabase`, error);
                            return null;
                        } else {
                            console.log(`Message saved to Supabase`, data);
                            return data;
                        }
                    }
                }
            } else {
                console.log("Generating image with Text", inputValue, selectedModel, user.id);
                const data = await generateImage(`${BASE_URL}/textToImage`, {
                    model_id: selectedModel,
                    input: {prompt: inputValue},
                    user_id: user.id,
                    aspect_ratio: aspectRatio,
                    style: style
                });

                console.log("data", data);
                if (data && data[0]) {
                    const generatedImageUrl = data[0].url;
                    setImageUrl(generatedImageUrl);

                    console.log("Generated image URL:", generatedImageUrl);
                    if (generatedImageUrl) {
                        const {data, error} = await supabase
                            .from('messages')
                            .insert([{
                                session_id: session_id, text: inputValue, type: mode, gen_img_id: generatedImageUrl,
                                model_id: selectedModel
                            }])
                            .select();

                        if (error) {
                            console.error(`Error saving the message to Supabase`, error);
                            return null;
                        } else {
                            console.log(`Message saved to Supabase`, data);
                            return data;
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error generating image:', error);
        } finally {
            setIsLoading(false); // End loading state
        }
    };

    const handleDeleteImage = async (fileId: string) => {
        try {
            const {error} = await supabase.from('images').delete().eq('id', fileId);
            if (error) {
                console.error('Error deleting file from Supabase', error);
            } else {
                setFiles(files.filter(file => file.id !== fileId));
            }
        } catch (error) {
            console.error('Error deleting file:', error);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <NavBar selectedTab={selectedTab} onSelectTab={setSelectedTab}/>
            <div className="flex flex-1 mt-12">
                <Toolbar
                    mode={mode}
                    selectedTab={selectedTab}
                    imageUrl={imageUrl}
                    onFileChange={handleFileChange}
                    onUpload={handleUpload}
                    uploadedImageUrl={uploadedImageUrl}
                    onShowModal={() => setShowModal(true)}
                    selectedImage={selectedImage}
                    brushSize={brushSize}
                    setBrushSize={setBrushSize}
                    tool={tool}
                    setTool={setTool}
                    sessionID={session_id}
                    dimensions={dimensions}
                    setDimensions={setDimensions}
                    user={user}
                    selectedModel={selectedModel}
                    setImageUrl={setImageUrl}
                    aspectRatio={aspectRatio}
                    setAspectRatio={setAspectRatio}
                    stylePreset={style}
                    setStylePreset={setStyle}
                />
                <div className="flex-1 flex flex-col">
                    <div className="flex-1 flex justify-center items-center bg-gray-100 p-4">
                        <DrawingCanvas
                            imageUrl={imageUrl}
                            setImageUrl={setImageUrl}
                            brushSize={brushSize}
                            tool={tool}
                            user={user}
                            mode={mode}
                            selectedTab={selectedTab}
                            ref={canvasRef}
                        />
                    </div>
                    <InputSection
                        mode={mode}
                        selectedModel={selectedModel}
                        inputValue={inputValue}
                        onModelChange={(e) => setSelectedModel(e.target.value)}
                        onInputChange={(e) => setInputValue(e.target.value)}
                        onGenerateImage={handleGenerateImage}
                        onModeChange={(e) => setMode(e.target.value)}
                        isLoading={isLoading} // Pass loading state
                    />
                </div>
            </div>
            <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
                <div className="grid grid-cols-3 gap-2"> {/* Change grid-cols-2 to grid-cols-3 */}
                    {files.map((file) => (
                        <div key={file.id} className="relative cursor-pointer">
                            <button
                                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full focus:outline-none"
                                onClick={() => handleDeleteImage(file.id)}
                            >
                                &#x2715;
                            </button>
                            <img
                                src={file.url}
                                alt={file.id}
                                className="w-full rounded"
                                onClick={() => {
                                    setSelectedImage(file);
                                    setShowModal(false);
                                }}
                            />
                        </div>
                    ))}
                </div>
            </Modal>
        </div>
    );
}
