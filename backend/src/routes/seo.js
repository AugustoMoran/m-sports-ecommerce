const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');

router.get('/sitemap.xml', async (req, res) => {
  try {
    const products = await Product.find({ activo: true }).select('_id updatedAt');
    const categories = await Category.find().select('_id');
    
    const baseUrl = 'https://msportssl.com'; // Cambiar por el dominio real en producción

    let xml = '<?xml version="1.0" encoding="UTF-8"?>';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

    // Home
    xml += `
      <url>
        <loc>${baseUrl}/</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
      </url>`;

    // Products main page
    xml += `
      <url>
        <loc>${baseUrl}/productos</loc>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
      </url>`;

    // Dynamic Categories
    categories.forEach(cat => {
      xml += `
        <url>
          <loc>${baseUrl}/productos?categoria=${cat._id}</loc>
          <changefreq>weekly</changefreq>
          <priority>0.8</priority>
        </url>`;
    });

    // Dynamic Products
    products.forEach(prod => {
      xml += `
        <url>
          <loc>${baseUrl}/productos/${prod._id}</loc>
          <lastmod>${prod.updatedAt.toISOString().split('T')[0]}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.7</priority>
        </url>`;
    });

    xml += '</urlset>';

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Sitemap error:', error);
    res.status(500).send('Error generating sitemap');
  }
});

module.exports = router;
