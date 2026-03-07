import './globals.css'

export const metadata = {
  title: 'Medicine Dose Tracker',
  description: 'Track your medicine doses easily',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
