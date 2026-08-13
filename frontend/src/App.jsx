import { useState } from 'react'
import Header from './assets/components/Header.jsx'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
     <p>welcome</p>
     < Header/>
    </>
  )
}

export default App
