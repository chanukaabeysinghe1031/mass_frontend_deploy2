import React, {useEffect, useState} from 'react';

interface Dimensions {
    width: number;
    height: number;
    linkDimensions: boolean;
}

interface ImageInformationProps {
    imageUrl: string;
    dimensions: Dimensions;
}

const ImageInformation: React.FC<ImageInformationProps> = ({imageUrl, dimensions}) => {
    const [imageInfo, setImageInfo] = useState({width: 0, height: 0, size: 0});

    useEffect(() => {
        if (imageUrl) {
            fetch(imageUrl)
                .then((response) => response.blob())
                .then((blob) => {
                    const img = new Image();
                    img.onload = () => {
                        setImageInfo({
                            width: img.width,
                            height: img.height,
                            size: blob.size,
                        });
                    };
                    img.src = URL.createObjectURL(blob);
                })
                .catch((error) => console.error('Error fetching image info:', error));
        }
    }, [imageUrl]);

    return (
        <div className="mt-4">
            {/*<p className="text-gray-700">Image Information Component</p>*/}
            {imageUrl && (
                <div>
                    {/*<img src={imageUrl} alt="Uploaded" className="w-full rounded mb-2" />*/}
                    <p>Width: {imageInfo.width}px</p>
                    <p>Height: {imageInfo.height}px</p>
                    <p>Size: {(imageInfo.size / 1024).toFixed(2)} KB</p>
                </div>
            )}
        </div>
    );
};

export default ImageInformation;
