const express = require("express");
const router = express.Router();
const { SitemapStream, streamToPromise } = require("sitemap");
const Event = require("../models/Event");
const { createGzip } = require("zlib");

router.get("/sitemap.xml", async (req, res) => {
  try {
    // Base URL of your site
    const baseUrl = "https://www.classicpro.events";

    res.header("Content-Type", "application/xml");
    res.header("Content-Encoding", "gzip");

    const smStream = new SitemapStream({ hostname: baseUrl });
    const pipeline = smStream.pipe(createGzip());

    // Add static pages
    smStream.write({ url: "/", changefreq: "daily", priority: 1.0 });
    smStream.write({ url: "/about", changefreq: "monthly", priority: 0.7 });
    smStream.write({ url: "/contact", changefreq: "monthly", priority: 0.7 });
    smStream.write({ url: "/events", changefreq: "daily", priority: 0.9 });

    // Add all events dynamically
    const events = await Event.find().select("_id updatedAt");
    events.forEach(event => {
      smStream.write({
        url: `/show/event/${event._id}`,
        changefreq: "weekly",
        priority: 0.8,
        lastmodISO: event.updatedAt.toISOString()
      });
    });

    smStream.end();

    streamToPromise(pipeline).then(sm => console.log("Sitemap generated"));

    pipeline.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
});

module.exports = router;
