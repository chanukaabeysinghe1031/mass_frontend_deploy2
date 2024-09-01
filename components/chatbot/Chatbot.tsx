import {useEffect, useState} from 'react';
import useSupabaseClient from "@/lib/supabase/client";

interface ChatbotProps {
    imageUrl: string | null;
    refImageUrl: string | null;
    userId: string;
    modelId: string;
    sessionId: string;
    onImageGenerated: (url: string) => void;
}

const Chatbot: React.FC<ChatbotProps> = ({imageUrl, refImageUrl, userId, modelId, sessionId, onImageGenerated}) => {
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<string[]>([]);
    const [isSending, setIsSending] = useState(false);

    const supabase = useSupabaseClient();

    const saveMessageToDatabase = async (message: string, role: 'user' | 'bot') => {
        const {data, error} = await supabase
            .from('chats')
            .insert([
                {session_id: sessionId, user_id: userId, message: message, role},
            ]);

        if (error) {
            console.error('Error saving message to database:', error);
        } else {
            console.log('Message saved to database:', data);
        }
    };

    const prepareRequestBody = () => {
        return JSON.stringify({
            message,
            model: 'gpt-4o',
            session_id: sessionId,
            image_url: imageUrl,
            ref_image_url: refImageUrl,
            mask_img_url: refImageUrl,
            user_id: userId,
            model_id: modelId
        });
    };

    const handleSendMessage = async () => {
        if (message.trim() === '') return;

        setIsSending(true);
        await saveMessageToDatabase(message, 'user');

        const requestBody = prepareRequestBody();
        console.log('Chatbot input:', requestBody);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_NLP_BACKEND_URL}/chat_model`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: requestBody,
            });

            if (response.ok) {
                const result = await response.json();
                let newChatHistory = [...chatHistory, `You: ${message}`];

                let botMessage = '';

                if (result.message) {
                    botMessage = `${result.message}`;
                }

                if (result.imageUrl) {
                    onImageGenerated(result.imageUrl);
                    botMessage += `<br> <a href="${result.imageUrl}" target="_blank">${result.imageUrl}</a>`;
                }

                if (botMessage) {
                    newChatHistory.push(`Bot: ${botMessage}`);
                    await saveMessageToDatabase(botMessage, 'bot');
                } else {
                    newChatHistory.push(`Bot: Failed to generate a response`);
                }

                setChatHistory(newChatHistory);
            } else {
                console.error('Failed to generate a response:', response.statusText);
                setChatHistory([...chatHistory, `You: ${message}`, `Bot: Failed to generate a response`]);
            }
        } catch (error) {
            console.error('Error generating image:', error);
            setChatHistory([...chatHistory, `You: ${message}`, `Bot: Error generating image`]);
        }

        setMessage('');
        setIsSending(false);
    };

    const fetchChatHistory = async () => {
        const {data, error} = await supabase
            .from('chats')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', {ascending: true});

        if (error) {
            console.error('Error fetching chat history:', error);
        } else {
            const formattedChatHistory = data.map((chat) => `${chat.role === 'user' ? 'You' : 'Bot'}: ${chat.message}`);
            setChatHistory(formattedChatHistory);
        }
    };

    useEffect(() => {
        fetchChatHistory();
    }, [sessionId]);

    const createMarkup = (html: string) => {
        return {__html: html};
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-grow overflow-y-auto p-4 bg-gray-100 rounded mb-4"
                 style={{height: 'calc(100vh - 120px)', wordBreak: 'break-word'}}>
                {chatHistory.map((chat, index) => (
                    <div
                        key={index}
                        className={`mb-2 p-2 rounded ${chat.startsWith('You') ? 'bg-blue-100 text-right' : 'bg-green-100 text-left'}`}
                        dangerouslySetInnerHTML={createMarkup(chat)}
                    />
                ))}
            </div>
            <div className="fixed bottom-0 left-0 w-1/3 p-4 bg-white flex items-center border-t">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-grow p-2 border rounded mr-2"
                    placeholder="Type a message..."
                />
                <button
                    // onClick={handleSendMessage}
                    className="bg-blue-500 text-white py-2 px-4 rounded"
                    disabled={isSending}
                >
                    {isSending ? 'Sending...' : 'Send'}
                </button>
            </div>
        </div>
    );
};

export default Chatbot;
