/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://gestion-asistencias-docente.vercel.app',
  generateRobotsTxt: true, // (optional)
  sitemapSize: 5000,
};
