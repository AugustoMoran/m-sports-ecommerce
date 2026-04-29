// Script para insertar productos de librería en MongoDB
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const connectDB = require('../src/config/db');

async function seedLibreriaProducts() {
  await connectDB();

  const productos = [
    {
      nombre: 'Cuaderno Rivadavia Tapa Dura',
      descripcion: 'Cuaderno de 84 hojas, rayado, tapa dura, ideal para la escuela.',
      precio: 3500,
      precioOferta: 3200,
      stock: 40,
      categoria: null,
      imagenes: [{ url: 'https://dummyimage.com/400x400/fff/000&text=Cuaderno', publicId: 'libro1' }],
      tags: ['cuaderno', 'escuela', 'tapa dura', 'rivadavia'],
    },
    {
      nombre: 'Lapicera Bic Azul',
      descripcion: 'Lapicera clásica Bic, tinta azul, escritura suave.',
      precio: 400,
      precioOferta: null,
      stock: 100,
      categoria: null,
      imagenes: [{ url: 'https://dummyimage.com/400x400/00f/fff&text=Lapicera', publicId: 'libro2' }],
      tags: ['lapicera', 'bic', 'azul', 'escritura'],
    },
    {
      nombre: 'Mochila Escolar Totto',
      descripcion: 'Mochila resistente, varios compartimentos, ideal para primaria y secundaria.',
      precio: 12000,
      precioOferta: 10500,
      stock: 15,
      categoria: null,
      imagenes: [{ url: 'https://dummyimage.com/400x400/0ff/000&text=Mochila', publicId: 'libro3' }],
      tags: ['mochila', 'escolar', 'totto', 'secundaria'],
    },
    {
      nombre: 'Resaltadores Pastel x6',
      descripcion: 'Set de 6 resaltadores colores pastel, punta biselada.',
      precio: 2500,
      precioOferta: 2200,
      stock: 30,
      categoria: null,
      imagenes: [{ url: 'https://dummyimage.com/400x400/faf/000&text=Resaltador', publicId: 'libro4' }],
      tags: ['resaltador', 'pastel', 'oficina', 'estudio'],
    },
    {
      nombre: 'Cartuchera Triple Cierre',
      descripcion: 'Cartuchera con tres compartimentos, tela resistente, varios colores.',
      precio: 3200,
      precioOferta: 2900,
      stock: 25,
      categoria: null,
      imagenes: [{ url: 'https://dummyimage.com/400x400/ff0/000&text=Cartuchera', publicId: 'libro5' }],
      tags: ['cartuchera', 'triple', 'colores', 'escuela'],
    },
    {
      nombre: 'Goma de Borrar Pelikan',
      descripcion: 'Goma de borrar blanca, no mancha, ideal para lápiz.',
      precio: 350,
      precioOferta: null,
      stock: 60,
      categoria: null,
      imagenes: [{ url: 'https://dummyimage.com/400x400/fff/000&text=Goma', publicId: 'libro6' }],
      tags: ['goma', 'borrar', 'pelikan', 'lápiz'],
    },
    {
      nombre: 'Regla Plástica 30cm',
      descripcion: 'Regla transparente de 30cm, flexible y resistente.',
      precio: 600,
      precioOferta: null,
      stock: 50,
      categoria: null,
      imagenes: [{ url: 'https://dummyimage.com/400x400/0ff/000&text=Regla', publicId: 'libro7' }],
      tags: ['regla', 'plástica', '30cm', 'escuela'],
    },
    {
      nombre: 'Set Geometría Escolar',
      descripcion: 'Incluye compás, transportador, escuadra y cartabón.',
      precio: 1800,
      precioOferta: 1500,
      stock: 20,
      categoria: null,
      imagenes: [{ url: 'https://dummyimage.com/400x400/0f0/000&text=Geometría', publicId: 'libro8' }],
      tags: ['geometría', 'compás', 'escuadra', 'transportador'],
    },
    {
      nombre: 'Block de Hojas N°3',
      descripcion: 'Block de hojas blancas N°3, 96 hojas, ideal para dibujo.',
      precio: 2100,
      precioOferta: 1900,
      stock: 35,
      categoria: null,
      imagenes: [{ url: 'https://dummyimage.com/400x400/fff/000&text=Block', publicId: 'libro9' }],
      tags: ['block', 'hojas', 'dibujo', 'n3'],
    },
    {
      nombre: 'Tijera Escolar Punta Redonda',
      descripcion: 'Tijera de acero inoxidable, punta redonda, segura para niños.',
      precio: 800,
      precioOferta: null,
      stock: 45,
      categoria: null,
      imagenes: [{ url: 'https://dummyimage.com/400x400/f00/fff&text=Tijera', publicId: 'libro10' }],
      tags: ['tijera', 'escolar', 'punta redonda', 'niños'],
    },
  ];

  await Product.insertMany(productos);
  console.log('✅ Productos de librería insertados correctamente.');
  process.exit();
}

seedLibreriaProducts();
