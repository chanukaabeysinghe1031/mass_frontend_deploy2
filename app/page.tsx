import Header from '@/components/navbar/header';
import Link from "next/link";
import React from "react";

export default function Home() {
    return (
        <div className="bg-[#2F2F2F] min-h-screen">
            <Header/>
            <section className='bg-[#2F2F2F] min-h-screen mb-12'>
                <div
                    className='mx-auto bg-white rounded-md h-[30rem] flex justify-center items-center shadow-lg'>
                    <div className='text-center px-4'>
                        <div className='flex justify-center mb-4'>
                            <img src="./twinery-logo-default.png" alt="mas logo" className="w-1/5 "/>
                        </div>
                        <h1 className='text-5xl font-bold mb-4 mt-5 text-[#2F2F2F] '>
                            Welcome to Artwork Generator by MAS
                        </h1>
                        <Link href='/create'>
                            <button
                                className='mt-10 bg-[#FF0001] hover:bg-red-700 text-white font-bold py-2 px-4 rounded'>
                                Create Design
                            </button>
                        </Link>

                    </div>
                </div>
            </section>
        </div>
    );
}
