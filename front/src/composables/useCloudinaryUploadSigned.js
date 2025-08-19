// src/composables/useCloudinaryUploadSigned.js
import api from '@/services/api' // 你現成的 axios 實例

export function useCloudinaryUploadSigned() {
  function transform(url, ops = 'w_1200,q_auto,f_auto') {
    if (!url) return ''
    return url.replace('/upload/', `/upload/${ops}/`)
  }

  /**
   * 簽名上傳
   * @param {File} file
   * @param {(n:number)=>void} onProgress 0~100
   * @returns {Promise<{secure_url:string, public_id:string, width:number, height:number}>}
   */
  async function uploadImageSigned(file, onProgress) {
    if (!file) throw new Error('No file')
    if (!/^image\//.test(file.type)) throw new Error('請選擇圖片檔')
    if (file.size > 5 * 1024 * 1024) throw new Error('圖片請小於 5MB')

    // 1) 向後端索取簽名（可帶 folder 覆蓋）
    const { data: sig } = await api.get('/cloudinary/signature', {
      params: { folder: 'hood-link/posts' },
    })

    // 2) 帶簽名上傳到 Cloudinary
    const fd = new FormData()
    fd.append('file', file)
    fd.append('api_key', sig.apiKey)
    fd.append('timestamp', sig.timestamp)
    fd.append('upload_preset', sig.upload_preset)
    fd.append('folder', sig.folder)
    // 若簽名有包含 use_filename / unique_filename / overwrite，這邊也要一併附上
    // fd.append('use_filename', 'true')
    // fd.append('unique_filename', 'true')
    // fd.append('overwrite', 'false')
    fd.append('signature', sig.signature)

    const url = `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`

    const res = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', url)
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && typeof onProgress === 'function') {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      }
      xhr.onload = () => {
        try {
          const json = JSON.parse(xhr.responseText)
          if (xhr.status >= 400) {
            reject(new Error(json?.error?.message || `Upload failed (${xhr.status})`))
          } else {
            resolve(json)
          }
        } catch (err) {
          reject(err)
        }
      }
      xhr.onerror = reject
      xhr.send(fd)
    })

    return {
      secure_url: res.secure_url,
      public_id: res.public_id,
      width: res.width,
      height: res.height,
    }
  }

  return { uploadImageSigned, transform }
}
