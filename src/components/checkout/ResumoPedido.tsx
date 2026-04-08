interface ItemResumo {
  produtoId:    string
  nome:         string
  preco:        number
  quantidade:   number
  variacaoId?:  string
  variacaoNome?: string
}

interface Props {
  itens: ItemResumo[]
  total: number
  frete: number
}

export default function ResumoPedido({ itens, total, frete }: Props) {
  return (
    <div className="bg-[#f8f9fa] border border-gray-200 rounded-xl p-6 sticky top-24">
      <h3 className="font-bold text-base text-[#0a0a0a] mb-5">Resumo do Pedido</h3>
      <ul className="space-y-2.5 mb-5">
        {itens.map((item) => (
          <li key={item.produtoId + (item.variacaoId ?? '')} className="flex justify-between text-sm">
            <span className="text-gray-700">
              {item.nome}
              {item.variacaoNome && (
                <span className="text-[#3cbfb3] font-semibold"> ({item.variacaoNome})</span>
              )}{' '}
              <span className="text-gray-400 text-xs">x{item.quantidade}</span>
            </span>
            <span className="font-medium">R$ {(item.preco * item.quantidade).toFixed(2)}</span>
          </li>
        ))}
      </ul>

      <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>R$ {(total - frete).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Frete</span>
          <span className={frete === 0 ? 'text-green-600 font-medium' : ''}>
            {frete === 0 ? 'A calcular' : `R$ ${frete.toFixed(2)}`}
          </span>
        </div>
        <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-3 mt-1">
          <span>Total</span>
          <span className="text-[#3cbfb3]">R$ {total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
