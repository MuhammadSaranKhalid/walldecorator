import ProductCard from './ProductCard';

const newProducts = [
  {
    title: "Minimalist Road Bicycle Laser-Cut Metal Wall Art",
    material: "Steel",
    price: "Rs 2,600.00",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBIYO-82qqCB06ZkRgZHZCakS6KVex_-03HLgGLIs-UsfXtdYBDsDXnEhc3vQhO2osO7NYASu-KjDPXcGTmsc0WnQBQEEW9Fejg_NTzY010pxpi_EvtKErixKdgvFMld5mGrem-UemLeaN_cX8CW9KzwpO3-tIFTycq0HV7Q0YsFNxMy6fxIDJro166qkKn9QKjuUWe-jitluwRWgyrhtrU5b4FAUYqUyjZ1iKQnZ5cvyJ33FnB4Lbl8Bhfl__ij7p8C0Dq1UYVss0",
    imageAlt: "Minimalist Road Bicycle Laser-Cut Metal Wall Art"
  },
  {
    title: "2-Piece Laser-Cut Vintage Bicycle Wall Art with Floral Basket",
    material: "Steel",
    price: "Rs 2,600.00",
    imageUrl: "",
    imageAlt: "2-Piece Laser-Cut Vintage Bicycle Wall Art with Floral Basket",
    showPlaceholder: true
  },
  {
    title: "Minimalist Road Bike Silhouette Wall Art - Modern Cycling Decor",
    material: "Steel",
    price: "Rs 2,600.00",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBtspTcH3zn6rQIGsKwSUl8qPMIQxqrX1MsT9ylhstNx2ajfMna2Ln7XALdwyIIUrveJK0MBGPja8INPkj3DD5Qu2PIXSYLgM1iYXCzmJiKR-dWzYNvFRdA-Wfg504K6Y364a8e44SMAKKuOeBz76xPc2Jw7WIPVffowyTZO2wYRe0ruA60xa732Fv8JVR-mFhGXMsSbkVuaUiaGx-FAvXMg1VG8Wud2r0Np7AIiiqCcjjsW04xl47UptgxcddcMM_YCGVvonC2K04",
    imageAlt: "Minimalist Road Bike Silhouette Wall Art"
  },
  {
    title: "Geometric Metal Road Bicycle Wall Art - Minimalist Black Silhouette",
    material: "Steel",
    price: "Rs 2,600.00",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuA0Kpvv5V8gOpf4tLEojJa72p1YSxvgQMbOlK4TxswB8j2m3Eyc1DRy6o5rnh56YKbZMM4i7nxXbQpYxDz-3i0HOkz3-34UQZu_4Zl1u1R--8AEKTL4mYvrTIV_jh38iVDrmSqiYtWNtgMPibGWWh7XZGoWa5ZhFovD8QlJIchXeJkkZygEsABn8_x4OHsiiPZm5GKH95fQi2JuPw0-Az6J_0cn-kZ1zF1T_9Q0uYhyfTKYrEuFrkU7jzQl2cdP4NDtOwZhHwu8Gjc",
    imageAlt: "Geometric Metal Road Bicycle Wall Art"
  }
];

export default function NewArrivals() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold mb-10">New Arrivals</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {newProducts.map((product, index) => (
          <ProductCard key={index} {...product} />
        ))}
      </div>
      <div className="mt-12 text-center">
        <button className="px-6 py-2 border border-gray-300 text-xs font-semibold rounded hover:bg-gray-50 transition-colors uppercase tracking-wider">
          View All
        </button>
      </div>
    </section>
  );
}
