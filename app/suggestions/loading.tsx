import Loading from "@/components/Loading";

export default function SuggestionsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Recipe Suggestions</h1>
      <p className="text-gray-600 mb-8">
        Loading personalized recipe suggestions...
      </p>
      
      <div className="flex justify-center items-center py-16">
        <Loading />
      </div>
    </div>
  );
}
