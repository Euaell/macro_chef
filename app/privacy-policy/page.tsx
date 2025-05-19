import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | MacroChef",
  description: "Read MacroChef's privacy policy and learn how we protect your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <section className="max-w-2xl mx-auto bg-white/90 rounded-xl shadow-lg p-8 mt-8 animate-fade-in-up">
      <h1 className="text-3xl font-bold mb-4 text-emerald-800">Privacy Policy</h1>
      <p className="mb-4 text-gray-700">
        Your privacy is important to us. This Privacy Policy explains how MacroChef collects, uses, and protects your information.
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-2 text-emerald-700">Information We Collect</h2>
      <ul className="list-disc list-inside text-gray-700 mb-4">
        <li>Account information (email, name, etc.)</li>
        <li>Recipes, meals, and nutrition data you provide</li>
        <li>Usage data (for improving the app)</li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2 text-emerald-700">How We Use Your Information</h2>
      <ul className="list-disc list-inside text-gray-700 mb-4">
        <li>To provide and improve MacroChef services</li>
        <li>To communicate with you about your account</li>
        <li>To ensure security and prevent abuse</li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2 text-emerald-700">Your Rights</h2>
      <ul className="list-disc list-inside text-gray-700 mb-4">
        <li>You can request deletion of your data at any time</li>
        <li>Contact us at <a href="mailto:support@macrochef.com" className="underline text-emerald-700">support@macrochef.com</a></li>
      </ul>
      <p className="text-gray-500 text-sm mt-8">This policy may be updated from time to time. Please check back for updates.</p>
    </section>
  );
} 