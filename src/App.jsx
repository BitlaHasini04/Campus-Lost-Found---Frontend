
import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('http://localhost:8081/api/items')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load items')
        }
        return response.json()
      })
      .then((data) => {
        setItems(data)
        setLoading(false)
      })
      .catch(() => {
        setError('Could not load items. Please check the backend.')
        setLoading(false)
      })
  }, [])

  return (
    <div className="app">
      <header className="header">
        <h1>Campus Lost & Found</h1>
        <p>Lost something on campus? Let's help you find it!</p>
      </header>

      <main className="container">
        <h2>Recently Reported Items</h2>

        {loading && <p>Loading items...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && !error && items.length === 0 && (
          <p>No items have been reported yet.</p>
        )}

        <div className="item-list">
          {items.map((item) => (
            <article className="item-card" key={item.id}>
              <span className={item.type === 'LOST' ? 'lost' : 'found'}>
                {item.type}
              </span>

              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <p><strong>Category:</strong> {item.category}</p>
              <p><strong>Location:</strong> {item.location}</p>
              <p><strong>Date:</strong> {item.date}</p>
            </article>
          ))}
        </div>
      </main>
    </div>
  )
}

export default App
