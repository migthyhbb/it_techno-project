export interface MitraProduct {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  stock: number;
}

// Data dummy — ganti dengan data stok/produk sesungguhnya dari backend.
export const mitraProducts: MitraProduct[] = [
  {
    id: "briket-5kg",
    name: "Briket Energi LENTERA 5kg",
    category: "Briket padat",
    unit: "karung",
    price: 45000,
    stock: 128,
  },
  {
    id: "pelet-10kg",
    name: "Pelet Biomassa 10kg",
    category: "Pelet biomassa",
    unit: "karung",
    price: 78000,
    stock: 84,
  },
  {
    id: "cair-20l",
    name: "Tabung Energi Cair 20L",
    category: "Energi cair",
    unit: "tabung",
    price: 210000,
    stock: 36,
  },
  {
    id: "serbuk-25kg",
    name: "Serbuk Biomassa Curah 25kg",
    category: "Serbuk curah",
    unit: "karung",
    price: 95000,
    stock: 19,
  },
];
