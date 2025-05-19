import React, { useState } from "react";
import Link from "next/link";

function OnboardingWizard() {
  const [step, setStep] = useState(1);

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-emerald-700 mb-6">Welcome to MacroChef</h1>
        {step === 1 && (
          <div>
            <h2 className="text-xl text-emerald-600 mb-4">Step 1: Profile Setup</h2>
            <p className="text-gray-600 mb-4">Let&apos;s set up your profile to personalize your experience.</p>
            {/* Form fields for profile setup */}
            <button onClick={nextStep} className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 transition-colors">
              Next
            </button>
          </div>
        )}
        {step === 2 && (
          <div>
            <h2 className="text-xl text-emerald-600 mb-4">Step 2: Dietary Goals</h2>
            <p className="text-gray-600 mb-4">Define your macro and health goals.</p>
            {/* Form fields for goals */}
            <div className="flex justify-between">
              <button onClick={prevStep} className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors">
                Back
              </button>
              <button onClick={nextStep} className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 transition-colors">
                Next
              </button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div>
            <h2 className="text-xl text-emerald-600 mb-4">Step 3: Get Started</h2>
            <p className="text-gray-600 mb-4">You&apos;re all set! Explore MacroChef and start planning your meals.</p>
            <Link href="/meal-plan" className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 transition-colors block text-center">
              Start Planning
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default OnboardingWizard; 