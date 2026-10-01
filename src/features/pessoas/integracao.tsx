import { Aviso, Card, Pill } from '@/components/ui'
import { formatarDataCompleta } from '@/lib/formatos'
import { useIntegracaoDoColaborador, useMarcarEtapa } from './api'
import { Carregando, ErroAoCarregar, erroAoSalvar } from './estados'
import {
  contarConcluidas,
  hojeNoFuso,
  marcarFechaAIntegracao,
  ROTULO_DA_INTEGRACAO,
  statusDaIntegracao,
  TOM_DA_INTEGRACAO,
} from './regras'

export function CartaoIntegracao({ colaboradorId, podeMarcar }: { colaboradorId: string; podeMarcar: boolean }) {
  const consulta = useIntegracaoDoColaborador(colaboradorId)
  const marcar = useMarcarEtapa()

  if (consulta.isPending) {
    return (
      <Card titulo="Integração">
        <Carregando texto="Carregando a integração..." />
      </Card>
    )
  }
  if (consulta.isError) {
    return (
      <Card titulo="Integração">
        <ErroAoCarregar onTentar={() => void consulta.refetch()} />
      </Card>
    )
  }

  const { etapas, concluidas } = consulta.data
  const ativas = etapas.map((e) => e.id)
  const feitas = concluidas.map((c) => c.etapa_id)
  const quandoConcluiu = new Map(concluidas.map((c) => [c.etapa_id, c.concluida_em]))
  const total = contarConcluidas(ativas, feitas)
  const status = statusDaIntegracao(ativas.length, total)

  if (etapas.length === 0) {
    return (
      <Card titulo="Integração">
        <p className="text-sm text-apagado">
          A empresa ainda não tem etapas de integração. O Dono cria as etapas em Configurações.
        </p>
      </Card>
    )
  }

  return (
    <Card titulo="Integração" acao={<Pill tom={TOM_DA_INTEGRACAO[status]}>{ROTULO_DA_INTEGRACAO[status]}</Pill>}>
      <p className="mb-3 text-xs text-apagado">
        {total} de {ativas.length} {ativas.length === 1 ? 'etapa concluída' : 'etapas concluídas'}
      </p>
      <ul className="flex flex-col gap-1">
        {etapas.map((etapa) => {
          const feita = quandoConcluiu.has(etapa.id)
          const quando = quandoConcluiu.get(etapa.id)
          return (
            <li key={etapa.id}>
              <label className="flex cursor-pointer items-start gap-2.5 rounded-lg px-1.5 py-1.5 hover:bg-fundo has-[:disabled]:cursor-default has-[:disabled]:hover:bg-transparent">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 accent-acento"
                  checked={feita}
                  disabled={!podeMarcar || marcar.isPending}
                  onChange={(e) =>
                    marcar.mutate({
                      colaboradorId,
                      etapaId: etapa.id,
                      concluida: e.target.checked,
                      fechaIntegracao: e.target.checked && marcarFechaAIntegracao(ativas, feitas, etapa.id),
                      hoje: hojeNoFuso(),
                    })
                  }
                />
                <span className="min-w-0 text-sm">
                  <span className={feita ? 'text-tinta' : 'text-tinta-2'}>{etapa.nome}</span>
                  {feita && quando && (
                    <span className="block text-xs text-apagado font-medium">
                      feita em {formatarDataCompleta(quando)}
                    </span>
                  )}
                </span>
              </label>
            </li>
          )
        })}
      </ul>
      {marcar.isError && (
        <Aviso tom="erro" className="mt-3">
          {erroAoSalvar(marcar.error)}
        </Aviso>
      )}
    </Card>
  )
}
