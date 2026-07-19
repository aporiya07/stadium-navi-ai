import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { ViewSwitcher } from './components/ViewSwitcher'
import { FanView } from './views/FanView/FanView'
import { OpsDashboard } from './views/OpsDashboard/OpsDashboard'

// Mock the child components to avoid deep rendering issues in simple tests
vi.mock('./views/FanView/FanView', () => ({
  FanView: () => <div data-testid="fan-view">Fan View</div>
}))

vi.mock('./views/OpsDashboard/OpsDashboard', () => ({
  OpsDashboard: () => <div data-testid="ops-view">Ops View</div>
}))

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

describe('Stadium Copilot App Rendering', () => {
  it('renders the FanView by default', () => {
    const client = createTestQueryClient()
    render(
      <QueryClientProvider client={client}>
        <App />
      </QueryClientProvider>
    )
    expect(screen.getByTestId('fan-view')).toBeInTheDocument()
  })

  it('renders ViewSwitcher properly', () => {
    const mockOnChange = vi.fn()
    render(<ViewSwitcher currentView="fan" onChange={mockOnChange} />)
    
    // Check if the tabs exist
    expect(screen.getByText('Fan View')).toBeInTheDocument()
    expect(screen.getByText('Ops Dashboard')).toBeInTheDocument()
  })
})
