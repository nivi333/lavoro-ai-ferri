import React, { useState, useEffect } from 'react';
import { Upload, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import type { UploadChangeParam } from 'antd/es/upload';

interface ImageUploadProps {
  value?: string;
  onChange?: (url: string) => void;
  icon?: React.ReactNode;
  helpText?: string;
  className?: string;
  maxSizeMB?: number;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  icon,
  helpText = 'Upload Image (PNG/JPG/SVG, max 2MB)',
  className = 'ccd-logo-upload',
  maxSizeMB = 2,
}) => {
  const [imageFile, setImageFile] = useState<{ url: string; name: string; status: string; uid: string } | null>(null);

  useEffect(() => {
    if (value) {
      setImageFile({
        url: value,
        name: 'image',
        status: 'done',
        uid: 'existing-image',
      });
    } else {
      setImageFile(null);
    }
  }, [value]);

  const handleRemoveImage = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setImageFile(null);
    onChange?.('');
  };

  const handleImageChange = (info: UploadChangeParam) => {
    const { file } = info;

    if (file.status === 'error') {
      message.error('Failed to upload image. Please try again.');
      return;
    }

    // Validate file type
    const isValidType =
      file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg' || file.type === 'image/svg+xml';
    if (!isValidType) {
      message.error('You can only upload JPG/PNG/SVG files!');
      return;
    }

    // Validate file size
    const isValidSize = (file.size || 0) / 1024 / 1024 < maxSizeMB;
    if (!isValidSize) {
      message.error(`Image must be smaller than ${maxSizeMB}MB!`);
      return;
    }

    if (file.status === 'done' || file.status === 'uploading' || !file.status) {
      const fileObj = file.originFileObj || file;
      if (fileObj) {
        const reader = new FileReader();
        reader.onload = () => {
          const url = reader.result as string;
          setImageFile({
            url,
            name: (fileObj as File).name,
            status: 'done',
            uid: file.uid || Date.now().toString(),
          });
          onChange?.(url);
        };
        reader.onerror = () => {
          message.error('Failed to read image file!');
        };
        reader.readAsDataURL(fileObj as File);
      }
    }

    if (file.status === 'removed') {
      setImageFile(null);
      onChange?.('');
    }
  };

  return (
    <>
      <Upload
        name='image'
        accept='image/*'
        listType='picture-circle'
        beforeUpload={() => false}
        showUploadList={false}
        onChange={handleImageChange}
        maxCount={1}
        className={className}
      >
        {imageFile && imageFile.url ? (
          <div className='ccd-logo-preview'>
            <img src={imageFile.url} alt='Uploaded' />
            <button
              type='button'
              className='ccd-logo-delete-btn'
              onClick={handleRemoveImage}
              aria-label='Remove image'
            >
              <DeleteOutlined />
            </button>
          </div>
        ) : (
          <span className='ccd-upload-icon'>
            {icon}
          </span>
        )}
      </Upload>
      <div className='ccd-logo-help-text'>
        {helpText}
        <br />
        Drag & drop or click to upload
      </div>
    </>
  );
};

export default ImageUpload;
