import Image from "next/image"

const teamMembers = [
    {
        name: "Dr. Emily Anderson",
        role: "Chief Veterinarian",
        image: "/gallery/family1.png",
    },
    {
        name: "Linda Parker",
        role: "Certified Pet Trainer",
        image: "/gallery/family2.png",
    },
    {
        name: "Maria Rodriguez",
        role: "Professional Pet Groomer",
        image: "/gallery/family3.png",
    },
    {
        name: "David Johnson",
        role: "Care Manager",
        image: "/gallery/family4.png",
    },
]

export function Teams() {
    return (
        <div className="py-32 max-md:py-20 relative">

            <div className="w-full h-[60%] bottom-0 absolute bg-[url('/reverseSection.svg')] bg-cover bg-bottom bg-no-repeat" />

            <div className="max-w-7xl flex flex-col mx-auto gap-10">
                <div className="flex justify-between max-md:flex-col max-md:text-center gap-10 items-end px-5 lg:px-0">
                    <div className="flex flex-col gap-4">
                        <h2 className="text-5xl md:text-7xl font-heading text-foreground">
                            Our FurrCircle Team
                        </h2>
                    </div>
                    <p className="text-muted-foreground max-w-sm text-md md:text-base font-normal">
                        Meet the Passionate Specialists Who Make FurrCircle a Safe Haven for Your Beloved Pets
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8 px-6 lg:px-0">
                    {teamMembers.map((mem) => (
                        <div 
                            key={mem.name} 
                            className="group relative h-[350px] rounded-[1rem] overflow-hidden shadow-md transition-all duration-500 hover:shadow-2xl"
                        >
                            {/* Member Image */}
                            <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110">
                                <Image
                                    src={mem.image}
                                    alt={mem.name}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            
                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

                            {/* Content */}
                            <div className="absolute bottom-0 bg-white group-hover:bg-primary w-[60%] rounded-tr-[1rem] left-0 right-0 p-8 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                <h3 className="text-2xl group-hover:text-white transition-colors duration-300 font-heading  mb-1">
                                    {mem.name}
                                </h3>
                                <p className="text-muted-foreground font-body group-hover:text-white/40 text-sm font-medium">
                                    {mem.role}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}