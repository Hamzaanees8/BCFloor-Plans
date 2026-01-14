import Header from "@/components/Header";
import React from "react";

const AboutPage: React.FC = () => {
    return (
        <div className="relative w-full h-screen font-alexandria">
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage: "url('/about.png')"
                }}
            />

            <div className="absolute inset-0 bg-black bg-opacity-30"></div>

            <Header />

            <div className="relative z-10 flex items-center justify-center h-full w-full">
                <div className="bg-[#00000080] flex items-center justify-center h-[180px] w-full">
                    <h1 className="text-white text-[62px] text-center">
                        We are a team of real estate media creators
                    </h1>
                </div>

            </div>
        </div>
    );
};

export default AboutPage;
