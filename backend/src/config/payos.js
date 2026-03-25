// const { PayOS } = require("@payos/node");

// const payOS = new PayOS({
//   clientId: process.env.PAYOS_CLIENT_ID,
//   apiKey: process.env.PAYOS_API_KEY,
//   checksumKey: process.env.PAYOS_CHECKSUM_KEY,
// });
// module.exports = payOS;

const { PayOS } = require("@payos/node");

// Cú pháp ĐÚNG: Truyền 3 tham số riêng biệt (không dùng ngoặc nhọn {})
const payOS = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);

module.exports = payOS;