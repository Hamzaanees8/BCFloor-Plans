'use client';

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { useAppContext } from "@/app/context/AppContext";

interface TagsInputProps {
    coAgents: string[];
    setCoAgents: (tags: string[]) => void;
}


export function TagsInput({ coAgents, setCoAgents }: TagsInputProps) {
    const [tags, setTags] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState("");
    const { userType } = useAppContext()

    console.log('coAgents', coAgents);
    console.log('tags', tags);

    useEffect(() => {
        if (Array.isArray(coAgents)) {
            setTags(coAgents);
        }
    }, [coAgents]);

    useEffect(() => {
        if (JSON.stringify(tags) !== JSON.stringify(coAgents)) {
            setCoAgents(tags);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tags]);

    const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && inputValue.trim()) {
            e.preventDefault();
            const newTag = inputValue.trim();
            if (!tags.includes(newTag)) {
                setTags(prev => [...prev, newTag]);
            }
            setInputValue("");
        }
    };

    const removeTag = (tag: string) => {
        setTags(prev => prev.filter(t => t !== tag));
    };
    const addTagFromInput = () => {
        const newTag = inputValue.trim();
        if (newTag && !tags.includes(newTag)) {
            setTags(prev => [...prev, newTag]);
            setInputValue("");
        }
    };

    return (
        <div className="relative w-full min-h-[67px] h-fit border border-gray-300 rounded-lg p-2 flex flex-wrap gap-2 bg-[#F2F2F2]">
            {tags.map((tag, index) => (
                <div
                    key={index}
                    className="flex items-center h-[30px] bg-[#EAEAEA] rounded-full text-[12px] px-3 py-1 text-sm text-[#333]"
                >
                    <span className="mr-2">{tag}</span>
                    <X
                        className="h-4 w-4 text-red-400 cursor-pointer hover:text-red-600"
                        onClick={() => removeTag(tag)}
                    />
                </div>
            ))}
            <Input
                type="text"
                className="flex-1 border-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 min-w-[150px] text-sm"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={addTag}
            />
            <div className='absolute top-[-30px] flex right-0  mb-[12px]'>
                <p onClick={() => addTagFromInput()} className={`${userType}-text flex gap-[10px] cursor-pointer`}>Add<span className={`flex ${userType}-bg w-[18px] h-[18px] rounded-[3px] justify-center items-center`}><Plus className='text-[#F2F2F2] w-[12px]' /></span> </p>
            </div>
        </div>
    );
}
