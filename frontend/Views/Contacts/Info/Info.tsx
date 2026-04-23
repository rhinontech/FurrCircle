"use client";

import { FadeInUp } from "@/components/AnimationProvider";
import { Mail, Map, Phone } from "lucide-react";
import { type FormEvent, useState } from "react";
import { submitContactLead } from "@/lib/contactLeads";


const contactInfo = [
    {
        icon: Mail,
        title: "Email",
        description: "info@rhinontech.com"
    },
    {
        icon: Phone,
        title: "Phone",
        description: "+91 824 929 1789"
    },
    {
        icon: Map,
        title: "Address",
        description: "Attapur, hyderabad"
    }
]

export default function Info() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        message: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitState, setSubmitState] = useState<"idle" | "success" | "error">("idle");
    const [submitMessage, setSubmitMessage] = useState("");

    const handleChange = (field: "name" | "email" | "phone" | "message", value: string) => {
        setFormData((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        setSubmitState("idle");
        setSubmitMessage("");

        try {
            await submitContactLead({
                ...formData,
                source: "contact-page",
                pagePath: typeof window !== "undefined" ? window.location.pathname : "/_contacts",
            });

            setFormData({
                name: "",
                email: "",
                phone: "",
                message: "",
            });
            setSubmitState("success");
            setSubmitMessage("Thanks for reaching out. Our team will get back to you soon.");
        } catch (error) {
            setSubmitState("error");
            setSubmitMessage(error instanceof Error ? error.message : "Failed to submit your message.");
        } finally {
            setIsSubmitting(false);
        }
    };

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
                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col h-full w-sm max-md:w-full gap-5">
                        <input
                            type="text"
                            placeholder='Name'
                            value={formData.name}
                            onChange={(event) => handleChange("name", event.target.value)}
                            className="p-4 outline-none bg-primary/10 rounded-xl"
                            required
                        />
                        <input
                            type="email"
                            placeholder='Email'
                            value={formData.email}
                            onChange={(event) => handleChange("email", event.target.value)}
                            className="p-4 outline-none bg-primary/10 rounded-xl"
                            required
                        />
                        <input
                            type="tel"
                            placeholder='Phone number (optional)'
                            value={formData.phone}
                            onChange={(event) => handleChange("phone", event.target.value)}
                            className="p-4 outline-none bg-primary/10 rounded-xl"
                        />
                        <textarea
                            placeholder='Message'
                            value={formData.message}
                            onChange={(event) => handleChange("message", event.target.value)}
                            className="p-4 flex flex-1 min-h-40 outline-none bg-primary/10 rounded-xl"
                            required
                        />
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="p-4 outline-none bg-primary text-white rounded-xl disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isSubmitting ? "Sending..." : "Contact Us"}
                        </button>
                        {submitMessage && (
                            <p className={`text-sm ${submitState === "success" ? "text-emerald-600" : "text-rose-600"}`}>
                                {submitMessage}
                            </p>
                        )}
                    </div>
                </form>


            </div>

        </div>
    )
}
