import React, { useState } from 'react';
import { Instagram, Heart, MessageCircle, X, ShoppingBag } from 'lucide-react';
import { instagramFeed } from '../data/mockData';
import { InstagramPost, Product } from '../types/store';

interface InstagramGalleryProps {
  posts?: InstagramPost[];
  storeHandle?: string;
  onSelectProductById?: (productId: string) => void;
  products?: Product[];
}

export const InstagramGallery: React.FC<InstagramGalleryProps> = ({
  posts = instagramFeed,
  storeHandle = '@anfa_print_wear',
  onSelectProductById,
}) => {
  const [activeModalPost, setActiveModalPost] = useState<InstagramPost | null>(null);

  const handleOpenPost = (post: InstagramPost) => {
    setActiveModalPost(post);
  };

  const handleShopLook = (post: InstagramPost) => {
    if (post.taggedShirtId && onSelectProductById) {
      onSelectProductById(post.taggedShirtId);
      setActiveModalPost(null);
    }
  };

  return (
    <section id="instagram-section" className="py-16 md:py-20 bg-neutral-50/50 border-t border-neutral-200 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10 md:mb-14">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-['Oswald'] font-bold text-neutral-900 tracking-wider uppercase">
            INSTAGRAM
          </h2>
          <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-neutral-400 uppercase mt-2">
            COMMUNITY LOOKBOOK & STREETWEAR MOMENTS
          </p>
        </div>

        {/* 5-Column Photo Showcase */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
          {posts.map((post) => (
            <div
              key={post.id}
              onClick={() => handleOpenPost(post)}
              className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-neutral-200 cursor-pointer shadow-sm hover:shadow-md transition-all duration-300"
            >
              {/* Photo */}
              <img
                src={post.image}
                alt={post.caption}
                className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
              />

              {/* Hover Dark Overlay with Stats & Icon */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3 sm:p-4 text-white">
                <div className="flex justify-end">
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <Instagram className="w-4 h-4 text-white" />
                  </div>
                </div>

                <div className="space-y-1 text-left">
                  <p className="text-xs font-bold text-amber-300">{post.username}</p>
                  <p className="text-[11px] text-neutral-200 line-clamp-2">{post.caption}</p>
                  <div className="flex items-center space-x-3 pt-1 text-[11px] text-neutral-300">
                    <span className="flex items-center space-x-1">
                      <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                      <span>{post.likes}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{post.comments}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instagram Photo Modal */}
      {activeModalPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setActiveModalPost(null)}
        >
          <div
            className="bg-white rounded-2xl overflow-hidden max-w-2xl w-full grid grid-cols-1 md:grid-cols-2 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveModalPost(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/50 hover:bg-black text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Image */}
            <div className="aspect-square md:aspect-auto bg-neutral-900">
              <img
                src={activeModalPost.image}
                alt={activeModalPost.caption}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Modal Content */}
            <div className="p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2.5 mb-4">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white font-bold text-xs">
                    {activeModalPost.username.charAt(1).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900">{activeModalPost.username}</h4>
                    <p className="text-[10px] text-neutral-500">Verified Community Member</p>
                  </div>
                </div>

                <p className="text-xs text-neutral-700 leading-relaxed mb-4">
                  {activeModalPost.caption}
                </p>

                {activeModalPost.taggedShirtName && (
                  <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 mb-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      FEATURED ITEM
                    </p>
                    <p className="text-xs font-semibold text-neutral-900 mt-0.5">
                      {activeModalPost.taggedShirtName}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-4 border-t border-neutral-100">
                <div className="flex items-center justify-between text-xs text-neutral-600">
                  <span className="flex items-center space-x-1">
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                    <span>{activeModalPost.likes} likes</span>
                  </span>
                  <span>{activeModalPost.comments} comments</span>
                </div>

                {activeModalPost.taggedShirtId && onSelectProductById && (
                  <button
                    onClick={() => handleShopLook(activeModalPost)}
                    className="w-full py-2.5 rounded-full bg-neutral-900 hover:bg-black text-white font-semibold text-xs flex items-center justify-center space-x-2 transition active:scale-95"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>SHOP THIS LOOK</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
