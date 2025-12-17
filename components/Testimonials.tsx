import React from 'react';
import { TestimonialData } from '../types';


const testimonials: TestimonialData[] = [
  {
    quote: "Switching to Oxygen cut our manual work in half. The automation flows just work — we closed more deals in a week than the entire last year.",
    name: "Alex Chen",
    role: "Operations Manager",
    image: "https://placehold.co/100x100?text=AC"
  },
  {
    quote: "Finally, a tool that feels smart but stays simple. Our team collaborates faster, tracks everything, and we’ve grown our active users by 40%.",
    name: "Priya Das",
    role: "Head of Product",
    image: "https://placehold.co/100x100?text=PD"
  },
  {
    quote: "I love how intuitive it is. It plugs right into our stack, keeps data secure, and helps us ship new ideas without the chaos.",
    name: "Daniel Rivera",
    role: "CTO",
    image: "https://placehold.co/100x100?text=DR"
  }
];



export const Testimonials: React.FC = () => {
  return (
    <section className="py-24 px-4 bg-background/50 backdrop-blur-sm border-t border-white/5">
        <div className="max-w-6xl mx-auto">
             <div className="text-center mb-24 overflow-hidden">
                 <h2 className="text-4xl md:text-5xl font-display font-light mb-12">60+ customers around the globe</h2>
                 
                 <div className="relative w-full overflow-hidden">
                    <div className="flex gap-12 animate-marquee whitespace-nowrap items-center">
                        {[
                            "https://gentrack.b-cdn.net/wp-content/uploads/2021/04/so-energy.svg",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2021/04/Maxen-power.svg",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2022/09/pulse-energy-logo.png",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2024/02/solstice.png",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2023/03/Hunter-Water.svg",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2023/09/Npower-powered-by-EON.png",
                            "https://gentrack.b-cdn.net/wp-content/uploads/Horizon_Power.png",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2022/09/Shell.svg",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2024/09/yu-energy-1.png",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2024/10/vocus-white.png",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2024/10/ecotricity-white.png",
                            "https://gentrack.b-cdn.net/wp-content/uploads/ACEN_Corp_Ayala_white.png",
                            "https://gentrack.b-cdn.net/wp-content/uploads/Amber-Logo-Green-1.svg",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2023/09/Water-Authority-of-Fiji-logo.png",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2023/09/Utility-Warehouse-logo.png",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2023/09/PNG-Power-logo.png",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2023/09/Pacific-Light-Energy-logo.png",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2023/09/Energy-Australia-logo.png",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2023/09/Mercury-logo.png",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2021/04/Genesis.svg",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2021/04/Red-energy.svg",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2021/04/Engie.svg",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2021/04/Wave.svg",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2021/04/actewagl.svg",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2021/04/Vector_1.svg",
                            "https://gentrack.b-cdn.net/wp-content/uploads/Unitywater-white.webp"
                        ].map((logo, i) => (
                             <div key={i} className="inline-block mx-6 min-w-[120px] h-16 flex items-center justify-center">
                                <img src={logo} alt="Client Logo" className="h-full w-auto object-contain brightness-0 invert opacity-70 hover:opacity-100 transition-opacity" />
                             </div>
                        ))}
                         {/* Duplicate for seamless loop */}
                         {[
                            "https://gentrack.b-cdn.net/wp-content/uploads/2021/04/so-energy.svg",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2021/04/Maxen-power.svg",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2022/09/pulse-energy-logo.png",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2024/02/solstice.png",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2023/03/Hunter-Water.svg",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2023/09/Npower-powered-by-EON.png",
                            "https://gentrack.b-cdn.net/wp-content/uploads/Horizon_Power.png",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2022/09/Shell.svg",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2024/09/yu-energy-1.png",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2024/10/vocus-white.png",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2024/10/ecotricity-white.png",
                            "https://gentrack.b-cdn.net/wp-content/uploads/ACEN_Corp_Ayala_white.png",
                            "https://gentrack.b-cdn.net/wp-content/uploads/Amber-Logo-Green-1.svg",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2023/09/Water-Authority-of-Fiji-logo.png",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2023/09/Utility-Warehouse-logo.png",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2023/09/PNG-Power-logo.png",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2023/09/Pacific-Light-Energy-logo.png",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2023/09/Energy-Australia-logo.png",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2023/09/Mercury-logo.png",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2021/04/Genesis.svg",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2021/04/Red-energy.svg",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2021/04/Engie.svg",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2021/04/Wave.svg",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2021/04/actewagl.svg",
                            "https://gentrack.b-cdn.net/wp-content/uploads/2021/04/Vector_1.svg",
                            "https://gentrack.b-cdn.net/wp-content/uploads/Unitywater-white.webp"
                        ].map((logo, i) => (
                             <div key={`dup-${i}`} className="inline-block mx-6 min-w-[120px] h-16 flex items-center justify-center">
                                <img src={logo} alt="Client Logo" className="h-full w-auto object-contain brightness-0 invert opacity-70 hover:opacity-100 transition-opacity" />
                             </div>
                        ))}
                    </div>
                 </div>
             </div>

             <div className="mb-12">
                <h2 className="text-3xl md:text-5xl font-display font-medium mb-4">See what our clients love</h2>
                <p className="text-secondary text-lg max-w-2xl">Discover why teams trust Oxygen to automate workflows, boost growth, and deliver standout experiences.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {testimonials.map((t, i) => (
                    <div key={i} className="bg-surface/30 border border-white/5 p-8 rounded-3xl flex flex-col justify-between hover:bg-surface/50 transition-colors backdrop-blur-md">
                        <p className="text-lg text-gray-300 mb-8 italic leading-relaxed">"{t.quote}"</p>
                        <div className="flex items-center gap-4">
                            <img src={t.image} alt={t.name} className="w-12 h-12 rounded-full object-cover border border-white/10" />
                            <div>
                                <div className="font-bold text-white">{t.name}</div>
                                <div className="text-sm text-secondary">{t.role}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
  );
};