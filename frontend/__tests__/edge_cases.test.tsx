import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UploadZone } from '@/components/UploadZone'
import DashboardPage from '@/app/page'
import { TransactionProvider } from '@/context/TransactionContext'
import React from 'react'

// Mocking Next Themes
vi.mock('next-themes', () => ({
    useTheme: () => ({ theme: 'dark', setTheme: vi.fn() }),
    ThemeProvider: ({ children }: any) => <>{children}</>
}))

// Mocking Tremor
vi.mock('@tremor/react', () => ({
    BarChart: () => <div data-testid="bar-chart" />,
    AreaChart: () => <div data-testid="area-chart" />,
}))

// Mocking Lucide icons
vi.mock('lucide-react', () => {
    const mockComponent = (name: string) => (props: any) => <span data-testid={`icon-${name}`}>{name}</span>
    return {
        Upload: mockComponent('Upload'),
        X: mockComponent('X'),
        CheckCircle2: mockComponent('CheckCircle2'),
        Loader2: mockComponent('Loader2'),
        Search: mockComponent('Search'),
        Calendar: mockComponent('Calendar'),
        Play: mockComponent('Play'),
        Sparkles: mockComponent('Sparkles'),
        FilterX: mockComponent('FilterX'),
        ChevronUp: mockComponent('ChevronUp'),
        ChevronDown: mockComponent('ChevronDown'),
        HelpCircle: mockComponent('HelpCircle'),
        ArrowUpRight: mockComponent('ArrowUpRight'),
        ArrowDownRight: mockComponent('ArrowDownRight'),
        RefreshCw: mockComponent('RefreshCw'),
        Download: mockComponent('Download'),
        Settings: mockComponent('Settings'),
        Moon: mockComponent('Moon'),
        Sun: mockComponent('Sun'),
        Monitor: mockComponent('Monitor'),
        CheckSquare: mockComponent('CheckSquare'),
        Square: mockComponent('Square'),
        Info: mockComponent('Info'),
        Lock: mockComponent('Lock'),
        History: mockComponent('History'),
        TrendingUp: mockComponent('TrendingUp'),
        List: mockComponent('List'),
        Edit: mockComponent('Edit'),
        Trash2: mockComponent('Trash2'),
        Plus: mockComponent('Plus'),
        Eye: mockComponent('Eye'),
        EyeOff: mockComponent('EyeOff'),
        ArrowRight: mockComponent('ArrowRight'),
        ArrowLeft: mockComponent('ArrowLeft'),
        DollarSign: mockComponent('DollarSign'),
        CreditCard: mockComponent('CreditCard'),
        PieChart: mockComponent('PieChart'),
        BarChart: mockComponent('BarChart'), // Note: Tremor also has BarChart, conflict possible but icons are usually separate
        Clock: mockComponent('Clock'),
    }
})

// Mocking react-dropzone
vi.mock('react-dropzone', () => ({
    useDropzone: vi.fn()
}))

import { useDropzone } from 'react-dropzone'

describe('Frontend Edge Cases', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        global.fetch = vi.fn()
    })

    it('should display empty state message', () => {
        (useDropzone as any).mockReturnValue({
            getRootProps: () => ({}),
            getInputProps: () => ({}),
            isDragActive: false
        })

        render(
            <TransactionProvider>
                <DashboardPage />
            </TransactionProvider>
        )

        // In DashboardPage, it shows "Echtheits-Simulation" when no transactions
        expect(screen.getByText(/Echtheits-Simulation/i)).toBeDefined()
    })

    it('should show error toast on 500 API response', async () => {
        (useDropzone as any).mockReturnValue({
            getRootProps: () => ({}),
            getInputProps: () => ({}),
            isDragActive: false
        })

            // Mock fetch to fail
            ; (global.fetch as any).mockResolvedValue({
                ok: false,
                status: 500,
                json: async () => ({ error: 'Upload fehlgeschlagen' })
            })

        const testFile = new File(['test'], 'test.csv', { type: 'text/csv' })

        // Render component with initial file
        render(<UploadZone onUploadSuccess={vi.fn()} onDemoClick={vi.fn()} initialFile={testFile} />)

        // Find and click submit button
        const submitButton = screen.getByTestId('submit-button')
        fireEvent.click(submitButton)

        // Check if error message appears
        await waitFor(() => {
            expect(screen.getByTestId('error-message')).toBeDefined()
            expect(screen.getByText(/Upload fehlgeschlagen/i)).toBeDefined()
        })
    })

    it('should disable submit button if input is empty', () => {
        (useDropzone as any).mockReturnValue({
            getRootProps: () => ({}),
            getInputProps: () => ({}),
            isDragActive: false
        })

        render(<UploadZone onUploadSuccess={vi.fn()} onDemoClick={vi.fn()} />)

        // "Analyse starten" is the submit button, it should be absent (hidden) when no file is present
        const submitButton = screen.queryByTestId('submit-button')
        expect(submitButton).toBeNull()
    })
})
