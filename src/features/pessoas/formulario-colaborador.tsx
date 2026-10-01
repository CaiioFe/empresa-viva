import { useId, useState, type FormEvent } from 'react'
import { Aviso, Button, Campo } from '@/components/ui'
import type { DadosDoColaborador } from './api'
import { hojeNoFuso } from './regras'

type Props = {
  inicial?: Partial<DadosDoColaborador>
  setores: string[]
  textoDoBotao: string
  salvando: boolean
  erro: string | null
  onSalvar: (dados: DadosDoColaborador) => void
  onCancelar: () => void
}

/** Formulário do colaborador: serve para o cadastro e para a edição na ficha. */
export function FormularioColaborador({ inicial, setores, textoDoBotao, salvando, erro, onSalvar, onCancelar }: Props) {
  const idSetores = useId()
  const [nome, setNome] = useState(inicial?.nome ?? '')
  const [funcao, setFuncao] = useState(inicial?.funcao ?? '')
  const [setor, setSetor] = useState(inicial?.setor ?? '')
  const [entrada, setEntrada] = useState(inicial?.data_entrada ?? hojeNoFuso())
  const [telefone, setTelefone] = useState(inicial?.telefone ?? '')
  const [email, setEmail] = useState(inicial?.email ?? '')
  const [faltaNome, setFaltaNome] = useState(false)

  function enviar(ev: FormEvent) {
    ev.preventDefault()
    if (!nome.trim()) {
      setFaltaNome(true)
      return
    }
    onSalvar({
      nome: nome.trim(),
      funcao: funcao.trim(),
      setor: setor.trim(),
      data_entrada: entrada,
      telefone: telefone.trim() || null,
      email: email.trim() || null,
    })
  }

  return (
    <form onSubmit={enviar} className="grid gap-4 sm:grid-cols-2" noValidate>
      <Campo
        rotulo="Nome"
        value={nome}
        onChange={(e) => {
          setNome(e.target.value)
          setFaltaNome(false)
        }}
        erro={faltaNome ? 'Escreva o nome.' : undefined}
        autoComplete="off"
        required
      />
      <Campo rotulo="Função" value={funcao} onChange={(e) => setFuncao(e.target.value)} autoComplete="off" />
      <Campo rotulo="Setor" value={setor} onChange={(e) => setSetor(e.target.value)} list={idSetores} autoComplete="off" />
      <datalist id={idSetores}>
        {setores.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <Campo rotulo="Data de entrada" type="date" value={entrada} onChange={(e) => setEntrada(e.target.value)} required />
      <Campo
        rotulo="Telefone"
        type="tel"
        inputMode="tel"
        value={telefone}
        onChange={(e) => setTelefone(e.target.value)}
        ajuda="Com DDD. É para onde vai o link do DISC no WhatsApp."
      />
      <Campo rotulo="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      {erro && (
        <Aviso tom="erro" className="sm:col-span-2">
          {erro}
        </Aviso>
      )}
      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <Button type="submit" disabled={salvando || !entrada}>
          {salvando ? 'Salvando...' : textoDoBotao}
        </Button>
        <Button variante="fantasma" onClick={onCancelar} disabled={salvando}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
