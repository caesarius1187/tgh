# Identidad Visual TGH - Guía de Implementación

## Paleta de Colores Corporativos

### Colores Primarios

- **Teal Oscuro Principal**: `#214F5F` (tgh-teal) - Color de marca principal
- **Naranja Corporativo**: `#E17739` (tgh-orange) - Color de acento y CTA
- **Gris Claro**: `#C4C6C8` (tgh-gray) - Fondos y elementos secundarios
- **Azul Marino Oscuro**: `#0C0F1E` (tgh-navy) - Textos principales y fondos oscuros

### Colores Secundarios

- **Teal Medio**: `#153041` (tgh-teal-dark) - Variante de marca
- **Marrón Grisáceo**: `#6C504C` (tgh-brown) - Elementos complementarios
- **Amarillo Dorado**: `#FFCB68` (tgh-gold) - Acentos y highlights

## Configuración de Tailwind CSS

Los colores están configurados en `tailwind.config.js`:

```javascript
colors: {
  'tgh-teal': '#214F5F',
  'tgh-teal-dark': '#153041',
  'tgh-orange': '#E17739',
  'tgh-navy': '#0C0F1E',
  'tgh-gray': '#C4C6C8',
  'tgh-brown': '#6C504C',
  'tgh-gold': '#FFCB68',
}
```

## Componentes Disponibles

### 1. Button

Componente de botón con variantes y tamaños:

```tsx
import Button from '@/components/Button'

// Botón primario (naranja)
<Button variant="primary" size="lg">
  Validar Serial
</Button>

// Botón secundario (gris)
<Button variant="secondary" size="md">
  Cancelar
</Button>

// Botón outline
<Button variant="outline" size="sm">
  Ver más
</Button>

// Botón con estado de carga
<Button variant="primary" isLoading={true}>
  Cargando...
</Button>
```

