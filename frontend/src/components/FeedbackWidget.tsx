'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, X, Send, Star, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

type FeedbackType = 'bug' | 'feature' | 'general' | 'praise';

interface FeedbackWidgetProps {
  position?: 'bottom-right' | 'bottom-left';
}

export default function FeedbackWidget({ position = 'bottom-right' }: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('general');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  // Reset form when closing
  useEffect(() => {
    if (!isOpen) {
      // Delay reset to allow close animation
      const timer = setTimeout(() => {
        if (!isOpen) {
          setIsSubmitted(false);
          setFeedbackType('general');
          setMessage('');
          setEmail('');
          setRating(null);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);

    try {
      await api.submitFeedback({
        type: feedbackType,
        message: message.trim(),
        email: email.trim() || null,
        rating,
        page: window.location.pathname,
        userAgent: navigator.userAgent,
      });
      setIsSubmitted(true);
      // Auto-close after success
      setTimeout(() => setIsOpen(false), 2500);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const feedbackTypes: { value: FeedbackType; label: string; emoji: string }[] = [
    { value: 'bug', label: 'Bug', emoji: '🐛' },
    { value: 'feature', label: 'Feature', emoji: '💡' },
    { value: 'general', label: 'General', emoji: '💬' },
    { value: 'praise', label: 'Praise', emoji: '❤️' },
  ];

  const positionClasses = position === 'bottom-right' 
    ? 'right-4 sm:right-6' 
    : 'left-4 sm:left-6';

  return (
    <>
      {/* Floating Button - subtle, semi-transparent */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 sm:bottom-6 ${positionClasses} z-40
          w-10 h-10 sm:w-12 sm:h-12 rounded-full 
          bg-gray-900/80 hover:bg-gray-900 text-white
          shadow-lg hover:shadow-xl
          transition-all duration-300 ease-out
          hover:scale-110 active:scale-95
          backdrop-blur-sm
          flex items-center justify-center
          group`}
        aria-label="Send feedback"
      >
        <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110" />
        
        {/* Tooltip */}
        <span className={`absolute ${position === 'bottom-right' ? 'right-full mr-3' : 'left-full ml-3'} 
          px-2 py-1 rounded bg-gray-900 text-white text-xs font-medium
          opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap
          pointer-events-none`}>
          Send feedback
        </span>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm
            transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Modal */}
      <div className={`fixed z-50
        ${position === 'bottom-right' ? 'right-4 sm:right-6' : 'left-4 sm:left-6'}
        bottom-20 sm:bottom-24
        w-[calc(100vw-2rem)] sm:w-96 max-w-md
        max-h-[calc(100vh-8rem)] sm:max-h-[calc(100vh-10rem)]
        transition-all duration-300 ease-out
        ${isOpen
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none'
        }`}>
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col max-h-full">
          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-gray-700" />
                <h3 className="font-semibold text-gray-900">Send Feedback</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 
                  hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          {isSubmitted ? (
            /* Success State */
            <div className="px-5 py-10 text-center">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Thank you!</h4>
              <p className="text-gray-500 text-sm">
                Your feedback helps us improve FixFlow.
              </p>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Feedback Type */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Feedback Type
                </label>
                <div className="flex gap-2">
                  {feedbackTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFeedbackType(type.value)}
                      className={`flex-1 px-2 py-2 rounded-lg text-xs font-medium
                        transition-all duration-200 border
                        ${feedbackType === type.value
                          ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      <span className="block text-base mb-0.5">{type.emoji}</span>
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating (optional) */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  How are we doing? <span className="text-gray-400 font-normal normal-case">(optional)</span>
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(rating === star ? null : star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star 
                        className={`w-6 h-6 transition-colors ${
                          (hoverRating !== null ? star <= hoverRating : star <= (rating || 0))
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Your Feedback *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What's on your mind? Share your thoughts, report a bug, or suggest a feature..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 
                    focus:border-gray-400 focus:ring-2 focus:ring-gray-100
                    text-sm text-gray-700 placeholder:text-gray-400
                    resize-none transition-all"
                  rows={4}
                  required
                />
              </div>

              {/* Email (optional) */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Email <span className="text-gray-400 font-normal normal-case">(if you'd like a reply)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 
                    focus:border-gray-400 focus:ring-2 focus:ring-gray-100
                    text-sm text-gray-700 placeholder:text-gray-400
                    transition-all"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!message.trim() || isSubmitting}
                className="w-full py-3 rounded-xl bg-gray-900 text-white font-medium
                  hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed
                  transition-all duration-200
                  flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Feedback
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer */}
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              Your feedback is anonymous unless you provide an email.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}