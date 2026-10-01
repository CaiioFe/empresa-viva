import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useSessao } from '@/app/sessao'
import { Button } from '@/components/ui'
import { Marca } from '@/components/layout/app-shell'
import { NOME_DO_PAPEL } from '@/lib/permissoes'
import type { Perfil } from '@/lib/tipos'

const NOME_DO_PERFIL: Record<Perfil, string> = {
  comercio: 'Comércio',
  frota: 'Serviço com frota',
  clinica: 'Clínica',
  outro: 'Empresa',
}

export function PaginaEmpresas() {
  const { vinculos, escolherEmpresa, sair } = useSessao()
  const navegar = useNavigate()

  return (
    <main className="mx-auto flex min-h-svh max-w-lg flex-col justify-center px-6 py-10">
      <Marca className="mb-10" />
      <p className="text-[13px] font-medium text-apagado">Suas empresas</p>
      <h1 className="mt-1 text-titulo font-semibold tracking-tight text-tinta">Qual empresa agora?</h1>
      <ul className="mt-7 flex flex-col gap-2">
        {vinculos.map((v) => (
          <li key={v.empresa.id}>
            <button
              type="button"
              onClick={() => {
                escolherEmpresa(v.empresa.id)
                navegar('/')
              }}
              className="flex w-full items-center gap-3 rounded-caixa bg-superficie px-4 py-3.5 text-left shadow-painel transition-transform hover:-translate-y-0.5"
            >
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-tinta">{v.empresa.nome}</span>
                <span className="block text-xs text-apagado">
                  {NOME_DO_PERFIL[v.empresa.perfil]} · {NOME_DO_PAPEL[v.papel]}
                </span>
              </span>
              <ChevronRight size={18} className="text-apagado" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <Button variante="fantasma" className="mt-6 self-start" onClick={() => void sair()}>
        Sair
      </Button>
    </main>
  )
}

export function PaginaSemAcesso() {
  const { sair } = useSessao()
  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-6 py-10">
      <h1 className="text-titulo text-tinta font-semibold tracking-tight">Seu acesso ainda não foi liberado</h1>
      <p className="mt-3 text-tinta-2">
        Você entrou, mas ainda não está ligado a nenhuma empresa. Peça para o responsável da empresa liberar o seu acesso.
      </p>
      <Button variante="secundario" className="mt-6 self-start" onClick={() => void sair()}>
        Sair
      </Button>
    </main>
  )
}
