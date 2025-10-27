export default function TestPage() {
  return (
    <div className="min-h-screen bg-blue-500 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Tailwind CSS Test</h1>
        <p className="text-lg text-gray-600 mb-6">If you can see this styled properly, Tailwind is working!</p>
        <div className="space-y-4">
          <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium">
            Green Button
          </button>
          <button className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium">
            Red Button
          </button>
          <div className="bg-yellow-200 p-4 rounded">
            <p className="text-yellow-800">Yellow background box</p>
          </div>
        </div>
      </div>
    </div>
  )
}
