import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

/*
  O jsdom não tem ResizeObserver, que todo navegador de verdade tem desde 2020. Sem este dublê,
  qualquer componente que meça o próprio tamanho quebra no teste e passa no navegador, que é o
  pior dos dois mundos. Ele não mede nada: só existe pra o componente poder chamar sem estourar.
*/
if (!('ResizeObserver' in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

afterEach(() => {
  cleanup()
})
