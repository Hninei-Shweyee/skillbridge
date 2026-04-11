// ─── Firebase Storage Helpers ─────────────────────────────────────────────────
// Functions for uploading and deleting files (PDFs, thumbnails, resource files).
// Returns download URLs after upload.

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage'
import { storage } from './config'

// ─── Upload a file with progress callback ────────────────────────────────────
// path: storage path, e.g. "courses/abc123/thumbnail.jpg"
// file: File object from <input type="file">
// onProgress: optional callback receiving 0–100 percentage
// Returns: download URL string
export function uploadFile(path, file, onProgress) {
  return new Promise((resolve, reject) => {
    const storageRef  = ref(storage, path)
    const uploadTask  = uploadBytesResumable(storageRef, file)

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        // Calculate and report upload progress (0–100)
        const percent = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        )
        if (onProgress) onProgress(percent)
      },
      (error) => reject(error),
      async () => {
        // Upload complete — get the public download URL
        const url = await getDownloadURL(uploadTask.snapshot.ref)
        resolve(url)
      }
    )
  })
}

// ─── Delete a file by its storage path ───────────────────────────────────────
export async function deleteFile(path) {
  const storageRef = ref(storage, path)
  await deleteObject(storageRef)
}

// ─── Get a download URL for an existing file ─────────────────────────────────
export async function getFileURL(path) {
  const storageRef = ref(storage, path)
  return await getDownloadURL(storageRef)
}
