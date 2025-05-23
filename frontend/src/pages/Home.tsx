import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import logo from '../assets/logo.png'

function Home() {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/signin')
    }, 3000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="h-screen w-full bg-gradient-to-br from-blue-700 via-blue-500 to-blue-300 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2 }}
        className="flex flex-col items-center"
      >
        <img
          src={logo}
          alt="NeuroLook logo"
          className="w-40 h-40 mb-6 drop-shadow-2xl"
        />
        <h1 className="text-6xl font-extrabold text-white drop-shadow-lg">NeuroLook</h1>
        <p className="text-white text-2xl mt-3 italic drop-shadow">See Early. Support Better.</p>
      </motion.div>
    </div>
  )
}

export default Home
