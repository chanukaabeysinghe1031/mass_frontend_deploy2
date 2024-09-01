'use client';

import {useRouter} from 'next/navigation';
import getSupabaseBrowserClient from '@/lib/supabase/client';

import React from 'react';
import Link from 'next/link';
import {ModeToggle} from "@/components/mode-toggle";

interface NavBarProps {
    selectedTab: string;
    onSelectTab: (tab: string) => void;
}

const NavBar: React.FC<NavBarProps> = ({selectedTab, onSelectTab}) => {
    const router = useRouter();
    const supabase = getSupabaseBrowserClient();

    const logoutAction = async () => {
        await supabase.auth.signOut();
        router.refresh();
    };

    return (
        <div className="bg-gray-800 flex p-4 fixed w-full z-40 items-center">
            <Link href='/' className='flex items-center mr-4 text-white'>
                <img src="/mas_logo.png" alt="MAS Logo" className="w-8 h-8 ml-1"/>
            </Link>
            <Link href='/create' className='flex items-center mr-4 text-white'>
                <span className="text-xl">&lt;</span> {/* Back arrow symbol */}
                <span className="ml-1">Back</span>
            </Link>
            <span className="text-white mr-4">|</span>
            {['Design', 'Edit', 'History', 'Chatbot'].map((tab) => (
                <button
                    key={tab}
                    className={`mr-4 text-white ${selectedTab === tab ? 'font-bold' : ''}`}
                    onClick={() => onSelectTab(tab)}
                >
                    {tab}
                </button>
            ))}
            {/* Spacer to push the right-aligned items to the end */}
            <div className="ml-auto flex items-center space-x-4 mr-2">
                <ModeToggle />
                <button onClick={logoutAction} className='text-white'>Logout</button>
            </div>
        </div>
    );
};

export default NavBar;
