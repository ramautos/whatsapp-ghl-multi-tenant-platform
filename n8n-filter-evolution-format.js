// 🔍 CÓDIGO ACTUALIZADO PARA FILTRO EVOLUTION
// Reemplaza las condiciones en el nodo "Filter: Instancia Ray"

// CONDICIÓN 1: Verificar evento
// Campo: {{ $json.event }}
// Operador: equals
// Valor: messages.upsert

// CONDICIÓN 2: Verificar instancia  
// Campo: {{ $json.instance }}
// Operador: equals
// Valor: ray

// CONDICIÓN 3: Verificar que NO es mensaje nuestro
// Campo: {{ $json.data.key.fromMe }}
// Operador: equals  
// Valor: false

// Combinator: AND (todas las condiciones deben cumplirse)