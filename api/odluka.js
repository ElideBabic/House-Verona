/* /api/odluka — gumbi Potvrdi / Odbij u mailu su ukinuti, sve se odlučuje u adminu.
   Ova adresa ostaje samo zato da poveznice iz ranijih mailova ne završe na grešci:
   pokazuje kratku poruku s poveznicom na admin i ništa ne mijenja. */

function page() {
  const html = `<!doctype html>
<html lang="hr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Odluka u adminu · House Verona</title>
<style>
  body { margin: 0; background: #f4efe6; color: #26231e; font: 16px/1.55 Arial, sans-serif; }
  main { max-width: 480px; margin: 0 auto; padding: 32px 16px 48px; }
  .brand { font: 600 13px/1 Arial, sans-serif; letter-spacing: .14em; text-transform: uppercase; color: #8a6d3b; margin-bottom: 18px; }
  h1 { font: 600 26px/1.2 Georgia, serif; margin: 0 0 18px; }
  a.btn { display: inline-block; padding: 14px 20px; background: #26231e; color: #fff; text-decoration: none; font-weight: 700; }
</style>
</head>
<body><main>
<div class="brand">House Verona</div>
<h1>Zahtjeve potvrđuješ u adminu</h1>
<p>Gumbi u mailu više se ne koriste. Ništa nije promijenjeno.</p>
<p><a class="btn" href="/admin.html">Otvori admin</a></p>
</main></body>
</html>`;
  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
      "referrer-policy": "no-referrer",
    },
  });
}

export function GET() {
  return page();
}

export function POST() {
  return page();
}
