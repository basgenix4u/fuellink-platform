// src/app/depot/ratings/page.tsx

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Star,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  ThumbsUp,
  Filter,
  Search,
  Calendar,
  User,
} from "lucide-react";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { cn, formatRelativeTime } from "@/lib/utils";

interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  orderNumber: string;
  product: string;
  createdAt: string;
  helpful: number;
  response?: string;
}

const reviews: Review[] = [
  {
    id: "rev-1",
    customerName: "Sahara Energy Resources",
    rating: 5,
    comment:
      "Excellent service! Loading was completed in record time. The staff was professional and the product quality was top-notch. Will definitely continue doing business here.",
    orderNumber: "ORD-2025-001234",
    product: "AGO",
    createdAt: "2025-02-19T14:30:00Z",
    helpful: 12,
    response:
      "Thank you for your kind words! We strive to provide the best service possible. Looking forward to serving you again!",
  },
  {
    id: "rev-2",
    customerName: "Matrix Petroleum Ltd",
    rating: 4,
    comment:
      "Good experience overall. Loading time was reasonable. Would appreciate if the gate processing could be faster during peak hours.",
    orderNumber: "ORD-2025-001233",
    product: "PMS",
    createdAt: "2025-02-18T16:45:00Z",
    helpful: 8,
  },
  {
    id: "rev-3",
    customerName: "Golden Oil Company",
    rating: 5,
    comment:
      "Outstanding depot! Best prices in Lagos and the escrow system gives us peace of mind. The QR verification process is seamless.",
    orderNumber: "ORD-2025-001232",
    product: "AGO",
    createdAt: "2025-02-18T11:30:00Z",
    helpful: 15,
  },
  {
    id: "rev-4",
    customerName: "Premier Fuel Distributors",
    rating: 3,
    comment:
      "Average experience. Product quality was fine but had to wait 2 hours for loading due to high traffic. Communication could be better.",
    orderNumber: "ORD-2025-001231",
    product: "DPK",
    createdAt: "2025-02-17T09:15:00Z",
    helpful: 5,
    response:
      "We apologize for the delay. We are working on improving our queue management system to reduce wait times. Thank you for your feedback.",
  },
  {
    id: "rev-5",
    customerName: "National Oil Marketers",
    rating: 5,
    comment:
      "This depot is a game changer! FuelLink makes the whole process transparent. No more hidden costs or surprises. Highly recommended!",
    orderNumber: "ORD-2025-001230",
    product: "AGO",
    createdAt: "2025-02-16T15:00:00Z",
    helpful: 20,
  },
  {
    id: "rev-6",
    customerName: "Swift Petroleum Services",
    rating: 4,
    comment:
      "Very satisfied with the service. The depot is well organized and the staff knows what they are doing. Minor delay but nothing significant.",
    orderNumber: "ORD-2025-001229",
    product: "PMS",
    createdAt: "2025-02-15T10:30:00Z",
    helpful: 6,
  },
];

const ratingStats = {
  average: 4.8,
  total: 342,
  distribution: [
    { stars: 5, count: 245, percentage: 72 },
    { stars: 4, count: 68, percentage: 20 },
    { stars: 3, count: 20, percentage: 6 },
    { stars: 2, count: 6, percentage: 2 },
    { stars: 1, count: 3, percentage: 1 },
  ],
  trends: {
    thisMonth: 4.9,
    lastMonth: 4.7,
    change: 0.2,
  },
};

