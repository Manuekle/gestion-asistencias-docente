/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://fup-asistencias-docente.vercel.app',
  generateRobotsTxt: true, // (optional)
  sitemapSize: 5000,
};
