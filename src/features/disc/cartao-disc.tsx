import { useState } from 'react'
import { Check, Copy, MessageCircle } from 'lucide-react'
import { Aviso, Button, Card, Pill } from '@/components/ui'
import { Carregando, ErroAoCarregar, erroAoSalvar } from '@/features/pessoas/estados'
import { linkDoTesteDisc, linkDoWhatsApp, mensagemDoConviteDisc, primeiroNome } from '@/features/pessoas/regras'
import { formatarDataCompleta } from '@/lib/formatos'
import type { Colaborador } from '@/lib/tipos'
import { useCriarConviteDisc, useDiscDoColaborador } from './api'
import { PerfilDisc } from './perfil'

type Props = { colaborador: Pick<Colaborador, 'id' | 'nome' | 'telefone' | 'situacao'>; podeEnviar: boolean }

/** Perfil DISC na ficha: o resultado, o convite esperando resposta ou o botão para mandar o teste. */
export function CartaoDisc({ colaborador, podeEnviar }: Props) {
  const consulta = useDiscDoColaborador(colaborador.id)
  const criar = useCriarConviteDisc()

  if (consulta.isPending) {
    return (
      <Card titulo="Perfil DISC">
        <Carregando texto="Carregando o DISC..." />
      </Card>
    )
  }
  if (consulta.isError) {
    return (
      <Card titulo="Perfil DISC">
        <ErroAoCarregar onTentar={() => void consulta.refetch()} />
      </Card>
    )
  }

  const { resultado, convitePendente } = consulta.data

  if (resultado) {
    return (
      <Card titulo="Perfil DISC" acao={<span className="text-[11px] text-apagado">respondido em {formatarDataCompleta(resultado.respondido_em)}</span>}>
        <PerfilDisc resultado={resultado} />
      </Card>
    )
  }

  if (convitePendente) {
    return (
      <Card titulo="Perfil DISC" acao={<Pill tom="atencao">Aguardando resposta</Pill>}>
        <p className="mb-3 text-xs leading-relaxed text-tinta-2">
          O teste foi criado em {formatarDataCompleta(convitePendente.criado_em)} e ainda não foi respondido. Mande o link de novo se
          precisar: quando {primeiroNome(colaborador.nome)} responder, o resultado entra aqui sozinho.
        </p>
        <LinkDoConvite nome={colaborador.nome} telefone={colaborador.telefone} token={convitePendente.token} />
      </Card>
    )
  }

  return (
    <Card titulo="Perfil DISC">
      <p className="text-xs leading-relaxed text-tinta-2">
        Ainda não respondeu. O teste vai por WhatsApp, é feito no celular e o resultado entra aqui sozinho.
      </p>
      {podeEnviar && colaborador.situacao === 'ativo' && (
        <Button
          className="mt-3"
          tamanho="pequeno"
          disabled={criar.isPending}
          onClick={() => criar.mutate({ colaboradorId: colaborador.id })}
        >
          {criar.isPending ? 'Criando o link...' : 'Enviar teste DISC'}
        </Button>
      )}
      {criar.isError && (
        <Aviso tom="erro" className="mt-3">
          {erroAoSalvar(criar.error)}
        </Aviso>
      )}
    </Card>
  )
}

function LinkDoConvite({ nome, telefone, token }: { nome: string; telefone: string | null; token: string }) {
  const [copiado, setCopiado] = useState<'sim' | 'falhou' | null>(null)
  const link = linkDoTesteDisc(window.location.origin, token)
  const whatsapp = linkDoWhatsApp(telefone, mensagemDoConviteDisc(nome, link))

  async function copiar() {
    try {
      await navigator.clipboard.writeText(link)
      setCopiado('sim')
    } catch {
      setCopiado('falhou')
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        readOnly
        aria-label="Link do teste DISC"
        value={link}
        onFocus={(e) => e.currentTarget.select()}
        className="w-full rounded-lg border border-linha-2 bg-fundo px-3 py-2 text-xs text-tinta-2 outline-none focus:border-acento font-medium"
      />
      <div className="flex flex-wrap gap-2">
        <Button variante="secundario" tamanho="pequeno" onClick={() => void copiar()}>
          {copiado === 'sim' ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
          {copiado === 'sim' ? 'Link copiado' : 'Copiar link'}
        </Button>
        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center justify-center gap-2 rounded-lg bg-grafite px-3 text-xs font-semibold whitespace-nowrap text-white transition-colors hover:bg-acento"
          >
            <MessageCircle size={14} aria-hidden />
            Enviar no WhatsApp
          </a>
        )}
      </div>
      {!whatsapp && <p className="text-[11px] text-apagado">Sem telefone na ficha: copie o link e mande como preferir.</p>}
      {copiado === 'falhou' && <p className="text-[11px] text-ruim">Não deu para copiar sozinho. Toque no link acima e copie à mão.</p>}
    </div>
  )
}
