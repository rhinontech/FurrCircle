import { FadeInUp } from "@/components/AnimationProvider";
import { div } from "framer-motion/client";
import { Mail, Map, Phone } from "lucide-react";


const contactInfo = [
    {
        icon: Mail,
        title: "Email",
        description: "info@petpals.com"
    },
    {
        icon: Phone,
        title: "Phone",
        description: "+1 (123) 456-7890"
    },
    {
        icon: Map,
        title: "Address",
        description: "123 Main St, Anytown, USA"
    }
]

export default function Info() {

    return (
        <div className="py-32 max-md:py-10 relative">
            <div className="max-w-7xl mx-auto flex justify-between gap-10 max-md:flex-col px-5">

                {/* left side */}
                <div className="flex flex-col gap-10 max-w-sm">
                    <h2 className="text-4xl md:text-6xl font-heading ">
                        Get in Touch
                    </h2>
                    <p className="text-lg md:text-xl text-muted-foreground">
                        Feel free to stop by during operating hours if you'd like in-person assistance
                    </p>
                    <div className="flex flex-col gap-5">
                        {contactInfo.map((info) => (
                            <FadeInUp key={info.title}>
                                <div className="flex gap-10 p-5 bg-section-bg rounded-2xl items-center">
                                    <div className="p-3 border-1 border-black w-fit h-fit rounded-full">
                                        <info.icon className="" strokeWidth={1.5} size={30} />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-xl font-heading">{info.title}</h3>
                                        <p className="text-md text-muted-foreground">{info.description}</p>
                                    </div>
                                </div>
                            </FadeInUp>
                        ))}

                    </div>
                </div>

                {/* right side */}
                <form>
                    <div className="flex flex-col h-full w-sm max-md:w-full gap-5">
                        <input type="text" placeholder='Name' className="p-4 outline-none bg-primary/10 rounded-xl" />
                        <input type="text" placeholder='Email' className="p-4 outline-none bg-primary/10 rounded-xl" />
                        <textarea placeholder='Message' className="p-4 flex flex-1 outline-none bg-primary/10 rounded-xl" />
                        <button type="submit" className="p-4 outline-none bg-primary text-white rounded-xl">Sign-up</button>
                    </div>
                </form>


            </div>

        </div>
    )
}