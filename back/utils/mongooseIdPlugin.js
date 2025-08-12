// utils/mongooseIdPlugin.js
import mongoose from 'mongoose'

/**
 * 全域 Mongoose toJSON 統一輸出
 * - 根層：新增 id（字串），刪除 __v，可選擇是否刪除根層 _id
 * - 指定欄位（含陣列）：ObjectId => 字串；被 populate 的物件 => 保留欄位，補 id，_id 轉字串
 *
 * 使用：mongoose.plugin(mongooseIdPlugin) 或 schema.plugin(mongooseIdPlugin)
 */
export function mongooseIdPlugin (schema, options = {}) {
  const {
    // 會被統一處理的欄位（可再加）
    idFields = ['participants', 'admins', 'members', 'community', 'creator', 'user', 'users'],
    removeRootUnderscoreId = false, // 根層是否移除 _id（預設保留，避免破壞相容性）
  } = options

  const normalizeIdish = (val) => {
    if (val == null) return val
    // ObjectId -> 字串
    if (val instanceof mongoose.Types.ObjectId) return String(val)

    // 被 populate 的物件：保留欄位，補 id；_id 轉字串（保留 _id，避免相容性問題）
    if (typeof val === 'object' && !Array.isArray(val)) {
      const out = { ...val }
      if (out._id) {
        out.id = String(out._id)
        out._id = String(out._id)
      }
      return out
    }

    // 其他（例如原本就是字串）原樣回傳
    return val
  }

  const normalizeField = (ret, key) => {
    if (!(key in ret)) return
    const v = ret[key]
    if (Array.isArray(v)) {
      ret[key] = v.map(normalizeIdish)
    } else {
      ret[key] = normalizeIdish(v)
    }
  }

  const applyTransform = (_doc, ret) => {
    // 根層 id 與基本清理
    if (ret._id) {
      ret.id = String(ret._id)
      if (removeRootUnderscoreId) delete ret._id
      else ret._id = String(ret._id)
    }
    if ('__v' in ret) delete ret.__v

    // 指定欄位做統一化
    for (const f of idFields) {
      normalizeField(ret, f)
    }

    return ret
  }

  // toJSON
  const prevToJSON = schema.get('toJSON') || {}
  schema.set('toJSON', {
    virtuals: true,
    ...prevToJSON,
    transform: (doc, ret, opts) => {
      const base = prevToJSON.transform ? prevToJSON.transform(doc, ret, opts) : ret
      // 若上一層 transform 回傳了新的物件，優先用那個
      const target = base || ret
      return applyTransform(doc, target)
    }
  })

  // toObject（有需要也一起統一）
  const prevToObject = schema.get('toObject') || {}
  schema.set('toObject', {
    virtuals: true,
    ...prevToObject,
    transform: (doc, ret, opts) => {
      const base = prevToObject.transform ? prevToObject.transform(doc, ret, opts) : ret
      const target = base || ret
      return applyTransform(doc, target)
    }
  })
}

export default mongooseIdPlugin
