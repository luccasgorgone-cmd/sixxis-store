import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'

config({ path: '.env.local' })

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set')

const adapter = new PrismaMariaDb(process.env.DATABASE_URL)
const prisma = new PrismaClient({ adapter })

const SPECS = [
  { label: 'Modelo',               valor: 'SX040' },
  { label: 'Voltagem',             valor: '110V / 220V (Bivolt)' },
  { label: 'Potência',             valor: '180 W' },
  { label: 'Vazão de Ar',          valor: '5.500 m³/h' },
  { label: 'Capacidade do Tanque', valor: '45 litros' },
  { label: 'Consumo de Água',      valor: '4 a 6 L/h' },
  { label: 'Área Recomendada',     valor: 'até 45 m²' },
  { label: 'Nível de Ruído',       valor: '< 60 dB' },
  { label: 'Velocidades',          valor: '3' },
  { label: 'Oscilação Vertical',   valor: 'Automática' },
  { label: 'Oscilação Horizontal', valor: 'Manual' },
  { label: 'Filtro',               valor: 'Colmeias 4cm Anti-Pó' },
  { label: 'Painel',               valor: 'Touch Screen' },
  { label: 'Controle Remoto',      valor: 'Incluso' },
  { label: 'Eficiência Energética',valor: 'Classe A' },
  { label: 'Peso',                 valor: '15 kg' },
  { label: 'Dimensões',            valor: '105,5 × 46 × 36 cm' },
]

try {
  const updated = await prisma.produto.updateMany({
    where: { slug: { contains: 'sx040' } },
    data: { especificacoes: SPECS },
  })
  console.log(`Updated ${updated.count} produto(s) with specs.`)
} catch (e) {
  console.error('Error:', e.message)
} finally {
  await prisma.$disconnect()
}
