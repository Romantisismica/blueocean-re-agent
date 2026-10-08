import type { ReactNode } from 'react';

export const metadata = {
  title: 'BlueOcean RE · Dashboard',
  description: 'Océanos Azules inmobiliarios en Sabaneta y Envigado, en tiempo real.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          background: '#0b1220',
          color: '#e6edf7',
          fontFamily: 'system-ui, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {children}
      </body>
    </html>
  );
}
