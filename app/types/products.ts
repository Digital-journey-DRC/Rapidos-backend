export interface UploadedMedia {
  mediaUrl: string
  mediaType: string
}

export interface UploadResult {
  medias: UploadedMedia[]
  errors: any[]
}
