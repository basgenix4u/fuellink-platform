// src/components/landing/TestimonialsSection.tsx

"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { Container } from "@/components/shared/Container";

const testimonials = [
  {
    name: "Alhaji Musa Abdullahi",
    role: "Independent Marketer",
    location: "Kano State",
    image: "/images/testimonials/user1.jpg",
    rating: 5,
    text: "FuelLink has completely transformed how I do business. I used to spend 3-4 hours every morning calling depots. Now I see all prices instantly and make better decisions. My margins have improved by 12% since I started using the platform.",
  },
  {
    name: "Chief Mrs. Adaeze Okonkwo",
    role: "Depot Manager, Pinnacle Oil",
    location: "Lagos State",
    image: "/images/testimonials/user2.jpg",
    rating: 5,
    text: "As a depot operator, FuelLink has reduced our phone calls by 80%. Marketers can see our prices in real-time, and the escrow system means we always get paid. The QR verification has eliminated loading disputes completely.",
  },
  {
    name: "Engr. Chukwuemeka Obi",
    role: "Fleet Owner, 15 Trucks",
    location: "Rivers State",
    image: "/images/testimonials/user3.jpg",
    rating: 5,
    text: "Before FuelLink, we'd send trucks to depots only to find they were out of stock. The wasted trips were killing our business. Now we can verify stock before dispatch. We've cut empty runs by 90%.",
  },
  {
    name: "Mallam Ibrahim Suleiman",
    role: "IPMAN Chapter Chairman",
    location: "Kaduna State",
    image: "/images/testimonials/user4.jpg",
    rating: 5,
    text: "I've recommended FuelLink to all our chapter members. The transparency it brings to pricing is exactly what our industry needs. It's leveling the playing field for smaller marketers.",
  },
  {
    name: "Mrs. Folake Adeyemi",
    role: "Station Owner, 3 Outlets",
    location: "Oyo State",
    image: "/images/testimonials/user5.jpg",
    rating: 5,
    text: "The profitability calculator alone has saved me from bad deals multiple times. I can see my margins before I commit to any purchase. Plus, the escrow gives me peace of mind on large transactions.",
  },
  {
    name: "Alhaji Garba Danladi",
    role: "Bulk Distributor",
    location: "Abuja FCT",
    image: "/images/testimonials/user6.jpg",
    rating: 5,
    text: "Moving ₦50-100 million weekly used to be stressful. Now with FuelLink's escrow, I sleep better. The platform has brought trust back to petroleum trading in Nigeria.",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < rating ? "text-yellow-400 fill-yellow-400" : "text-slate-300"
          }`}
        />
      ))}
    </div>
  );
}

function TestimonialCard({
  testimonial,
  index,
}: {
  testimonial: (typeof testimonials)[0];
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow duration-300"
    >
      {/* Quote Icon */}
      <Quote className="w-10 h-10 text-primary-100 mb-4" />

      {/* Testimonial Text */}
      <p className="text-slate-700 mb-6 leading-relaxed">{testimonial.text}</p>

      {/* Rating */}
      <div className="mb-4">
        <StarRating rating={testimonial.rating} />
      </div>

      {/* Author */}
      <div className="flex items-center gap-4">
        {/* Avatar Placeholder */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-lg">
          {testimonial.name.charAt(0)}
        </div>
        <div>
          <p className="font-semibold text-slate-900">{testimonial.name}</p>
          <p className="text-sm text-slate-500">{testimonial.role}</p>
          <p className="text-xs text-slate-400">{testimonial.location}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function TestimonialsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 bg-slate-50 overflow-hidden">
      <Container size="wide">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 text-primary-600 font-semibold text-sm uppercase tracking-wider mb-4">
              <Star className="w-4 h-4 fill-primary-600" />
              Testimonials
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
              Trusted by{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-secondary-500">
                Industry Leaders
              </span>
            </h2>
            <p className="text-lg text-slate-600">
              See what depot owners, marketers, and transporters are saying
              about their experience with FuelLink.
            </p>
          </motion.div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={testimonial.name}
              testimonial={testimonial}
              index={index}
            />
          ))}
        </div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-white"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold mb-2">4.9/5</p>
              <p className="text-white/80">Average Rating</p>
            </div>
            <div>
              <p className="text-4xl font-bold mb-2">3,456+</p>
              <p className="text-white/80">Active Users</p>
            </div>
            <div>
              <p className="text-4xl font-bold mb-2">98%</p>
              <p className="text-white/80">Satisfaction Rate</p>
            </div>
            <div>
              <p className="text-4xl font-bold mb-2">24/7</p>
              <p className="text-white/80">Support Available</p>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}