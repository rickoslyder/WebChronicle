import { Metadata } from 'next'
import { DataExport } from '@/components/export/data-export'
import { AppLayout } from '@/components/app-layout'


export const metadata: Metadata = {
  title: 'Export Data | WebChronicle',
  description: 'Export your browsing history data in various formats',
}

export default function ExportPage() {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <DataExport />
      </div>
    </AppLayout>
  )
}