**Variantes:**
- `primary`: Fondo naranja (#E17739), hover en dorado (#FFCB68)
- `secondary`: Fondo gris (#C4C6C8), texto oscuro
- `outline`: Borde naranja, fondo transparente
- `ghost`: Solo texto naranja

**Tamaños:**
- `sm`: Pequeño
- `md`: Mediano (por defecto)
- `lg`: Grande

### 2. Card

Componente de tarjeta con variantes:

```tsx
import Card, { CardHeader, CardBody, CardFooter } from '@/components/Card'

<Card variant="default" padding="md">
  <CardHeader 
    title="Título de la Card"
    subtitle="Subtítulo opcional"
    action={<Button>Acción</Button>}
  />
  <CardBody>
    Contenido de la card
  </CardBody>
  <CardFooter>
    Pie de página opcional
  </CardFooter>
</Card>

// Card oscura
<Card variant="dark">
  <CardBody>
    Contenido sobre fondo oscuro
  </CardBody>
</Card>
```

**Variantes:**
- `default`: Fondo blanco con borde teal
- `dark`: Fondo teal oscuro con texto gris claro

**Padding:**
- `sm`: 1rem (p-4)
- `md`: 1.5rem (p-6) - por defecto
- `lg`: 2rem (p-8)
- `none`: Sin padding

### 3. Input

Componente de input con label y validación:

```tsx
import Input, { Textarea } from '@/components/Input'

<Input
  label="Nombre completo"
  type="text"
  placeholder="Ingresa tu nombre"
  error={errors.name}
  helperText="Este campo es obligatorio"
/>

<Textarea
  label="Descripción"
  placeholder="Escribe una descripción..."
  rows={4}
/>
```

### 4. Navbar

Barra de navegación corporativa:

```tsx
import Navbar from '@/components/Navbar'

// Navbar con botón de login
<Navbar showLogin={true} showLogout={false} />

// Navbar con botón de logout (para páginas autenticadas)
<Navbar showLogin={false} showLogout={true} />
```

### 5. HexagonalPattern

Patrón hexagonal decorativo para fondos:

```tsx
import { HexagonalPatternCSS } from '@/components/HexagonalPattern'

<div className="relative min-h-screen bg-tgh-teal">
  <HexagonalPatternCSS />
  {/* Contenido */}
</div>
```

## Clases CSS Utilitarias

### Botones

```tsx
// Botón primario
<button className="btn-primary">
  Botón Primario
</button>

// Botón secundario
<button className="btn-secondary">
  Botón Secundario
</button>
```

### Inputs

```tsx
<input className="input-field" type="text" />
```

### Cards

```tsx
<div className="card">
  Contenido de la card
</div>

<div className="card-dark">
  Contenido sobre fondo oscuro
</div>
```

### Formularios

```tsx
<div className="form-group">
  <label className="label">Etiqueta</label>
  <input className="input-field" />
</div>
```

### Fondos

```tsx
// Fondo con patrón hexagonal
<div className="bg-hexagonal">
  Contenido
</div>
```

## Guías de Uso de Color

### Fondos

- **Fondos principales**: Usar `bg-tgh-teal` o `bg-tgh-teal-dark`
- **Fondos claros**: Usar `bg-white` o `bg-tgh-gray`
- **Fondos oscuros**: Usar `bg-tgh-navy` o `bg-tgh-teal-dark`

### Textos

- **Textos principales sobre fondos claros**: `text-tgh-navy`
- **Textos sobre fondos oscuros**: `text-tgh-gray` o `text-white`
- **Títulos importantes**: `text-tgh-orange`
- **Subtítulos**: `text-tgh-teal`

### Botones y CTAs

- **Botón primario**: `bg-tgh-orange hover:bg-tgh-gold`
- **Botón secundario**: `bg-tgh-gray hover:bg-tgh-gray/80`
- **Enlaces**: `text-tgh-orange hover:text-tgh-gold`

### Bordes y Acentos

- **Bordes principales**: `border-tgh-teal` o `border-2 border-tgh-teal`
- **Elementos decorativos**: `bg-tgh-brown` o `bg-tgh-gold`
- **Iconos**: Usar `text-tgh-orange` o `text-tgh-brown`

## Ejemplos de Uso Completo

### Página con Fondo Corporativo

```tsx
import { HexagonalPatternCSS } from '@/components/HexagonalPattern'
import Navbar from '@/components/Navbar'
import Card from '@/components/Card'
import Button from '@/components/Button'

export default function MiPagina() {
  return (
    <>
      <Navbar showLogin={true} />
      <div className="min-h-screen bg-tgh-teal relative">
        <HexagonalPatternCSS />
        <div className="relative z-10 p-8">
          <Card>
            <h1 className="text-tgh-orange text-3xl font-bold mb-4">
              Título Principal
            </h1>
            <p className="text-tgh-navy mb-6">
              Descripción del contenido
            </p>
            <Button variant="primary">
              Acción Principal
            </Button>
          </Card>
        </div>
      </div>
    </>
  )
}
```

### Formulario Estilizado

```tsx
import Card from '@/components/Card'
import Input from '@/components/Input'
import Button from '@/components/Button'

export default function MiFormulario() {
  return (
    <Card>
      <h2 className="text-tgh-teal text-2xl font-bold mb-6">
        Formulario de Registro
      </h2>
      <form>
        <Input
          label="Nombre completo"
          type="text"
          placeholder="Ingresa tu nombre"
        />
        <Input
          label="Email"
          type="email"
          placeholder="tu@email.com"
        />
        <div className="mt-6">
          <Button variant="primary" type="submit">
            Enviar
          </Button>
        </div>
      </form>
    </Card>
  )
}
```

## Accesibilidad

- Todos los componentes mantienen contraste WCAG AA mínimo
- Los botones tienen estados de focus visibles
- Los inputs tienen labels asociados correctamente
- Los colores de texto sobre fondos mantienen legibilidad adecuada

## Logo TGH

El logo TGH está implementado en el componente Navbar y se puede usar en otras partes con:

```tsx
import { TGHLogo } from '@/components/Navbar'

<TGHLogo size="lg" />
```

Tamaños disponibles: `sm`, `md`, `lg`

