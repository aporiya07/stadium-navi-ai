import { ViewSwitcher } from './components/ViewSwitcher'
import { ToastProvider } from './components/Toast'

function App() {
  return (
    <ToastProvider>
      <ViewSwitcher />
    </ToastProvider>
  )
}

export default App