import { PawPrint } from "@/Views/Home/Hero/Hero";

interface ButtonProps {
    text: string;
    onClick?: () => void;
}

export default function Button({ text, onClick }: ButtonProps) {
    return (
        <button
            onClick={onClick}
            className="relative w-fit h-14 px-10 rounded-full text-lg font-medium bg-primary hover:bg-[#8A7160] text-white transition-all duration-300 group overflow-hidden flex items-center justify-center"
        >
            {/* Text */}
            <span className="transition-transform duration-300 ease-out group-hover:-translate-x-2">
                {text}
            </span>

            {/* Icon */}
            <PawPrint className="absolute text-section-bg right-6 w-6 h-6 opacity-0 translate-x-3 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-x-0" />
        </button>
    );
}