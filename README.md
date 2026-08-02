# Diagnóstico Precifica Mix

Funil público de diagnóstico de precificação para restaurantes, delivery e food service. A aplicação coleta respostas, gera um resultado personalizado, salva o lead no Firebase central de diagnósticos e direciona para a oferta do Precifica Mix.

## Oferta configurada

- Produto: Precifica Mix
- Preço original: R$ 97
- Condição especial: R$ 37
- Tipo: pagamento único, sem mensalidade
- Checkout: `https://pay.hotmart.com/D106845746F?checkoutMode=10`

## Desenvolvimento

```bash
npm install
npm run dev
```

Copie `.env.example` para `.env.local` e preencha as credenciais. O projeto deve usar as mesmas credenciais Firebase Admin do painel central de diagnósticos; não use o Firebase operacional do aplicativo Precifica Mix.

## Variáveis da Vercel

### Rastreamento e checkout

- `NEXT_PUBLIC_GTM_ID`
- `NEXT_PUBLIC_GA4_ID`
- `NEXT_PUBLIC_META_PIXEL_ID`
- `NEXT_PUBLIC_UTMIFY_PIXEL_ID`
- `NEXT_PUBLIC_HOTMART_CHECKOUT_URL`
- `NEXT_PUBLIC_ANALYTICS_DEBUG`
- `NEXT_PUBLIC_SITE_URL`

### Firebase Admin

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

A chave privada deve existir somente nas variáveis protegidas da Vercel. Preserve as quebras de linha como `\n` e nunca envie a chave real ao GitHub.

## Identificação no banco

Cada lead é gravado na coleção `diagnosticos` com:

- `produto: "precifica_mix"`
- `funil: "diagnostico_precifica_mix"`
- `versao_diagnostico: "v1"`
- `segmento`
- `tipo_oferta: "pagamento_unico"`
- `valor_original: 97`
- `valor_oferta: 37`

Os eventos são gravados na coleção `eventos` com o mesmo produto e funil. IDs determinísticos impedem a duplicação do mesmo evento por sessão.

## Eventos de marketing

O navegador envia eventos ao `dataLayer`; o GTM distribui os dados para GA4 e Meta Pixel. Todos incluem `produto: "precifica_mix"` e `funil: "diagnostico_precifica_mix"`. Nome e WhatsApp não são enviados às plataformas de marketing.

## Publicação

Crie um repositório e um projeto Vercel próprios, por exemplo `diagnostico-precifica-mix`. Replique nele as credenciais do Firebase central de diagnósticos e os IDs de rastreamento usados no ecossistema Mix.

O `firebase-admin` está fixado na versão `13.6.0`. Mantenha `package.json` e
`package-lock.json` juntos no mesmo commit para evitar falhas 500 nas rotas de gravação.
