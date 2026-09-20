import { Navigate, Route, Routes, useLocation } from 'react-router'
import { TabBar } from './components/TabBar'
import { UpdatePrompt } from './components/UpdatePrompt'
import { BookPage } from './pages/BookPage'
import { ChordLibraryPage } from './pages/ChordLibraryPage'
import { ChordPage } from './pages/ChordPage'
import { HomePage } from './pages/HomePage'
import { NewSongPage } from './pages/NewSongPage'
import { SetlistPage } from './pages/SetlistPage'
import { SongEditPage } from './pages/SongEditPage'
import { SongPage } from './pages/SongPage'

export default function App() {
  const { pathname } = useLocation()
  const fullscreen = pathname.startsWith('/song/') || pathname === '/new'
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/book" element={<BookPage />} />
        <Route path="/chords" element={<ChordLibraryPage />} />
        <Route path="/chord/:name" element={<ChordPage />} />
        <Route path="/song/:id" element={<SongPage />} />
        <Route path="/song/:id/edit" element={<SongEditPage />} />
        <Route path="/new" element={<NewSongPage />} />
        <Route path="/setlist/:id" element={<SetlistPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!fullscreen && <TabBar />}
      <UpdatePrompt />
    </div>
  )
}
