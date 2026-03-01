import ProductCard from './ProductCard';

const bestSellingProducts = [
  {
    title: "Itachi Uchiha & Crows Metal Wall Art - Naruto",
    material: "Steel",
    price: "Rs 2,600.00",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBrntu3XNL1__n4WV4gnXmnxaieFLVhVY-uEGXg6rvjMXn7NpX4qK1aKV8JAVRJYFSkdHb8DdB2f-VuL2OMPNLEn7FysTm0sH-EfbEB5w9XWfJmv-aYofGD8PZTcI1ah8959sTMpal5ZQe_1ouMbIbqUGljmxvO-WHQeWEwu7rFSYmMRHS4Q-qoe7tqkX3qbV8VYQ2q5TXqCFFRjXMmarC_CuLTS0J7vfJ9rmIz_D8uAj2mVZyjRkNR5WUgaQcEsAyWym7JffJie4c",
    imageAlt: "Itachi Uchiha & Crows Metal Wall Art"
  },
  {
    title: "Obito Uchiha Split Face Metal Wall Art - Naruto",
    material: "Steel",
    price: "Rs 2,600.00",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAhPK0F_KqB92hrGXJxbgqiCqtwktZJEYJ-cK7G0gja20dicHo0LDi7SxtjG2-pv0m71EQrOM7e_OFHSe7jGk3sFPk8bW4OkCb558ONSoQmKy-5d4dku01r3r2PpG04xc7eOFhs74UI9UAw1DN9vIOdpCJQTwzRYRVSf2e37o8pGqbrbneMAQmM3PPmyYWTBX1jKo3scd3KJw4kR2ZSyMttHdlMENElb2nuAT4TPOFbn3ReG2xzYKZeaePn_EC-ecKWe7BV3HetLfU",
    imageAlt: "Obito Uchiha Split Face Metal Wall Art"
  },
  {
    title: "Obito & Kakashi Metal Wall Art - Naruto",
    material: "Steel",
    price: "Rs 2,600.00",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDn8ccXuEL0KnkTbBL4VeAuG7tYhEqO1di1sbtGiU4T8rep9VjqOTjeu-PnX4vkMDXL-poAeJ8SmmQHAWZuVKZXbB85iLWCL9QAFUAWlghvZhjejiyvVuVPS6qWQ2SpQ9WBifvsYDL6jNdzNBCjREAoq7epYMbSCgFRcxDTo7UURzr0G3DkDQQCfciRe_3B0Mto1MT1LI_b1vA8pNSkGxIW9d7iMAZQvb1CrpBFqTPxpytQsZdP-O-J-no0gg4R9a4LskphIAh7fCk",
    imageAlt: "Obito & Kakashi Metal Wall Art"
  },
  {
    title: "Gojo Satoru Metal Wall Art - Jujutsu Kaisen",
    material: "Steel",
    price: "Rs 2,600.00",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuByr9FNRM2oDfTEtrJlbPAvrkythtDCbFI2Cj7znGC0ytdkwP_P_V5lp1ZdtqufD5CVxAcs7Z8zCHCM0WsoA2QJfFFHt_Pq2ndDiLuxR8390kKoGbZelqOxawnCFzodM6VEb1ByV9Znog2kIeVilHUaFcizSEmz_myMf0LQ9XdSp84kBpSGR-v8cm4eTC-Yk-hvMgFfX8XuqMJHtuLAiiXE5JEncBDdo2swAVN0kLmP_57Pb6lfn7umZIvgfp_awdyq28SgUM5IpYM",
    imageAlt: "Gojo Satoru Metal Wall Art"
  }
];

export default function BestSellers() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-16 bg-gray-50/30">
      <h2 className="text-3xl font-bold mb-10">Best Sellers</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {bestSellingProducts.map((product, index) => (
          <ProductCard key={index} {...product} />
        ))}
      </div>
      <div className="mt-12 text-center">
        <button className="px-6 py-2 border border-gray-300 text-xs font-semibold rounded hover:bg-gray-50 transition-colors uppercase tracking-wider">
          Shop Bestsellers
        </button>
      </div>
    </section>
  );
}
