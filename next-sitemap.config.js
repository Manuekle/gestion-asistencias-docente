/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://edutrack-fup.vercel.app',
  generateRobotsTxt: true, // (optional)
  sitemapSize: 5000,
};
