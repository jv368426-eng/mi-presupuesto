# Mi Presupuesto

PWA de control de ingresos, gastos, gasolina y ahorro.

## Requisitos
- Node.js 18 o superior
- npm

## Instalar

```bash
npm install
```

## Ejecutar en desarrollo

```bash
npm run dev
```

## Crear versión de producción

```bash
npm run build
```

La carpeta `dist` contiene la aplicación lista para publicar.

## Probar la PWA

```bash
npm run preview
```

Para instalarla en Android, publícala en un dominio con HTTPS y abre el sitio desde Chrome. El navegador mostrará la opción de instalar la aplicación cuando se cumplan los criterios de PWA.

## Datos

La aplicación usa `window.storage` cuando está disponible y `localStorage` como respaldo en un navegador normal.

## Contraseña de acceso

La primera vez que se abre la app en un dispositivo, pide crear una contraseña. Esa contraseña (en forma de hash SHA-256, nunca en texto plano) se guarda con `localStorage` en ese mismo dispositivo/navegador. En visitas posteriores, hay que ingresarla para ver la app; queda desbloqueada mientras la pestaña siga abierta (se vuelve a pedir al cerrar el navegador o al tocar el ícono de candado).

Importante: esto es una protección básica del lado del cliente, pensada para que alguien que tome tu celular o compre la URL no vea tus datos a simple vista. No es cifrado de los datos ni seguridad de nivel empresarial — cualquiera con acceso técnico al almacenamiento del navegador podría evadirla. Si necesitas protección real (por ejemplo si vas a compartir el link públicamente), lo correcto es agregar autenticación en el servidor.
