// src/components/StarRating.jsx

import React from 'react';
import { FiStar } from 'react-icons/fi';

// Recebe uma nota de 0 a 10 e exibe 5 estrelas correspondentes
const StarRating = ({ rating = 0 }) => {
  const totalStars = 5;
  let fullStars = Math.floor(rating / 2);
  let halfStar = rating % 2 >= 1 ? 1 : 0;
  let emptyStars = totalStars - fullStars - halfStar;

  return (
    <div className="flex items-center">
      {[...Array(fullStars)].map((_, i) => (
        <FiStar key={`full-${i}`} className="text-yellow-400 fill-current" size={24} />
      ))}
      {halfStar === 1 && (
        <div className="relative">
          <FiStar className="text-gray-600" size={24} />
          <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
            <FiStar className="text-yellow-400 fill-current" size={24} />
          </div>
        </div>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <FiStar key={`empty-${i}`} className="text-gray-600" size={24} />
      ))}
    </div>
  );
};

export default StarRating;