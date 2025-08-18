const s3 = require('../config/s3');

const deleteFromSpaces = async (urlOrKey) => {
    if (!urlOrKey) return;
  
    try {
      let key = urlOrKey;

      if (urlOrKey.startsWith("http")) {
        const url = new URL(urlOrKey);
        key = url.pathname.startsWith("/") ? url.pathname.slice(1) : url.pathname;
      }
  
      await s3
        .deleteObject({
          Bucket: process.env.SPACES_BUCKET,
          Key: key,
        })
        .promise();
    } catch (err) {
      console.error("❌ Error eliminando de Spaces:", err);
      throw err;
    }
};

module.exports = { deleteFromSpaces };

  