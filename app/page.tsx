import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Browserless PJE
        </h1>
        <p className="text-xl text-center mb-8 text-muted-foreground">
          Plataforma de automação de navegadores e raspagem de dados do PJE (Processo Judicial Eletrônico)
        </p>
        <div className="flex flex-col gap-4 items-center">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Acessar Dashboard
          </Link>
          <p className="text-sm text-muted-foreground">
            Baseado em Browserless • Automação PJE TRT3
          </p>
        </div>
      </div>
    </main>
  );
}
