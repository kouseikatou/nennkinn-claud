module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const urlParts = req.url.split('/').filter(part => part);
  const lastSegment = urlParts[urlParts.length - 1];
  const urlId = /^\d+$/.test(lastSegment) ? parseInt(lastSegment) : null;

  return res.status(200).json({
    url: req.url,
    method: req.method,
    urlParts: urlParts,
    lastSegment: lastSegment,
    urlId: urlId,
    query: req.query,
    timestamp: new Date().toISOString()
  });
};