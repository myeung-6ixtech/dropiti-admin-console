"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface ImageUploadDndProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  featuredImageUrl?: string;
  onFeaturedImageChange?: (url: string | null) => void;
  maxImages?: number;
  disabled?: boolean;
  hideDropzone?: boolean;
}

interface DragItem {
  index: number;
  url: string;
}

function SortableImage({
  url,
  index,
  moveImage,
  isFeatured,
  onSetFeatured,
  onRemove,
  disabled,
}: {
  url: string;
  index: number;
  moveImage: (dragIndex: number, hoverIndex: number) => void;
  isFeatured: boolean;
  onSetFeatured: () => void;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: unknown }>({
    accept: 'image',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      moveImage(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'image',
    item: () => {
      return { url, index };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: !disabled,
  });

  const opacity = isDragging ? 0.5 : 1;
  drag(drop(ref));

  return (
    <div
      ref={ref}
      style={{ opacity }}
      data-handler-id={handlerId}
      className="relative group aspect-square rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800"
    >
      <img
        src={url}
        alt=""
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.src = 'https://via.placeholder.com/300x300?text=Invalid+Image';
        }}
      />
      
      {/* Drag handle */}
      {!disabled && (
        <div className="absolute top-2 left-2 p-1 bg-white/90 dark:bg-gray-800/90 rounded cursor-move hover:bg-white dark:hover:bg-gray-700">
          <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>
      )}

      {/* Featured star */}
      {!disabled && (
        <button
          onClick={onSetFeatured}
          className="absolute top-2 right-2 p-1 bg-white/90 dark:bg-gray-800/90 rounded hover:bg-white dark:hover:bg-gray-700"
          type="button"
        >
          {isFeatured ? (
            <svg className="w-5 h-5 text-yellow-500 fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          )}
        </button>
      )}

      {/* Remove button */}
      {!disabled && (
        <button
          onClick={onRemove}
          type="button"
          className="absolute bottom-2 right-2 p-1 bg-red-500/90 text-white rounded hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Featured badge */}
      {isFeatured && (
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-yellow-500 text-white text-xs rounded font-medium">
          Featured
        </div>
      )}
    </div>
  );
}

function ImageUploadDndInner({
  images,
  onImagesChange,
  featuredImageUrl,
  onFeaturedImageChange,
  maxImages = 20,
  disabled = false,
  hideDropzone = false,
}: ImageUploadDndProps) {
  const [imageList, setImageList] = useState<string[]>(images);

  useEffect(() => {
    setImageList(images);
  }, [images]);

  const moveImage = useCallback((dragIndex: number, hoverIndex: number) => {
    setImageList((prevImages) => {
      const newImages = [...prevImages];
      const [removed] = newImages.splice(dragIndex, 1);
      newImages.splice(hoverIndex, 0, removed);
      onImagesChange(newImages);
      return newImages;
    });
  }, [onImagesChange]);

  const handleRemove = useCallback((url: string) => {
    const newImages = imageList.filter((img) => img !== url);
    onImagesChange(newImages);
    
    if (featuredImageUrl === url && onFeaturedImageChange) {
      onFeaturedImageChange(null);
    }
  }, [imageList, onImagesChange, featuredImageUrl, onFeaturedImageChange]);

  const handleSetFeatured = useCallback((url: string) => {
    if (onFeaturedImageChange) {
      onFeaturedImageChange(featuredImageUrl === url ? null : url);
    }
  }, [featuredImageUrl, onFeaturedImageChange]);

  if (imageList.length === 0 && hideDropzone) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No images selected yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {imageList.length > 0 && (
        <>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {imageList.length} image{imageList.length !== 1 ? 's' : ''} (drag to reorder)
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {imageList.map((url, index) => (
              <SortableImage
                key={`${url}-${index}`}
                url={url}
                index={index}
                moveImage={moveImage}
                isFeatured={featuredImageUrl === url}
                onSetFeatured={() => handleSetFeatured(url)}
                onRemove={() => handleRemove(url)}
                disabled={disabled}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function ImageUploadDnd(props: ImageUploadDndProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <ImageUploadDndInner {...props} />
    </DndProvider>
  );
}
