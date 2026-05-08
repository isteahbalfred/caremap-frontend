import { Routes, Route } from 'react-router-dom'

function App() {
  return (
    <Routes>
      <Route path="/" element={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-primary-700 mb-2">
              🗺️ CareMap
            </h1>
            <p className="text-gray-500">
              Trouvez vos médicaments, près de vous, en un clic.
            </p>
            <span className="inline-block mt-4 px-4 py-2 bg-success text-white rounded-full text-sm">
              Frontend opérationnel ✅
            </span>
          </div>
        </div>
      } />
    </Routes>
  )
}

export default App