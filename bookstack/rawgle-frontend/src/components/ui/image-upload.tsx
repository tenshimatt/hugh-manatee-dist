'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Camera, Upload, X, Check } from 'lucide-react'
import { toast } from 'sonner'

interface ImageUploadProps {
  onImageChange: (imageUrl: string | null) => void
  currentImage?: string | null
  maxSizeMB?: number
  acceptedFormats?: string[]
  className?: string
}

export function ImageUpload({
  onImageChange,
  currentImage,
  maxSizeMB = 5,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp'],
  className = ''
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // File validation
  const validateFile = useCallback((file: File): boolean => {
    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Image must be less than ${maxSizeMB}MB`)
      return false
    }

    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      const formats = acceptedFormats.map(f => f.split('/')[1]).join(', ')
      toast.error(`Please select a ${formats} image`)
      return false
    }

    return true
  }, [maxSizeMB, acceptedFormats])

  // Process image file
  const processFile = useCallback(async (file: File) => {
    if (!validateFile(file)) return

    setIsProcessing(true)

    try {
      // Create preview URL
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const result = e.target?.result as string
        onImageChange(result)
        setIsProcessing(false)
        toast.success('Image uploaded successfully!')
      }

      reader.onerror = () => {
        toast.error('Failed to read image file')
        setIsProcessing(false)
      }

      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Image processing error:', error)
      toast.error('Failed to process image')
      setIsProcessing(false)
    }
  }, [validateFile, onImageChange])

  // Handle file input change
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(file => file.type.startsWith('image/'))
    
    if (imageFile) {
      processFile(imageFile)
    } else {
      toast.error('Please drop an image file')
    }
  }, [processFile])

  // Handle click to select file
  const handleClick = () => {
    fileInputRef.current?.click()
  }

  // Remove image
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onImageChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    toast.success('Image removed')
  }

  const acceptedFormatsString = acceptedFormats.map(format => {
    const ext = format.split('/')[1]
    return `.${ext}`
  }).join(',')

  return (
    <div className={`relative ${className}`}>
      <div
        className={`
          relative w-32 h-32 rounded-full border-2 border-dashed cursor-pointer
          transition-all duration-200 overflow-hidden
          ${isDragging 
            ? 'border-pumpkin bg-pumpkin/10' 
            : 'border-charcoal-300 hover:border-pumpkin'
          }
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
          }
        }}
        aria-label="Upload pet photo"
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormatsString}
          onChange={handleFileChange}
          className="hidden"
          disabled={isProcessing}
        />

        {currentImage ? (
          // Show uploaded image
          <div className="relative w-full h-full">
            <Image
              src={currentImage}
              alt="Pet photo"
              width={128}
              height={128}
              className="w-full h-full object-cover rounded-full"
              priority
            />
            {/* Remove button */}
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors"
              aria-label="Remove image"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          // Show upload placeholder
          <div className="flex flex-col items-center justify-center w-full h-full text-charcoal-500">
            {isProcessing ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pumpkin" />
            ) : (
              <>
                <Camera className="h-8 w-8 mb-2" />
                <span className="text-xs text-center px-2">
                  Click or drag photo
                </span>
              </>
            )}
          </div>
        )}

        {/* Camera icon overlay button when image exists */}
        {currentImage && !isProcessing && (
          <div className="absolute bottom-0 right-0 p-2 bg-olivine text-white rounded-full shadow-lg hover:bg-olivine-600 transition-colors">
            <Camera className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Upload status indicator */}
      {isProcessing && (
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
          <div className="text-xs text-pumpkin flex items-center">
            <div className="animate-spin rounded-full h-3 w-3 border-b border-pumpkin mr-1" />
            Processing...
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageUpload