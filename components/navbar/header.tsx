import Link from 'next/link';
import getUserSession from '@/lib/getUserSession';
import React from "react";
import {ModeToggle} from "@/components/mode-toggle";
import ProfileDropdown from "@/components/navbar/ProfileDropdown";

const Header = async () => {
    const {data} = await getUserSession();

    return (
        <header className='bg-[#212121] dark:bg-gray-800 shadow-md'>
            <nav className='container mx-auto flex justify-between items-center h-20 px-4'>
                <div>
                    <Link href=''
                          className='text-[#77797C] dark:text-[#77797C] text-2xl font-semibold flex items-center'>
                        <img src="./mas_logo.png" alt="mas logo" className="w-8 h-8 mr-3"/>
                        Artwork Generator
                    </Link>
                </div>
                <div className='flex items-center space-x-4'>
                    <ul className='flex items-center space-x-4'>
                        <li>
                            <Link href='/public'
                                  className='text-white dark:text-white hover:text-gray-500 dark:hover:text-gray-500'>
                                Home
                            </Link>
                        </li>
                        {!data.session && (
                            <>
                                <li>
                                    <Link href='/register'
                                          className='text-white dark:text-white hover:text-gray-500 dark:hover:text-gray-500'>
                                        Register
                                    </Link>
                                </li>
                                <li>
                                    <Link href='/login'
                                          className='text-white dark:text-white hover:text-gray-500 dark:hover:text-gray-500'>
                                        Login
                                    </Link>
                                </li>
                            </>
                        )}
                        {data.session && (
                            <li>
                                <Link href='/create'
                                      className='text-white dark:text-white hover:text-gray-500 dark:hover:text-gray-500'>
                                    Create
                                </Link>
                            </li>
                        )}
                    </ul>
                </div>
                <div className='flex items-center space-x-4'>
                    <ModeToggle/>
                    {data.session && (
                        <ProfileDropdown session={data.session}/>
                    )}
                </div>
            </nav>
        </header>
    );
};

export default Header;
