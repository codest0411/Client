import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState('free');

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '₹0',
      period: '',
      color: 'blue',
      features: [
        'Up to 10 transcriptions/month',
        'Basic support',
        'Standard audio quality',
        'Email support'
      ],
      buttonText: 'Current Plan',
      buttonAction: () => {},
      popular: false
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '₹499',
      period: '/mo',
      color: 'green',
      features: [
        'Up to 100 transcriptions/month',
        'Priority support',
        'High-quality audio processing',
        'Live chat support',
        'Export to multiple formats'
      ],
      buttonText: 'Upgrade to Pro',
      buttonAction: () => handleUpgrade('pro'),
      popular: true
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '₹999',
      period: '/mo',
      color: 'purple',
      features: [
        'Unlimited transcriptions',
        '24/7 priority support',
        'Ultra HD audio processing',
        'Phone & email support',
        'Advanced editing tools',
        'Team collaboration',
        'API access'
      ],
      buttonText: 'Upgrade to Premium',
      buttonAction: () => handleUpgrade('premium'),
      popular: false
    }
  ];

  const handleUpgrade = (plan) => {
    // Here you would integrate with your payment system
    alert(`Upgrading to ${plan} plan. Payment integration coming soon!`);
  };

  const getColorClasses = (color) => {
    const colorMap = {
      blue: {
        border: 'border-blue-500',
        button: 'bg-blue-600 hover:bg-blue-700',
        text: 'text-blue-600'
      },
      green: {
        border: 'border-green-500',
        button: 'bg-green-600 hover:bg-green-700',
        text: 'text-green-600'
      },
      purple: {
        border: 'border-purple-500',
        button: 'bg-purple-600 hover:bg-purple-700',
        text: 'text-purple-600'
      }
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Pricing & Plans
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Choose the perfect plan for your transcription needs. Start free and upgrade as you grow.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const colors = getColorClasses(plan.color);
            const isSelected = selectedPlan === plan.id;
            
            return (
              <div
                key={plan.id}
                className={`relative bg-gray-800 rounded-2xl p-8 border-2 transition-all duration-300 hover:scale-105 ${
                  isSelected ? colors.border : 'border-gray-700'
                } ${plan.popular ? 'ring-2 ring-green-500 ring-opacity-50' : ''}`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className={`text-2xl font-bold ${colors.text} mb-2`}>
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-gray-400 text-lg">{plan.period}</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-gray-300">
                      <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Action Button */}
                <button
                  onClick={plan.buttonAction}
                  className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors duration-200 ${
                    plan.id === 'free' 
                      ? 'bg-gray-600 cursor-not-allowed' 
                      : colors.button
                  }`}
                  disabled={plan.id === 'free'}
                >
                  {plan.buttonText}
                </button>
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <div className="bg-gray-800 rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">
              All Plans Include
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-white font-semibold mb-2">Secure & Private</h4>
                <p className="text-gray-400 text-sm">Your audio files and transcriptions are encrypted and secure</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="text-white font-semibold mb-2">Fast Processing</h4>
                <p className="text-gray-400 text-sm">Get your transcriptions in seconds with our AI-powered system</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h4 className="text-white font-semibold mb-2">Easy to Use</h4>
                <p className="text-gray-400 text-sm">Simple interface designed for the best user experience</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h3 className="text-3xl font-bold text-white text-center mb-8">
            Frequently Asked Questions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h4 className="text-white font-semibold mb-2">Can I change plans anytime?</h4>
              <p className="text-gray-400 text-sm">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <h4 className="text-white font-semibold mb-2">What audio formats are supported?</h4>
              <p className="text-gray-400 text-sm">We support MP3, WAV, M4A, OGG, and most common audio formats up to 60 minutes.</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <h4 className="text-white font-semibold mb-2">Is there a free trial?</h4>
              <p className="text-gray-400 text-sm">Yes! Start with our free plan and upgrade when you need more features.</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <h4 className="text-white font-semibold mb-2">How accurate are the transcriptions?</h4>
              <p className="text-gray-400 text-sm">Our AI achieves 95%+ accuracy for clear audio. Higher plans offer enhanced processing.</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8">
            <h3 className="text-3xl font-bold text-white mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-blue-100 mb-6 text-lg">
              Join thousands of users who trust Transcripto for their transcription needs.
            </p>
            <Link
              to="/transcription"
              className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
            >
              Start Transcribing Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 