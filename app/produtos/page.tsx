import { AppShell } from '@/components/dashboard/app-shell'
import { ProdutosView } from '@/components/produtos/produtos-view'

export default function ProdutosPage() {
  return (
    <AppShell
      title="Produtos"
      subtitle="Controle o estoque dos produtos que você vende e registre as vendas."
    >
      <ProdutosView />
    </AppShell>
  )
}
