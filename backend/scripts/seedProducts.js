// Script para insertar productos de ejemplo en MongoDB
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const connectDB = require('../src/config/db');

async function seedProducts() {
  await connectDB();

  const productos = [
    {
      nombre: 'Remera Oversize Blanca',
      descripcion: 'Remera de algodón premium, corte oversize, color blanco.',
      precio: 9500,
      precioOferta: 8000,
      stock: 20,
      categoria: null,
      imagenes: [{ url: 'https://dummyimage.com/400x400/fff/000&text=Remera+Blanca', publicId: 'demo1' }],
      tags: ['remera', 'blanca', 'oversize', 'verano'],
    },
    {
      nombre: 'Buzo Canguro Negro',
      descripcion: 'Buzo canguro con capucha, color negro, ideal para el frío.',
      precio: 18000,
      precioOferta: 15000,
      stock: 10,
      categoria: null,
      imagenes: [{ url: 'https://dummyimage.com/400x400/000/fff&text=Buzo+Negro', publicId: 'demo2' }],
      tags: ['buzo', 'negro', 'invierno'],
    },
    {
      nombre: 'Zapatillas Urbanas',
      descripcion: 'Zapatillas urbanas unisex, cómodas y livianas.',
      precio: 32000,
      precioOferta: null,
      stock: 15,
      categoria: null,
      imagenes: [{ url: 'https://dummyimage.com/400x400/ccc/333&text=Zapatillas', publicId: 'demo3' }],
      tags: ['zapatillas', 'urbano', 'calzado'],
    },
    {
      nombre: 'Campera Rompeviento',
      descripcion: 'Campera liviana rompeviento, resistente al agua.',
      precio: 25000,
      precioOferta: 22000,
      stock: 8,
      categoria: null,
      imagenes: [{ url: 'https://dummyimage.com/400x400/00f/fff&text=Campera', publicId: 'demo4' }],
      tags: ['campera', 'rompeviento', 'abrigo'],
    },
    {
      nombre: 'Short Deportivo',
      descripcion: 'Short de secado rápido, ideal para entrenar o la playa.',
      precio: 7000,
      precioOferta: null,
      stock: 25,
      categoria: null,
      imagenes: [{ url: 'https://dummyimage.com/400x400/0f0/fff&text=Short', publicId: 'demo5' }],
      tags: ['short', 'deporte', 'verano'],
    },
    {
      nombre: 'Gorra Trucker',
      descripcion: 'Gorra estilo trucker, ajustable, varios colores.',
      precio: 4500,
      precioOferta: 4000,
      stock: 30,
      categoria: null,
      imagenes: [{ url: 'https://dummyimage.com/400x400/ff0/000&text=Gorra', publicId: 'demo6' }],
      tags: ['gorra', 'accesorio', 'verano'],
    },
    {
      nombre: 'Pantalón Jogger',
      descripcion: 'Jogger de frisa, súper cómodo, color gris.',
      precio: 16000,
      precioOferta: 14000,
      stock: 12,
      categoria: null,
      imagenes: [{ url: 'https://dummyimage.com/400x400/888/fff&text=Jogger', publicId: 'demo7' }],
      tags: ['pantalón', 'jogger', 'gris'],
    },
    {
      nombre: 'Medias Pack x3',
      descripcion: 'Pack de 3 pares de medias de algodón.',
      precio: 3500,
      precioOferta: null,
      stock: 40,
      categoria: null,
      imagenes: [{ url: 'https://dummyimage.com/400x400/fff/000&text=Medias', publicId: 'demo8' }],
      tags: ['medias', 'accesorio'],
    },
    {
      nombre: 'Camisa Leñadora',
      descripcion: 'Camisa de franela a cuadros, estilo leñador.',
      precio: 21000,
      precioOferta: 18000,
      stock: 7,
      categoria: null,
      imagenes: [{ url: 'https://dummyimage.com/400x400/f00/fff&text=Camisa', publicId: 'demo9' }],
      tags: ['camisa', 'leñadora', 'cuadros'],
    },
    {
      nombre: 'Cinturón de Cuero',
      descripcion: 'Cinturón 100% cuero legítimo, hebilla metálica.',
      precio: 9000,
      precioOferta: null,
      stock: 18,
      categoria: null,
      imagenes: [{ url: 'https://dummyimage.com/400x400/964B00/fff&text=Cinturon', publicId: 'demo10' }],
      tags: ['cinturón', 'accesorio', 'cuero'],
    },
  ];

  await Product.insertMany(productos);
  console.log('✅ Productos de ejemplo insertados correctamente.');
  process.exit();
}

seedProducts();
