// src/utils/id.js
export const toId = (v) => String(v?._id ?? v?.id ?? v ?? '')