function StarRating({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizeClasses[size],
            star <= rating
              ? "text-yellow-400 fill-yellow-400"
              : "text-slate-300"
          )}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const [showFullComment, setShowFullComment] = useState(false);
  const isLongComment = review.comment.length > 200;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-lg font-bold text-primary-600">
              {review.customerName.charAt(0)}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">
              {review.customerName}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <StarRating rating={review.rating} size="sm" />
              <span className="text-sm text-slate-500">
                {formatRelativeTime(review.createdAt)}
              </span>
            </div>
          </div>
        </div>
        <Badge variant="default">{review.product}</Badge>
      </div>

      {/* Comment */}
      <p className="text-slate-700 mb-4">
        {isLongComment && !showFullComment
          ? `${review.comment.slice(0, 200)}...`
          : review.comment}
        {isLongComment && (
          <button
            onClick={() => setShowFullComment(!showFullComment)}
            className="ml-1 text-primary-600 hover:text-primary-700 font-medium"
          >
            {showFullComment ? "Show less" : "Read more"}
          </button>
        )}
      </p>

      {/* Order Reference */}
      <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
        <span>Order: {review.orderNumber}</span>
        <span className="flex items-center gap-1">
          <ThumbsUp className="w-4 h-4" />
          {review.helpful} found helpful
        </span>
      </div>

      {/* Response */}
      {review.response && (
        <div className="bg-slate-50 rounded-xl p-4 border-l-4 border-primary-500">
          <p className="text-sm font-semibold text-slate-900 mb-2">
            Depot Response
          </p>
          <p className="text-sm text-slate-600">{review.response}</p>
        </div>
      )}

      {/* Actions */}
      {!review.response && (
        <Button variant="ghost" size="sm" className="mt-4">
          <MessageSquare className="w-4 h-4 mr-2" />
          Respond to Review
        </Button>
      )}
    </motion.div>
  );
}

export default function RatingsPage() {
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredReviews = reviews.filter((review) => {
    const matchesRating = filterRating === null || review.rating === filterRating;
    const matchesSearch =
      review.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRating && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ratings & Reviews</h1>
          <p className="text-slate-500">
            See what customers are saying about your depot
          </p>
        </div>
        <Button variant="outline" size="md">
          <Calendar className="w-4 h-4 mr-2" />
          This Month
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-6">
        {/* Average Rating */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-center"
        >
          <div className="text-5xl font-bold text-slate-900 mb-2">
            {ratingStats.average}
          </div>
          <StarRating rating={Math.round(ratingStats.average)} size="lg" />
          <p className="text-sm text-slate-500 mt-2">
            Based on {ratingStats.total} reviews
          </p>
          <div
            className={cn(
              "flex items-center justify-center gap-1 mt-4 text-sm font-medium",
              ratingStats.trends.change > 0 ? "text-success-600" : "text-danger-600"
            )}
          >
            {ratingStats.trends.change > 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>
              {ratingStats.trends.change > 0 ? "+" : ""}
              {ratingStats.trends.change} from last month
            </span>
          </div>
        </motion.div>

        {/* Rating Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
        >
          <h3 className="font-semibold text-slate-900 mb-4">
            Rating Distribution
          </h3>
          <div className="space-y-3">
            {ratingStats.distribution.map((item) => (
              <div key={item.stars} className="flex items-center gap-3">
                <button
                  onClick={() =>
                    setFilterRating(filterRating === item.stars ? null : item.stars)
                  }
                  className={cn(
                    "flex items-center gap-1 w-16 text-sm font-medium transition-colors",
                    filterRating === item.stars
                      ? "text-primary-600"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  {item.stars}
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                </button>
                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percentage}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="h-full bg-yellow-400 rounded-full"
                  />
                </div>
                <span className="w-12 text-right text-sm text-slate-500">
                  {item.count}
                </span>
                <span className="w-12 text-right text-sm font-medium text-slate-700">
                  {item.percentage}%
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reviews..."
            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterRating === null ? "primary" : "outline"}
            size="md"
            onClick={() => setFilterRating(null)}
          >
            All
          </Button>
          {[5, 4, 3, 2, 1].map((rating) => (
            <Button
              key={rating}
              variant={filterRating === rating ? "primary" : "outline"}
              size="md"
              onClick={() => setFilterRating(rating)}
              className="gap-1"
            >
              {rating}
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            </Button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {filteredReviews.map((review, index) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <ReviewCard review={review} />
          </motion.div>
        ))}

        {filteredReviews.length === 0 && (
          <div className="py-12 text-center">
            <Star className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">
              No reviews found
            </h3>
            <p className="text-slate-500">
              {searchQuery || filterRating
                ? "Try adjusting your filters"
                : "Reviews will appear here when customers leave feedback"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}