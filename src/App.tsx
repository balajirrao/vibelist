import { useAuthStore } from './store/authStore'
import { TokenEntry } from './components/auth/TokenEntry'
import { Header } from './components/layout/Header'
import { SectionList } from './components/section/SectionList'

function App() {
  const token = useAuthStore((s) => s.token)

  if (!token) {
    return <TokenEntry />
  }

  return (
    <div className="safe-area">
      <Header />
      <main>
        <SectionList />
      </main>
    </div>
  )
}

export default App
